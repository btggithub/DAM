// frontend/src/components/admin/AdminDashboard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
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
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Admin Information</h2>
        <p>Logged in as: <span className="font-medium">{currentUser?.username}</span></p>
        <p>Admin since: <span className="font-medium">{new Date(currentUser?.created_at).toLocaleDateString()}</span></p>
      </div>
    </div>
  );
};

export default AdminDashboard;