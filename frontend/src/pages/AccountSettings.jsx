import React, { useState, useEffect } from "react";
import axiosInstance from "../AxiosInstance";

const AccountSettings = () => {
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [message, setMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false); // מצב עריכה לפרטים אישיים
    const [isEditingPassword, setIsEditingPassword] = useState(false); // מצב עריכה לסיסמה

    useEffect(() => {
        axiosInstance.get("api/user/")
            .then((response) => {
                const data = response.data[0];
                setFormData({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                });
            })
            .catch((error) => console.error("Error fetching user data: " + error));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axiosInstance.put("api/user/", formData)
            .then((response) => {
                setMessage("Account details updated successfully.");
                setIsEditing(false);
            })
            .catch((error) => {
                console.error("Error updating account details: " + error);
                setMessage("Error updating account details.");
            });
    };

    const handlePasswordSubmit = (e) => {
        console.log("TODO: Implement password change functionality");
    };

    return (
        <div className="container mt-4">
            <h2>Account Settings</h2>
            {message && <div className="alert alert-info">{message}</div>}

            {/* פרטים אישיים */}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={true}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        disabled={!isEditing}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        disabled={!isEditing}
                    />
                </div>

                {isEditing ? (
                    <div className="mb-3">
                        <button type="submit" className="btn btn-primary me-2">Save Changes</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                ) : (
                    <button type="button" className="btn btn-warning" onClick={() => setIsEditing(true)}>Edit Profile</button>
                )}
            </form>

            <hr />

            {/* שינוי סיסמה */}
            <h3>Change Password</h3>
            {isEditingPassword ? (
                <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Current Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="confirm_password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary me-2">Change Password</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditingPassword(false)}>Cancel</button>
                </form>
            ) : (
                <button type="button" className="btn btn-danger" onClick={() => setIsEditingPassword(true)}>Change Password</button>
            )}
        </div>
    );
};

export default AccountSettings;
