import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const cardStyle = {
  padding: "0.5rem",
  marginBottom: "0.5rem",
  backgroundColor: "#f8f9fa",
  borderRadius: "0.25rem",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  cursor: "grab",
};

const KanbanCard = ({ task, columnId, onDelete }) => {
  const {
      setNodeRef,
      attributes,
      listeners,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: task.id, // Use task title as ID for simplicity
      data: { type: "card", task },
    });

     const style = {
        ...cardStyle,
        transform: CSS.Transform.toString(transform),
        transition,
        // Apply styles based on dragging state
        opacity: isDragging ? 0.5 : 1,
  border: isDragging ? "2px solid #FF6C2F" : undefined,
      };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card kanban-card mb-2 rounded shadow-sm border-2"
    >
      {/* Card content */}
   
      <div className="card-body d-flex justify-content-between align-items-center p-2">
        <span className="text-truncate text-purple">
          {task.title}
        </span>

        <div 
        onPointerDown={(e) => e.stopPropagation()} // Prevent card click event
        className="delete-icon-wrapper">
          
          <button
            className="btn btn-sm border-0"
            title="Delete task"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              onDelete(columnId, task);
            }}
            style={{
              color: "#FF6C2F",
              fontSize: "1.1rem",
            }}
          >
            <i className="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;