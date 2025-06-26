// server/middleware/auth.js

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Debug: Check if pool is properly imported
console.log('Auth middleware loaded. Pool methods available:', Object.getOwnPropertyNames(pool));

// Verify JWT token from request headers
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Check if user owns the project
const checkProjectOwnership = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.userId;

    console.log(`Checking project ownership: projectId=${projectId}, userId=${userId}`);
    
    // Debug: Verify pool has execute method
    if (typeof pool.execute !== 'function') {
      console.error('❌ Pool.execute is not a function! Pool object:', pool);
      return res.status(500).json({ message: 'Database configuration error' });
    }

    const [projects] = await pool.execute(
      'SELECT id FROM Projects WHERE id = ? AND owner_id = ?',
      [projectId, userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    console.log(`✅ Project ownership verified for project ${projectId}`);
    next();
  } catch (error) {
    console.error('Check project ownership error:', error);
    res.status(500).json({ message: 'Server error checking project access' });
  }
};

// Check if user owns the story (through project ownership)
const checkStoryOwnership = async (req, res, next) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.userId;

    console.log(`Checking story ownership: storyId=${storyId}, userId=${userId}`);

    const [stories] = await pool.execute(
      `SELECT s.id 
       FROM Stories s
       JOIN Projects p ON s.project_id = p.id
       WHERE s.id = ? AND p.owner_id = ?`,
      [storyId, userId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found or access denied' });
    }

    console.log(`✅ Story ownership verified for story ${storyId}`);
    next();
  } catch (error) {
    console.error('Check story ownership error:', error);
    res.status(500).json({ message: 'Server error checking story access' });
  }
};

// Check if user owns the chapter (through project ownership)
const checkChapterOwnership = async (req, res, next) => {
  try {
    const chapterId = req.params.id;
    const userId = req.user.userId;

    console.log(`Checking chapter ownership: chapterId=${chapterId}, userId=${userId}`);

    const [chapters] = await pool.execute(
      `SELECT c.id 
       FROM Chapters c
       JOIN Stories s ON c.story_id = s.id
       JOIN Projects p ON s.project_id = p.id
       WHERE c.id = ? AND p.owner_id = ?`,
      [chapterId, userId]
    );

    if (chapters.length === 0) {
      return res.status(404).json({ message: 'Chapter not found or access denied' });
    }

    console.log(`✅ Chapter ownership verified for chapter ${chapterId}`);
    next();
  } catch (error) {
    console.error('Check chapter ownership error:', error);
    res.status(500).json({ message: 'Server error checking chapter access' });
  }
};

// Check if user owns the story (for creating chapters in that story)
const checkStoryOwnershipForChapters = async (req, res, next) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user.userId;

    console.log(`Checking story ownership for chapters: storyId=${storyId}, userId=${userId}`);

    const [stories] = await pool.execute(
      `SELECT s.id 
       FROM Stories s
       JOIN Projects p ON s.project_id = p.id
       WHERE s.id = ? AND p.owner_id = ?`,
      [storyId, userId]
    );

    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found or access denied' });
    }

    console.log(`✅ Story ownership verified for creating chapters in story ${storyId}`);
    next();
  } catch (error) {
    console.error('Check story ownership for chapters error:', error);
    res.status(500).json({ message: 'Server error checking story access' });
  }
};

// NEW FUNCTION - Check project ownership for stories routes 
// (routes that use :projectId instead of :id)
const checkProjectOwnershipForStories = async (req, res, next) => {
  try {
    const projectId = req.params.projectId; // Look for 'projectId' not 'id'
    const userId = req.user.userId;

    console.log(`Checking project ownership for stories: projectId=${projectId}, userId=${userId}`);

    const [projects] = await pool.execute(
      'SELECT id FROM Projects WHERE id = ? AND owner_id = ?',
      [projectId, userId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    console.log(`✅ Project ownership verified for stories in project ${projectId}`);
    next();
  } catch (error) {
    console.error('Check project ownership for stories error:', error);
    res.status(500).json({ message: 'Server error checking project access' });
  }
};

module.exports = {
  authenticateToken,
  checkProjectOwnership,
  checkStoryOwnership,
  checkChapterOwnership,
  checkStoryOwnershipForChapters,
  checkProjectOwnershipForStories  
};