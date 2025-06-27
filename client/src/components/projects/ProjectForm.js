import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/api/projectService';
import FileManager from '../files/FileManager';

const ProjectForm = ({ project, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showFileManager, setShowFileManager] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || ''
      });
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Project title is required');
      setSaving(false);
      return;
    }

    try {
      let savedProject;
      if (project?.id) {
        savedProject = await projectService.updateProject(project.id, formData);
      } else {
        savedProject = await projectService.createProject(formData);
      }
      onSave(savedProject);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
      console.error('Save project error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="project-form-container">
      <form onSubmit={handleSubmit} className="project-form">
        <h2>{project?.id ? 'Edit Project' : 'Create New Project'}</h2>

        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Project Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={saving}
            placeholder="Enter project title..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            disabled={saving}
            placeholder="Enter project description (optional)..."
          />
        </div>

        {/* File Management Section */}
        {project?.id && (
          <div className="form-section file-management-section">
            <div className="section-header">
              <h4>Project Files</h4>
              <button
                type="button"
                onClick={() => setShowFileManager(!showFileManager)}
                className="btn btn-info btn-small"
              >
                {showFileManager ? 'Hide Files' : 'Manage Files'}
              </button>
            </div>

            {showFileManager && (
              <FileManager
                entityType="projects"
                entityId={project.id}
                entityTitle={formData.title || 'Project'}
                compact={true}
              />
            )}
          </div>
        )}

        {/* Info message for new projects */}
        {!project?.id && (
          <div className="info-message">
            <p><strong>File Management:</strong> Save the project first to enable file attachments.</p>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={saving} className="save-button">
            {saving ? 'Saving...' : (project?.id ? 'Update Project' : 'Create Project')}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>

    </div>
  );
};

export default ProjectForm;