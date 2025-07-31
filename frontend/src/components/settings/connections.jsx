import React, { useState, useEffect } from "react";
import axiosInstance from "../../AxiosInstance";

const Connections = () => {
    const [connections, setConnections] = useState([]);
    const [userSettings, setUserSettings] = useState({});
    const [systemSettings, setSystemSettings] = useState({});
    const [message, setMessage] = useState("");
    const [integrationType, setIntegrationType] = useState("smtp");

    useEffect(() => {
        fetchConnections();
        fetchUserSettings();
        fetchSystemSettings();
    }, []);

    const fetchConnections = async () => {
        try {
            const response = await axiosInstance.get("api/email-connections/email-connections/");
            setConnections(response.data);
        } catch (error) {
            setMessage("Failed to load connections.");
        }
    };

    const fetchUserSettings = async () => {
        try {
            const response = await axiosInstance.get("api/usersettings/");
            setUserSettings(response.data);
            console.log("User Settings:", response.data);
        } catch (error) {
            setMessage("Failed to load user settings.");
        }
    };

    const fetchSystemSettings = async () => {
        try {
            const response = await axiosInstance.get("api/system-settings/");
            setSystemSettings(response.data);
            console.log("System Settings:", response.data);
        } catch (error) {
            setMessage("Failed to load system settings.");
        }
    };

    const getSelectedConnectionId = (purpose) => {
        if (purpose === "rfq") return userSettings.rfq_email_connection;
        if (purpose === "crm") return userSettings.crm_email_connection;
        if (purpose === "inventory") return systemSettings.inventory_update_connection;
    };

    const handlePurposeChange = async (purpose, connectionId) => {
        try {
            if (purpose === "inventory") {
                if (!window.confirm("⚠️ This will affect ALL users. Proceed?")) return;
                await axiosInstance.patch("api/system-settings/", {
                    inventory_update_connection: connectionId
                });
                setSystemSettings({
                    ...systemSettings,
                    inventory_update_connection: connectionId
                });
            } else {
                await axiosInstance.patch("api/usersettings/update_settings/", {
                    [`${purpose}_email_connection`]: connectionId,
                });
                setUserSettings({
                    ...userSettings,
                    [`${purpose}_email_connection`]: connectionId,
                });
            }
        } catch (error) {
            setMessage(`Failed to update ${purpose} connection.`);
        }
    };

    const deleteConnection = async (id) => {
        if (!window.confirm("Are you sure you want to delete this connection?")) return;
        try {
            await axiosInstance.delete(`api/email-connections/email-connections/${id}/`);
            setConnections(connections.filter(conn => conn.id !== id));
            setMessage("Connection deleted successfully.");
        } catch (error) {
            setMessage("Failed to delete connection.");
        }
    };

    const connectGoogle = async () => {
        try {
            const res = await axiosInstance.get("api/email-connections/google/init/");
            if (res.data.auth_url) {
                window.location.href = res.data.auth_url;
            } else {
                setMessage("Failed to initiate Google OAuth.");
            }
        } catch (err) {
            setMessage("Error initiating Google connection.");
        }
    };

    const renderPurposeButton = (connId, label, purpose, isGlobal = false) => {
        const selected = getSelectedConnectionId(purpose) === connId;
        return (
            <button
                className={`btn btn-sm me-1 ${selected ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => handlePurposeChange(purpose, connId)}
            >
                {label} {isGlobal && <span title="System-wide setting">🌐</span>}
            </button>
        );
    };

    return (
        <div className="container mt-4">
            <h2>Connections & Integrations</h2>
            {message && <div className="alert alert-info">{message}</div>}

            <div className="mb-3">
                <p className="d-inline-flex gap-1">
                    <button className="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#addConnection" aria-expanded="false" aria-controls="addConnection">
                        Add New Connection
                    </button>
                </p>

                <div className="collapse" id="addConnection">
                    <div className="card card-body">
                        <form id="emailConfigForm">
                            {/* Integration Type Selector */}
                            <div className="mb-3">
                                <label htmlFor="integrationType" className="form-label">Integration Type</label>
                                <select
                                    className="form-select"
                                    id="integrationType"
                                    value={integrationType}
                                    onChange={(e) => setIntegrationType(e.target.value)}
                                >
                                    <option value="smtp">SMTP Server</option>
                                    <option value="gmail">Gmail API</option>
                                </select>
                            </div>

                            {/* SMTP Fields */}
                            {integrationType === "smtp" && (
                                <>
                                    <div className="row mb-3">
                                        <div className="col">
                                            <label htmlFor="smtpServer" className="form-label">SMTP Server</label>
                                            <input type="text" className="form-control" id="smtpServer" placeholder="smtp.example.com" />
                                        </div>
                                        <div className="col">
                                            <label htmlFor="smtpPort" className="form-label">Port</label>
                                            <input type="number" className="form-control" id="smtpPort" placeholder="587" />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="smtpUsername" className="form-label">Username</label>
                                        <input type="email" className="form-control" id="smtpUsername" placeholder="user@example.com" />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="smtpPassword" className="form-label">Password</label>
                                        <input type="password" className="form-control" id="smtpPassword" placeholder="Password" />
                                    </div>

                                    <div className="form-check form-switch mb-3">
                                        <input className="form-check-input" type="checkbox" id="useSSL" defaultChecked />
                                        <label className="form-check-label" htmlFor="useSSL">Use SSL/TLS</label>
                                    </div>
                                </>
                            )}

                            {/* Gmail Fields */}
                            {integrationType === "gmail" && (
                                <>
                                    <div className="alert alert-light border d-flex align-items-center gap-2">
                                        <i className="bi bi-envelope-at fs-4 text-primary"></i>
                                        <div>
                                            <strong>Gmail Integration</strong><br />
                                            Connect your Gmail account to send and receive emails directly from the platform. This integration uses OAuth 2.0 for secure access.
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-warning w-100 mb-3"
                                        onClick={connectGoogle}
                                    >
                                        Connect Gmail Account
                                    </button>
                                </>
                            )}

                            <button type="submit" className="btn btn-success">Save</button>
                        </form>
                    </div>
                </div>
            </div>

            <table className="table mt-3">
                <thead className="thead-light">
                    <tr>
                        <th>ID</th>
                        <th>Provider</th>
                        <th>Email</th>
                        <th>Display Name</th>
                        <th>Expires At</th>
                        <th>Used For</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {connections.length > 0 ? (
                        connections.map(conn => (
                            <tr key={conn.id}>
                                <td>{conn.id}</td>
                                <td>{conn.provider}</td>
                                <td>{conn.email_address}</td>
                                <td>{conn.display_name}</td>
                                <td>{conn.token_expires ? new Date(conn.token_expires).toLocaleString() : "N/A"}</td>
                                <td>
                                    {renderPurposeButton(conn.id, "RFQ", "rfq")}
                                    {renderPurposeButton(conn.id, "CRM", "crm")}
                                    {renderPurposeButton(conn.id, "Inventory", "inventory", true)}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteConnection(conn.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center">No connections found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Connections;
