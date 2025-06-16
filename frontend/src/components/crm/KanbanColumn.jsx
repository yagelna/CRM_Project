import React, { useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import KanbanCard from "./KanbanCard";
import { SortableContext } from "@dnd-kit/sortable";

const columnStyle = {
  width: "300px",
  minWidth: "280px",
  height: "500px",
  flexShrink: 0,
};


const KanbanColumn = ({ id, column, onAddAccount, onDeleteAccount, overColumnId, draggedCardId, onViewAccount }) => {

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: { type: "column", column },
  });

  const style = {
    ...columnStyle,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOver = overColumnId === column.id;
  const showPreviewCard = isOver && draggedCardId && !column.cards.some(card => card.id === draggedCardId);
 useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach(tooltipEl => {
      new bootstrap.Tooltip(tooltipEl);
    });
  }, []);



  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="bg-body border border-warning rounded p-2 opacity-75"
        style={{
          ...style,
          borderColor: "#FF6C2F",
        }}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`bg-body text-white rounded p-2 d-flex flex-column ${isOver ? 'border border-warning border-1' : ''}`}
      style={style}
    >
      {/* Header */}
      <div className="card bg-secondary border-secondary mb-2 ">
        <div
          className="card-header text-white d-flex justify-content-between p-2"
          style={{ backgroundColor: "#5A34F1", cursor: "grab", }}
          {...attributes}
          {...listeners}
        >
          <span className="fw-bold">
            <span className="badge bg-secondary me-2">{column.cards.length}</span>
            {column.title}
          </span>
          <button 
                                type="button" 
                                className="btn btn-sm"
                                data-bs-toggle="tooltip"
                                title="Test BUTTON"
                                data-bs-content={`
                                    <strong>TEST:</strong><br>
                                    This is a test button.<br>
                                    <br>
                                `}
                            >
                                <i className="bi bi-bell-fill text-warning"></i>
                            </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-auto px-1 flex-grow-1" style={{ scrollbarWidth: "thin" }}>
        <SortableContext items={column.cards.map((card) => card.id)}>
          {column.cards.map((card) => (
            <KanbanCard key={card.id} account={card} onDelete={onDeleteAccount} onView={onViewAccount} />
          ))}
          {showPreviewCard && (
            <div className="card kanban-card mb-2 rounded shadow-sm border-2 opacity-50" style={{ border: "2px solid #FF6C2F" }}>
              <div className="card-body p-2">
                <strong> Drop here to change status to {column.title} </strong>
                <div className="text-muted small">
                  Preview card
                </div>
              </div>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Footer */}
      <div className="mt-2 text-center">
        <button className="kanban-add-account-btn" onClick={onAddAccount}>
          <i className="bi bi-plus-circle me-2"></i>
          Add account
        </button>
      </div>
    </div>
  );
}

export default KanbanColumn;
