import React from "react";

const ActionCellRenderer = ({ api, node, handleDelete, handleEdit}) => {

    const Delete = () => {
        if (window.confirm(`Are you sure you want to delete ${node.data.mpn}?`)) {
            handleDelete(node.data.id);
        }
    };

    return (
        <div>
            <button
                className="btn btn-primary btn-sm me-2"
                onClick={() => handleEdit(node.data)} // קביעת הנתונים לעריכה
                data-bs-toggle="modal" 
                data-bs-target="#EditRfqModal" // מתייחס ל-id של המודל
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

