import React from "react";

const ActionCellRenderer = ({ api, node, handleDelete, handleEdit, modalId}) => {

    const Delete = () => {
        if (window.confirm(`Are you sure you want to delete this item?`)) {
            handleDelete(node.data.id);
        }
    };

    return (
        <div>
            <button
                className="btn btn-primary btn-sm me-2"
                onClick={() => handleEdit(node.data)}
                data-bs-toggle="modal" 
                data-bs-target={`#${modalId}`}
            >
                Edit
            </button>
            <button 
                className="btn btn-danger btn-sm"
                onClick={Delete}
            >
                Delete
            </button>
        </div>

    );
}

export default ActionCellRenderer;

