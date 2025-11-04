import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import axiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [pendingSessionId, setPendingSessionId] = useState(null);
  const [step, setStep] = useState('credentials'); // 'credentials' | 'mfa'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleCredsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const res = await axiosInstance.post('api/login/', {
        email: formData.email,
        password: formData.password,
      });

      // Two options: either a token is received (no MFA) or requires_2fa+session_id
      if (res.data?.requires_2fa) {
        setPendingSessionId(res.data.session_id);
        setStep('mfa');
        return;
      }

      const token = res.data?.token;
      if (!token) throw new Error("No token in response");
      await login({ token });
      setSuccess(true);
      navigate('/rfqs');
    } catch (err) {
      console.error("Login failed", err);
      setErrorMsg(err?.response?.data?.error || err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!pendingSessionId) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await axiosInstance.post('api/users/2fa/verify/', {
        session_id: pendingSessionId,
        code: mfaCode.trim(),
      });
      const token = res.data?.token;
      if (!token) throw new Error("No token after MFA verify");

      await login({ token });
      setSuccess(true);
      navigate('/rfqs');
    } catch (err) {
      console.error("MFA verify failed", err);
      setErrorMsg(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        {success && (
          <div className="alert alert-success" role="alert">
            Login successful!
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-danger" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="card text-center shadow-lg">
          <div className="card-body">
            {step === 'credentials' && (
              <form onSubmit={handleCredsSubmit}>
                <h1 className="h3 mb-3 fw-normal">Please sign in</h1>

                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="floatingInput"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoFocus
                  />
                  <label htmlFor="floatingInput">Email address</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="floatingPassword"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>

                <div className="form-check text-start my-3">
                  <input className="form-check-input" type="checkbox" value="remember-me" id="flexCheckDefault" />
                  <label className="form-check-label" htmlFor="flexCheckDefault">
                    Remember me
                  </label>
                </div>

                <button className="btn btn-primary w-100 py-2" type="submit" disabled={loading}>
                  {loading ? 'Loading...' : 'Sign in'}
                </button>
              </form>
            )}

            {step === 'mfa' && (
              <form onSubmit={handleMfaSubmit}>
                <h1 className="h5 mb-3 fw-normal">Two-Factor Authentication</h1>
                <p className="text-muted">Open Google Authenticator and enter the 6-digit code.</p>

                <div className="form-floating mb-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    className="form-control text-center"
                    id="mfaCode"
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                  />
                  <label htmlFor="mfaCode">Authenticator Code</label>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary w-100" type="submit" disabled={loading || mfaCode.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify & Sign in'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={loading}
                    onClick={() => { setStep('credentials'); setMfaCode(''); setPendingSessionId(null); }}
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="card-footer text-body-secondary">
            Don't have an account? <a href="/register">Create One</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
