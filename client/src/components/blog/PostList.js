// client/src/components/blog/PostList.js - Blog Post List Component
import React from 'react';

const PostList = ({
  posts,
  onEdit,
  onDelete,
  onView,
  searchTerm,
  selectedCategory,
  selectedTag
}) => {

  // Helper function to truncate text
  const truncateText = (text, maxLength = 400) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Filter posts by search term, category, and tag
  const filteredPosts = posts.filter(post => {
    const title = post.title || '';
    const excerpt = post.excerpt || '';
    const searchLower = (searchTerm || '').toLowerCase();

    const matchesSearch = title.toLowerCase().includes(searchLower) ||
      excerpt.toLowerCase().includes(searchLower);

    const matchesCategory = selectedCategory === 'all' || post.category_name === selectedCategory;

    // Check if post matches selected tag
    const matchesTag = selectedTag === 'all' ||
      (post.tags && post.tags.some(tag =>
        typeof tag === 'string' ? tag === selectedTag : tag.name === selectedTag
      ));

    return matchesSearch && matchesCategory && matchesTag;
  });

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <h3>no blog posts yet</h3>
        <p>create your first blog post to start sharing your thoughts with the world.</p>
      </div>
    );
  }

  return (
    <div className="post-list">
      {/* Results Count */}
      <div className="results-info">
        {filteredPosts.length === posts.length
          ? `${posts.length} post${posts.length !== 1 ? 's' : ''}`
          : `${filteredPosts.length} of ${posts.length} posts`
        }
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="no-results">
          <p>no posts match your search criteria.</p>
        </div>
      ) : (
        <div className="post-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card">
              {/* Post Status Badge */}
              <div className="post-status-top">
                {post.status === 'draft' && (
                  <span className="status-badge draft">
                    draft
                  </span>
                )}
                {post.status === 'published' && (
                  <span className="status-badge published">
                    published
                  </span>
                )}
              </div>

              <div className="post-card-header">
                <h3 className="post-title">{post.title}</h3>
              </div>

              {/* Post Actions */}
              <div className="post-actions">
                {/* View Button */}
                <button
                  onClick={() => onView(post)}
                  className="btn btn-primary btn-small"
                  title="view this post"
                >
                  view
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => onEdit(post)}
                  className="btn btn-secondary btn-small"
                >
                  edit
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onDelete(post.id)}
                  className="btn btn-danger btn-small"
                >
                  delete
                </button>
              </div>

              {/* Category Badge */}
              {post.category_name && (
                <div className="post-category">
                  <span className="category-badge">{post.category_name}</span>
                </div>
              )}

              {/* Post Excerpt */}
              {post.excerpt && (
                <p className="post-excerpt">{truncateText(post.excerpt, 400)}</p>
              )}

              {/* Post Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(tag => (
                    <span key={typeof tag === 'string' ? tag : tag.id} className="tag-badge">
                      {typeof tag === 'string' ? tag : tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Post Meta */}
              <div className="post-meta">
                <span className="post-author">by: {post.author_name}</span>
                <span className="post-date">
                  updated: {new Date(post.updated_at).toLocaleDateString()}
                </span>
                {post.status === 'published' && post.published_at && (
                  <span className="post-published">
                    published: {new Date(post.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;