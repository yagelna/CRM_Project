import React, { useState, useEffect } from "react";
import axiosInstance from "../../AxiosInstance";

const Connections = () => {
    const [connections, setConnections] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const response = await axiosInstance.get("api/email-connections/email-connections/");
            setConnections(response.data);
        } catch (error) {
            setMessage("Failed to load connections.");
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

    return (
        <div className="container mt-4">
            <h2>Connections & Integrations</h2>
            {message && <div className="alert alert-info">{message}</div>}

            <div className="mb-3">
                <button className="btn btn-outline-danger me-2" onClick={connectGoogle}>
                    Connect Google Account
                </button>
                {/* בעתיד נוסיף גם חיבור SMTP כאן */}
            </div>

            <table className="table table-bordered mt-3">
                <thead className="thead-light">
                    <tr>
                        <th>ID</th>
                        <th>Provider</th>
                        <th>Email</th>
                        <th>Display Name</th>
                        <th>Expires At</th>
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
                            <td colSpan="6" className="text-center">No connections found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Connections;