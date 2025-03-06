import React from "react";
import { Link } from "react-router-dom";

const Settings = () => {
    return (
        <div className="container mt-4">
            <h1>Settings</h1>
            <p>Manage your account, system preferences, and templates.</p>

            <div className="list-group">
                <Link to="/settings/account" className="list-group-item list-group-item-action">
                    Account Settings
                </Link>
                <Link to="/settings/export" className="list-group-item list-group-item-action">
                    Export Settings
                </Link>
                <Link to="/settings/templates" className="list-group-item list-group-item-action">
                    Email Templates
                </Link>
            </div>
        </div>
    );
};

export default Settings;
