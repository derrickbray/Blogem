// client/src/components/files/FileManager.js

import React, { useState } from 'react';
import FileUpload from './FileUpload';
import FileList from './FileList';

const FileManager = ({
    entityType,
    entityId,
    entityTitle,
    showUpload = true,
    showList = true,
    compact = false
}) => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Handle successful upload - trigger file list refresh
    const handleUploadComplete = () => {
        console.log('✅ Upload complete, refreshing file list');
        setRefreshTrigger(prev => prev + 1);
    };

    // Get entity type display name
    const getEntityDisplayName = () => {
        const entityName = entityType.slice(0, -1); // Remove 's' from entityType
        return entityName.charAt(0).toUpperCase() + entityName.slice(1);
    };

    return (
        <div className={`file-manager ${compact ? 'compact' : ''}`}>
            {/* File Manager Header */}
            <div className="file-manager-header">
                <h3>File Management</h3>
                {entityTitle && (
                    <p className="entity-context">
                        {getEntityDisplayName()}: {entityTitle}
                    </p>
                )}
            </div>

            {/* Upload Section */}
            {showUpload && (
                <div className="file-manager-section">
                    <h4>Upload Files</h4>
                    <FileUpload
                        entityType={entityType}
                        entityId={entityId}
                        onUploadComplete={handleUploadComplete}
                    />
                </div>
            )}

            {/* Files List Section */}
            {showList && (
                <div className="file-manager-section">
                    <FileList
                        entityType={entityType}
                        entityId={entityId}
                        refreshTrigger={refreshTrigger}
                    />
                </div>
            )}

            {/* File Management Tips */}
            {!compact && (
                <div className="file-manager-tips">
                    <h4>File Management Tips:</h4>
                    <ul>
                        <li><strong>Organization:</strong> Files are attached to specific content (projects, stories, chapters)</li>
                        <li><strong>Access:</strong> Only you can access files in your projects</li>
                        <li><strong>Formats:</strong> Upload images for visual content, documents for reference materials</li>
                        <li><strong>Cleanup:</strong> Files are automatically deleted when content is removed</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileManager;