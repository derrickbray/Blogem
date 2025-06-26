// server/routes/chapters.js

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { 
  authenticateToken, 
  checkChapterOwnership, 
  checkStoryOwnershipForChapters 
} = require('../middleware/auth');

const router = express.Router();

// GET /api/chapters/stories/:storyId/chapters - Get all chapters in a story
// WHY: We need to list all chapters that belong to a specific story
router.get('/stories/:storyId/chapters', 
  authenticateToken,                    // First: Verify user is logged in
  checkStoryOwnershipForChapters,       // Second: Verify user owns this story
  async (req, res) => {
    try {
      const storyId = req.params.storyId;

      // EXPLANATION: Get chapters with story and project info for breadcrumbs
      // ORDER BY order_index ensures chapters appear in the correct sequence
      const [chapters] = await pool.execute(
        `SELECT 
           c.id,
           c.story_id,
           c.title,
           c.content,
           c.order_index,
           c.created_at,
           s.title as story_title,      -- For breadcrumbs
           p.title as project_title     -- For breadcrumbs
         FROM Chapters c
         JOIN Stories s ON c.story_id = s.id
         JOIN Projects p ON s.project_id = p.id
         WHERE c.story_id = ?
         ORDER BY c.order_index ASC, c.created_at ASC`,
        [storyId]
      );

      res.json(chapters);
    } catch (error) {
      console.error('Get chapters error:', error);
      res.status(500).json({ message: 'Server error loading chapters' });
    }
  }
);

// POST /api/chapters/stories/:storyId/chapters - Create new chapter in story
// WHY: Users need to add new chapters to their stories
router.post('/stories/:storyId/chapters',
  authenticateToken,
  checkStoryOwnershipForChapters,
  [
    // Validation: Title is required and not too long
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Chapter title is required')
      .isLength({ max: 200 })
      .withMessage('Chapter title must be 200 characters or less'),
    
    // Content is optional but if provided, check length
    body('content')
      .optional()
      .isLength({ max: 65535 })
      .withMessage('Chapter content is too long')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const storyId = req.params.storyId;
      const { title, content = '' } = req.body;

      // EXPLANATION: Auto-calculate order_index for new chapter
      // Find the highest order_index in this story and add 1
      const [maxOrder] = await pool.execute(
        'SELECT COALESCE(MAX(order_index), 0) as max_order FROM Chapters WHERE story_id = ?',
        [storyId]
      );
      
      const orderIndex = maxOrder[0].max_order + 1;

      // Insert the new chapter
      const [result] = await pool.execute(
        `INSERT INTO Chapters (story_id, title, content, order_index) 
         VALUES (?, ?, ?, ?)`,
        [storyId, title, content, orderIndex]
      );

      // Get the complete chapter data with story/project info
      const [newChapter] = await pool.execute(
        `SELECT 
           c.id,
           c.story_id,
           c.title,
           c.content,
           c.order_index,
           c.created_at,
           s.title as story_title,
           p.title as project_title
         FROM Chapters c
         JOIN Stories s ON c.story_id = s.id
         JOIN Projects p ON s.project_id = p.id
         WHERE c.id = ?`,
        [result.insertId]
      );

      res.status(201).json(newChapter[0]);
    } catch (error) {
      console.error('Create chapter error:', error);
      res.status(500).json({ message: 'Server error creating chapter' });
    }
  }
);

// GET /api/chapters/:id - Get specific chapter
// WHY: When editing a chapter, we need to load its current data
router.get('/:id',
  authenticateToken,
  checkChapterOwnership,
  async (req, res) => {
    try {
      const chapterId = req.params.id;

      const [chapters] = await pool.execute(
        `SELECT 
           c.id,
           c.story_id,
           c.title,
           c.content,
           c.order_index,
           c.created_at,
           s.title as story_title,
           p.title as project_title
         FROM Chapters c
         JOIN Stories s ON c.story_id = s.id
         JOIN Projects p ON s.project_id = p.id
         WHERE c.id = ?`,
        [chapterId]
      );

      if (chapters.length === 0) {
        return res.status(404).json({ message: 'Chapter not found' });
      }

      res.json(chapters[0]);
    } catch (error) {
      console.error('Get chapter error:', error);
      res.status(500).json({ message: 'Server error loading chapter' });
    }
  }
);

// PUT /api/chapters/:id - Update chapter
// WHY: Users need to edit chapter title and content
router.put('/:id',
  authenticateToken,
  checkChapterOwnership,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Chapter title is required')
      .isLength({ max: 200 })
      .withMessage('Chapter title must be 200 characters or less'),
    
    body('content')
      .optional()
      .isLength({ max: 65535 })
      .withMessage('Chapter content is too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const chapterId = req.params.id;
      const { title, content = '' } = req.body;

      // Update the chapter
      await pool.execute(
        'UPDATE Chapters SET title = ?, content = ? WHERE id = ?',
        [title, content, chapterId]
      );

      // Get the updated chapter with story/project info
      const [updatedChapter] = await pool.execute(
        `SELECT 
           c.id,
           c.story_id,
           c.title,
           c.content,
           c.order_index,
           c.created_at,
           s.title as story_title,
           p.title as project_title
         FROM Chapters c
         JOIN Stories s ON c.story_id = s.id
         JOIN Projects p ON s.project_id = p.id
         WHERE c.id = ?`,
        [chapterId]
      );

      res.json(updatedChapter[0]);
    } catch (error) {
      console.error('Update chapter error:', error);
      res.status(500).json({ message: 'Server error updating chapter' });
    }
  }
);

// DELETE /api/chapters/:id - Delete chapter
// WHY: Users need to remove chapters they no longer want
router.delete('/:id',
  authenticateToken,
  checkChapterOwnership,
  async (req, res) => {
    try {
      const chapterId = req.params.id;

      // Delete the chapter (CASCADE will handle any future related data)
      const [result] = await pool.execute(
        'DELETE FROM Chapters WHERE id = ?',
        [chapterId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Chapter not found' });
      }

      res.json({ message: 'Chapter deleted successfully' });
    } catch (error) {
      console.error('Delete chapter error:', error);
      res.status(500).json({ message: 'Server error deleting chapter' });
    }
  }
);

module.exports = router;