import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboardContext } from '../../App';
import { authService } from '../../services/api/authService';

const Navigation = () => {
  const { user, isAuthenticated, dispatch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminDashboardRef = useContext(AdminDashboardContext);

  const isAdminArea = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const handleAdminDashboard = () => {
    // First navigate to /admin (in case we're not there)
    navigate('/admin');
    // Then call the reset function if available
    if (adminDashboardRef?.current?.resetToPostsList) {
      adminDashboardRef.current.resetToPostsList();
    }
  };

  return (
    <nav className={`navigation ${isAdminArea ? 'admin-nav' : 'public-nav'}`}>
      <div className="nav-brand">
        <Link to="/">bray.report</Link>
      </div>

      <div className="nav-links">
        {isAdminArea ? (
          // Admin Navigation
          isAuthenticated ? (
            <>
              <button
                onClick={handleAdminDashboard}
                className="nav-link-button"
              >
                admin dashboard
              </button>
              <Link to="/blog" target="_blank" rel="noopener noreferrer">public view</Link>
              <span className="user-info">welcome, {user?.username.toLowerCase()}</span>
              <button onClick={handleLogout} className="logout-button">
                logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">login</Link>
            </>
          )
        ) : (
          // Public Navigation
          <>
            <Link to="/blog">musings</Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin">admin</Link>
                <span className="user-info">{user?.username}</span>
                <button onClick={handleLogout} className="logout-button">
                  logout
                </button>
              </>
            ) : (
              <Link to="/login">login</Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;