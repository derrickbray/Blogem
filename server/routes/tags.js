// server/routes/tags.js - Tags API endpoints
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

// GET /api/tags/public - Get all tags with post counts
router.get('/public', async (req, res) => {
  try {
    const [tags] = await pool.execute(`
      SELECT
        t.id, t.name, t.slug,
        COUNT(DISTINCT p.id) as post_count
      FROM Tags t
      LEFT JOIN Post_Tags pt ON t.id = pt.tag_id
      LEFT JOIN Posts p ON pt.post_id = p.id AND p.status = 'published'
      GROUP BY t.id
      HAVING post_count > 0
      ORDER BY post_count DESC, t.name
    `);

    res.json({ tags });

  } catch (error) {
    console.error('Error fetching public tags:', error);
    res.status(500).json({ message: 'Server error fetching tags' });
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// All routes below require authentication
router.use(authenticateToken);

// GET /api/tags - Get all tags (admin view)
router.get('/', async (req, res) => {
  try {
    const [tags] = await pool.execute(`
      SELECT
        t.id, t.name, t.slug, t.created_at,
        COUNT(DISTINCT pt.post_id) as post_count
      FROM Tags t
      LEFT JOIN Post_Tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY t.name
    `);

    res.json({ tags });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Server error fetching tags' });
  }
});

// GET /api/tags/search - Search tags for autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ tags: [] });
    }

    const [tags] = await pool.execute(`
      SELECT id, name, slug
      FROM Tags
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 10
    `, [`%${q}%`]);

    res.json({ tags });

  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({ message: 'Server error searching tags' });
  }
});

// GET /api/tags/:id - Get single tag
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [tags] = await pool.execute(`
      SELECT * FROM Tags WHERE id = ?
    `, [id]);

    if (tags.length === 0) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Get posts with this tag
    const [posts] = await pool.execute(`
      SELECT p.id, p.title, p.slug, p.status, p.created_at
      FROM Posts p
      JOIN Post_Tags pt ON p.id = pt.post_id
      WHERE pt.tag_id = ?
      ORDER BY p.created_at DESC
    `, [id]);

    const tag = { ...tags[0], posts };

    res.json({ tag });

  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ message: 'Server error fetching tag' });
  }
});

// POST /api/tags - Create new tag
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    // Check if tag already exists
    const [existing] = await pool.execute('SELECT id FROM Tags WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    // Generate unique slug
    let baseSlug = createSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const [existingSlug] = await pool.execute('SELECT id FROM Tags WHERE slug = ?', [slug]);
      if (existingSlug.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const [result] = await pool.execute(`
      INSERT INTO Tags (name, slug)
      VALUES (?, ?)
    `, [name, slug]);

    res.status(201).json({
      message: 'Tag created successfully',
      tagId: result.insertId,
      slug
    });

  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'Server error creating tag' });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    // Check if tag exists
    const [tags] = await pool.execute('SELECT * FROM Tags WHERE id = ?', [id]);
    if (tags.length === 0) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Check if name already exists on another tag
    const [existing] = await pool.execute('SELECT id FROM Tags WHERE name = ? AND id != ?', [name, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Tag name already exists' });
    }

    const currentTag = tags[0];

    // Update slug if name changed
    let slug = currentTag.slug;
    if (name !== currentTag.name) {
      let baseSlug = createSlug(name);
      slug = baseSlug;
      let counter = 1;

      while (true) {
        const [existingSlug] = await pool.execute('SELECT id FROM Tags WHERE slug = ? AND id != ?', [slug, id]);
        if (existingSlug.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    await pool.execute(`
      UPDATE Tags
      SET name = ?, slug = ?
      WHERE id = ?
    `, [name, slug, id]);

    res.json({
      message: 'Tag updated successfully',
      slug
    });

  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ message: 'Server error updating tag' });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tag has posts (optional - you might want to allow deletion and just remove associations)
    const [posts] = await pool.execute('SELECT COUNT(*) as count FROM Post_Tags WHERE tag_id = ?', [id]);

    if (posts[0].count > 0) {
      return res.status(400).json({
        message: 'Cannot delete tag that is assigned to posts. Remove tag from posts first.'
      });
    }

    const [result] = await pool.execute('DELETE FROM Tags WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });

  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ message: 'Server error deleting tag' });
  }
});

// POST /api/tags/bulk - Create multiple tags at once (useful for post editor)
router.post('/bulk', async (req, res) => {
  try {
    const { names } = req.body; // Array of tag names

    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ message: 'Tag names array is required' });
    }

    const createdTags = [];
    const existingTags = [];

    for (const name of names) {
      // Check if tag exists
      const [existing] = await pool.execute('SELECT id, name, slug FROM Tags WHERE name = ?', [name]);

      if (existing.length > 0) {
        existingTags.push(existing[0]);
      } else {
        // Create new tag
        let baseSlug = createSlug(name);
        let slug = baseSlug;
        let counter = 1;

        while (true) {
          const [existingSlug] = await pool.execute('SELECT id FROM Tags WHERE slug = ?', [slug]);
          if (existingSlug.length === 0) break;
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        const [result] = await pool.execute('INSERT INTO Tags (name, slug) VALUES (?, ?)', [name, slug]);
        createdTags.push({
          id: result.insertId,
          name,
          slug
        });
      }
    }

    res.json({
      message: 'Tags processed successfully',
      created: createdTags,
      existing: existingTags,
      all: [...createdTags, ...existingTags]
    });

  } catch (error) {
    console.error('Error creating bulk tags:', error);
    res.status(500).json({ message: 'Server error creating tags' });
  }
});

module.exports = router;