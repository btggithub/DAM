// components/domains/DomainDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const DomainDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [domain, setDomain] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        // Fetch domain details
        const domainResponse = await axios.get(`${API_URL}/domains/${id}`);
        setDomain(domainResponse.data);
        
        // Fetch websites using this domain
        const websitesResponse = await axios.get(`${API_URL}/websites`);
        const domainWebsites = websitesResponse.data.filter(
          website => website.domain_id === parseInt(id)
        );
        setWebsites(domainWebsites);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load domain data');
        setLoading(false);
        console.error('Domain detail loading error:', err);
      }
    };
    
    fetchDomainData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days until expiry
  const daysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/domains/${id}`);
      navigate('/domains');
    } catch (err) {
      setError('Failed to delete domain');
      console.error('Domain delete error:', err);
    }
  };

  if (loading) return <div className="card"><p>Loading domain details...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;
  
  if (!domain) return <div className="card"><p>Domain not found</p></div>;

  const daysLeft = daysUntilExpiry(domain.expiry_date);
  let expiryBadgeClass = 'badge-success';
  if (daysLeft <= 7) {
    expiryBadgeClass = 'badge-danger';
  } else if (daysLeft <= 30) {
    expiryBadgeClass = 'badge-warning';
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1>{domain.domain_name}</h1>
          <div>
            <Link to={`/domains/edit/${id}`} className="btn btn-primary">
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
          <div className="detail-label">Provider</div>
          <div className="detail-value">
            {domain.provider_name ? (
              <Link to={`/providers/${domain.provider_id}`}>
                {domain.provider_name}
              </Link>
            ) : 'Not specified'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Registration Date</div>
          <div className="detail-value">{formatDate(domain.registration_date)}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Expiry Date</div>
          <div className="detail-value">
            {formatDate(domain.expiry_date)}
            <span className={`badge ${expiryBadgeClass}`} style={{ marginLeft: '10px' }}>
              {daysLeft} days left
            </span>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Auto Renew</div>
          <div className="detail-value">{domain.auto_renew ? 'Yes' : 'No'}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Nameservers</div>
          <div className="detail-value">
            {domain.nameservers && domain.nameservers.length > 0 ? (
              <ul className="nameserver-list">
                {domain.nameservers.map((ns, index) => (
                  <li key={index}>{ns.nameserver_value}</li>
                ))}
              </ul>
            ) : 'No nameservers configured'}
          </div>
        </div>
      </div>
      
      {/* Websites using this domain */}
      <div className="card">
        <div className="card-header">
          <h2>Associated Websites</h2>
          <Link to="/websites/add" className="btn btn-primary btn-sm">
            Add Website
          </Link>
        </div>
        
        {websites.length === 0 ? (
          <p>No websites are using this domain.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Website Name</th>
                <th>Hosting Provider</th>
                <th>Hosting Package</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {websites.map(website => (
                <tr key={website.website_id}>
                  <td>{website.website_name}</td>
                  <td>
                    {website.provider_name ? (
                      <Link to={`/providers/${website.hosting_provider_id}`}>
                        {website.provider_name}
                      </Link>
                    ) : 'Not specified'}
                  </td>
                  <td>{website.hosting_package || 'Not specified'}</td>
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete domain <strong>{domain.domain_name}</strong>?</p>
              <p>This action cannot be undone and may affect associated websites.</p>
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

export default DomainDetail;