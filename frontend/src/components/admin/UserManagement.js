// frontend/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get basic stats
        const statsResponse = await axios.get('/api/stats');
        const userResponse = await axios.get('/api/auth/users');
        
        setStats({
          ...statsResponse.data,
          userCount: userResponse.data.users.length
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load system statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Controls */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/admin/users" 
              className="bg-blue-100 p-4 rounded-md hover:bg-blue-200 flex flex-col items-center"
            >
              <span className="text-lg font-medium text-blue-800">User Management</span>
              <span className="text-sm text-blue-600">Manage system users and permissions</span>
            </Link>
            
            <div className="bg-gray-100 p-4 rounded-md flex flex-col items-center">
              <span className="text-lg font-medium text-gray-600">System Settings</span>
              <span className="text-sm text-gray-500">Coming soon...</span>
            </div>
          </div>
        </div>
        
        {/* Admin Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Information</h2>
          <p className="mb-2">Logged in as: <span className="font-medium">{currentUser?.username}</span></p>
          <p className="mb-2">Admin since: <span className="font-medium">{currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}</span></p>
          <p className="mb-2">Email: <span className="font-medium">{currentUser?.email}</span></p>
        </div>
        
        {/* System Statistics */}
        <div className="bg-white shadow-md rounded-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Users</p>
              <p className="text-2xl font-bold text-blue-800">{stats?.userCount || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Providers</p>
              <p className="text-2xl font-bold text-green-800">
                {stats?.providers?.reduce((sum, item) => sum + item.count, 0) || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Domains</p>
              <p className="text-2xl font-bold text-purple-800">{stats?.domains?.total || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Websites</p>
              <p className="text-2xl font-bold text-yellow-800">{stats?.websites?.total || 0}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Expiring Domains</h3>
            <div className="flex items-center space-x-4">
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-600 font-medium">30 Days</p>
                <p className="text-xl font-bold text-red-800">{stats?.domains?.expiring_30_days || 0}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-md">
                <p className="text-sm text-orange-600 font-medium">90 Days</p>
                <p className="text-xl font-bold text-orange-800">{stats?.domains?.expiring_90_days || 0}</p>
              </div>
              <Link 
                to="/domains" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All Domains →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;