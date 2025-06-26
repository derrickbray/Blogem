// server/routes/files.js

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const { 
  authenticateToken, 
  checkProjectOwnership,
  checkStoryOwnership,
  checkChapterOwnership 
} = require('../middleware/auth');
const { upload, checkFileSize } = require('../middleware/fileUpload');

const router = express.Router();

/**
 * Convert plural entity type to singular for database storage
 * @param {string} entityType - The plural entity type (projects, stories, chapters)
 * @returns {string} - The singular entity type (project, story, chapter)
 */
const convertEntityTypeToSingular = (entityType) => {
  // Add debugging
  console.log('🔄 Converting entity type to singular:', entityType);
  
  // Handle both input formats
  const normalized = entityType.toLowerCase().trim();
  
  const conversions = {
    'projects': 'project',
    'stories': 'story', 
    'chapters': 'chapter',
    // Also handle if singular is passed by mistake
    'project': 'project',
    'story': 'story',
    'chapter': 'chapter'
  };
  
  const result = conversions[normalized];
  console.log('🔄 Conversion result:', normalized, '->', result);
  
  if (!result) {
    console.error('❌ Unknown entity type:', entityType);
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  return result;
};

/**
 * Convert singular entity type to plural for API routing
 * @param {string} entityType - The singular entity type (project, story, chapter)  
 * @returns {string} - The plural entity type (projects, stories, chapters)
 */
const convertEntityTypeToPlural = (entityType) => {
  const normalized = entityType.toLowerCase().trim();
  
  const conversions = {
    'project': 'projects',
    'story': 'stories', 
    'chapter': 'chapters',
    // Also handle if plural is passed by mistake
    'projects': 'projects',
    'stories': 'stories',
    'chapters': 'chapters'
  };
  
  return conversions[normalized] || entityType;
};

// Middleware to check entity ownership based on entity type
const checkEntityOwnership = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const userId = req.user.userId;

    let ownershipQuery;
    let params;

    // Build different queries based on entity type
    switch (entityType) {
      case 'projects':
        ownershipQuery = 'SELECT id FROM Projects WHERE id = ? AND owner_id = ?';
        params = [entityId, userId];
        break;
        
      case 'stories':
        ownershipQuery = `
          SELECT s.id 
          FROM Stories s
          JOIN Projects p ON s.project_id = p.id
          WHERE s.id = ? AND p.owner_id = ?`;
        params = [entityId, userId];
        break;
        
      case 'chapters':
        ownershipQuery = `
          SELECT c.id 
          FROM Chapters c
          JOIN Stories s ON c.story_id = s.id
          JOIN Projects p ON s.project_id = p.id
          WHERE c.id = ? AND p.owner_id = ?`;
        params = [entityId, userId];
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid entity type' });
    }

    const [results] = await pool.execute(ownershipQuery, params);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Entity not found or access denied' });
    }

    next();
  } catch (error) {
    console.error('Check entity ownership error:', error);
    res.status(500).json({ message: 'Server error checking entity access' });
  }
};

// POST /api/files/upload/:entityType/:entityId - Upload file to entity
// WHY: Users need to attach files to their projects, stories, or chapters
// router.post('/upload/:entityType/:entityId',
//   authenticateToken,           // Verify user is logged in
//   checkEntityOwnership,        // Verify user owns the entity
//   upload.single('file'),       // Handle single file upload
//   checkFileSize,               // Validate file size for type
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ message: 'No file uploaded' });
//       }

//       const { entityType, entityId } = req.params;
//       const userId = req.user.userId;
      
//       // Save file metadata to database
//       const [result] = await pool.execute(
//         `INSERT INTO Files (entity_type, entity_id, filename, file_path, file_size, uploaded_by)
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           convertEntityTypeToSingular(entityType), // Remove 's' from entityType (projects -> project)
//           entityId,
//           req.file.originalname,
//           req.file.path,
//           req.file.size,
//           userId
//         ]
//       );

