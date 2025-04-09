// App.js - Main application component
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';

// Components
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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>Domain & Hosting Manager</h1>
          </div>
          <div className="header-right">
            {/* Add any header elements here */}
          </div>
        </header>
        
        <div className="app-body">
          <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <nav>
              <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/providers">Providers</Link></li>
                <li><Link to="/domains">Domains</Link></li>
                <li><Link to="/websites">Websites</Link></li>
              </ul>
            </nav>
          </aside>
          
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
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
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;