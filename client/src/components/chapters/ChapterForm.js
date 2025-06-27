// client/src/components/chapters/ChapterForm.js - Updated with Rich Text Editor

import React, { useState, useEffect, useCallback } from 'react';
import RichTextEditor from '../common/RichTextEditor';
import FileManager from '../files/FileManager';

const ChapterForm = ({ chapter, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [plainTextLength, setPlainTextLength] = useState(0); // For display purposes
  const [showFileManager, setShowFileManager] = useState(false);

  // Maximum character limits
  const MAX_TITLE_LENGTH = 200;
  const MAX_CONTENT_LENGTH = 100000; // Increased for rich text HTML

  // Helper function to strip HTML tags for plain text counting
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Update character counts when content changes
  const updateContentLengths = useCallback((htmlContent) => {
    const plainText = stripHtml(htmlContent);
    setCharacterCount(htmlContent.length); // HTML length
    setPlainTextLength(plainText.length);  // Plain text length
  }, []);

  // Initialize form with chapter data if editing
  useEffect(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || '',
        content: chapter.content || ''
      });
      // Calculate initial lengths
      updateContentLengths(chapter.content || '');
    }
  }, [chapter, updateContentLengths]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle rich text editor content changes
  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
    updateContentLengths(content);
  };

  // Handle length changes from the rich text editor
  const handleLengthChange = (plainTextLen, htmlLen) => {
    setPlainTextLength(plainTextLen);
    setCharacterCount(htmlLen);
  };

  const validateForm = () => {
    const errors = [];

    // Title validation
    if (!formData.title.trim()) {
      errors.push('Chapter title is required');
    } else if (formData.title.length > MAX_TITLE_LENGTH) {
      errors.push(`Chapter title must be ${MAX_TITLE_LENGTH} characters or less`);
    }

    // Content validation (check HTML length)
    if (formData.content.length > MAX_CONTENT_LENGTH) {
      errors.push(`Chapter content must be ${MAX_CONTENT_LENGTH} characters or less`);
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        title: formData.title.trim(),
        content: formData.content
      });
      // Form will be closed by parent component on success
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.response?.data?.message || 'Failed to save chapter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWordCount = () => {
    if (!formData.content) return 0;
    const plainText = stripHtml(formData.content);
    if (!plainText.trim()) return 0;
    return plainText.trim().split(/\s+/).length;
  };

  const isFormValid = formData.title.trim() &&
    formData.title.length <= MAX_TITLE_LENGTH &&
    formData.content.length <= MAX_CONTENT_LENGTH;

  return (
    <div className="chapter-form">
      <div className="form-header">
        <h2>{chapter ? 'Edit Chapter' : 'Create New Chapter'}</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="chapter-title">Chapter Title *</label>
          <input
            type="text"
            id="chapter-title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter chapter title..."
            maxLength={MAX_TITLE_LENGTH}
            required
            disabled={loading}
          />
          <div className="form-help">
            {formData.title.length}/{MAX_TITLE_LENGTH} characters
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="chapter-content">Chapter Content</label>

          {/* Rich Text Editor */}
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            onLengthChange={handleLengthChange}
            placeholder="Write your chapter content here..."
            disabled={loading}
            maxLength={MAX_CONTENT_LENGTH}
          />

          <div className="form-help">
            <span>
              {plainTextLength.toLocaleString()} words ({characterCount.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()} characters with formatting)
            </span>
            <span className="word-count">{getWordCount()} words</span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !isFormValid}
          >
            {loading ? 'Saving...' : (chapter ? 'Update Chapter' : 'Create Chapter')}
          </button>
        </div>
      </form>

      {/* File Management Section */}
      <div className="form-section file-management-section">
        <div className="section-header">
          <h4>Attachments</h4>
          <button
            type="button"
            onClick={() => setShowFileManager(!showFileManager)}
            className="btn btn-secondary btn-small"
          >
            {showFileManager ? 'Hide Files' : 'Manage Files'}
          </button>
        </div>

        {showFileManager && chapter?.id && (
          <FileManager
            entityType="chapters"
            entityId={chapter.id}
            entityTitle={formData.title || 'New Chapter'}
            compact={true}
          />
        )}

        {showFileManager && !chapter?.id && (
          <div className="info-message">
            <p>Save the chapter first to enable file attachments.</p>
          </div>
        )}
      </div>

      {/* Writing tips */}
      <div className="form-tips">
        <h4>Writing Tips:</h4>
        <ul>
          <li>Use <strong>headers</strong> to organize your chapter into sections</li>
          <li>Apply <em>italic</em> text for emphasis and inner thoughts</li>
          <li>Create <strong>bold</strong> text for important moments</li>
          <li>Use blockquotes for memorable dialogue or quotes</li>
          <li>Add lists for instructions, steps, or multiple items</li>
        </ul>
      </div>
    </div>
  );
};

export default ChapterForm;