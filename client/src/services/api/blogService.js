// client/src/services/api/blogService.js - Blog API Service
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    // Return the error for component handling
    return Promise.reject(error);
  }
);

export const blogService = {
  // Posts API
  async getPosts() {
    const response = await api.get('/posts');
    return response.data;
  },

  async getPost(id) {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  async createPost(postData) {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  async updatePost(id, postData) {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async publishPost(id) {
    const response = await api.patch(`/posts/${id}/publish`);
    return response.data;
  },

  async unpublishPost(id) {
    const response = await api.patch(`/posts/${id}/unpublish`);
    return response.data;
  },

  // Public Posts API (no auth required)
  async getPublishedPosts() {
    const response = await axios.get(`${API_URL}/posts/public`);
    return response.data;
  },

  async getPublishedPost(slug) {
    const response = await axios.get(`${API_URL}/posts/public/${slug}`);
    return response.data;
  },

  // Categories API
  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },

  async createCategory(categoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  // Tags API
  async getTags() {
    const response = await api.get('/tags');
    return response.data;
  },

  async createTag(tagData) {
    const response = await api.post('/tags', tagData);
    return response.data;
  },

  async updateTag(id, tagData) {
    const response = await api.put(`/tags/${id}`, tagData);
    return response.data;
  },

  async deleteTag(id) {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },

  // Public Tags API (no auth required)
  async getPublicTags() {
    const response = await axios.get(`${API_URL}/tags/public`);
    return response.data;
  }
};