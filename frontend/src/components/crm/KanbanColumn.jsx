import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import KanbanCard from "./KanbanCard";
import { SortableContext } from "@dnd-kit/sortable";

const columnStyle = {
  width: "280px",
  minWidth: "280px",
  height: "500px",
  flexShrink: 0,
};


const KanbanColumn = ({ id, title, tasks = [], onAddTask, onDeleteTask }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "column" },
  });

  const style = {
    ...columnStyle,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // עמודה בזמן גרירה – placeholder בגודל קבוע
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="bg-body border border-warning rounded p-2 opacity-75"
        style={{
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className="bg-body text-white border-secondary rounded p-2 d-flex flex-column"
      style={style}
    >
      {/* Header */}
      <div className="card bg-secondary border-secondary mb-2">
        <div
          className="card-header text-white d-flex justify-content-between align-items-center p-2"
          style={{
            backgroundColor: "#5A34F1",
            cursor: "grab",
          }}
          {...attributes}
          {...listeners}
        >
          <span className="fw-bold">
            <span className="badge bg-secondary me-2">{tasks.length}</span>
            {title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className="overflow-auto px-1 flex-grow-1"
        style={{ scrollbarWidth: "thin" }}
      >
        <SortableContext items={tasks.map((task) => task.id)}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} columnId={id} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
      </div>

      {/* Footer */}
      <div className="mt-2 text-center">
        <button
          className="kanban-add-task-btn"
          onClick={onAddTask}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add task
        </button>
      </div>
    </div>
  );
}

export default KanbanColumn;
