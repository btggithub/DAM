// frontend/components/websites/WebsiteList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const WebsiteList = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await axios.get(`${API_URL}/websites`);
        setWebsites(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load websites');
        setLoading(false);
        console.error('Website loading error:', err);
      }
    };
    
    fetchWebsites();
  }, []);

  const confirmDelete = (website) => {
    setWebsiteToDelete(website);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setWebsiteToDelete(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/websites/${websiteToDelete.website_id}`);
      setWebsites(websites.filter(w => w.website_id !== websiteToDelete.website_id));
      setShowDeleteModal(false);
      setWebsiteToDelete(null);
    } catch (err) {
      console.error('Error deleting website:', err);
      setError('Failed to delete website');
    }
  };

  if (loading) return <div className="card"><p>Loading websites...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;

  return (
    <div>
      <div className="card-header">
        <h1>Websites</h1>
        <Link to="/websites/add" className="btn btn-primary">Add New Website</Link>
      </div>
      
      {websites.length === 0 ? (
        <div className="card">
          <p>No websites found. Click "Add New Website" to create one.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Website Name</th>
                <th>Domain</th>
                <th>Hosting Provider</th>
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
                  <td>{website.provider_name || 'Not specified'}</td>
                  <td>{website.hosting_package || 'Not specified'}</td>
                  <td>{website.ip_address || 'Not specified'}</td>
                  <td>
                    <span className={`badge ${website.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {website.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-column">
                    <Link to={`/websites/${website.website_id}`} className="action-btn">
                      View
                    </Link>
                    <Link to={`/websites/edit/${website.website_id}`} className="action-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={() => confirmDelete(website)} 
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete website <strong>{websiteToDelete?.website_name}</strong>?</p>
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

export default WebsiteList;