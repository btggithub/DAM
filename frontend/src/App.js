// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';


// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import UserProfile from './components/auth/UserProfile';
import PrivateRoute from './components/routing/PrivateRoute';
import AuthTest from './components/auth/AuthTest'; // Import the AuthTest component

// Dashboard and Main Components
import Dashboard from './components/Dashboard';
import ProviderList from './components/providers/ProviderList';
import ProviderForm from './components/providers/ProviderForm';
import ProviderDetail from './components/providers/ProviderDetail';
import DomainList from './components/domains/DomainList';
import DomainForm from './components/domains/DomainForm';
import DomainDetail from './components/domains/DomainDetail';
import WebsiteList from './components/websites/WebsiteList';
import WebsiteForm from './components/websites/WebsiteForm';
import WebsiteDetail from './components/websites/WebsiteDetail';

// Admin Components
import UserManagement from './components/admin/UserManagement';
import AdminDashboard from './components/admin/AdminDashboard';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotFound from './components/layout/NotFound';
//import Sidebar from './components/layout/Sidebar'; // Import if you have this component

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar 
            sidebarOpen={sidebarOpen} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />
          
          <div className="app-body">
            {/* Sidebar - Only show on authenticated routes */}
            <Routes>
              <Route path="/login" element={null} />
              <Route path="/register" element={null} />
              <Route path="/forgot-password" element={null} />
              <Route path="/reset-password/*" element={null} />
              <Route path="/auth-test" element={null} />
              <Route path="*" element={
                <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                  <nav>
                    <ul>
                      <li><a href="/">Dashboard</a></li>
                      <li><a href="/providers">Providers</a></li>
                      <li><a href="/domains">Domains</a></li>
                      <li><a href="/websites">Websites</a></li>
                      <li><a href="/auth-test">Auth Test</a></li>
                    </ul>
                  </nav>
                </aside>
              } />
            </Routes>
            
            <main className="app-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/auth-test" element={<AuthTest />} />
                
                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                  {/* Dashboard */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<UserProfile />} />
                  
                  {/* Provider Routes */}
                  <Route path="/providers" element={<ProviderList />} />
                  <Route path="/providers/add" element={<ProviderForm />} />
                  <Route path="/providers/edit/:id" element={<ProviderForm />} />
                  <Route path="/providers/:id" element={<ProviderDetail />} />
                  
                  {/* Domain Routes */}
                  <Route path="/domains" element={<DomainList />} />
                  <Route path="/domains/add" element={<DomainForm />} />
                  <Route path="/domains/edit/:id" element={<DomainForm />} />
                  <Route path="/domains/:id" element={<DomainDetail />} />
                  
                  {/* Website Routes */}
                  <Route path="/websites" element={<WebsiteList />} />
                  <Route path="/websites/add" element={<WebsiteForm />} />
                  <Route path="/websites/edit/:id" element={<WebsiteForm />} />
                  <Route path="/websites/:id" element={<WebsiteDetail />} />
                </Route>
                
                {/* Admin Routes */}
                <Route element={<PrivateRoute adminOnly={true} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                </Route>
                
                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;