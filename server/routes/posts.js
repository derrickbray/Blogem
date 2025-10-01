// server/routes/posts.js - Blog Post API endpoints
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to create URL-friendly slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// GET /api/posts/public - Get published posts for public blog
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const tag = req.query.tag;

    let whereClause = "WHERE p.status = 'published'";
    let joinClause = '';
    let queryParams = [];

    // Filter by category
    if (category) {
      joinClause += `
        JOIN Post_Categories pc ON p.id = pc.post_id
        JOIN Categories c ON pc.category_id = c.id
      `;
      whereClause += ' AND c.slug = ?';
      queryParams.push(category);
    }

    // Filter by tag
    if (tag) {
      joinClause += `
        JOIN Post_Tags pt ON p.id = pt.post_id
        JOIN Tags t ON pt.tag_id = t.id
      `;
      whereClause += ' AND t.slug = ?';
      queryParams.push(tag);
    }

    // Get posts with author info
    const [posts] = await pool.execute(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.featured_image,
        p.published_at, p.view_count,
        u.username as author_name, u.username as author_display_name
      FROM Posts p
      JOIN Users u ON p.author_id = u.id
      ${joinClause}
      ${whereClause}
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    // Get tags for each post
    for (const post of posts) {
      const [tags] = await pool.execute(`
        SELECT t.id, t.name, t.slug
        FROM Tags t
        JOIN Post_Tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      post.tags = tags;
    }

    // Get total count for pagination
    const [countResult] = await pool.execute(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM Posts p
      JOIN Users u ON p.author_id = u.id
      ${joinClause}
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching public posts:', error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
});

// GET /api/posts/public/:slug - Get single published post by slug
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get post with author and categories/tags
    const [posts] = await pool.execute(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.content, p.featured_image,
        p.published_at, p.view_count, p.meta_title, p.meta_description,
        u.username as author_name, u.username as author_display_name
      FROM Posts p
      JOIN Users u ON p.author_id = u.id
      WHERE p.slug = ? AND p.status = 'published'
    `, [slug]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[0];

    // Get categories for this post
    const [categories] = await pool.execute(`
      SELECT c.id, c.name, c.slug, c.color
      FROM Categories c
      JOIN Post_Categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `, [post.id]);

    // Get tags for this post
    const [tags] = await pool.execute(`
      SELECT t.id, t.name, t.slug
      FROM Tags t
      JOIN Post_Tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `, [post.id]);

    // Increment view count
    await pool.execute(`
      UPDATE Posts SET view_count = view_count + 1 WHERE id = ?
    `, [post.id]);

    post.categories = categories;
    post.tags = tags;

    res.json({ post });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error fetching post' });
  }
});

// ============================================
// AUTHENTICATED ROUTES (Admin/Author access)
// ============================================

// All routes below require authentication
router.use(authenticateToken);

