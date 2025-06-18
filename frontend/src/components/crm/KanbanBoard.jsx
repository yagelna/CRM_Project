import React, { useState, useMemo } from "react";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

function KanbanBoard({ accounts, onAddAccount, onDeleteAccount, onStatusChange, onViewAccount }) {
  const statuses = ['new', 'active', 'slow', 'inactive', 'archived'];
    const tooltipMap = {
    new: "New customers with no prior interaction",
    active: "Customers currently engaged in active communication",
    slow: "Customers with no interaction for up to 3 months",
    inactive: "Customers with no interaction for over 6 months",
    archived: "Archived customers kept for future reference"
  };

  const columns = useMemo(() => {
    return statuses.map((status) => ({
      id: status,
      title: status.charAt(0).toUpperCase() + status.slice(1),
      tooltip: tooltipMap[status],
      cards: accounts.filter((acc) => acc.status === status),
    }));
  }, [accounts]);



  const [activeColumn, setActiveColumn] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [draggedCardId, setDraggedCardId] = useState(null);

  const onDragStart = (event) => {
    console.log("onDragStart", event);
    if (event.active.data.current?.type === "column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "card") {
      setActiveCard(event.active.data.current.account);
      setDraggedCardId(event.active.data.current.account.id);
      return;
    }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveColumn(null);
    setOverColumnId(null);
    setActiveCard(null);
    setDraggedCardId(null);

    if (!over) return;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType === "column") {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
    }
    if (activeType === "card") {
      const draggedCard = active.data.current.account;
      let targetColumnId = null;

      if (overType === "column") {
        // dragged over a column – use the column's ID
        targetColumnId = over.id;
      } else if (overType === "card") {
        // dragged over a card – use the card's status
        targetColumnId = over.data.current.account.status;
      }

      if (!targetColumnId || targetColumnId === draggedCard.status) return;

      // Update backend status
      onStatusChange?.(draggedCard.id, targetColumnId);
    }
  }

  const onDragOver = (event) => {
    const activeType = event.active.data.current?.type;
    const overType = event.over?.data.current?.type;
    const overId = event.over?.id;

    if (activeType === "card") {
      let newOverColumnId = null;

      if (overType === "column") {
        newOverColumnId = overId;
      } else if (overType === "card") {
        newOverColumnId = event.over?.data.current?.account?.status || null;
      }

      if (newOverColumnId !== overColumnId) {
        setOverColumnId(newOverColumnId);
      }
    } else {
      if (overColumnId !== null) {
        setOverColumnId(null);
      }
    }
  };

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
      <div className="container-fluid d-flex flex-column min-vh-100 overflow-hidden px-0">
        <div className="kanban-columns-wrapper d-flex justify-content-between" style={{ width: "100%" }}><SortableContext items={columns.map((col) => col.id)}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              column={col}
              tooltip={col.tooltip}
              overColumnId={overColumnId}
              draggedCardId={draggedCardId}
              onDeleteAccount={onDeleteAccount}
              onViewAccount={onViewAccount}
            />
          ))}
        </SortableContext>
        </div>
      </div>
      {createPortal(
        <DragOverlay>
          {activeColumn && (
            <KanbanColumn
              id={activeColumn.id}
              column={activeColumn}
            />
          )}
          {activeCard && (
            <KanbanCard
              account={activeCard}
            />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default KanbanBoard;
