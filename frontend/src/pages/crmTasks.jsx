import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import axiosInstance from '../AxiosInstance';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import Logo from '../assets/Icon-01.png';
import { showToast } from '../components/common/toast';
import CRMOffcanvas from '../components/crm/CRMOffcanvas';
import TaskDetailsModal from '../components/crm/TaskDetailsModal';
import AddTaskModal from '../components/crm/AddTaskModal';
import EditTaskModal from '../components/crm/EditTaskModal';
import { useAuth } from '../context/AuthContext';

ModuleRegistry.registerModules([AllCommunityModule]);

// Helper: check if due date is overdue
const isOverdue = (dueDate) => {
  if (!dueDate) return false;

  const due = new Date(dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due < today;
};

// Helper: determine task status label and classes
const getTaskStatus = (task) => {
  if (!task) return { label: 'Unknown', className: 'border-secondary text-secondary' };

  if (task.is_completed) {
    return { label: 'Completed', className: 'border-success text-black-50' };
  }

  if (isOverdue(task.due_date)) {
    return { label: 'Overdue', className: 'border-danger text-black-50' };
  }

  return { label: 'Open', className: 'border-warning text-black-50' };
};

// Custom Action Cell Renderer
const ActionCellRenderer = ({ data, onToggleComplete, onViewDetails }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggleComplete(data.id, data.is_completed);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-outline-primary"
        title="View Details"
        onClick={() => onViewDetails(data)}
      >
        <i className="bi bi-eye" />
      </button>
      <button
        className={`btn btn-sm ${data.is_completed ? 'btn-outline-secondary' : 'btn-outline-success'}`}
        title={data.is_completed ? 'Reopen Task' : 'Mark as Complete'}
        onClick={handleToggle}
        disabled={isUpdating}
      >
        <i className={`bi ${data.is_completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg'}`} />
      </button>
    </div>
  );
};

