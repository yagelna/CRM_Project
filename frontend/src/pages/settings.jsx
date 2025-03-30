import React from "react";
import { Link } from "react-router-dom";
import AccountSettings from "./AccountSettings";
import ExportSettings from "./ExportSettings";
import EmailTemplates from "./EmailTemplates";
import { useState, useEffect } from "react";

const Settings = () => {

    const [activeTab, setActiveTab] = useState('account');

    return (
        <div className="module-container">
            <h3>Settings</h3>
            <p>Manage your account and configure your RFQ Manager preferences.</p>

            {/* Navigation Tabs */}
            <ul className="nav nav-underline mb-3">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === "account" ? "active" : ""}`}
                        onClick={() => setActiveTab("account")}
                    >
                        Account Settings
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === "export" ? "active" : ""}`}
                        onClick={() => setActiveTab("export")}
                    >
                        Export Settings
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === "templates" ? "active" : ""}`}
                        onClick={() => setActiveTab("templates")}
                    >
                        Email Templates
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === "account" && <AccountSettings />}
                {activeTab === "export" && <ExportSettings />}
                {activeTab === "templates" && <EmailTemplates />}
            </div>
        </div>
    );
};
export default Settings;
