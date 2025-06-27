// client/src/components/stories/StoryForm.js - Create/Edit story form
import React, { useState, useEffect } from 'react';

const StoryForm = ({ story, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing existing story
  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || '',
        description: story.description || ''
      });
    }
  }, [story]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Story title is required');
      return;
    }

    if (formData.title.length > 200) {
      setError('Story title must be 200 characters or less');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || null
      });
      
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to save story. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="story-form">
      <h3>{story ? 'Edit Story' : 'Create New Story'}</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Story Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter story title..."
            maxLength="200"
            required
          />
          <small className="form-hint">
            {formData.title.length}/200 characters
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter story description..."
            rows="4"
          />
          <small className="form-hint">
            Optional: Brief description of this story
          </small>
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
            disabled={loading}
          >
            {loading ? 'Saving...' : (story ? 'Update Story' : 'Create Story')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryForm;