import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SubmissionList from './components/SubmissionList';
import BulkSubmit from './components/BulkSubmit';
import SaasManager from './components/SaasManager';
import DirectoryManager from './components/DirectoryManager';
import { 
  LayoutDashboard, Send, Database, Globe, Menu, X, type LucideIcon 
} from 'lucide-react';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Directory</h1>
                  <p className="text-xs text-gray-600">Agent</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavLink to="/submissions" icon={Send} label="Submissions" />
              <NavLink to="/bulk-submit" icon={Database} label="Bulk Submit" />
              <NavLink to="/saas" icon={Database} label="SaaS Products" />
              <NavLink to="/directories" icon={Globe} label="Directories" />
            </nav>

            {/* Footer */}
            <div className="p-4 border-t">
              <p className="text-xs text-gray-600 text-center">
                SaaS Directory Agent v1.0
              </p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Directory Agent
            </h2>
            <div className="w-6" /> {/* Spacer for centering */}
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submissions" element={<SubmissionList />} />
              <Route path="/bulk-submit" element={<BulkSubmit />} />
              <Route path="/saas" element={<SaasManager />} />
              <Route path="/directories" element={<DirectoryManager />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group
        ${isActive 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
        }
      `}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export default App;