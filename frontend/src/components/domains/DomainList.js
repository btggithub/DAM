// components/domains/DomainList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const DomainList = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await axios.get(`${API_URL}/domains`);
        setDomains(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load domains');
        setLoading(false);
        console.error('Domain loading error:', err);
      }
    };
    
    fetchDomains();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const confirmDelete = (domain) => {
    setDomainToDelete(domain);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDomainToDelete(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/domains/${domainToDelete.domain_id}`);
      setDomains(domains.filter(d => d.domain_id !== domainToDelete.domain_id));
      setShowDeleteModal(false);
      setDomainToDelete(null);
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError('Failed to delete domain');
    }
  };

  // Calculate days until expiry
  const daysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return <div className="card"><p>Loading domains...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;

  return (
    <div>
      <div className="card-header">
        <h1>Domains</h1>
        <Link to="/domains/add" className="btn btn-primary">Add New Domain</Link>
      </div>
      
      {domains.length === 0 ? (
        <div className="card">
          <p>No domains found. Click "Add New Domain" to create one.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Domain Name</th>
                <th>Provider</th>
                <th>Registration Date</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Auto Renew</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(domain => {
                const daysLeft = daysUntilExpiry(domain.expiry_date);
                let badgeClass = 'badge-success';
                if (daysLeft <= 7) {
                  badgeClass = 'badge-danger';
                } else if (daysLeft <= 30) {
                  badgeClass = 'badge-warning';
                }
                
                return (
                  <tr key={domain.domain_id}>
                    <td>{domain.domain_name}</td>
                    <td>{domain.provider_name || 'Not specified'}</td>
                    <td>{formatDate(domain.registration_date)}</td>
                    <td>{formatDate(domain.expiry_date)}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {daysLeft} days
                      </span>
                    </td>
                    <td>{domain.auto_renew ? 'Yes' : 'No'}</td>
                    <td className="actions-column">
                      <Link to={`/domains/${domain.domain_id}`} className="action-btn">
                        View
                      </Link>
                      <Link to={`/domains/edit/${domain.domain_id}`} className="action-btn">
                        Edit
                      </Link>
                      <button 
                        onClick={() => confirmDelete(domain)} 
                        className="action-btn delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete domain <strong>{domainToDelete?.domain_name}</strong>?</p>
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

export default DomainList;