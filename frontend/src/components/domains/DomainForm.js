// components/domains/DomainForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const DomainForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  
  const [formData, setFormData] = useState({
    domain_name: '',
    provider_id: '',
    registration_date: '',
    expiry_date: '',
    auto_renew: false,
    nameservers: ['', '', '', ''] // 4 nameservers
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch providers for dropdown
        const providersResponse = await axios.get(`${API_URL}/providers`);
        // Filter only domain and both providers
        const domainProviders = providersResponse.data.filter(
          p => p.provider_type === 'domain' || p.provider_type === 'both'
        );
        setProviders(domainProviders);
        
        // If edit mode, fetch domain data
        if (isEditMode) {
          const domainResponse = await axios.get(`${API_URL}/domains/${id}`);
          const domain = domainResponse.data;
          
          // Format dates for input fields (YYYY-MM-DD)
          if (domain.registration_date) {
            domain.registration_date = new Date(domain.registration_date)
              .toISOString().split('T')[0];
          }
          
          if (domain.expiry_date) {
            domain.expiry_date = new Date(domain.expiry_date)
              .toISOString().split('T')[0];
          }
          
          // Extract nameservers
          const nameserversArray = domain.nameservers || [];
          const nameservers = Array(4).fill('');
          
          nameserversArray.forEach((ns, index) => {
            if (index < 4) {
              nameservers[index] = ns.nameserver_value;
            }
          });
          
          domain.nameservers = nameservers;
          setFormData(domain);
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

  const handleNameserverChange = (index, value) => {
    const updatedNameservers = [...formData.nameservers];
    updatedNameservers[index] = value;
    setFormData({ ...formData, nameservers: updatedNameservers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/domains/${id}`, formData);
      } else {
        await axios.post(`${API_URL}/domains`, formData);
      }
      
      navigate('/domains');
    } catch (err) {
      setError('Failed to save domain data');
      console.error('Domain save error:', err);
    }
  };

  if (loading) return <div className="card"><p>Loading domain data...</p></div>;

  return (
    <div className="card">
      <div className="card-header">
        <h1>{isEditMode ? 'Edit Domain' : 'Add New Domain'}</h1>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="domain_name" className="form-label">Domain Name</label>
          <input
            type="text"
            id="domain_name"
            name="domain_name"
            value={formData.domain_name}
            onChange={handleChange}
            className="form-control"
            required
            placeholder="example.com"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="provider_id" className="form-label">Domain Provider</label>
          <select
            id="provider_id"
            name="provider_id"
            value={formData.provider_id || ''}
            onChange={handleChange}
            className="form-control"
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
          <label htmlFor="registration_date" className="form-label">Registration Date</label>
          <input
            type="date"
            id="registration_date"
            name="registration_date"
            value={formData.registration_date || ''}
            onChange={handleChange}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="expiry_date" className="form-label">Expiry Date</label>
          <input
            type="date"
            id="expiry_date"
            name="expiry_date"
            value={formData.expiry_date || ''}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            id="auto_renew"
            name="auto_renew"
            checked={formData.auto_renew || false}
            onChange={handleChange}
            style={{ marginRight: '10px' }}
          />
          <label htmlFor="auto_renew">Auto Renew</label>
        </div>
        
        <div className="form-group">
          <label className="form-label">Nameservers</label>
          
          {formData.nameservers.map((ns, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder={`Nameserver ${index + 1}`}
                value={ns}
                onChange={(e) => handleNameserverChange(index, e.target.value)}
                className="form-control"
              />
            </div>
          ))}
        </div>
        
        <div className="form-group">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Domain' : 'Add Domain'}
          </button>
          <Link to="/domains" className="btn" style={{ marginLeft: '10px' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default DomainForm;