import React from 'react';
import Modal from '../common/modal';

const TaskDetailsModal = ({
  id = 'taskDetailsModal',
  task,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}) => {
  if (!task) return null;

  const priorityClass =
    task.priority === 'high'
      ? 'bg-danger'
      : task.priority === 'medium'
      ? 'bg-warning text-dark'
      : 'bg-info text-dark';

  const statusClass = task.is_completed
    ? 'bg-success'
    : 'bg-warning text-dark';

  const formatDate = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const modalTitle = (
    <div>
      <div className="fw-bold fs-5">
        {task.title || 'Untitled Task'}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
        <span className={`badge ${statusClass}`}>
          {task.is_completed ? 'Completed' : 'Open'}
        </span>

        <span className={`badge ${priorityClass}`}>
          {task.priority || 'N/A'}
        </span>
      </div>
    </div>
  );

  return (
    <Modal id={id} title={modalTitle}>
      {/* Account / General Task Row */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <div className="border rounded p-3 bg-light-subtle h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fw-semibold text-muted small">
                {task.account ? 'Account Details' : 'General Task'}
              </span>
            </div>

            {!task.account ? (
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-list-task text-muted"></i>
                <div>
                  <div className="fw-semibold">General Task</div>
                  <div className="text-muted small">No CRM account linked</div>
                </div>
              </div>
            ) : (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-person text-muted"></i>
                  <div className="fw-semibold">
                    {task.account_name || 'N/A'}
                  </div>
                </div>

                {task.account_company && (
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-building text-muted"></i>
                    <div className="text-muted">
                      {task.account_company}
                    </div>
                  </div>
                )}

                {task.account_email && (
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-envelope text-muted"></i>
                    <span
                      className="text-break"
                      title={task.account_email}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {task.account_email}
                    </span>
                  </div>
                )}

                {task.account_phone && (
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-telephone text-muted"></i>
                    <span>{task.account_phone}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Meta Row */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="border rounded p-3 h-100 bg-light-subtle">
            <small className="text-muted d-block mb-1">Due Date</small>
            <div className="fw-semibold">
              {formatDate(task.due_date)}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="border rounded p-3 h-100 bg-light-subtle">
            <small className="text-muted d-block mb-1">Assigned To</small>
            <div className="fw-semibold">
              {task.assigned_to_name || 'Unassigned'}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="border rounded p-3 h-100 bg-light-subtle">
            <small className="text-muted d-block mb-1">Added By</small>
            <div className="fw-semibold">
              {task.added_by_name || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="border rounded p-3 mt-3 mb-3 bg-light-subtle">
        <div className="d-flex align-items-center gap-2 mb-2">
          <i className="bi bi-card-text text-muted" />
          <small className="text-muted fw-semibold">Description</small>
        </div>

        {task.description ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{task.description}</div>
        ) : (
          <span className="text-muted">No description provided.</span>
        )}
      </div>

      <div className="modal-footer pb-0 justify-content-between">
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => onEditTask?.(task)}
          >
            <i className="bi bi-pencil me-1" />
            Edit
          </button>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDeleteTask?.(task.id)}
          >
            <i className="bi bi-trash me-1" />
            Delete
          </button>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn btn-sm ${
              task.is_completed ? 'btn-outline-secondary' : 'btn-success'
            }`}
            onClick={() => onToggleComplete(task.id, task.is_completed)}
          >
            <i
              className={`bi ${
                task.is_completed
                  ? 'bi-arrow-counterclockwise me-1'
                  : 'bi-check-lg me-1'
              }`}
            />
            {task.is_completed ? 'Reopen Task' : 'Mark as Complete'}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            data-bs-dismiss="modal"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailsModal;