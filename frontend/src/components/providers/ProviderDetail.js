// components/providers/ProviderDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const ProviderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [provider, setProvider] = useState(null);
  const [domains, setDomains] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        // Fetch provider details
        const providerResponse = await axios.get(`${API_URL}/providers/${id}`);
        setProvider(providerResponse.data);
        
        // Fetch domains if provider is domain or both type
        if (providerResponse.data.provider_type === 'domain' || 
            providerResponse.data.provider_type === 'both') {
          const domainsResponse = await axios.get(`${API_URL}/providers/${id}/domains`);
          setDomains(domainsResponse.data);
        }
        
        // Fetch websites if provider is hosting or both type
        if (providerResponse.data.provider_type === 'hosting' || 
            providerResponse.data.provider_type === 'both') {
          const websitesResponse = await axios.get(`${API_URL}/providers/${id}/websites`);
          setWebsites(websitesResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load provider data');
        setLoading(false);
        console.error('Provider detail loading error:', err);
      }
    };
    
    fetchProviderData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/providers/${id}`);
      navigate('/providers');
    } catch (err) {
      setError('Failed to delete provider');
      console.error('Provider delete error:', err);
    }
  };

  if (loading) return <div className="card"><p>Loading provider details...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;
  
  if (!provider) return <div className="card"><p>Provider not found</p></div>;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1>{provider.provider_name}</h1>
          <div>
            <Link to={`/providers/edit/${id}`} className="btn btn-primary">
              Edit
            </Link>
            <button 
              className="btn btn-danger" 
              style={{ marginLeft: '10px' }}
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Provider Type</div>
          <div className="detail-value">
            {provider.provider_type === 'hosting' ? 'Hosting' : 
              provider.provider_type === 'domain' ? 'Domain' : 'Hosting & Domain'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Username</div>
          <div className="detail-value">{provider.username || 'Not set'}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Password</div>
          <div className="detail-value">
            {provider.password ? '********' : 'Not set'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Account Expiry Date</div>
          <div className="detail-value">{formatDate(provider.account_expiry_date)}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Provider Website</div>
          <div className="detail-value">
            {provider.website ? (
              <a href={provider.website} target="_blank" rel="noopener noreferrer">
                {provider.website}
              </a>
            ) : 'Not set'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Notes</div>
          <div className="detail-value">{provider.notes || 'No notes'}</div>
        </div>
      </div>
      
      {/* Show domains if provider is domain or both type */}
      {(provider.provider_type === 'domain' || provider.provider_type === 'both') && (
        <div className="card">
          <div className="card-header">
            <h2>Domains</h2>
            <Link to="/domains/add" className="btn btn-primary btn-sm">
              Add Domain
            </Link>
          </div>
          
          {domains.length === 0 ? (
            <p>No domains registered with this provider.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Domain Name</th>
                  <th>Registration Date</th>
                  <th>Expiry Date</th>
                  <th>Auto Renew</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {domains.map(domain => (
                  <tr key={domain.domain_id}>
                    <td>{domain.domain_name}</td>
                    <td>{formatDate(domain.registration_date)}</td>
                    <td>{formatDate(domain.expiry_date)}</td>
                    <td>{domain.auto_renew ? 'Yes' : 'No'}</td>
                    <td>
                      <Link to={`/domains/${domain.domain_id}`} className="action-btn">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Show websites if provider is hosting or both type */}
      {(provider.provider_type === 'hosting' || provider.provider_type === 'both') && (
        <div className="card">
          <div className="card-header">
            <h2>Websites</h2>
            <Link to="/websites/add" className="btn btn-primary btn-sm">
              Add Website
            </Link>
          </div>
          
          {websites.length === 0 ? (
            <p>No websites hosted with this provider.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Website Name</th>
                  <th>Domain</th>
                  <th>Hosting Package</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {websites.map(website => (
                  <tr key={website.website_id}>
                    <td>{website.website_name}</td>
                    <td>{website.domain_name || 'Not set'}</td>
                    <td>{website.hosting_package || 'Not specified'}</td>
                    <td>{website.ip_address || 'Not specified'}</td>
                    <td>
                      <span className={`badge ${website.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {website.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/websites/edit/${website.website_id}`} className="action-btn">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete provider <strong>{provider.provider_name}</strong>?</p>
              <p>This action cannot be undone and may affect associated domains and websites.</p>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDetail;