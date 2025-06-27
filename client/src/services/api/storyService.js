// client/src/services/api/storyService.js - Story API service
import apiService from './apiService';

const storyService = {
  // Get all stories for a specific project
  getStoriesByProject: async (projectId) => {
    try {
      const response = await apiService.get(`/stories/projects/${projectId}/stories`);
      return response.data.stories;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  // Get a specific story by ID
  getStoryById: async (storyId) => {
    try {
      const response = await apiService.get(`/stories/${storyId}`);
      return response.data.story;
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  },

  // Create a new story in a project
  createStory: async (projectId, storyData) => {
    try {
      const response = await apiService.post(`/stories/projects/${projectId}/stories`, storyData);
      return response.data.story;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  // Update an existing story
  updateStory: async (storyId, storyData) => {
    try {
      const response = await apiService.put(`/stories/${storyId}`, storyData);
      return response.data.story;
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  },

  // Delete a story
  deleteStory: async (storyId) => {
    try {
      const response = await apiService.delete(`/stories/${storyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
};

export default storyService;