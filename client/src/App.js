import React, { useRef, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/public/HomePage';
import PublicBlog from './pages/public/PublicBlog';
import PublicPost from './pages/public/PublicPost';
import AdminDashboard from './pages/admin/AdminDashboard';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/admin.css';
import './styles/public.css';
import './styles/theme.css';
import './App.css';

// Create context for admin dashboard ref
export const AdminDashboardContext = createContext();

function App() {
  const adminDashboardRef = useRef();

  return (
    <AuthProvider>
      <AdminDashboardContext.Provider value={adminDashboardRef}>
        <Router>
          <div className="App">
            <Navigation />
            <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<PublicBlog />} />
              <Route path="/blog/:slug" element={<PublicPost />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin Routes (Protected) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard ref={adminDashboardRef} />
                  </ProtectedRoute>
                }
              />

              {/* Redirect legacy routes */}
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
      </AdminDashboardContext.Provider>
    </AuthProvider>
  );
}

export default App;