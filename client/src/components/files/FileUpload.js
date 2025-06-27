// client/src/components/files/FileUpload.js

import React, { useState, useRef } from 'react';
import { fileService } from '../../services/api/fileService';

const FileUpload = ({ entityType, entityId, onUploadComplete, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection (both drag-drop and click)
  const handleFiles = async (files) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(files);
    
    // Validate each file before uploading
    const validationErrors = [];
    const validFiles = [];

    fileArray.forEach(file => {
      const validation = fileService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        validationErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    // Show validation errors if any
    if (validationErrors.length > 0) {
      setError(`Upload failed:\n${validationErrors.join('\n')}`);
      return;
    }

    // Upload valid files
    if (validFiles.length > 0) {
      await uploadFiles(validFiles);
    }
  };

  // Upload files to server
  const uploadFiles = async (files) => {
    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      // Upload files one by one (could be parallelized for multiple files)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        await fileService.uploadFile(
          entityType, 
          entityId, 
          file,
          (progress) => {
            // Calculate overall progress for multiple files
            const fileProgress = (i / files.length) * 100 + (progress / files.length);
            setUploadProgress(Math.round(fileProgress));
          }
        );
      }

      console.log('✅ All files uploaded successfully');
      setUploadProgress(100);
      
      // Notify parent component that upload is complete
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Reset state after brief delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  // Click handler to open file dialog
  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get CSS classes for upload area
  const getUploadAreaClasses = () => {
    let classes = 'file-upload-area';
    
    if (isDragOver) classes += ' drag-over';
    if (uploading) classes += ' uploading';
    if (disabled) classes += ' disabled';
    if (error) classes += ' error';
    
    return classes;
  };

  return (
    <div className="file-upload">
      {/* Upload Area */}
      <div
        className={getUploadAreaClasses()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* Upload UI */}
        <div className="upload-content">
          {uploading ? (
            <div className="upload-progress">
              <div className="progress-text">
                Uploading... {uploadProgress}%
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Drop files here or click to browse</strong>
                <p>
                  Images: JPG, PNG, GIF (max 5MB)<br />
                  Documents: PDF, DOC, DOCX, TXT (max 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          <strong>Upload Error:</strong>
          <pre>{error}</pre>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="upload-instructions">
        <h4>File Upload Guidelines:</h4>
        <ul>
          <li><strong>Images:</strong> Use for screenshots, diagrams, or illustrations</li>
          <li><strong>Documents:</strong> Attach research materials, outlines, or references</li>
          <li><strong>Multiple files:</strong> You can upload several files at once</li>
          <li><strong>Organization:</strong> Files are organized by project/story/chapter</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;