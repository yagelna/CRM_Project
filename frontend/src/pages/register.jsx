import React, { useState, useEffect} from 'react';
import axiosInstance from '../AxiosInstance';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setLoading(true);
        setError(null);
        setSuccess(false);

        console.log(formData);
        try {
            const res = await axiosInstance.post('api/register/', {
                email: formData.email,
                password: formData.password,
            });
            console.log(res.data);
            localStorage.setItem('access_token', res.data.token);
            navigate('/login');
            setSuccess(true);
        } catch (error) {
            console.error("Registration failed", error);
            setError(error);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="w-100" style={{ maxWidth: '400px' }}>
            {success && (
                <div className="alert alert-success" role="alert">
                    Registration successful!
                </div>
            )}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error.response?.data?.error || error.message}
                </div>
            )}
            <div className="card text-center shadow-lg">
                <div className="card-body">
                <p className="text-center">We are currently in development.</p>
                <p className="text-center">Please contact the administrator for registration and further details.</p>
                    {/* <form onSubmit={handleSubmit}>
                        <h1 className="h3 mb-3 fw-normal">Please register</h1>

                        <div className="form-floating mb-3">
                            <input
                                type="email"
                                className="form-control"
                                id="floatingInput"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
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
                        <button
                            className="btn btn-primary w-100 py-2"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Register'}
                        </button>
                    </form> */}
                </div>
                <div className="card-footer text-body-secondary">
                    Already have an account? <a href="/login">Login</a>
                </div>
            </div>
        </div>
    </div>
    );
}

export default Register;