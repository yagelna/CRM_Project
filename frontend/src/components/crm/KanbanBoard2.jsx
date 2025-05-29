import React, { useState } from "react";
import KanbanColumn2 from "./KanbanColumn2";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

function KanbanBoard2({accounts}) {
  const statuses = ['new', 'active', 'slow', 'inactive', 'archived'];
  const [columns, setColumns] = useState(() =>
  statuses.map((status) => ({
    id: status,
    title: status.charAt(0).toUpperCase() + status.slice(1),
    cards: accounts.filter((acc) => acc.status === status),
  }))
);

  const [activeColumn, setActiveColumn] = useState(null);
  
  const onDragStart = (event) => {
    console.log("onDragStart", event);
    if (event.active.data.current?.type === "column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveColumn(null);
    if (!over) return;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType === "column") {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      if (oldIndex !== newIndex) {
        setColumns(arrayMove(columns, oldIndex, newIndex));
      }
    }
  }

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="container-fluid d-flex flex-column min-vh-100 overflow-hidden px-4">
        <div className="d-flex overflow-auto gap-3 px-3" style={{ flex: 1, alignItems: "flex-start" }}>
            <SortableContext items={columns.map((col) => col.id)}>
              {columns.map((col) => (
                <KanbanColumn2
                  key={col.id}
                  id={col.id}
                  column={col}
                />
              ))}
            </SortableContext>
        </div>
      </div>
      {createPortal(
        <DragOverlay>
          {activeColumn && (
            <KanbanColumn2
              id={activeColumn.id}
              column={activeColumn}
            />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default KanbanBoard2;
