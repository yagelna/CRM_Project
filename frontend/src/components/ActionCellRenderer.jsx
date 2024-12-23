import React from "react";

const ActionCellRenderer = ({ api, node, handleDelete, handleEdit, modalId}) => {

    const Delete = () => {
        if (window.confirm(`Are you sure you want to delete this item?`)) {
            handleDelete(node.data.id);
        }
    };

    return (
        <div className="btn-group btn-group-sm" role="group" aria-label="Small button group">
            <button 
                type="button"
                className="btn btn-outline-danger"
                onClick={() => handleEdit(node.data)}
                data-bs-toggle="modal" 
                data-bs-target={`#${modalId}`}
            >
                <i className="bi bi-pencil"></i>
            </button>
            <button 
                type="button"
                className="btn btn-outline-primary"
                onClick={Delete}
            >
                <i className="bi bi-trash3"></i>
            </button>
            <button type="button" className="btn btn-outline-secondary"><i className="bi bi-envelope"></i>
            </button>
        </div>

    );
}

export default ActionCellRenderer;



