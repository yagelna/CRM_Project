import React from "react";
import { Link } from "react-router-dom";
import AccountSettings from "../components/settings/AccountSettings";
import ExportSettings from "../components/settings/ExportSettings";
import EmailTemplates from "../components/settings/EmailTemplates";
import Connections from "../components/settings/connections";
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
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === "connections" ? "active" : ""}`}
                        onClick={() => setActiveTab("connections")}
                    >
                        Connections & Integrations
                    </button>
                </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === "account" && <AccountSettings />}
                {activeTab === "export" && <ExportSettings />}
                {activeTab === "templates" && <EmailTemplates />}
                {activeTab === "connections" && <Connections />}
            </div>
        </div>
    );
};
export default Settings;
