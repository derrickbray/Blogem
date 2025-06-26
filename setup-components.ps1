# PowerShell Setup Script for React Components
Write-Host "🚀 Setting up React components and structure..." -ForegroundColor Green

# Navigate to client directory
Set-Location "client\src"

# Create directories
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow
New-Item -Path "components\common" -ItemType Directory -Force
New-Item -Path "components\auth" -ItemType Directory -Force
New-Item -Path "components\projects" -ItemType Directory -Force
New-Item -Path "pages\auth" -ItemType Directory -Force
New-Item -Path "pages\projects" -ItemType Directory -Force
New-Item -Path "services\api" -ItemType Directory -Force

Write-Host "✅ Directory structure created" -ForegroundColor Green

# Create Auth Context
Write-Host "🔐 Creating Auth Context..." -ForegroundColor Yellow
@'
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set user
      // You'll implement this with your API
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
'@ | Out-File -FilePath "context\AuthContext.js" -Encoding UTF8

# Create API Services
Write-Host "🌐 Creating API services..." -ForegroundColor Yellow

@'
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
'@ | Out-File -FilePath "services\api\apiService.js" -Encoding UTF8

@'
import api from './apiService';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};
'@ | Out-File -FilePath "services\api\authService.js" -Encoding UTF8

@'
import api from './apiService';

export const projectService = {
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};
'@ | Out-File -FilePath "services\api\projectService.js" -Encoding UTF8

# Environment file
Write-Host "🌍 Creating environment file..." -ForegroundColor Yellow
Set-Location ".."
@'
REACT_APP_API_URL=http://localhost:5000/api
'@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "🎉 Basic setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Due to PowerShell limitations, I've created the core files." -ForegroundColor Yellow
Write-Host "   You'll need to create the component files manually using the code provided." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Install dependencies: npm install axios react-router-dom" -ForegroundColor White
Write-Host "   2. Create the remaining component files (see previous message)" -ForegroundColor White
Write-Host "   3. Start the app: npm start" -ForegroundColor White