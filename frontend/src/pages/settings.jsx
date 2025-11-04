import React from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "bi-person-gear",
      title: "Account & Security",
      desc: "Profile, password, and two-factor authentication.",
      path: "/settings/account",
    },
    {
      icon: "bi-box-arrow-up",
      title: "Export Settings",
      desc: "Configure export formats and options.",
      path: "/settings/export",
    },
    {
      icon: "bi-envelope-paper",
      title: "Email Templates",
      desc: "Customize your outgoing email templates.",
      path: "/settings/templates",
    },
    {
      icon: "bi-link-45deg",
      title: "Connections & Integrations",
      desc: "Manage external connections and API keys.",
      path: "/settings/connections",
    },
  ];

  return (
    <div className="module-container">
      <div>
        <h3 className="me-3">Settings</h3>
        <p className="text-muted small">Manage your account, security, and system preferences.</p>
      </div>

      <div className="row g-4">
        {cards.map((c) => (
          <div className="col-12 col-md-6 col-xl-4" key={c.title}>
            <div className="card border-0 shadow-sm h-100 text-center p-4 hover-lift">
              <div className="text-primary fs-1 mb-3">
                <i className={`bi ${c.icon}`}></i>
              </div>
              <h5 className="mb-1">{c.title}</h5>
              <p className="text-muted small mb-3">{c.desc}</p>
              <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(c.path)}>
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
