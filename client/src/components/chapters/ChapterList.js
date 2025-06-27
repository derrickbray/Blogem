// client/src/components/chapters/ChapterList.js - CORRECT VERSION

import React, { useState, useEffect, useCallback } from 'react';
import { chapterService } from '../../services/api/chapterService';
import ChapterForm from './ChapterForm';
import FileManager from '../files/FileManager';

const ChapterList = ({ storyId, storyTitle, projectTitle, onBack }) => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [showChapterFileManager, setShowChapterFileManager] = useState(false);
  const [selectedChapterForFiles, setSelectedChapterForFiles] = useState(null);

  // Load chapters function wrapped in useCallback to prevent ESLint warning
  const loadChapters = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading chapters for story:', storyId);

      const chaptersData = await chapterService.getChaptersByStory(storyId);
      setChapters(chaptersData);
      console.log('Loaded chapters:', chaptersData);
    } catch (err) {
      console.error('Failed to load chapters:', err);
      setError('Failed to load chapters. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [storyId]); // Include storyId in dependencies

  // Load chapters when component mounts or storyId changes
  useEffect(() => {
    loadChapters();
  }, [loadChapters]); // Now loadChapters is included in dependencies

  const handleCreateChapter = () => {
    setEditingChapter(null);
    setShowForm(true);
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setShowForm(true);
  };

  const handleManageChapterFiles = (chapter) => {
    console.log('🗂️ Managing files for chapter:', chapter.title);
    setSelectedChapterForFiles(chapter);
    setShowChapterFileManager(true);
  };

  const handleCloseChapterFileManager = () => {
    setShowChapterFileManager(false);
    setSelectedChapterForFiles(null);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      await chapterService.deleteChapter(chapterId);
      // Remove the deleted chapter from the list
      setChapters(chapters.filter(chapter => chapter.id !== chapterId));
    } catch (err) {
      console.error('Failed to delete chapter:', err);
      setError('Failed to delete chapter. Please try again.');
    }
  };

  const handleFormSubmit = async (chapterData) => {
    try {
      if (editingChapter) {
        // Update existing chapter
        const updatedChapter = await chapterService.updateChapter(editingChapter.id, chapterData);
        setChapters(chapters.map(chapter =>
          chapter.id === editingChapter.id ? updatedChapter : chapter
        ));
      } else {
        // Create new chapter
        const newChapter = await chapterService.createChapter(storyId, chapterData);
        setChapters([...chapters, newChapter]);
      }

      setShowForm(false);
      setEditingChapter(null);
    } catch (err) {
      console.error('Failed to save chapter:', err);
      throw err; // Let the form handle the error display
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingChapter(null);
  };

  // Strip HTML and truncate content for preview
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return 'No content yet...';

    // Strip HTML tags for clean preview
    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    const plainText = stripHtml(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="chapter-list">
        <div className="chapter-list-header">
          <div className="breadcrumb">
            <button onClick={onBack} className="breadcrumb-link">
              ← Stories
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{storyTitle}</span>
          </div>
        </div>
        <div className="loading">Loading chapters...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="chapter-list">
        <div className="chapter-list-header">
          <div className="breadcrumb">
            <button onClick={onBack} className="breadcrumb-link">
              ← Stories
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{storyTitle}</span>
          </div>
        </div>
        <ChapterForm
          chapter={editingChapter}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="chapter-list">
      <div className="chapter-list-header">
        <div className="breadcrumb">
          <button onClick={onBack} className="breadcrumb-link">
            ← Stories
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{storyTitle}</span>
        </div>
        <div className="chapter-list-title">
          <h2>Chapters in "{storyTitle}"</h2>
          <p className="chapter-list-subtitle">Project: {projectTitle}</p>
        </div>
        <button
          onClick={handleCreateChapter}
          className="btn btn-primary"
        >
          Add New Chapter
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {chapters.length === 0 ? (
        <div className="chapter-empty-state">
          <h3>No chapters yet</h3>
          <p>Start building your story by creating the first chapter.</p>
          <button
            onClick={handleCreateChapter}
            className="btn btn-primary"
          >
            Create First Chapter
          </button>
        </div>
      ) : (
        <div className="chapter-grid">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="chapter-card">
              <div className="chapter-card-header">
                <div className="chapter-title">
                  <h3>{chapter.title}</h3>
                  <span className="chapter-order">Chapter {chapter.order_index}</span>
                </div>
                <div className="chapter-actions">
                  <button
                    onClick={() => handleManageChapterFiles(chapter)}
                    className="btn btn-info btn-small"
                    title="Manage files for this chapter"
                  >
                    Files
                  </button>
                  <button
                    onClick={() => handleEditChapter(chapter)}
                    className="btn btn-small btn-secondary"
                    title="Edit chapter"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="btn btn-small btn-danger"
                    title="Delete chapter"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="chapter-content-preview">
                {truncateContent(chapter.content)}
              </div>

              <div className="chapter-meta">
                <span className="chapter-date">
                  Created: {formatDate(chapter.created_at)}
                </span>
                <span className="chapter-word-count">
                  {chapter.content ? (() => {
                    // Strip HTML for accurate word count
                    const tmp = document.createElement('div');
                    tmp.innerHTML = chapter.content;
                    const plainText = tmp.textContent || tmp.innerText || '';
                    return plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
                  })() : 0} words
                </span>
                {/* NEW: File count indicator */}
                <span className="chapter-files">
                  📎 {chapter.file_count || 0} files
                </span>
              </div>
            </div>
          ))}
          {showChapterFileManager && selectedChapterForFiles && (
            <div className="modal-overlay" onClick={handleCloseChapterFileManager}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Files for "{selectedChapterForFiles.title}"</h3>
                  <button
                    onClick={handleCloseChapterFileManager}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
                <FileManager
                  entityType="chapters"
                  entityId={selectedChapterForFiles.id}
                  entityTitle={selectedChapterForFiles.title}
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

export default ChapterList;