const CRMTasks = () => {
  const gridRef = useRef();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completionFilter, setCompletionFilter] = useState('false'); // 'false', 'true', 'all'
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [taskBeingEdited, setTaskBeingEdited] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [addedByFilter, setAddedByFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [users, setUsers] = useState([]);
  const { user, loading: authLoading } = useAuth();

  const myTheme = themeQuartz.withParams({
    browserColorScheme: 'light',
    headerBackgroundColor: '#5A34F1',
    headerTextColor: '#ffffff',
  });

  const handleOpenAccount = (task) => {
    if (!task?.account) return;

    flushSync(() => {
      setSelectedAccount({
        id: task.account,
        name: task.account_name,
        company_name: task.account_company,
      });
    });

    const el = document.getElementById("crmAccountOffcanvasFromTasks");
    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
    bsOffcanvas.show();
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;

    try {
      await axiosInstance.delete(`/api/crm/accounts/${accountId}/`);
      setSelectedAccount(null);
      setTasks(prev => prev.filter(task => String(task.account) !== String(accountId)));

      showToast({
        type: 'success',
        title: 'Account Deleted',
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast({
        type: 'danger',
        title: 'Delete Failed',
        message: 'Could not delete account.',
      });
    }
  };

  const flashOverdueRows = useCallback(() => {
    if (!gridRef.current?.api) return;

    const overdueNodes = [];

    gridRef.current.api.forEachNode((node) => {
      if (
        node.data &&
        !node.data.is_completed &&
        isOverdue(node.data.due_date)
      ) {
        overdueNodes.push(node);
      }
    });

    if (overdueNodes.length === 0) return;

    gridRef.current.api.flashCells({
      rowNodes: overdueNodes,
    });
  }, []);

  const colDefs = [
    {
      field: 'account_name',
      headerName: 'Account',
      flex: 0.8,
      cellRenderer: (params) => {
        const task = params.data;
        if (!task?.account) {
          return (
            <span className="badge bg-transparent border text-muted">
              General Task
            </span>
          );
        }
        return (
        <a
          href="#"
          className="link-opacity-50-hover fw-medium"
          onClick={(e) => {
            e.preventDefault();
            handleOpenAccount(params.data);
          }}
          >
          {params.value || 'N/A'}
        </a>
        );
      }
    },
    { field: 'title', headerName: 'Title', flex: 1.4, cellClass: 'fw-semibold' },
    { field: 'account_company', headerName: 'Company', flex: 1.1 },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 0.8,
      cellClass: (params) => {
        switch (params.value) {
          case 'high':
            return 'priority-cell-high';
          case 'medium':
            return 'priority-cell-medium';
          case 'low':
            return 'priority-cell-low';
          default:
            return '';
        }
      },
      valueFormatter: (params) =>
        params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : '',
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      flex: 1,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      field: 'is_completed',
      headerName: 'Status',
      flex: 0.9,
      cellRenderer: (params) => {
        const status = getTaskStatus(params.data);
        return (
          <span className={`badge bg-transparent border ${status.className}`}>
            {status.label}
          </span>
        );
      },
      sortable: false,

    },
    { field: 'assigned_to_name', headerName: 'Assigned To', flex: 1 },
    { field: 'added_by_name', headerName: 'Added By', flex: 1, resizable: false },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      minWidth: 120,
      maxWidth: 120,
      pinned: 'right',
      headerClass: 'text-center',
      cellRenderer: (params) => (
        <ActionCellRenderer
          data={params.data}
          onToggleComplete={toggleTaskCompleted}
          onViewDetails={handleViewTask}
        />
      ),
      cellStyle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      resizable: false,
      sortable: false,
      filter: false,
    },
  ];

  const fetchTasks = useCallback(async () => {
    if (authLoading) return;
    if (!assignedToFilter) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const response = await axiosInstance.get('/api/crm/tasks/', {
        params: {
        completed: completionFilter,
        priority: priorityFilter,
        assigned_to: assignedToFilter,
        added_by: addedByFilter,
        }
      });

      setTasks(response.data);
      setTimeout(() => {
        flashOverdueRows();
      }, 200);
    } catch (error) {
      console.error('Failed to fetch CRM tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, completionFilter, priorityFilter, assignedToFilter, addedByFilter, flashOverdueRows]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!authLoading && user?.id && !assignedToFilter) {
      setAssignedToFilter(String(user.id));
    }
  }, [authLoading, user?.id, assignedToFilter]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('api/user/');
        setUsers(response.data || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const onFilterTextBoxChanged = useCallback(() => {
    gridRef.current.api.setGridOption(
      'quickFilterText',
      document.getElementById('filter-text-box').value,
    );
  }, []);

  const toggleTaskCompleted = async (taskId, currentStatus) => {
    try {
      const response = await axiosInstance.patch(`/api/crm/tasks/${taskId}/`, {
        is_completed: !currentStatus
      });
      
      // Update the task in the local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, is_completed: !currentStatus } : task
        )
      );

      // Update selected task if it's the one being edited
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, is_completed: !currentStatus });
      }

      showToast({
        type: 'success',
        title: 'Task Updated',
        message: !currentStatus ? 'Task marked as completed.' : 'Task reopened.'
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      showToast({
        type: 'danger',
        title: 'Update Failed',
        message: 'Could not update task status. Please try again.'
      });
    }
  };

  const handleViewTask = (task) => {
    flushSync(() => {
      setSelectedTask(task);
    });

    const modalEl = document.getElementById('taskDetailsModal');
    if (!modalEl) {
      console.error('Task details modal element not found');
      return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  const resetFiltersToDefault = () => {
    setCompletionFilter('false');
    setPriorityFilter('all');
    setAssignedToFilter(user?.id ? String(user.id) : 'all');
    setAddedByFilter('all');
  };

  const showAllTasks = () => {
    setCompletionFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
    setAddedByFilter('all');
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await axiosInstance.delete(`/api/crm/tasks/${taskId}/`);

      setTasks(prev => prev.filter(task => task.id !== taskId));

      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }

      const modalEl = document.getElementById('taskDetailsModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();

      showToast({
        type: 'success',
        title: 'Task Deleted',
        message: 'The task was deleted successfully.',
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      showToast({
        type: 'danger',
        title: 'Delete Failed',
        message: 'Could not delete task.',
      });
    }
  };

  const handleEditTask = (task) => {
    setTaskBeingEdited(task);

    const detailsModalEl = document.getElementById('taskDetailsModal');
    const detailsModal = bootstrap.Modal.getInstance(detailsModalEl);
    detailsModal?.hide();

    setTimeout(() => {
      const editModalEl = document.getElementById('editTaskFromTasksPageModal');
      const editModal = bootstrap.Modal.getOrCreateInstance(editModalEl);
      editModal.show();
    }, 200);
  };

  return (
    <div className='module-container'>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2>CRM Tasks</h2>
          <p className="text-muted">All customer tasks in one place</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addTaskFromTasksPageModal"
        >
          + Add Task
        </button>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        {/* LEFT SIDE */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="text"
            id="filter-text-box"
            className="form-control"
            placeholder="Quick Filter..."
            onInput={onFilterTextBoxChanged}
            style={{ width: '200px' }}
          />

          <span className="text-muted small ms-1">Active filters:</span>

          <span className="badge rounded-pill text-bg-light border">
            Status: {completionFilter === 'false' ? 'Open' : completionFilter === 'true' ? 'Completed' : 'All'}
          </span>
          <span className="badge rounded-pill text-bg-light border">
            Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
          </span>
          <span className="badge rounded-pill text-bg-light border">
            Assigned To: {
              assignedToFilter === 'all'
                ? 'All'
                : users.find(u => String(u.id) === String(assignedToFilter))?.first_name || user?.email || 'Me'
            }
          </span>

          <span className="badge rounded-pill text-bg-light border">
            Added By: {
              addedByFilter === 'all'
                ? 'All'
                : users.find(u => String(u.id) === String(addedByFilter))?.first_name || 'User'
            }
          </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="dropdown ms-auto">
          <button
            className="btn btn-sm btn-outline-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
          >
            <i className="bi bi-funnel me-1"></i>
            Filters
          </button>

          <div className="dropdown-menu dropdown-menu-end p-3 shadow" style={{ minWidth: '250px' }}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Completion Status</label>

              {[
                { value: 'false', label: 'Open' },
                { value: 'true', label: 'Completed' },
                { value: 'all', label: 'All' },
              ].map((option) => (
                <div className="form-check" key={option.value}>
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`status-${option.label.toLowerCase()}`}
                    name="completionFilter"
                    value={option.value}
                    checked={completionFilter === option.value}
                    onChange={(e) => setCompletionFilter(e.target.value)}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor={`status-${option.label.toLowerCase()}`}
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Priority</label>

              {[
                { value: 'all', label: 'All' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ].map((option) => (
                <div className="form-check" key={option.value}>
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`priority-${option.value}`}
                    name="priorityFilter"
                    value={option.value}
                    checked={priorityFilter === option.value}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  />
                  <label className="form-check-label small" htmlFor={`priority-${option.value}`}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Assigned To</label>

              <select
                className="form-select form-select-sm"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name || ''} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Added By</label>

              <select
                className="form-select form-select-sm"
                value={addedByFilter}
                onChange={(e) => setAddedByFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name || ''} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-50"
                onClick={resetFiltersToDefault}
              >
                Default
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-50"
                onClick={showAllTasks}
              >
                Show all
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4 mt-2">
        <div className="card-body p-2">
          <div className="ag-theme-quartz" style={{ height: 650, width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              columnDefs={colDefs}
              rowData={tasks}
              theme={myTheme}
              defaultColDef={{ filter: true, flex: 1, resizable: true }}
              pagination={true}
              paginationPageSize={20}
              overlayLoadingTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading CRM tasks...</div>'}
              overlayNoRowsTemplate={`
                <div class="d-flex flex-column align-items-center text-primary justify-content-center" style="height: 100%;">
                  <img src="${Logo}" class="my-logo-fade" style="width: 48px; height: 48px;" />
                  <br/>
                  <span class="loading -text-purple">No CRM tasks yet</span>
                </div>
              `}
              loading={loading}
            />
          </div>
        </div>
      </div>

      <TaskDetailsModal
        id="taskDetailsModal"
        task={selectedTask}
        onToggleComplete={toggleTaskCompleted}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />
      <AddTaskModal
        id="addTaskFromTasksPageModal"
        onTaskAdded={() => { fetchTasks(); }}
      />
      <EditTaskModal
        id="editTaskFromTasksPageModal"
        task={taskBeingEdited}
        onSave={(updatedTask) => {
          setTasks(prev =>
            prev.map(task => task.id === updatedTask.id ? updatedTask : task)
          );

          setSelectedTask(updatedTask);
          setTaskBeingEdited(null);
        }}
      />
      <CRMOffcanvas
        id="crmAccountOffcanvasFromTasks"
        account={selectedAccount}
        onDelete={handleDeleteAccount}
        fetchAccounts={() => {}}
        accounts={[]}
      />
    </div>
  );
};

export default CRMTasks;