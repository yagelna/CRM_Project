import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../AxiosInstance";
import { useAuth } from "../../context/AuthContext";

const MODULES = [
  { key: "crm",       label: "CRM",       group: "crm_access" },
  { key: "inventory", label: "Inventory", group: "inventory_access" },
  { key: "companies", label: "Companies", group: "companies_access" },
  { key: "contacts",  label: "Contacts",  group: "contacts_access" },
  { key: "rfqs",      label: "RFQs",      group: "rfqs_access" },
  { key: "orders",    label: "Orders",    group: "orders_access" },
  { key: "ai",        label: "AI",        group: "ai_access" },
];

export default function SettingsAccess() {
  const { user: me, refreshMe } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  // Client-side protection: only is_staff / superuser can see the page
  const canManage =
    !!me && (me.is_staff || me.is_superuser || (me.permissions || []).includes("users.manage_access"));

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axiosInstance.get("api/user/list-for-access/");
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (canManage) fetchUsers();
    return () => { cancelled = true; };
  }, [canManage]);

  const toggleAccess = async (userRow, moduleKey, allow) => {
    setSavingId(userRow.id);
    try {
      const { data } = await axiosInstance.post(`api/user/${userRow.id}/set-module-access/`, {
        module: moduleKey,
        allow
      });
      // Local update
      setRows(prev => prev.map(r => (r.id === userRow.id ? data : r)));
      // If this is the logged-in user – refresh profile to update UI (sidebar/permissions etc.)
      if (me?.id === userRow.id && typeof refreshMe === "function") {
        await refreshMe();
      }
    } catch (e) {
      alert("Failed to update access: " + (e?.response?.data?.error || e.message));
    } finally {
      setSavingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="module-container">
        <h4 className="mb-2">Manage Users Access</h4>
        <div className="alert alert-warning"> You do not have permission to view this page.</div>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="mb-1">Manage Users Access</h4>
          <div className="text-muted small">Enable/disable module access for users (superusers are excluded from the list).</div>
        </div>
      </div>

      {loading && (
        <div className="card shadow-sm">
          <div className="card-body">Loading users...</div>
        </div>
      )}

      {error && (
        <div className="card shadow-sm">
          <div className="card-body text-danger">
            שגיאה: {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th style={{minWidth: 240}}>User</th>
                    {MODULES.map(m => <th key={m.key} className="text-center">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={1 + MODULES.length} className="text-center text-muted">No users to display.</td>
                    </tr>
                  )}
                  {rows.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-semibold">{u.email}</div>
                        <div className="text-muted small">
                          {(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}` : '—'}
                        </div>
                      </td>
                      {MODULES.map(m => {
                        const has = (u.groups || []).some(g => g.toLowerCase() === m.group.toLowerCase());
                        return (
                          <td key={m.key} className="text-center">
                            <div className="form-check form-switch d-inline-block">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`sw-${u.id}-${m.key}`}
                                checked={!!has}
                                disabled={savingId === u.id}
                                onChange={(e) => toggleAccess(u, m.key, e.target.checked)}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 small text-muted">
              Changes are applied immediately. If you modify your own access, UI may refresh.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}