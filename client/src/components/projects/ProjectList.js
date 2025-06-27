// client/src/components/projects/ProjectList.js - Updated with file management
import React, { useState } from 'react';
import FileManager from '../files/FileManager';

const ProjectList = ({
  projects,
  onEdit,
  onDelete,
  onViewStories,
  searchTerm,
  onSearchChange
}) => {
  // State for file management modal
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedProjectForFiles, setSelectedProjectForFiles] = useState(null);

  // Handle Files button click
  const handleManageFiles = (project) => {
    console.log('🗂️ Managing files for project:', project.title);
    setSelectedProjectForFiles(project);
    setShowFileManager(true);
  };

  // Close file manager modal
  const handleCloseFileManager = () => {
    setShowFileManager(false);
    setSelectedProjectForFiles(null);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <h3>No projects yet</h3>
        <p>Create your first project to get started with your writing journey.</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Results Count */}
      <div className="results-info">
        {filteredProjects.length === projects.length
          ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
          : `${filteredProjects.length} of ${projects.length} projects`
        }
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="no-results">
          <p>No projects match your search.</p>
        </div>
      ) : (
        <div className="project-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 className="project-title">{project.title}</h3>
                <div className="project-actions">
                  {/* Stories Button */}
                  <button
                    onClick={() => onViewStories(project)}
                    className="btn btn-primary btn-small"
                    title="View stories in this project"
                  >
                    Stories
                  </button>

                  {/* NEW: Files Button */}
                  <button
                    onClick={() => handleManageFiles(project)}
                    className="btn btn-info btn-small"
                    title="Manage files for this project"
                  >
                    Files
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(project)}
                    className="btn btn-secondary btn-small"
                  >
                    Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(project.id)}
                    className="btn btn-danger btn-small"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="project-description">{project.description}</p>
              )}

              <div className="project-meta">
                <span className="project-owner">By: {project.owner_name}</span>
                <span className="project-date">
                  Updated: {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Manager Modal */}
      {showFileManager && selectedProjectForFiles && (
        <div className="modal-overlay" onClick={handleCloseFileManager}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Files for "{selectedProjectForFiles.title}"</h3>
              <button
                onClick={handleCloseFileManager}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
            <FileManager
              entityType="projects"
              entityId={selectedProjectForFiles.id}
              entityTitle={selectedProjectForFiles.title}
              compact={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;