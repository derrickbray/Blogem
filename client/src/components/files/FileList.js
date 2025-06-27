// client/src/components/files/FileList.js

import React, { useState, useEffect } from 'react';
import { fileService } from '../../services/api/fileService';

const FileList = ({ entityType, entityId, refreshTrigger = 0 }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(null); // Track which file is being deleted

    // Load files when component mounts or refreshTrigger changes
    useEffect(() => {
        loadFiles();
    }, [entityType, entityId, refreshTrigger]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError('');

            console.log(`Loading files for ${entityType} ${entityId}`);
            const filesData = await fileService.getFilesByEntity(entityType, entityId);
            setFiles(filesData);

            console.log(`✅ Loaded ${filesData.length} files`);
        } catch (err) {
            console.error('Failed to load files:', err);
            setError('Failed to load files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle file download
    const handleDownload = async (file) => {
        try {
            console.log('Downloading file:', file.filename);
            await fileService.downloadFile(file.id, file.filename);
        } catch (err) {
            console.error('Download failed:', err);
            setError(`Failed to download ${file.filename}: ${err.message}`);
        }
    };

    // Handle file deletion
    const handleDelete = async (file) => {
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete "${file.filename}"? This action cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setDeleting(file.id);
            setError('');

            console.log('Deleting file:', file.filename);
            await fileService.deleteFile(file.id);

            // Remove file from local state instead of reloading
            setFiles(files.filter(f => f.id !== file.id));

            console.log('✅ File deleted successfully');
        } catch (err) {
            console.error('Delete failed:', err);
            setError(`Failed to delete ${file.filename}: ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    // Format upload date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Get file type info for display
    const getFileTypeInfo = (filename) => {
        const fileType = fileService.getFileType(filename);
        const typeEmojis = {
            image: '🖼️',
            document: '📄',
            unknown: '📎'
        };

        return {
            emoji: typeEmojis[fileType.type] || typeEmojis.unknown,
            category: fileType.category
        };
    };

    // Loading state
    if (loading) {
        return (
            <div className="file-list">
                <div className="file-list-header">
                    <h4>Attached Files</h4>
                </div>
                <div className="loading">Loading files...</div>
            </div>
        );
    }

    return (
        <div className="file-list">
            <div className="file-list-header">
                <h4>Attached Files</h4>
                {files.length > 0 && (
                    <span className="file-count">
                        {files.length} file{files.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Files Grid */}
            {files.length === 0 ? (
                <div className="no-files">
                    <p>No files attached yet.</p>
                    <small>Use the upload area above to add files to this {entityType.slice(0, -1)}.</small>
                </div>
            ) : (
                <div className="files-grid">
                    {files.map((file) => {
                        const typeInfo = getFileTypeInfo(file.filename);
                        const isDeleting = deleting === file.id;

                        return (
                            <div key={file.id} className={`file-card ${isDeleting ? 'deleting' : ''}`}>
                                {/* File Type Icon */}
                                <div className="file-icon">
                                    {typeInfo.emoji}
                                </div>

                                {/* File Info */}
                                <div className="file-info">
                                    <div className="file-name" title={file.filename}>
                                        {file.filename}
                                    </div>
                                    <div className="file-meta">
                                        <span className="file-size">
                                            {fileService.formatFileSize(file.file_size)}
                                        </span>
                                        <span className="file-type">
                                            {typeInfo.category}
                                        </span>
                                    </div>
                                    <div className="file-details">
                                        <span className="upload-date">
                                            {formatDate(file.uploaded_at)}
                                        </span>
                                        <span className="uploaded-by">
                                            by {file.uploaded_by_name}
                                        </span>
                                    </div>
                                </div>

                                {/* File Actions */}
                                <div className="file-actions">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="btn btn-small btn-secondary"
                                        title="Download file"
                                        disabled={isDeleting}
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file)}
                                        className="btn btn-small btn-danger"
                                        title="Delete file"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* File Statistics */}
            {files.length > 0 && (
                <div className="file-statistics">
                    <div className="stats-summary">
                        <span className="total-files">
                            {files.length} files
                        </span>
                        <span className="total-size">
                            {fileService.formatFileSize(
                                files.reduce((total, file) => total + file.file_size, 0)
                            )} total
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileList;