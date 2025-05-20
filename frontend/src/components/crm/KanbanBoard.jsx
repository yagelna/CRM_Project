// src/components/crm/KanbanBoard.jsx
import React from 'react';
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusColumns = ['new', 'active', 'slow', 'inactive', 'archived'];

const getStatusLabel = (status) => {
  switch (status) {
    case 'new': return 'New';
    case 'active': return 'Active';
    case 'slow': return 'Slow';
    case 'inactive': return 'Inactive';
    case 'archived': return 'Archived';
    default: return status;
  }
};

const SortableCard = ({ account }) => {
  const {
    attributes,
    setNodeRef,
    transform,
    transition,
    listeners, // 🔥 זה מה שחסר לך!
  } = useSortable({
    id: account.id,
    data: { status: account.status },
  });

  const isDragging = !!transform;
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  zIndex: isDragging ? 9999 : 'auto',
  position: isDragging ? 'fixed' : 'relative',
  width: isDragging ? '250px' : '100%', // חשוב מאוד כדי שלא יתכווץ
  pointerEvents: isDragging ? 'none' : 'auto',
};

  console.log('Dragging', account.name, 'in column', account.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}  // 🧠 היה חסר! בלי זה אי אפשר לגרור
      className="card mb-2 shadow-sm"
    >
      <div className="card-body p-2">
        <h6 className="mb-1">{account.name}</h6>
        <p className="mb-0 text-muted small">{account.email || 'No email'}</p>
      </div>
    </div>
  );
};

const DroppableColumn = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="h-100">
      {children}
    </div>
  );
};

const KanbanBoard = ({ accounts, onStatusChange }) => {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeStatus = active.data.current.status;
    const overStatus = over.id;

    if (activeStatus !== overStatus) {
      const draggedAccount = accounts.find(account => account.id === active.id);
      if (draggedAccount && onStatusChange) {
        onStatusChange(draggedAccount.id, overStatus);
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="row">
        {statusColumns.map(status => (
          <div className="col" key={status}>
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-light fw-bold text-center">{getStatusLabel(status)}</div>
              <div className="card-body" style={{ minHeight: '300px' }}>
                <DroppableColumn id={status}>
                <SortableContext
                  id={status}
                  items={accounts.filter(a => a.status === status).map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {accounts
                    .filter(account => account.status === status)
                    .map(account => (
                      <SortableCard key={account.id} account={account} />
                    ))}
                </SortableContext>
                </DroppableColumn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
