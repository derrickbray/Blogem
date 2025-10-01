// server/app.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React frontend URL
  credentials: true
}));

app.use(express.json()); // Parse JSON request bodies

// Route imports
const authRoutes = require('./routes/auth');
// Blog routes
const postsRoutes = require('./routes/posts');
const categoriesRoutes = require('./routes/categories');
const tagsRoutes = require('./routes/tags');
// Shared routes
const filesRoutes = require('./routes/files');

// Route registration
app.use('/api/auth', authRoutes);         // Authentication endpoints

// Blog API endpoints
app.use('/api/posts', postsRoutes);       // Blog posts
app.use('/api/categories', categoriesRoutes); // Blog categories
app.use('/api/tags', tagsRoutes);         // Blog tags

// Shared endpoints
app.use('/api/files', filesRoutes);       // File upload endpoints

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;