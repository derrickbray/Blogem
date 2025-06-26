// server/routes/projects.js - Project CRUD endpoints - FIXED
const express = require('express');
const pool = require('../config/database');
const { authenticateToken, checkProjectOwnership } = require('../middleware/auth');

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// GET /api/projects - Get all projects for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId; // FIXED: Changed from req.user.id to req.user.userId

    const [projects] = await pool.execute(
      `SELECT p.id, p.title, p.description, p.created_at, p.updated_at,
              u.username as owner_name
       FROM Projects p
       JOIN Users u ON p.owner_id = u.id
       WHERE p.owner_id = ?
       ORDER BY p.updated_at DESC`,
      [userId]
    );

    res.json({
      projects: projects
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error getting projects' });
  }
});

// GET /api/projects/:id - Get specific project details
router.get('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId; // FIXED: Changed from req.user.id to req.user.userId

    const [projects] = await pool.execute(
      `SELECT p.id, p.title, p.description, p.created_at, p.updated_at,
              u.username as owner_name
       FROM Projects p
       JOIN Users u ON p.owner_id = u.id
       WHERE p.id = ? AND p.owner_id = ?`,
      [projectId, userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      project: projects[0]
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error getting project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.userId; // FIXED: Changed from req.user.id to req.user.userId

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Project title is required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Project title must be 200 characters or less' });
    }

    // Insert new project
    const [result] = await pool.execute(
      'INSERT INTO Projects (title, description, owner_id) VALUES (?, ?, ?)',
      [title.trim(), description || null, userId]
    );

    // Get the created project with owner info
    const [newProject] = await pool.execute(
      `SELECT p.id, p.title, p.description, p.created_at, p.updated_at,
              u.username as owner_name
       FROM Projects p
       JOIN Users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject[0]
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', checkProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description } = req.body;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Project title is required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Project title must be 200 characters or less' });
    }

    // Update project
    await pool.execute(
      'UPDATE Projects SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title.trim(), description || null, projectId]
    );

    // Get updated project
    const [updatedProject] = await pool.execute(
      `SELECT p.id, p.title, p.description, p.created_at, p.updated_at,
              u.username as owner_name
       FROM Projects p
       JOIN Users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [projectId]
    );

    res.json({
      message: 'Project updated successfully',
      project: updatedProject[0]
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', checkProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Delete project (CASCADE will handle related records)
    const [result] = await pool.execute(
      'DELETE FROM Projects WHERE id = ?',
      [projectId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

module.exports = router;