// server/routes/stories.js - Story CRUD endpoints - UPDATED
const express = require('express');
const pool = require('../config/database');
const { 
  authenticateToken, 
  checkProjectOwnershipForStories,  // CHANGED: Use the new function
  checkStoryOwnership 
} = require('../middleware/auth');

const router = express.Router();

// All story routes require authentication
router.use(authenticateToken);

// GET /api/stories/projects/:projectId/stories - Get all stories for a specific project
router.get('/projects/:projectId/stories', checkProjectOwnershipForStories, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const [stories] = await pool.execute(
      `SELECT s.id, s.title, s.description, s.order_index, s.created_at,
              p.title as project_title, p.id as project_id
       FROM Stories s
       JOIN Projects p ON s.project_id = p.id
       WHERE s.project_id = ?
       ORDER BY s.order_index ASC, s.created_at ASC`,
      [projectId]
    );

    res.json({
      stories: stories
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Server error getting stories' });
  }
});

// GET /api/stories/:id - Get specific story details
router.get('/:id', checkStoryOwnership, async (req, res) => {
  try {
    const storyId = req.params.id;

    const [stories] = await pool.execute(
      `SELECT s.id, s.title, s.description, s.order_index, s.created_at,
              p.title as project_title, p.id as project_id
       FROM Stories s
       JOIN Projects p ON s.project_id = p.id
       WHERE s.id = ?`,
      [storyId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.json({
      story: stories[0]
    });

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({ message: 'Server error getting story' });
  }
});

// POST /api/stories/projects/:projectId/stories - Create new story
router.post('/projects/:projectId/stories', checkProjectOwnershipForStories, async (req, res) => {
  try {
    const { title, description } = req.body;
    const projectId = req.params.projectId;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Story title is required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Story title must be 200 characters or less' });
    }

    // Get the next order_index for this project
    const [orderResult] = await pool.execute(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM Stories WHERE project_id = ?',
      [projectId]
    );
    const nextOrder = orderResult[0].next_order;

    // Insert new story
    const [result] = await pool.execute(
      'INSERT INTO Stories (title, description, project_id, order_index) VALUES (?, ?, ?, ?)',
      [title.trim(), description || null, projectId, nextOrder]
    );

    // Get the created story with project info
    const [newStory] = await pool.execute(
      `SELECT s.id, s.title, s.description, s.order_index, s.created_at,
              p.title as project_title, p.id as project_id
       FROM Stories s
       JOIN Projects p ON s.project_id = p.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Story created successfully',
      story: newStory[0]
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error creating story' });
  }
});

// PUT /api/stories/:id - Update story
router.put('/:id', checkStoryOwnership, async (req, res) => {
  try {
    const storyId = req.params.id;
    const { title, description, order_index } = req.body;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Story title is required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Story title must be 200 characters or less' });
    }

    // Build update query dynamically based on provided fields
    let updateFields = [];
    let updateValues = [];

    updateFields.push('title = ?');
    updateValues.push(title.trim());

    updateFields.push('description = ?');
    updateValues.push(description || null);

    if (order_index !== undefined) {
      updateFields.push('order_index = ?');
      updateValues.push(order_index);
    }

    updateValues.push(storyId);

    // Update story
    await pool.execute(
      `UPDATE Stories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated story
    const [updatedStory] = await pool.execute(
      `SELECT s.id, s.title, s.description, s.order_index, s.created_at,
              p.title as project_title, p.id as project_id
       FROM Stories s
       JOIN Projects p ON s.project_id = p.id
       WHERE s.id = ?`,
      [storyId]
    );

    res.json({
      message: 'Story updated successfully',
      story: updatedStory[0]
    });

  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ message: 'Server error updating story' });
  }
});

// DELETE /api/stories/:id - Delete story
router.delete('/:id', checkStoryOwnership, async (req, res) => {
  try {
    const storyId = req.params.id;

    // Delete story (CASCADE will handle related records)
    const [result] = await pool.execute(
      'DELETE FROM Stories WHERE id = ?',
      [storyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.json({
      message: 'Story deleted successfully'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error deleting story' });
  }
});

module.exports = router;