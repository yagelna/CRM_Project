import React, { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../AxiosInstance';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { Button } from 'react-bootstrap';
import Logo from '../assets/Icon-01.png';
import AddCRMAccountModal from '../components/crm/AddCRMAccountModal';
import CRMOffcanvas from '../components/crm/CRMOffcanvas';
import { showToast } from '../components/common/toast';
import KanbanBoard from '../components/crm/KanbanBoard';



ModuleRegistry.registerModules([AllCommunityModule]);

const CRMAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table / kanban
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeUser, setActiveUser] = useState("All");
  const [uniqueUsers, setUniqueUsers] = useState([]);

  const gridRef = useRef();
  const myTheme = themeQuartz
    .withParams({
      browserColorScheme: "light",
      headerBackgroundColor: "#5A34F1",
      headerTextColor: "#ffffff",
    });

  const fetchAccounts = () => {
    axiosInstance.get('/api/crm/accounts/')
      .then((res) => setAccounts(res.data))
      .catch((err) => console.error('Failed to fetch accounts:', err));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      const users = [...new Set(accounts.map(acc => acc.assigned_to_name).filter(Boolean))];
      setUniqueUsers(users);
    }
  }, [accounts]);

  const externalFilterChanged = (user) => {
    setActiveUser(user);
    gridRef.current.api.onFilterChanged();
  };

  const isExternalFilterPresent = () => {
    return activeUser !== "All";
  };
  const doesExternalFilterPass = (node) => {
    if (activeUser === "All") return true;
    return node.data.assigned_to_name === activeUser;
  };

  const fetchFullAccount = async (accountId) => {
    try {
      const response = await axiosInstance.get(`/api/crm/accounts/${accountId}/`);
      setSelectedAccount(response.data);
    } catch (error) {
      console.error('Failed to fetch full account details:', error);
    }
  };

  const handleDeleteAccount = (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    axiosInstance.delete(`/api/crm/accounts/${id}/`)
      .then(() => {
        showToast?.({ type: 'success', title: 'Account Deleted' });
        setSelectedAccount(null);
        fetchAccounts(); // Refresh the accounts list
        setAccounts((prev) => prev.filter(acc => acc.id !== id));
      })
      .catch((err) => {
        console.error('Delete error:', err);
        showToast?.({ type: 'danger', title: 'Delete Failed', message: 'Could not delete account.' });
      });
  };

  const handleStatusChange = async (accountId, newStatus) => {
    try {
      await axiosInstance.patch(`/api/crm/accounts/${accountId}/`, { status: newStatus });
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === accountId ? { ...acc, status: newStatus } : acc
        )
      );
      showToast?.({ type: 'success', title: 'Status Updated' });
    } catch (error) {
      console.error('Failed to update account status:', error);
      showToast?.({ type: 'danger', title: 'Update Failed', message: 'Could not update status.' });
    }
  };

  const handleViewAccount = async (accountId) => {
    try {
      const response = await axiosInstance.get(`/api/crm/accounts/${accountId}/`);
      setSelectedAccount(response.data);

      const el = document.getElementById("crmAccountOffcanvas");
      if (el) {
        const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
        bsOffcanvas.show();
      }
    } catch (error) {
      console.error("Failed to load account for view:", error);
    }
  };

  const colDefs = [
    {
      field: 'name',
      cellRenderer: (params) => (
        <a
          href="#crmAccountOffcanvas"
          data-bs-toggle="offcanvas"
          className="link-opacity-50-hover fw-medium"
          onClick={() => fetchFullAccount(params.data.id)}
        >
          {params.value}
        </a>
      ),
      headerName: 'Name', flex: 1
    },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'phone', headerName: 'Phone', flex: 1 },
    {
      field: 'company_details.name',
      headerName: 'Company',
      flex: 1,
      valueGetter: p => p.data.company_details?.name || ''
    },
    { field: 'assigned_to_name', headerName: 'Assigned To', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 0.6 },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : ''
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      flex: 1,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : ''
    },
  ];

  const onFilterTextBoxChanged = useCallback(() => {
    gridRef.current.api.setGridOption(
      "quickFilterText",
      document.getElementById("filter-text-box").value,
    );
  }, []);

  return (
    <div className='module-container'>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2>CRM Accounts</h2>
          <p className="text-muted">Manage your strategic clients</p>
        </div>
        <div>
          <Button
            type="button"
            className="btn btn-primary me-2"
            data-bs-toggle="modal"
            data-bs-target="#addCRMAccountModal"
          >
            + Add Account
          </Button>
          <Button variant={viewMode === 'table' ? 'primary' : 'outline-primary'} className="me-2" onClick={() => setViewMode('table')}>
            📊 Table
          </Button>
          <Button variant={viewMode === 'kanban' ? 'primary' : 'outline-primary'} onClick={() => setViewMode('kanban')}>
            📦 Kanban
          </Button>

        </div>
      </div>



      {viewMode === 'table' ? (
        <>
          <div className="mb-2 d-flex align-items-center">
            <input
              type="text"
              id="filter-text-box"
              className="form-control me-3"
              placeholder="Filter..."
              onInput={onFilterTextBoxChanged}
              style={{ width: "200px" }}
            />

            <div className="btn-group dotzhub-btn-group">
              <Button
                className={activeUser === "All" ? "active" : ""}
                onClick={() => externalFilterChanged("All")}
              >
                All
              </Button>
              {uniqueUsers.map(user => (
                <Button
                  key={user}
                  className={activeUser === user ? "active" : ""}
                  onClick={() => externalFilterChanged(user)}
                >
                  {user}
                </Button>
              ))}
            </div>
          </div>


          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              <div className="ag-theme-quartz" style={{ height: 650, width: '100%' }}>
                <AgGridReact
                  ref={gridRef}
                  columnDefs={colDefs}
                  rowData={accounts}
                  theme={myTheme}
                  defaultColDef={{ filter: true, flex: 1 }}
                  isExternalFilterPresent={isExternalFilterPresent}
                  doesExternalFilterPass={doesExternalFilterPass}
                  pagination={true}
                  paginationPageSize={20}
                  overlayNoRowsTemplate={`
                    <div class="d-flex flex-column align-items-center text-primary justify-content-center" style="height: 100%;">
                    <img src="${Logo}" class="my-logo-fade" style="width: 48px; height: 48px;" />
                    <br/>
                    <span class="loading -text-purple">Connecting The Dotz...</span>
                    </div>
                `}
                  overlayLoadingTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Updating Data...</div>'}

                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <KanbanBoard accounts={accounts} onStatusChange={handleStatusChange} onDeleteAccount={handleDeleteAccount} onViewAccount={handleViewAccount} />
      )}
      <AddCRMAccountModal id="addCRMAccountModal" onSuccess={fetchAccounts} />
      <CRMOffcanvas
        id="crmAccountOffcanvas"
        account={selectedAccount}
        onDelete={handleDeleteAccount}
        onClose={() => setSelectedAccount(null)}
        fetchAccounts={fetchAccounts}
      />
    </div>
  );
};

export default CRMAccounts;