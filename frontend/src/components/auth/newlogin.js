// frontend/src/components/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const { email, password } = formData;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email });
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      console.log('Login successful, response:', response.data);
      const { token, user } = response.data;
      
      // Important: This sets the auth header for subsequent requests
      login(token, user);
      
      // Give a little time for the auth state to update
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
    } catch (err) {
      const errorMsg = 
        err.response?.data?.message || 
        err.response?.data?.error ||
        'Login failed. Please check your credentials and try again.';
      
      console.error('Login error:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card" style={{maxWidth: '450px', width: '100%'}}>
        <div className="card-header">
          <h2>Sign in to your account</h2>
          <p className="text-sm">
            Or{' '}
            <Link to="/register" className="btn-link">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-control"
              placeholder="Email address"
              value={email}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>

            <div>
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
          </div>

          <div className="form-group">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;