//       // Get the complete file record
//       const [fileRecord] = await pool.execute(
//         'SELECT * FROM Files WHERE id = ?',
//         [result.insertId]
//       );

//       console.log('✅ File uploaded successfully:', req.file.originalname);

//       res.status(201).json({
//         message: 'File uploaded successfully',
//         file: fileRecord[0]
//       });

//     } catch (error) {
//       // If database save fails, clean up the uploaded file
//       if (req.file && req.file.path) {
//         fs.unlink(req.file.path).catch(console.error);
//       }
      
//       console.error('File upload error:', error);
//       res.status(500).json({ message: 'Server error during file upload' });
//     }
//   }
// );

// POST /api/files/upload/:entityType/:entityId - Upload file to entity
router.post('/upload/:entityType/:entityId',
  authenticateToken,           
  checkEntityOwnership,        
  upload.single('file'),       
  checkFileSize,               
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { entityType, entityId } = req.params;
      const userId = req.user.userId;
      
      // Debug logging
      console.log('📂 Upload Debug Info:');
      console.log('  entityType (from URL):', entityType);
      console.log('  entityId:', entityId);
      console.log('  userId:', userId);
      console.log('  filename:', req.file.originalname);
      
      // Convert entity type to singular for database storage
      const singularEntityType = convertEntityTypeToSingular(entityType);
      console.log('  singularEntityType:', singularEntityType);
      
      // Validate that conversion worked
      if (!singularEntityType || singularEntityType === entityType) {
        console.error('❌ Entity type conversion failed!');
        console.error('  Input:', entityType);
        console.error('  Output:', singularEntityType);
        return res.status(400).json({ 
          message: `Invalid entity type: ${entityType}` 
        });
      }
      
      // Save file metadata to database
      const insertQuery = `
        INSERT INTO Files (entity_type, entity_id, filename, file_path, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const insertValues = [
        singularEntityType,      // Should be 'story', 'project', or 'chapter'
        entityId,
        req.file.originalname,
        req.file.path,
        req.file.size,
        userId
      ];
      
      console.log('💾 Database Insert:');
      console.log('  Query:', insertQuery);
      console.log('  Values:', insertValues);
      
      const [result] = await pool.execute(insertQuery, insertValues);
      
      console.log('✅ Database insert successful, ID:', result.insertId);

      // Get the complete file record to verify it was saved correctly
      const [fileRecord] = await pool.execute(
        'SELECT * FROM Files WHERE id = ?',
        [result.insertId]
      );

      console.log('📄 Saved file record:', fileRecord[0]);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: fileRecord[0]
      });

    } catch (error) {
      // If database save fails, clean up the uploaded file
      if (req.file && req.file.path) {
        fs.unlink(req.file.path).catch(console.error);
      }
      
      console.error('❌ File upload error:', error);
      res.status(500).json({ message: 'Server error during file upload' });
    }
  }
);

// GET /api/files/entity/:entityType/:entityId - Get all files for an entity
// WHY: Users need to see what files are attached to their content
// router.get('/entity/:entityType/:entityId',
//   authenticateToken,
//   checkEntityOwnership,
//   async (req, res) => {
//     try {
//       const { entityType, entityId } = req.params;
      
//       const [files] = await pool.execute(
//         `SELECT f.*, u.username as uploaded_by_name 
//          FROM Files f
//          JOIN Users u ON f.uploaded_by = u.id
//          WHERE f.entity_type = ? AND f.entity_id = ?
//          ORDER BY f.uploaded_at DESC`,
//         [convertEntityTypeToSingular(entityType), entityId]
//       );

//       res.json({ files });

//     } catch (error) {
//       console.error('Get files error:', error);
//       res.status(500).json({ message: 'Server error loading files' });
//     }
//   }
// );

// GET /api/files/entity/:entityType/:entityId - Get all files for an entity
router.get('/entity/:entityType/:entityId',
  authenticateToken,
  checkEntityOwnership,
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      // Debug logging
      console.log('📂 Get Files Debug Info:');
      console.log('  entityType (from URL):', entityType);
      console.log('  entityId:', entityId);
      
      // Convert to singular for database query
      const singularEntityType = convertEntityTypeToSingular(entityType);
      console.log('  singularEntityType for query:', singularEntityType);
      
      const [files] = await pool.execute(
        `SELECT f.*, u.username as uploaded_by_name 
         FROM Files f
         JOIN Users u ON f.uploaded_by = u.id
         WHERE f.entity_type = ? AND f.entity_id = ?
         ORDER BY f.uploaded_at DESC`,
        [singularEntityType, entityId]  // Use converted entity type
      );

      console.log(`✅ Found ${files.length} files for ${singularEntityType} ${entityId}`);
      res.json({ files });

    } catch (error) {
      console.error('❌ Get files error:', error);
      res.status(500).json({ message: 'Server error loading files' });
    }
  }
);

