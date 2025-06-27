// client/src/components/stories/StoryList.js - Display stories in a project
import React, { useState, useEffect } from 'react';
import storyService from '../../services/api/storyService';
import StoryForm from './StoryForm';
import FileManager from '../files/FileManager';

const StoryList = ({ projectId, projectTitle, onBack, onViewChapters }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [managingFilesStory, setManagingFilesStory] = useState(null);

  // Load stories when component mounts or projectId changes
  useEffect(() => {
    loadStories();
  }, [projectId]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError('');
      const storiesData = await storyService.getStoriesByProject(projectId);
      setStories(storiesData);
    } catch (err) {
      setError('Failed to load stories. Please try again.');
      console.error('Load stories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = () => {
    setEditingStory(null);
    setShowForm(true);
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await storyService.deleteStory(storyId);
      await loadStories(); // Refresh the list
    } catch (err) {
      setError('Failed to delete story. Please try again.');
      console.error('Delete story error:', err);
    }
  };

  const handleManageFiles = (story) => {
    setManagingFilesStory(story);
  };

  const handleCloseFileManager = () => {
    setManagingFilesStory(null);
  };

  const handleFormSubmit = async (storyData) => {
    try {
      if (editingStory) {
        await storyService.updateStory(editingStory.id, storyData);
      } else {
        await storyService.createStory(projectId, storyData);
      }

      setShowForm(false);
      setEditingStory(null);
      await loadStories(); // Refresh the list
    } catch (err) {
      console.error('Form submit error:', err);
      // Error handling is done in the form component
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingStory(null);
  };

  if (loading) {
    return <div className="loading">Loading stories...</div>;
  }

  return (
    <div className="story-list">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <button onClick={onBack} className="breadcrumb-link">
          ← Projects
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{projectTitle}</span>
      </div>

      {/* Header */}
      <div className="story-list-header">
        <h2>Stories in "{projectTitle}"</h2>
        <button
          onClick={handleCreateStory}
          className="btn btn-primary"
        >
          + Add New Story
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Story Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <StoryForm
              story={editingStory}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {stories.length === 0 ? (
        <div className="empty-state">
          <h3>No stories yet</h3>
          <p>Get started by creating your first story for this project.</p>
          <button
            onClick={handleCreateStory}
            className="btn btn-primary"
          >
            Create First Story
          </button>
        </div>
      ) : (
        <div className="story-grid">
          {stories.map((story) => (
            <div key={story.id} className="story-card">
              <div className="story-card-header">
                <h3 className="story-title">{story.title}</h3>
                <div className="story-actions">
                  <button
                    onClick={() => onViewChapters(story)}
                    className="btn btn-primary btn-small"
                    title="View chapters in this story"
                  >
                    Chapters
                  </button>
                  <button
                    onClick={() => handleManageFiles(story)}
                    className="btn btn-secondary btn-small"
                    title="Manage files for this story"
                  >
                    Files
                  </button>

                  <button
                    onClick={() => handleEditStory(story)}
                    className="btn btn-secondary btn-small"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {story.description && (
                <p className="story-description">{story.description}</p>
              )}

              <div className="story-meta">
                <span className="story-order">Order: {story.order_index}</span>
                <span className="story-date">
                  Created: {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>

            </div>


          ))}
          {managingFilesStory && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Files for "{managingFilesStory.title}"</h3>
                  <button
                    onClick={handleCloseFileManager}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
                <FileManager
                  entityType="stories"
                  entityId={managingFilesStory.id}
                  entityTitle={managingFilesStory.title}
                  compact={false}
                />
              </div>
            </div>
          )}
        </div>

      )}
    </div>
  );
};

export default StoryList;