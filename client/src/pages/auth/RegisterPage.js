import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RegisterForm from '../../components/auth/RegisterForm';

const RegisterPage = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <RegisterForm />
        <div className="auth-links">
          <p>
            already have an account? <Link to="/login">login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;