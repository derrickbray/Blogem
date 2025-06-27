// client/src/pages/projects/Dashboard.js - FIXED VERSION

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/api/projectService';
import ProjectList from '../../components/projects/ProjectList';
import ProjectForm from '../../components/projects/ProjectForm';
import StoryList from '../../components/stories/StoryList';
import ChapterList from '../../components/chapters/ChapterList';

const Dashboard = () => {
  const { user } = useAuth();

  // View state management
  const [currentView, setCurrentView] = useState('projects'); // 'projects' | 'stories' | 'chapters' | 'form'
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

  // Project management state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProject, setEditingProject] = useState(null);

  // Load projects when component mounts
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err) {
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Project CRUD functions
  const handleCreateProject = () => {
    setEditingProject(null);
    setCurrentView('form');
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setCurrentView('form');
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all stories and chapters within it.')) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleFormSubmit = async (projectData) => {
    try {
      if (editingProject) {
        const updatedProject = await projectService.updateProject(editingProject.id, projectData);
        setProjects(projects.map(project =>
          project.id === editingProject.id ? updatedProject.project : project
        ));
      } else {
        const newProject = await projectService.createProject(projectData);
        setProjects([newProject.project, ...projects]);
      }

      setCurrentView('projects');
      setEditingProject(null);
    } catch (err) {
      console.error('Failed to save project:', err);
      throw err;
    }
  };

  const handleFormCancel = () => {
    setCurrentView('projects');
    setEditingProject(null);
  };

  // Navigation functions
  const handleViewStories = (project) => {
    console.log('🎯 handleViewStories called with project:', project);
    setSelectedProject(project);
    setCurrentView('stories');
  };

  const handleViewChapters = (story) => {
    console.log('🔍 handleViewChapters called');
    console.log('📖 story:', story);
    console.log('📁 selectedProject before:', selectedProject);

    setSelectedStory(story);
    setCurrentView('chapters');

    console.log('✅ Should now show chapters view');
  };

  const handleBackToProjects = () => {
    console.log('🔙 handleBackToProjects called');
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedStory(null);
  };

  const handleBackToStories = () => {
    console.log('🔙 handleBackToStories called');
    setCurrentView('stories');
    setSelectedStory(null);
  };

  // Add debugging for render
  console.log('🎯 Dashboard Render Debug:');
  console.log('currentView:', currentView);
  console.log('selectedProject:', selectedProject);
  console.log('selectedStory:', selectedStory);

  // Loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your projects...</div>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'form') {
    console.log('✅ Rendering ProjectForm');
    return (
      <div className="dashboard">
        <ProjectForm
          project={editingProject}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // FIXED: Check for both selectedStory AND selectedProject
  if (currentView === 'chapters' && selectedStory && selectedProject) {
    console.log('✅ Rendering ChapterList');
    console.log('storyId:', selectedStory.id);
    console.log('storyTitle:', selectedStory.title);
    console.log('projectTitle:', selectedProject.title);
    
    return (
      <ChapterList
        storyId={selectedStory.id}
        storyTitle={selectedStory.title}
        projectTitle={selectedProject.title}
        onBack={handleBackToStories}
      />
    );
  }

  // Handle missing state for chapters view
  if (currentView === 'chapters' && (!selectedStory || !selectedProject)) {
    console.error('❌ Chapters view but missing selectedStory or selectedProject');
    console.error('selectedStory:', selectedStory);
    console.error('selectedProject:', selectedProject);
    console.log('🔄 Resetting to projects view');
    
    // Reset to projects view if state is corrupted
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedStory(null);
    return <div className="loading">Resetting view...</div>;
  }

  if (currentView === 'stories' && selectedProject) {
    console.log('✅ Rendering StoryList');
    return (
      <StoryList
        projectId={selectedProject.id}
        projectTitle={selectedProject.title}
        onBack={handleBackToProjects}
        onViewChapters={handleViewChapters}
      />
    );
  }

  // Handle missing state for stories view
  if (currentView === 'stories' && !selectedProject) {
    console.error('❌ Stories view but no selectedProject');
    console.log('🔄 Resetting to projects view');
    
    // Reset to projects view if state is corrupted
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedStory(null);
    return <div className="loading">Resetting view...</div>;
  }

  // Default: Projects view
  console.log('✅ Rendering ProjectList (default)');
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.username}!</h1>
        <p>Manage your writing projects</p>

        <button
          onClick={handleCreateProject}
          className="btn btn-primary"
        >
          Create New Project
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <ProjectList
        projects={projects}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
        onViewStories={handleViewStories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    </div>
  );
};

export default Dashboard;