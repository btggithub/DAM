// frontend/components/providers/ProviderForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const ProviderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    provider_name: '',
    provider_type: 'hosting',
    username: '',
    password: '',
    account_expiry_date: '',
    website: '',
    notes: ''
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchProvider = async () => {
        try {
          const response = await axios.get(`${API_URL}/providers/${id}`);
          // Format date for input field (YYYY-MM-DD)
          const provider = response.data;
          if (provider.account_expiry_date) {
            provider.account_expiry_date = new Date(provider.account_expiry_date)
              .toISOString().split('T')[0];
          }
          
          setFormData(provider);
          setLoading(false);
        } catch (err) {
          setError('Failed to load provider data');
          setLoading(false);
          console.error('Provider loading error:', err);
        }
      };
      
      fetchProvider();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/providers/${id}`, formData);
      } else {
        await axios.post(`${API_URL}/providers`, formData);
      }
      
      navigate('/providers');
    } catch (err) {
      setError('Failed to save provider data');
      console.error('Provider save error:', err);
    }
  };

  if (loading) return <div className="card"><p>Loading provider data...</p></div>;

  return (
    <div className="card">
      <div className="card-header">
        <h1>{isEditMode ? 'Edit Provider' : 'Add New Provider'}</h1>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="provider_name" className="form-label">Provider Name</label>
          <input
            type="text"
            id="provider_name"
            name="provider_name"
            value={formData.provider_name}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="provider_type" className="form-label">Provider Type</label>
          <select
            id="provider_type"
            name="provider_type"
            value={formData.provider_type}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="hosting">Hosting</option>
            <option value="domain">Domain</option>
            <option value="both">Hosting & Domain</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="account_expiry_date" className="form-label">Account Expiry Date</label>
          <input
            type="date"
            id="account_expiry_date"
            name="account_expiry_date"
            value={formData.account_expiry_date || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="website" className="form-label">Provider Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="https://example.com"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            className="form-control"
            rows="3"
          ></textarea>
        </div>
        
        <div className="form-group">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Provider' : 'Add Provider'}
          </button>
          <Link to="/providers" className="btn" style={{ marginLeft: '10px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ProviderForm;