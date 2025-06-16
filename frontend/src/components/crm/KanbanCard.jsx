import React, { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const KanbanCard = ({ account, onDelete, onView }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: account.id,
    data: {
      type: "card",
      account,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    // Apply styles based on dragging state
    opacity: isDragging ? 0.5 : 1,
    border: isDragging ? "2px solid #FF6C2F" : undefined,
    position: "relative",
  };

  const tooltipRef = useRef(null);
  let tooltipInstance = useRef(null); // מחזיק את האינסטנס

  // useEffect(() => {
  //   const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  //   [...tooltipTriggerList].forEach(tooltipEl => {
  //     new bootstrap.Tooltip(tooltipEl);
  //   });
  // }, []);

  useEffect(() => {
    if (tooltipRef.current) {
      tooltipInstance.current = new bootstrap.Tooltip(tooltipRef.current);

      // Clean up on unmount
      return () => {
        tooltipInstance.current.dispose();
      };
    }
  }, []);

   const lastInteraction = account.last_interaction
    ? new Date(account.last_interaction).toLocaleDateString()
    : "No interactions";


   return (
    <div
      ref={setNodeRef}
      style={style}
      className="card kanban-card mb-2 rounded shadow-sm border-2 d-flex flex-column justify-content-between"
      {...attributes}
      {...listeners}
    >
      <div className="card-body p-2">
        <strong>{account.name}</strong>
        <div className="text-muted small">{account.company_details?.name || "No Company Info"}</div>
        <div className="text-muted small">👤 {account.assigned_to_name || "Unassigned"}</div>
      </div>

      <div className="card-actions d-flex justify-content-between align-items-center px-2">
        <small
          className="text-muted"
          ref={tooltipRef}
          data-bs-toggle="tooltip"
          data-bs-title="Last communication with this client"
        >
          {lastInteraction}
        </small>

        <div className="d-flex ">
          <button
            className="card-action btn btn-sm border-0"
            title="View account"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(account.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ color: "#FF6C2F", fontSize: "1.1rem" }}
          >
            <i className="bi bi-eye-fill"></i>
          </button>

          <button
            className="card-action btn btn-sm border-0"
            title="Delete account"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(account.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ color: "#FF6C2F", fontSize: "1.1rem" }}
          >
            <i className="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
export default KanbanCard;
