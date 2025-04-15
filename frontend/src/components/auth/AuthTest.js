// frontend/src/components/auth/AuthTest.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AuthTest = () => {
  const { currentUser, token, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      console.log('Testing auth endpoint with token:', token?.substring(0, 10) + '...');
      const response = await axios.get('/api/auth/me');
      console.log('Auth test response:', response.data);
      setTestResult(response.data);
    } catch (err) {
      console.error('Auth test error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Authentication test failed');
    } finally {
      setLoading(false);
    }
  };

  const testStats = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      console.log('Testing stats endpoint');
      const response = await axios.get('/api/stats');
      console.log('Stats test response:', response.data);
      setTestResult(response.data);
    } catch (err) {
      console.error('Stats test error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Stats test failed');
    } finally {
      setLoading(false);
    }
  };

  const checkTokenFromStorage = () => {
    const storedToken = localStorage.getItem('token');
    console.log('Token in localStorage:', storedToken ? 'exists' : 'none');
    if (storedToken) {
      console.log('First 10 chars:', storedToken.substring(0, 10) + '...');
    }
    
    // Check if auth header is set
    const currentAuthHeader = axios.defaults.headers.common['Authorization'];
    console.log('Current Authorization header:', currentAuthHeader || 'none');
    
    setTestResult({
      tokenExists: !!storedToken,
      tokenPreview: storedToken ? storedToken.substring(0, 10) + '...' : 'N/A',
      headerSet: !!currentAuthHeader
    });
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setTestResult({ message: 'Token cleared manually' });
    console.log('Token cleared manually');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Authentication Test</h2>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p>{error}</p>
            </div>
          )}

          {testResult && (
            <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Current Auth State</h3>
            <p>
              <strong>User:</strong> {currentUser ? currentUser.username : 'Not logged in'}
            </p>
            <p>
              <strong>Token exists:</strong> {token ? 'Yes' : 'No'}
            </p>
            {token && (
              <p>
                <strong>Token preview:</strong> {token.substring(0, 10)}...
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Test /api/auth/me
            </button>
            
            <button
              onClick={testStats}
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Test /api/stats
            </button>
            
            <button
              onClick={checkTokenFromStorage}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Check Token
            </button>
            
            <button
              onClick={clearToken}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear Token
            </button>
            
            <button
              onClick={logout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;