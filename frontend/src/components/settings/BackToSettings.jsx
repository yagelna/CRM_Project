import React from "react";
import { Link } from "react-router-dom";

const BackToSettings = ({ className = "" }) => {
  return (
    <div className={`mb-3 ${className}`}>
      <Link to="/settings" className="btn btn-link p-0 text-decoration-none">
        <i className="bi bi-arrow-left me-2"></i>
        Back to Settings
      </Link>
    </div>
  );
};

export default BackToSettings;