// GET /api/files/:id - Download specific file
// WHY: Users need to download files they've uploaded
router.get('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user.userId;

      // Get file info and verify ownership
      const [files] = await pool.execute(
        `SELECT f.*, 
                CASE 
                  WHEN f.entity_type = 'project' THEN p.owner_id
                  WHEN f.entity_type = 'story' THEN p.owner_id
                  WHEN f.entity_type = 'chapter' THEN p.owner_id
                END as owner_id
         FROM Files f
         LEFT JOIN Projects p ON (
           (f.entity_type = 'project' AND f.entity_id = p.id) OR
           (f.entity_type = 'story' AND f.entity_id IN (SELECT id FROM Stories WHERE project_id = p.id)) OR
           (f.entity_type = 'chapter' AND f.entity_id IN (
             SELECT c.id FROM Chapters c 
             JOIN Stories s ON c.story_id = s.id 
             WHERE s.project_id = p.id
           ))
         )
         WHERE f.id = ?`,
        [fileId]
      );

      if (files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }

      const file = files[0];

      // Check if user owns this file
      if (file.owner_id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if file exists on disk
      try {
        await fs.access(file.file_path);
      } catch (error) {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      // Send file
      res.download(file.file_path, file.filename);

    } catch (error) {
      console.error('Download file error:', error);
      res.status(500).json({ message: 'Server error downloading file' });
    }
  }
);

// DELETE /api/files/:id - Delete file
// WHY: Users need to remove files they no longer want
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const fileId = req.params.id;
      const userId = req.user.userId;

      // Get file info and verify ownership (same query as download)
      const [files] = await pool.execute(
        `SELECT f.*, 
                CASE 
                  WHEN f.entity_type = 'project' THEN p.owner_id
                  WHEN f.entity_type = 'story' THEN p.owner_id
                  WHEN f.entity_type = 'chapter' THEN p.owner_id
                END as owner_id
         FROM Files f
         LEFT JOIN Projects p ON (
           (f.entity_type = 'project' AND f.entity_id = p.id) OR
           (f.entity_type = 'story' AND f.entity_id IN (SELECT id FROM Stories WHERE project_id = p.id)) OR
           (f.entity_type = 'chapter' AND f.entity_id IN (
             SELECT c.id FROM Chapters c 
             JOIN Stories s ON c.story_id = s.id 
             WHERE s.project_id = p.id
           ))
         )
         WHERE f.id = ?`,
        [fileId]
      );

      if (files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }

      const file = files[0];

      if (file.owner_id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete from database
      await pool.execute('DELETE FROM Files WHERE id = ?', [fileId]);

      // Delete from disk
      try {
        await fs.unlink(file.file_path);
        console.log('✅ File deleted from disk:', file.file_path);
      } catch (error) {
        console.error('⚠️ Could not delete file from disk:', error);
        // Continue anyway - database record is removed
      }

      res.json({ message: 'File deleted successfully' });

    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ message: 'Server error deleting file' });
    }
  }
);

module.exports = router;