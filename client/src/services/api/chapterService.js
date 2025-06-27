// client/src/services/api/chapterService.js

import apiService from './apiService';

export const chapterService = {
  // Get all chapters in a specific story
  getChaptersByStory: async (storyId) => {
    try {
      console.log(`Fetching chapters for story ${storyId}`);
      const response = await apiService.get(`/chapters/stories/${storyId}/chapters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  },

  // Get specific chapter by ID
  getChapterById: async (chapterId) => {
    try {
      console.log(`Fetching chapter ${chapterId}`);
      const response = await apiService.get(`/chapters/${chapterId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chapter:', error);
      throw error;
    }
  },

  // Create new chapter in a story
  createChapter: async (storyId, chapterData) => {
    try {
      console.log(`Creating chapter in story ${storyId}:`, chapterData);
      const response = await apiService.post(`/chapters/stories/${storyId}/chapters`, chapterData);
      return response.data;
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    }
  },

  // Update existing chapter
  updateChapter: async (chapterId, chapterData) => {
    try {
      console.log(`Updating chapter ${chapterId}:`, chapterData);
      const response = await apiService.put(`/chapters/${chapterId}`, chapterData);
      return response.data;
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    }
  },

  // Delete chapter
  deleteChapter: async (chapterId) => {
    try {
      console.log(`Deleting chapter ${chapterId}`);
      const response = await apiService.delete(`/chapters/${chapterId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  }
};