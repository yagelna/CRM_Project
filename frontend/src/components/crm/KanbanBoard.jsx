import React, { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import KanbanCard from "./KanbanCard";

function KanbanBoard() {
  const statuses = ['new', 'active', 'slow', 'inactive', 'archived'];
  const [accounts, setAccounts] = useState([
  { id: 'new', name: 'Dotz', status: 'new', email: 'dotz@dotz.com' },
  { id: 'active', name: 'Intel', status: 'active', email: 'intel@intel.com' },
  { id: 'slow', name: 'Google', status: 'slow', email: 'google@google.com' },
  { id: 'inactive', name: 'Microsoft', status: 'inactive', email: 'mic@mic.com' },
  { id: 'archived', name: 'Apple', status: 'archived', email: 'app@app.com' }
  ]);
  // example initial state for columns
  const [columns, setColumns] = useState([
    {
      id: "new",
      title: "New",
      tasks: [{ 
          id: "task1",
          title: "Implement data validation" }]
    },
    {
      id: "active",
      title: "Active",
      tasks: [{ 
        id: "task2",
        title: "Analyze competitors" }]
    },
    {
      id: "slow",
      title: "Slow",
      tasks: [{ 
        id: "task3",
        title: "Deliver dashboard prototype" }]
    },
    {
      id: "inactive",
      title: "Inactive",
      tasks: [{ 
        id: "task4",
        title: "Conduct user interviews" }, { id: "task5", title: "Create user personas" }]
    },
    {
      id: "archived",
      title: "Archived",
      tasks: [{ id: "task6",title: "Review project documentation" }]
    }
  ]);

  const [activeColumn, setActiveColumn] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const onDragStart = (event) => {
    const id = event.active.id;
    const column = columns.find((col) => col.id === id);
    if (event.active.data.current?.type === "column") {
      setActiveColumn(column); // set the active column for drag overlay
      return;
    }
    if (event.active.data.current?.type === "card") {
      setActiveCard(event.active.data.current.task); // set the active task for drag overlay
      return;
    }
  };

  const onDragEnd = (event) => {
  const { active, over } = event;

  // reset state
  setActiveColumn(null);
  setActiveCard(null);

  // אין דריסה
  if (!over) return;

  const activeType = active.data.current?.type;
  const overType = over.data.current?.type;

  // גרירה של עמודה - קיים כבר
  if (activeType === "column" && overType === "column") {
    const activeIndex = columns.findIndex(col => col.id === active.id);
    const overIndex = columns.findIndex(col => col.id === over.id);
    if (activeIndex !== overIndex) {
      const newColumns = arrayMove(columns, activeIndex, overIndex);
      setColumns(newColumns);
    }
    return;
  }

  // גרירה של קלף
  if (activeType === "card" && over) {
    const activeCard = active.data.current.task;
    const sourceColumnId = active.data.current.task.columnId;
    const overId = over.id;

    // מצא את העמודה שמכילה את היעד
    const overColumn = columns.find(col =>
      col.tasks.some(task => task.id === overId) || col.id === overId
    );

    if (!overColumn) return;

    const sourceColumn = columns.find(col =>
      col.tasks.some(task => task.id === activeCard.id)
    );

    if (!sourceColumn) return;

    // אם נשאר באותה עמודה
    if (sourceColumn.id === overColumn.id) {
      const oldIndex = sourceColumn.tasks.findIndex(task => task.id === activeCard.id);
      const newIndex = overColumn.tasks.findIndex(task => task.id === overId);
      if (oldIndex !== newIndex) {
        const newTasks = arrayMove(sourceColumn.tasks, oldIndex, newIndex);
        setColumns(columns.map(col =>
          col.id === sourceColumn.id ? { ...col, tasks: newTasks } : col
        ));
      }
    } else {
      // מעבר לעמודה אחרת
      const newOverIndex = overColumn.tasks.findIndex(task => task.id === overId);
      const updatedSourceTasks = sourceColumn.tasks.filter(task => task.id !== activeCard.id);
      const updatedOverTasks = [
        ...overColumn.tasks.slice(0, newOverIndex),
        activeCard,
        ...overColumn.tasks.slice(newOverIndex),
      ];

      setColumns(columns.map(col => {
        if (col.id === sourceColumn.id) return { ...col, tasks: updatedSourceTasks };
        if (col.id === overColumn.id) return { ...col, tasks: updatedOverTasks };
        return col;
      }));
    }
  }
};

  const onDragCancel = () => {
    setActiveColumn(null);
  };

    const onDragOver = (event) => {

  };


  const handleAddTask = (columnId) => {
    const newTask = { 
      id: `task-${Date.now()}`, // unique ID based on timestamp
      title: `New Task ${Math.floor(Math.random() * 1000)}` // random title for demo
    };
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
    );
  };

  const handleDeleteTask = (columnId, taskToDelete) => {

    console.log("Deleting task:", taskToDelete);
  setColumns((prevColumns) =>
    prevColumns.map((col) =>
      col.id === columnId
        ? {
            ...col,
            tasks: col.tasks.filter((task) => task.id !== taskToDelete.id),
          }
        : col
    )
  );
  };
  

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      onDragOver= {onDragOver}
    >
      <div className="container-fluid d-flex flex-column min-vh-100 overflow-hidden px-4">
        <div
          className="d-flex overflow-auto gap-3 px-3"
          style={{ flex: 1, alignItems: "flex-start" }}
        >
          <SortableContext items={columns.map((col) => col.id)}>
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={col.tasks}
                onAddTask={() => handleAddTask(col.id)}
                onDeleteTask={handleDeleteTask}
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
              title={activeColumn.title}
              tasks={activeColumn.tasks}
            />
          )}
          {activeCard && (
            <KanbanCard
              task={activeCard}
              columnId={activeColumn?.id}
              onDelete={() => handleDeleteTask(activeColumn?.id, activeCard)}
            />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

export default KanbanBoard;
