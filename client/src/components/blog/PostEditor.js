// client/src/components/blog/PostEditor.js - Blog Post Editor Component
import React, { useState, useEffect } from 'react';
import { blogService } from '../../services/api/blogService';
import RichTextEditor from '../common/RichTextEditor';

const PostEditor = ({ post, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    tags: [],
    is_published: false,
    meta_description: '',
    meta_keywords: ''
  });
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSEO, setShowSEO] = useState(false);

  // Load categories and tags on component mount
  useEffect(() => {
    loadCategoriesAndTags();
  }, []);

  // Populate form data when post prop changes
  useEffect(() => {
    if (post) {
      // Convert server data format to form format
      const firstCategoryId = post.categories && post.categories.length > 0
        ? post.categories[0].id
        : '';

      const tagNames = post.tags && post.tags.length > 0
        ? post.tags.map(tag => tag.name)
        : [];

      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        category_id: firstCategoryId,
        tags: tagNames,
        is_published: post.status === 'published',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || ''
      });
    }
  }, [post]);

  const loadCategoriesAndTags = async () => {
    try {
      const categoriesResponse = await blogService.getCategories();
      setCategories(categoriesResponse.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Post title is required');
      setSaving(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('Post content is required');
      setSaving(false);
      return;
    }

    // Auto-generate slug if empty
    if (!formData.slug.trim()) {
      formData.slug = generateSlug(formData.title);
    }

    // Initialize apiData for error logging
    let apiData = {};

    try {
      // Process tags - create tags if they don't exist and get their IDs
      let tagIds = [];
      if (formData.tags.length > 0) {
        const tagPromises = formData.tags.map(async (tagName) => {
          try {
            // Try to create the tag (will fail if it already exists, which is fine)
            await blogService.createTag({ name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') });
          } catch (err) {
            // Tag might already exist, ignore error
          }
        });

        await Promise.all(tagPromises);

        // Get all tags to find IDs for our tag names
        const allTagsResponse = await blogService.getTags();
        const allTags = allTagsResponse.tags || [];

        tagIds = formData.tags.map(tagName => {
          const foundTag = allTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
          return foundTag ? foundTag.id : null;
        }).filter(id => id !== null);
      }

      // Transform data for API
      apiData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        status: formData.is_published ? 'published' : 'draft',
        categoryIds: formData.category_id ? [formData.category_id] : [],
        tagIds: tagIds,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords
      };

      let savedPost;
      if (post?.id) {
        savedPost = await blogService.updatePost(post.id, apiData);
      } else {
        savedPost = await blogService.createPost(apiData);
      }
      onSave(savedPost);
    } catch (err) {
      // More detailed error handling
      const errorMessage = err.response?.data?.message ||
                          err.message ||
                          'An unexpected error occurred while saving the post';
      setError(errorMessage);
      console.error('Save post error:', {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data,
        apiData
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title)
    });
  };

  const handleContentChange = (content) => {
    setFormData({ ...formData, content });
  };

  const handleTagAdd = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  return (
    <div className="post-editor-container">
      <form onSubmit={handleSubmit} className="post-editor">
        <h2>{post?.id ? 'edit post' : 'create new post'}</h2>

        {error && <div className="error">{error}</div>}

        {/* Basic Information */}
        <div className="form-group">
          <label htmlFor="title">post title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            required
            disabled={saving}
            placeholder="enter post title..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">url slug:</label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            disabled={saving}
            placeholder="url-friendly-slug (auto-generated if empty)"
          />
          <small>preview: /blog/{formData.slug || 'your-post-slug'}</small>
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">excerpt:</label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            rows="3"
            disabled={saving}
            placeholder="brief description for post previews..."
          />
        </div>

        {/* Category and Tags */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category_id">category:</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="">select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>tags:</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                disabled={saving}
                placeholder="add tags..."
              />
              <button
                type="button"
                onClick={handleTagAdd}
                disabled={saving || !tagInput.trim()}
                className="btn btn-small btn-secondary"
              >
                add
              </button>
            </div>
            <div className="tags-display">
              {formData.tags.map(tag => (
                <span key={tag} className="tag-badge">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    disabled={saving}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="form-group">
          <label>content:</label>
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder="write your blog post content here..."
            disabled={saving}
          />
        </div>

        {/* Publishing Options */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_published"
              checked={formData.is_published}
              onChange={handleChange}
              disabled={saving}
            />
            publish
          </label>
        </div>

        {/* SEO Section */}
        <div className="form-section">
          <div className="section-header">
            <h4>seo settings</h4>
            <button
              type="button"
              onClick={() => setShowSEO(!showSEO)}
              className="btn btn-info btn-small"
            >
              {showSEO ? 'hide seo' : 'show seo'}
            </button>
          </div>

          {showSEO && (
            <div className="seo-fields">
              <div className="form-group">
                <label htmlFor="meta_description">meta description:</label>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows="2"
                  disabled={saving}
                  placeholder="SEO description (150-160 characters recommended)"
                  maxLength="160"
                />
                <small>{formData.meta_description.length}/160 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="meta_keywords">meta keywords:</label>
                <input
                  type="text"
                  id="meta_keywords"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="SEO keywords (comma-separated)"
                />
              </div>
            </div>
          )}
        </div>


        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'saving...' : (post?.id ? 'update post' : 'create post')}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className="btn btn-secondary">
            cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostEditor;