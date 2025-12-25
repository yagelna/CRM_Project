import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Draggable supplier "pill".
 * We store important metadata in `data` so DnD handlers can know platform/container.
 */
const SortableItem = ({ id, item, platformKey, containerKey }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "item",
      platform: platformKey,
      container: containerKey,
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 2 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="d-inline-block">
      <span
        className="badge bg-light text-dark border me-2 mb-2"
        style={{ userSelect: "none", cursor: "grab" }}
        {...attributes}
        {...listeners}
        title={`${item.supplier} (${item.total_parts || 0})`}
      >
        {item.supplier} <span className="text-muted">({item.total_parts || 0})</span>
      </span>
    </div>
  );
};

export default SortableItem;
