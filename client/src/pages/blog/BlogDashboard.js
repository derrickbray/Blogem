// client/src/pages/blog/BlogDashboard.js - Blog Management Dashboard
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { blogService } from '../../services/api/blogService';
import PostList from '../../components/blog/PostList';
import PostEditor from '../../components/blog/PostEditor';

const BlogDashboard = () => {
  const { user } = useAuth();

  // View state management
  const [currentView, setCurrentView] = useState('posts'); // 'posts' | 'editor' | 'view'
  const [selectedPost, setSelectedPost] = useState(null);

  // Blog management state
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingPost, setEditingPost] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    loadBlogData();
  }, []);

  const loadBlogData = async () => {
    try {
      setLoading(true);
      setError('');
      const [postsData, categoriesData] = await Promise.all([
        blogService.getPosts(),
        blogService.getCategories()
      ]);
      setPosts(postsData.posts || []);
      setCategories(categoriesData.categories || []);
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

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setCurrentView('view');
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
      if (post.is_published) {
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
      <div className="blog-dashboard">
        <div className="loading">Loading your blog...</div>
      </div>
    );
  }

  // Render based on current view
  if (currentView === 'editor') {
    return (
      <div className="blog-dashboard">
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
      <div className="blog-dashboard">
        <div className="post-view">
          <div className="post-view-header">
            <button
              onClick={handleBackToPosts}
              className="btn btn-secondary"
            >
              ← back to posts
            </button>
            <div className="post-view-actions">
              <button
                onClick={() => handleEditPost(selectedPost)}
                className="btn btn-primary"
              >
                edit post
              </button>
              <button
                onClick={() => handlePublishToggle(selectedPost)}
                className={`btn ${selectedPost.is_published ? 'btn-warning' : 'btn-success'}`}
              >
                {selectedPost.is_published ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>

          <article className="post-content">
            <header className="post-header">
              <h1>{selectedPost.title}</h1>
              <div className="post-meta">
                <span className={`status-badge ${selectedPost.is_published ? 'published' : 'draft'}`}>
                  {selectedPost.is_published ? 'Published' : 'Draft'}
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
                    <span key={tag} className="tag-badge">{tag}</span>
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
    <div className="blog-dashboard">
      <div className="dashboard-header">
        <h1>welcome back, {user.username.toLowerCase()}!</h1>
        <p>manage your blog posts</p>

        <div className="dashboard-actions">
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
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <PostList
        posts={posts}
        categories={categories}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onView={handleViewPost}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
    </div>
  );
};

export default BlogDashboard;