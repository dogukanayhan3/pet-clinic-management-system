import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        const response = await axios.post('http://localhost:5001/login', formData);
        localStorage.setItem('token', response.data.token);
        // Store as string '1' or '0' for consistency
        localStorage.setItem('isAdmin', response.data.isAdmin ? '1' : '0');
        
        // Redirect based on admin status
        if (response.data.isAdmin) {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Error during login');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Login</h2>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-link">
          Don't have an account?
          <a href="/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
