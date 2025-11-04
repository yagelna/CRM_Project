import React, { useEffect, useState } from "react";
import axiosInstance from "../../AxiosInstance";

const TwoFactorModal = () => {
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);

  const loadSetup = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await axiosInstance.get("api/users/2fa/setup/");
      setQrDataUrl(data.qrcode_data_url || null);
      setMfaRequired(!!data.mfa_required);
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to load 2FA setup.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // נטען בכל פתיחה של המודל
    const modalEl = document.getElementById("TwoFactorModal");
    if (!modalEl) return;
    const handler = () => loadSetup();
    modalEl.addEventListener("show.bs.modal", handler);
    return () => modalEl.removeEventListener("show.bs.modal", handler);
  }, []);

  const enable = async (e) => {
    e.preventDefault();
    if (!code || code.length < 6) return;
    setLoading(true);
    setMsg(null);
    try {
      await axiosInstance.post("api/users/2fa/enable/", { code: code.trim() });
      setMfaRequired(true);
      setMsg("Two-Factor Authentication enabled.");
      setCode("");
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (!window.confirm("Disable 2FA for your account?")) return;
    setLoading(true);
    setMsg(null);
    try {
      await axiosInstance.post("api/users/2fa/disable/");
      setMfaRequired(false);
      setMsg("Two-Factor Authentication disabled.");
      setCode("");
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="TwoFactorModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-shield-lock me-2"></i>Two-Factor Authentication (TOTP)
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <small className="text-muted">
                Protect your account with a second step. Scan the QR with Google Authenticator, then enter the 6-digit code.
              </small>
              <span className={`badge ${mfaRequired ? "text-bg-success" : "text-bg-secondary"}`}>
                {mfaRequired ? "Enabled" : "Disabled"}
              </span>
            </div>

            {msg && <div className="alert alert-info py-2">{msg}</div>}

            <div className="row g-4 align-items-center">
              <div className="col-12 col-md-6">
                <div className="ratio ratio-1x1 border rounded d-flex align-items-center justify-content-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Scan QR" style={{ maxWidth: "100%", maxHeight: "100%" }} />
                  ) : (
                    <span className="text-muted">{loading ? "Loading QR..." : "QR not available"}</span>
                  )}
                </div>
                <button className="btn btn-link btn-sm mt-2" onClick={loadSetup} disabled={loading}>
                  Refresh QR
                </button>
              </div>

              <div className="col-12 col-md-6">
                {!mfaRequired ? (
                  <form onSubmit={enable}>
                    <div className="mb-3">
                      <label className="form-label">Authenticator Code</label>
                      <input
                        type="text"
                        className="form-control text-center"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                      />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading || code.length !== 6}>
                      {loading ? "Enabling..." : "Enable 2FA"}
                    </button>
                  </form>
                ) : (
                  <div>
                    <p className="text-muted">
                      Two-Factor is enabled. You’ll be asked for a code at login.
                    </p>
                    <button className="btn btn-danger" onClick={disable} disabled={loading}>
                      Disable 2FA
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-light" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorModal;
