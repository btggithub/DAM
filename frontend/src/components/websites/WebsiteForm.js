// components/websites/WebsiteForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const WebsiteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [domains, setDomains] = useState([]);
  
  const [formData, setFormData] = useState({
    website_name: '',
    domain_id: '',
    hosting_provider_id: '',
    hosting_package: '',
    ip_address: '',
    is_active: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hosting providers for dropdown
        const providersResponse = await axios.get(`${API_URL}/providers`);
        // Filter only hosting and both providers
        const hostingProviders = providersResponse.data.filter(
          p => p.provider_type === 'hosting' || p.provider_type === 'both'
        );
        setProviders(hostingProviders);
        
        // Fetch domains for dropdown
        const domainsResponse = await axios.get(`${API_URL}/domains`);
        setDomains(domainsResponse.data);
        
        // If edit mode, fetch website data
        if (isEditMode) {
          const websiteResponse = await axios.get(`${API_URL}/websites/${id}`);
          setFormData(websiteResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
        console.error('Data loading error:', err);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/websites/${id}`, formData);
      } else {
        await axios.post(`${API_URL}/websites`, formData);
      }
      
      navigate('/websites');
    } catch (err) {
      setError('Failed to save website data');
      console.error('Website save error:', err);
    }
  };

  if (loading) return <div className="card"><p>Loading website data...</p></div>;

  return (
    <div className="card">
      <div className="card-header">
        <h1>{isEditMode ? 'Edit Website' : 'Add New Website'}</h1>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="website_name" className="form-label">Website Name</label>
          <input
            type="text"
            id="website_name"
            name="website_name"
            value={formData.website_name}
            onChange={handleChange}
            className="form-control"
            required
            placeholder="My Website"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="hosting_provider_id" className="form-label">Hosting Provider</label>
          <select
            id="hosting_provider_id"
            name="hosting_provider_id"
            value={formData.hosting_provider_id || ''}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="">-- Select Provider --</option>
            {providers.map(provider => (
              <option key={provider.provider_id} value={provider.provider_id}>
                {provider.provider_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="domain_id" className="form-label">Domain</label>
          <select
            id="domain_id"
            name="domain_id"
            value={formData.domain_id || ''}
            onChange={handleChange}
            className="form-control"
          >
            <option value="">-- Select Domain --</option>
            {domains.map(domain => (
              <option key={domain.domain_id} value={domain.domain_id}>
                {domain.domain_name}
              </option>
            ))}
          </select>
          <small className="form-text text-muted">Optional: select if this website is associated with a domain</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="hosting_package" className="form-label">Hosting Package</label>
          <input
            type="text"
            id="hosting_package"
            name="hosting_package"
            value={formData.hosting_package || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="Basic Hosting / Pro Package / etc."
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="ip_address" className="form-label">IP Address</label>
          <input
            type="text"
            id="ip_address"
            name="ip_address"
            value={formData.ip_address || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="123.456.789.10"
          />
        </div>
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active || false}
            onChange={handleChange}
            style={{ marginRight: '10px' }}
          />
          <label htmlFor="is_active">Website is active</label>
        </div>
        
        <div className="form-group">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Website' : 'Add Website'}
          </button>
          <Link to="/websites" className="btn" style={{ marginLeft: '10px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default WebsiteForm;