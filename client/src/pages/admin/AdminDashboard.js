// client/src/pages/admin/AdminDashboard.js - Admin Dashboard (moved from BlogDashboard)
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../context/AuthContext';
import { blogService } from '../../services/api/blogService';
import PostList from '../../components/blog/PostList';
import PostEditor from '../../components/blog/PostEditor';

const AdminDashboard = forwardRef((props, ref) => {
  const { user } = useAuth();

  // View state management
  const [currentView, setCurrentView] = useState('posts'); // 'posts' | 'editor' | 'view'
  const [selectedPost, setSelectedPost] = useState(null);

  // Blog management state
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [editingPost, setEditingPost] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    loadBlogData();
  }, []);

  // Expose reset function to parent components
  useImperativeHandle(ref, () => ({
    resetToPostsList: () => {
      setCurrentView('posts');
      setSelectedPost(null);
      setEditingPost(null);
    }
  }));

  const loadBlogData = async () => {
    try {
      setLoading(true);
      setError('');
      const [postsData, categoriesData, tagsData] = await Promise.all([
        blogService.getPosts(),
        blogService.getCategories(),
        blogService.getTags()
      ]);
      setPosts(postsData.posts || []);
      setCategories(categoriesData.categories || []);
      setTags(tagsData.tags || []);
    } catch (err) {
      setError('Failed to load blog data. Please try again.');
      console.error('Load blog data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Post CRUD functions
  const handleCreatePost = () => {
    setEditingPost(null);
    setCurrentView('editor');
  };

  const handleEditPost = async (post) => {
    try {
      // Fetch full post data for editing
      const fullPostData = await blogService.getPost(post.id);
      setEditingPost(fullPostData.post);
      setCurrentView('editor');
    } catch (err) {
      console.error('Failed to load post for editing:', err);
      setError('Failed to load post for editing. Please try again.');
    }
  };

  const handleViewPost = async (post) => {
    try {
      // Fetch full post data for viewing (including content)
      const fullPostData = await blogService.getPost(post.id);
      setSelectedPost(fullPostData.post);
      setCurrentView('view');
    } catch (err) {
      console.error('Failed to load post for viewing:', err);
      setError('Failed to load post for viewing. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await blogService.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post. Please try again.');
    }
  };

  const handlePublishToggle = async (post) => {
    try {
      let updatedPost;
      if (post.status === 'published') {
        updatedPost = await blogService.unpublishPost(post.id);
      } else {
        updatedPost = await blogService.publishPost(post.id);
      }

      // Update the post in our local state
      setPosts(posts.map(p => p.id === post.id ? { ...p, ...updatedPost } : p));
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      setError('Failed to update publish status. Please try again.');
    }
  };

  const handleEditorSave = (savedPost) => {
    // Update the local posts state with the saved post
    if (editingPost) {
      setPosts(posts.map(post =>
        post.id === editingPost.id ? savedPost : post
      ));
    } else {
      setPosts([savedPost, ...posts]);
    }

    setCurrentView('posts');
    setEditingPost(null);
  };

  const handleEditorCancel = () => {
    setCurrentView('posts');
    setEditingPost(null);
  };

  const handleBackToPosts = () => {
    setCurrentView('posts');
    setSelectedPost(null);
    setEditingPost(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading your blog admin...</div>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'editor') {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1
            onClick={handleBackToPosts}
            style={{ cursor: 'pointer' }}
            title="Return to posts list"
          >
            bray.report admin
          </h1>
          <p>content management system</p>
        </div>
        <PostEditor
          post={editingPost}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      </div>
    );
  }

  if (currentView === 'view' && selectedPost) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1
            onClick={handleBackToPosts}
            style={{ cursor: 'pointer' }}
            title="Return to posts list"
          >
            bray.report admin
          </h1>
          <div className="header-actions">
            <button
              onClick={handleBackToPosts}
              className="btn btn-secondary"
            >
              ← back to posts
            </button>
            <a
              href={`/blog/${selectedPost.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-info"
            >
              view public post
            </a>
          </div>
        </div>

        <div className="post-view">
          <div className="post-view-header">
            <div className="post-view-actions">
              <button
                onClick={() => handleEditPost(selectedPost)}
                className="btn btn-primary"
              >
                edit post
              </button>
              <button
                onClick={() => handlePublishToggle(selectedPost)}
                className={`btn ${selectedPost.status === 'published' ? 'btn-warning' : 'btn-success'}`}
              >
                {selectedPost.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>

          <article className="post-content">
            <header className="post-header">
              <h1>{selectedPost.title}</h1>
              <div className="post-meta">
                <span className={`status-badge ${selectedPost.status === 'published' ? 'published' : 'draft'}`}>
                  {selectedPost.status === 'published' ? 'Published' : 'Draft'}
                </span>
                {selectedPost.category_name && (
                  <span className="category-badge">{selectedPost.category_name}</span>
                )}
                <span className="post-date">
                  updated: {new Date(selectedPost.updated_at).toLocaleDateString()}
                </span>
              </div>
              {selectedPost.excerpt && (
                <p className="post-excerpt">{selectedPost.excerpt}</p>
              )}
            </header>

            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
            />

            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <footer className="post-footer">
                <div className="post-tags">
                  <strong>tags:</strong>
                  {selectedPost.tags.map(tag => (
                    <span key={tag.id || tag.name || tag} className="tag-badge">
                      {tag.name || tag}
                    </span>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>
      </div>
    );
  }

  // Default: Posts list view
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <h1
            onClick={handleBackToPosts}
            style={{ cursor: 'pointer' }}
            title="Return to posts list"
          >
            bray.report admin
          </h1>
          <p>welcome back, {user.username.toLowerCase()}! manage your blog posts</p>
        </div>

        <div className="admin-actions">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">all categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="tag-select"
            >
              <option value="all">all tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.name}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div className="action-buttons">
            <button
              onClick={handleCreatePost}
              className="btn btn-primary"
            >
              create new post
            </button>
            <button
              onClick={loadBlogData}
              className="btn btn-secondary"
            >
              refresh
            </button>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-info"
            >
              view public blog
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <PostList
        posts={posts}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onView={handleViewPost}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
      />
    </div>
  );
});

export default AdminDashboard;