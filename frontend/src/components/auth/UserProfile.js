// frontend/src/components/auth/UserProfile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const UserProfile = () => {
  const { currentUser, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordMode, setPasswordMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Populate form with current user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  }, [currentUser]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordMode = () => {
    setPasswordMode(!passwordMode);
    // Clear password fields when toggling
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    // Clear messages
    setSuccessMessage('');
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (passwordMode) {
        // Check if passwords match
        if (formData.newPassword !== formData.confirmNewPassword) {
          setError('New passwords do not match');
          setIsLoading(false);
          return;
        }

        // Change password
        await axios.post('/api/auth/change-password', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });

        setSuccessMessage('Password updated successfully');
        
        // Reset password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      } else {
        // Update profile information
        const response = await axios.put('/api/auth/update-profile', {
          username: formData.username,
          email: formData.email
        });

        // Update user context
        updateUser(response.data.user);
        setSuccessMessage('Profile updated successfully');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {passwordMode ? 'Change Password' : 'Profile Information'}
          </h2>
        </div>

        <div className="p-6">
          {successMessage && (
            <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4" role="alert">
              <p>{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {passwordMode ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.newPassword}
                    onChange={handleChange}
                    minLength="8"
                  />
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    minLength="8"
                  />
                </div>

                <p className="text-sm text-gray-500">
                  Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Account Created:</span>{' '}
                    {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                  {currentUser.role === 'admin' && (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Role:</span> Administrator
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={togglePasswordMode}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {passwordMode ? 'Edit Profile' : 'Change Password'}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;