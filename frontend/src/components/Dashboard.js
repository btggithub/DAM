// frontend/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    providers: [],
    domains: { total: 0, expiring_30_days: 0, expiring_90_days: 0 },
    websites: { total: 0, active: 0, inactive: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expiringDomains, setExpiringDomains] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch statistics
        const statsResponse = await axios.get(`${API_URL}/stats`);
        setStats(statsResponse.data);
        
        // Fetch domains expiring soon
        const domainsResponse = await axios.get(`${API_URL}/domains`);
        const currentDate = new Date();
        const thirtyDaysFromNow = new Date(currentDate);
        thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
        
        // Filter domains expiring in the next 30 days
        const expiring = domainsResponse.data.filter(domain => {
          const expiryDate = new Date(domain.expiry_date);
          return expiryDate <= thirtyDaysFromNow;
        }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        
        setExpiringDomains(expiring);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error('Dashboard loading error:', err);
      }
    };
    
    fetchData();
  }, []);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate days remaining until expiry
  const daysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return <div className="card"><p>Loading dashboard data...</p></div>;
  
  if (error) return <div className="card"><p className="text-danger">{error}</p></div>;

  // Helper function to count providers by type
  const getProviderCount = (type) => {
    const provider = stats.providers.find(p => p.provider_type === type);
    return provider ? provider.count : 0;
  };

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value">{stats.domains.total}</div>
          <div className="stat-label">Total Domains</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{getProviderCount('hosting') + getProviderCount('both')}</div>
          <div className="stat-label">Hosting Providers</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{getProviderCount('domain') + getProviderCount('both')}</div>
          <div className="stat-label">Domain Providers</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.websites.total}</div>
          <div className="stat-label">Websites</div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2>Domains Expiring Soon</h2>
          <Link to="/domains" className="btn btn-primary btn-sm">View All Domains</Link>
        </div>
        
        {expiringDomains.length === 0 ? (
          <p>No domains expiring in the next 30 days.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Domain Name</th>
                <th>Provider</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expiringDomains.map(domain => {
                const daysLeft = daysUntilExpiry(domain.expiry_date);
                let badgeClass = 'badge-success';
                if (daysLeft <= 7) {
                  badgeClass = 'badge-danger';
                } else if (daysLeft <= 14) {
                  badgeClass = 'badge-warning';
                }
                
                return (
                  <tr key={domain.domain_id}>
                    <td>{domain.domain_name}</td>
                    <td>{domain.provider_name || 'Not specified'}</td>
                    <td>{formatDate(domain.expiry_date)}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {daysLeft} days
                      </span>
                    </td>
                    <td>
                      <Link to={`/domains/${domain.domain_id}`} className="btn btn-sm btn-primary">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <p>Activity tracking feature coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;