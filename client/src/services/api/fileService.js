// client/src/services/api/fileService.js

import apiService from './apiService';

export const fileService = {
  // Upload file to entity (project, story, or chapter)
  uploadFile: async (entityType, entityId, file, onProgress = null) => {
    try {
      console.log(`Uploading file to ${entityType} ${entityId}:`, file.name);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Configure request with progress tracking
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      // Add progress tracking if callback provided
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await apiService.post(
        `/files/upload/${entityType}/${entityId}`,
        formData,
        config
      );

      console.log('✅ File uploaded successfully:', response.data);
      return response.data.file;
    } catch (error) {
      console.error('❌ File upload failed:', error);
      
      // Extract meaningful error message
      const errorMessage = error.response?.data?.message || 'File upload failed';
      throw new Error(errorMessage);
    }
  },

  // Get all files for an entity
  getFilesByEntity: async (entityType, entityId) => {
    try {
      console.log(`Loading files for ${entityType} ${entityId}`);
      
      const response = await apiService.get(`/files/entity/${entityType}/${entityId}`);
      
      console.log(`✅ Loaded ${response.data.files.length} files`);
      return response.data.files;
    } catch (error) {
      console.error('❌ Failed to load files:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to load files';
      throw new Error(errorMessage);
    }
  },

  // Download file (returns blob for download)
  downloadFile: async (fileId, filename) => {
    try {
      console.log(`Downloading file ${fileId}: ${filename}`);
      
      const response = await apiService.get(`/files/${fileId}`, {
        responseType: 'blob', // Important for file downloads
      });

      // Create blob URL for download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ File downloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ File download failed:', error);
      
      const errorMessage = error.response?.data?.message || 'File download failed';
      throw new Error(errorMessage);
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      console.log(`Deleting file ${fileId}`);
      
      const response = await apiService.delete(`/files/${fileId}`);
      
      console.log('✅ File deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ File deletion failed:', error);
      
      const errorMessage = error.response?.data?.message || 'File deletion failed';
      throw new Error(errorMessage);
    }
  },

  // Utility function to format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Utility function to get file type icon/category
  getFileType: (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt'];
    
    if (imageTypes.includes(extension)) {
      return { type: 'image', category: 'Image' };
    } else if (documentTypes.includes(extension)) {
      return { type: 'document', category: 'Document' };
    } else {
      return { type: 'unknown', category: 'File' };
    }
  },

  // Validate file before upload
  validateFile: (file) => {
    const maxSizes = {
      image: 5 * 1024 * 1024,    // 5MB
      document: 10 * 1024 * 1024  // 10MB
    };

    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    };

    // Determine file category
    let category = null;
    if (allowedTypes.image.includes(file.type)) {
      category = 'image';
    } else if (allowedTypes.document.includes(file.type)) {
      category = 'document';
    }

    // Validation results
    const validation = {
      isValid: true,
      errors: [],
      category: category
    };

    // Check file type
    if (!category) {
      validation.isValid = false;
      validation.errors.push(`File type "${file.type}" is not allowed. Please upload images (JPG, PNG, GIF) or documents (PDF, DOC, DOCX, TXT).`);
    }

    // Check file size
    if (category && file.size > maxSizes[category]) {
      validation.isValid = false;
      const maxSizeMB = maxSizes[category] / (1024 * 1024);
      validation.errors.push(`File is too large. ${category} files must be ${maxSizeMB}MB or smaller.`);
    }

    // Check file name length
    if (file.name.length > 255) {
      validation.isValid = false;
      validation.errors.push('File name is too long. Please use a shorter filename.');
    }

    return validation;
  }
};