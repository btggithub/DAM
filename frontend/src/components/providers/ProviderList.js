// components/providers/ProviderList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const ProviderList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await axios.get(`${API_URL}/providers`);
        setProviders(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load providers');
        setLoading(false);
        console.error('Provider loading error:', err);
      }
    };
    
    fetchProviders();
  }, []);

  const getProviderTypeDisplay = (type) => {
    switch (type) {
      case 'hosting': return 'Hosting';
      case 'domain': return 'Domain';
      case 'both': return 'Hosting & Domain';
      default: return type;
    }
  };

  const confirmDelete = (provider) => {
    setProviderToDelete(provider);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProviderToDelete(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/providers/${providerToDelete.provider_id}`);
      setProviders(providers.filter(p => p.provider_id !== providerToDelete.provider_id));
      setShowDeleteModal(false);
      setProviderToDelete(null);
    } catch (err) {
      console.error('Error deleting provider:', err);
      setError('Failed to delete provider');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="card"><p>Loading providers...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;

  return (
    <div>
      <div className="card-header">
        <h1>Providers</h1>
        <Link to="/providers/add" className="btn btn-primary">Add New Provider</Link>
      </div>
      
      {providers.length === 0 ? (
        <div className="card">
          <p>No providers found. Click "Add New Provider" to create one.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Username</th>
                <th>Account Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(provider => (
                <tr key={provider.provider_id}>
                  <td>{provider.provider_name}</td>
                  <td>{getProviderTypeDisplay(provider.provider_type)}</td>
                  <td>{provider.username || 'Not set'}</td>
                  <td>{formatDate(provider.account_expiry_date)}</td>
                  <td className="actions-column">
                    <Link to={`/providers/${provider.provider_id}`} className="action-btn">
                      View
                    </Link>
                    <Link to={`/providers/edit/${provider.provider_id}`} className="action-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={() => confirmDelete(provider)} 
                      className="action-btn delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
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
              <p>Are you sure you want to delete provider <strong>{providerToDelete?.provider_name}</strong>?</p>
              <p>This action cannot be undone.</p>
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

export default ProviderList;