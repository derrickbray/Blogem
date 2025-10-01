// server/routes/categories.js - Categories API endpoints
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to create URL-friendly slug
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/categories/public - Get all categories with post counts
router.get('/public', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT
        c.id, c.name, c.slug, c.description, c.color,
        COUNT(DISTINCT p.id) as post_count
      FROM Categories c
      LEFT JOIN Post_Categories pc ON c.id = pc.category_id
      LEFT JOIN Posts p ON pc.post_id = p.id AND p.status = 'published'
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json({ categories });

  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// All routes below require authentication
router.use(authenticateToken);

// GET /api/categories - Get all categories (admin view)
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT
        c.id, c.name, c.slug, c.description, c.color, c.created_at,
        COUNT(DISTINCT pc.post_id) as post_count
      FROM Categories c
      LEFT JOIN Post_Categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [categories] = await pool.execute(`
      SELECT * FROM Categories WHERE id = ?
    `, [id]);

    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get posts in this category
    const [posts] = await pool.execute(`
      SELECT p.id, p.title, p.slug, p.status, p.created_at
      FROM Posts p
      JOIN Post_Categories pc ON p.id = pc.post_id
      WHERE pc.category_id = ?
      ORDER BY p.created_at DESC
    `, [id]);

    const category = { ...categories[0], posts };

    res.json({ category });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error fetching category' });
  }
});

// POST /api/categories - Create new category
router.post('/', async (req, res) => {
  try {
    const { name, description, color = '#3B82F6' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Generate unique slug
    let baseSlug = createSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const [existing] = await pool.execute('SELECT id FROM Categories WHERE slug = ?', [slug]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const [result] = await pool.execute(`
      INSERT INTO Categories (name, slug, description, color)
      VALUES (?, ?, ?, ?)
    `, [name, slug, description, color]);

    res.status(201).json({
      message: 'Category created successfully',
      categoryId: result.insertId,
      slug
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error creating category' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Check if category exists
    const [categories] = await pool.execute('SELECT * FROM Categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const currentCategory = categories[0];

    // Update slug if name changed
    let slug = currentCategory.slug;
    if (name && name !== currentCategory.name) {
      let baseSlug = createSlug(name);
      slug = baseSlug;
      let counter = 1;

      while (true) {
        const [existing] = await pool.execute('SELECT id FROM Categories WHERE slug = ? AND id != ?', [slug, id]);
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    await pool.execute(`
      UPDATE Categories
      SET name = ?, slug = ?, description = ?, color = ?
      WHERE id = ?
    `, [name, slug, description, color, id]);

    res.json({
      message: 'Category updated successfully',
      slug
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error updating category' });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has posts
    const [posts] = await pool.execute('SELECT COUNT(*) as count FROM Post_Categories WHERE category_id = ?', [id]);

    if (posts[0].count > 0) {
      return res.status(400).json({
        message: 'Cannot delete category that has posts assigned to it. Remove posts from category first.'
      });
    }

    const [result] = await pool.execute('DELETE FROM Categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error deleting category' });
  }
});

module.exports = router;