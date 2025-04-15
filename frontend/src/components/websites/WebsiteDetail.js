// frontend/components/websites/WebsiteDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const WebsiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchWebsiteData = async () => {
      try {
        // Get website details with related data
        const response = await axios.get(`${API_URL}/websites/${id}`);
        setWebsite(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load website data');
        setLoading(false);
        console.error('Website detail loading error:', err);
      }
    };
    
    fetchWebsiteData();
  }, [id]);

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/websites/${id}`);
      navigate('/websites');
    } catch (err) {
      setError('Failed to delete website');
      console.error('Website delete error:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="card"><p>Loading website details...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;
  
  if (!website) return <div className="card"><p>Website not found</p></div>;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1>{website.website_name}</h1>
          <div>
            <Link to={`/websites/edit/${id}`} className="btn btn-primary">
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
          <div className="detail-label">Status</div>
          <div className="detail-value">
            <span className={`badge ${website.is_active ? 'badge-success' : 'badge-danger'}`}>
              {website.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Domain</div>
          <div className="detail-value">
            {website.domain_name ? (
              <Link to={`/domains/${website.domain_id}`}>
                {website.domain_name}
              </Link>
            ) : 'Not associated with any domain'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Hosting Provider</div>
          <div className="detail-value">
            {website.provider_name ? (
              <Link to={`/providers/${website.hosting_provider_id}`}>
                {website.provider_name}
              </Link>
            ) : 'Not specified'}
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Hosting Package</div>
          <div className="detail-value">{website.hosting_package || 'Not specified'}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">IP Address</div>
          <div className="detail-value">{website.ip_address || 'Not specified'}</div>
        </div>
        
        <div className="detail-row">
          <div className="detail-label">Created On</div>
          <div className="detail-value">{formatDate(website.date_added)}</div>
        </div>
      </div>
      
      {/* Add related information sections here if needed */}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete website <strong>{website.website_name}</strong>?</p>
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

export default WebsiteDetail;