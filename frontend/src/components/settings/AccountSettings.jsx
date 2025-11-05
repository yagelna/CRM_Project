import React, { useState, useEffect } from "react";
import axiosInstance from "../../AxiosInstance";
import TwoFactorModal from "./TwoFactorModal";
import BackToSettings from "./BackToSettings";
import { showToast } from "../common/toast";
import { useAuth } from "../../context/AuthContext";

const AccountSettings = () => {
  const { refreshMe } = useAuth(); 
  const [formData, setFormData] = useState({ email: "", first_name: "", last_name: "" });
  const [passwordData, setPasswordData] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    axiosInstance.get("api/user/me/")
      .then(({ data }) => setFormData({ email: data.email, first_name: data.first_name, last_name: data.last_name }))
      .catch((err) => {
        console.error("Error fetching user data:", err);
        showToast({ title: "Error", message: "Failed to load profile.", type: "danger" });
      });
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await axiosInstance.patch("api/user/me/", {
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      await refreshMe();
      showToast({ title: "Saved", message: "Account details updated.", type: "success" });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Error updating account details.";
      showToast({ title: "Error", message: msg, type: "danger" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { current_password, new_password, confirm_password } = passwordData;

    if (!current_password || !new_password || !confirm_password) {
      showToast({ title: "Missing fields", message: "Please fill all password fields.", type: "warning" });
      return;
    }
    if (new_password !== confirm_password) {
      showToast({ title: "Mismatch", message: "New password and confirmation do not match.", type: "warning" });
      return;
    }

    setSavingPassword(true);
    try {
      await axiosInstance.post("api/user/change-password/", {
        current_password, new_password, confirm_password,
      });
      showToast({ title: "Password updated", message: "Password changed successfully.", type: "success" });
      setIsEditingPassword(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.join(", ") : (detail || "Error changing password.");
      showToast({ title: "Error", message: msg, type: "danger" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="module-container">
      <BackToSettings />
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 className="mb-0">Account & Security</h3>
          <small className="text-muted">Manage your profile and secure your account.</small>
        </div>
        <button className="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#TwoFactorModal">
          <i className="bi bi-shield-lock me-1"></i> Manage Two-Factor
        </button>
      </div>

      <div className="row g-4">
        {/* Profile card */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Profile</h5>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={formData.email} disabled />
                </div>

                <div className="row">
                  <div className="col">
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text" className="form-control" name="first_name"
                        value={formData.first_name} onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text" className="form-control" name="last_name"
                        value={formData.last_name} onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-warning" onClick={() => setIsEditing(true)}>Edit Profile</button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Password card */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Change Password</h5>

              {isEditingPassword ? (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-control" name="current_password"
                      value={passwordData.current_password} onChange={handlePasswordChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-control" name="new_password"
                      value={passwordData.new_password} onChange={handlePasswordChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" className="form-control" name="confirm_password"
                      value={passwordData.confirm_password} onChange={handlePasswordChange} />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                      {savingPassword ? "Saving..." : "Change Password"}
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => setIsEditingPassword(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button type="button" className="btn btn-danger" onClick={() => setIsEditingPassword(true)}>
                  Change Password
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      <TwoFactorModal />
    </div>
  );
};

export default AccountSettings;