// GET /api/posts - Get all posts for current user (admin view)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = req.query.status; // draft, published, archived

    let whereClause = 'WHERE p.author_id = ?';
    let queryParams = [userId];

    if (status) {
      whereClause += ' AND p.status = ?';
      queryParams.push(status);
    }

    const [posts] = await pool.execute(`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p.status,
        p.created_at, p.updated_at, p.published_at, p.view_count,
        u.username as author_name,
        COUNT(DISTINCT pc.category_id) as category_count,
        COUNT(DISTINCT pt.tag_id) as tag_count,
        (SELECT c.name FROM Categories c
         JOIN Post_Categories pc2 ON c.id = pc2.category_id
         WHERE pc2.post_id = p.id
         LIMIT 1) as category_name
      FROM Posts p
      JOIN Users u ON p.author_id = u.id
      LEFT JOIN Post_Categories pc ON p.id = pc.post_id
      LEFT JOIN Post_Tags pt ON p.id = pt.post_id
      ${whereClause}
      GROUP BY p.id, p.title, p.slug, p.excerpt, p.status, p.created_at, p.updated_at, p.published_at, p.view_count, u.username
      ORDER BY p.updated_at DESC
    `, queryParams);

    // Get tags for each post
    for (const post of posts) {
      const [tags] = await pool.execute(`
        SELECT t.id, t.name, t.slug
        FROM Tags t
        JOIN Post_Tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      post.tags = tags;
    }

    res.json({ posts });

  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
});

// GET /api/posts/:id - Get single post for editing
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [posts] = await pool.execute(`
      SELECT * FROM Posts WHERE id = ? AND author_id = ?
    `, [id, userId]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[0];

    // Get categories
    const [categories] = await pool.execute(`
      SELECT c.id, c.name, c.slug
      FROM Categories c
      JOIN Post_Categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `, [id]);

    // Get tags
    const [tags] = await pool.execute(`
      SELECT t.id, t.name, t.slug
      FROM Tags t
      JOIN Post_Tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `, [id]);

    post.categories = categories;
    post.tags = tags;

    res.json({ post });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error fetching post' });
  }
});

// POST /api/posts - Create new post
router.post('/', async (req, res) => {
  try {
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      status = 'draft',
      categoryIds = [],
      tagIds = [],
      meta_description,
      meta_keywords
    } = req.body;
    const userId = req.user.userId;


    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Generate unique slug - use custom slug if provided, otherwise generate from title
    let baseSlug = customSlug || createSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const [existing] = await pool.execute('SELECT id FROM Posts WHERE slug = ?', [slug]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Set published_at if status is published
    const publishedAt = status === 'published' ? new Date() : null;

    // Create post with all fields
    const [result] = await pool.execute(`
      INSERT INTO Posts (title, slug, content, excerpt, author_id, status, published_at, meta_description, meta_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, slug, content, excerpt || null, userId, status, publishedAt, meta_description || null, meta_keywords || null]);

    const postId = result.insertId;

    // Add categories
    if (categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await pool.execute(`INSERT INTO Post_Categories (post_id, category_id) VALUES (?, ?)`, [postId, categoryId]);
      }
    }

    // Add tags
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await pool.execute(`INSERT INTO Post_Tags (post_id, tag_id) VALUES (?, ?)`, [postId, tagId]);
      }
    }

    res.status(201).json({
      message: 'Post created successfully',
      postId,
      slug
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      status,
      categoryIds = [],
      tagIds = [],
      meta_description,
      meta_keywords
    } = req.body;
    const userId = req.user.userId;

    // Verify ownership
    const [posts] = await pool.execute('SELECT * FROM Posts WHERE id = ? AND author_id = ?', [id, userId]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const currentPost = posts[0];

    // Update slug if custom slug provided or title changed
    let slug = currentPost.slug;
    if (customSlug && customSlug !== currentPost.slug) {
      // Use custom slug
      let baseSlug = customSlug;
      slug = baseSlug;
      let counter = 1;

      while (true) {
        const [existing] = await pool.execute('SELECT id FROM Posts WHERE slug = ? AND id != ?', [slug, id]);
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    } else if (title && title !== currentPost.title) {
      // Generate from title if no custom slug
      let baseSlug = createSlug(title);
      slug = baseSlug;
      let counter = 1;

      while (true) {
        const [existing] = await pool.execute('SELECT id FROM Posts WHERE slug = ? AND id != ?', [slug, id]);
        if (existing.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Set published_at if changing to published
    let publishedAt = currentPost.published_at;
    if (status === 'published' && currentPost.status !== 'published') {
      publishedAt = new Date();
    }

    // Update post - handle undefined values by converting to null
    await pool.execute(`
      UPDATE Posts
      SET title = ?, slug = ?, content = ?, excerpt = ?, status = ?, published_at = ?, meta_description = ?, meta_keywords = ?
      WHERE id = ?
    `, [
      title || currentPost.title,
      slug,
      content || currentPost.content,
      excerpt === undefined ? currentPost.excerpt : excerpt,
      status || currentPost.status,
      publishedAt,
      meta_description === undefined ? currentPost.meta_description : meta_description,
      meta_keywords === undefined ? currentPost.meta_keywords : meta_keywords,
      id
    ]);

    // Update categories
    await pool.execute('DELETE FROM Post_Categories WHERE post_id = ?', [id]);
    if (categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await pool.execute(`INSERT INTO Post_Categories (post_id, category_id) VALUES (?, ?)`, [id, categoryId]);
      }
    }

    // Update tags
    await pool.execute('DELETE FROM Post_Tags WHERE post_id = ?', [id]);
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await pool.execute(`INSERT INTO Post_Tags (post_id, tag_id) VALUES (?, ?)`, [id, tagId]);
      }
    }

    res.json({
      message: 'Post updated successfully',
      slug
    });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error updating post' });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [result] = await pool.execute('DELETE FROM Posts WHERE id = ? AND author_id = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

module.exports = router;