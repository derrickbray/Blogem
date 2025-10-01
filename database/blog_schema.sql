-- database/blog_schema.sql - Blog Platform Database Structure
-- Simplified from 3-level hierarchy (Projects/Stories/Chapters) to single Posts

CREATE DATABASE IF NOT EXISTS bray_report;
USE bray_report;

-- Users table - Keep existing structure (works perfectly for blog)
CREATE TABLE Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    display_name VARCHAR(100) NULL,  -- For public bylines
    bio TEXT NULL,                   -- Author bio
    avatar_url VARCHAR(500) NULL,    -- Profile picture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table - Replaces Projects/Stories/Chapters hierarchy
CREATE TABLE Posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,     -- URL-friendly version of title
    excerpt TEXT,                          -- Short summary for post previews
    content LONGTEXT,                      -- Full blog post content (HTML from rich editor)
    featured_image VARCHAR(500) NULL,      -- Main post image
    author_id INT NOT NULL,                -- Post author
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,           -- When post was published
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- SEO fields
    meta_title VARCHAR(60) NULL,           -- SEO title (max 60 chars)
    meta_description VARCHAR(160) NULL,    -- SEO description (max 160 chars)

    -- Stats
    view_count INT DEFAULT 0,              -- Track popularity

    FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_posts_status_published (status, published_at),
    INDEX idx_posts_author (author_id),
    INDEX idx_posts_slug (slug)
);

-- Categories table - Organize posts into topics
CREATE TABLE Categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,     -- URL-friendly
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',    -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table - Flexible labeling system
CREATE TABLE Tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,      -- URL-friendly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post_Categories - Many-to-many relationship (posts can have multiple categories)
CREATE TABLE Post_Categories (
    post_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
);

-- Post_Tags - Many-to-many relationship (posts can have multiple tags)
CREATE TABLE Post_Tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
);

-- Comments table - Simplified for blog posts only
CREATE TABLE Comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NULL,                      -- NULL for anonymous comments
    author_name VARCHAR(100) NULL,         -- For anonymous commenters
    author_email VARCHAR(100) NULL,        -- For anonymous commenters
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'spam', 'rejected') DEFAULT 'pending',
    parent_id INT NULL,                    -- For comment replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Comments(id) ON DELETE CASCADE,
    INDEX idx_comments_post (post_id),
    INDEX idx_comments_status (status)
);

-- Files table - Updated for blog context
CREATE TABLE Files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type ENUM('post', 'user') NOT NULL,  -- Simplified from projects/stories/chapters
    entity_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    alt_text VARCHAR(255) NULL,            -- For accessibility
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_files_entity (entity_type, entity_id)
);

-- Blog Settings table - Store site-wide blog configuration
CREATE TABLE Blog_Settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default blog settings
INSERT INTO Blog_Settings (setting_key, setting_value) VALUES
('site_title', 'My Blog'),
('site_description', 'A personal blog about writing and creativity'),
('posts_per_page', '10'),
('allow_comments', 'true'),
('comment_moderation', 'true');

-- Create performance indexes
CREATE INDEX idx_posts_published ON Posts(status, published_at DESC);
CREATE INDEX idx_posts_search ON Posts(title, excerpt, content);
CREATE FULLTEXT INDEX ft_posts_search ON Posts(title, excerpt, content);

-- Sample categories
INSERT INTO Categories (name, slug, description, color) VALUES
('Writing', 'writing', 'Posts about writing and creativity', '#8B5CF6'),
('Technology', 'technology', 'Tech-related posts', '#3B82F6'),
('Personal', 'personal', 'Personal thoughts and experiences', '#EF4444'),
('Tutorials', 'tutorials', 'How-to guides and tutorials', '#10B981');

-- Sample tags
INSERT INTO Tags (name, slug) VALUES
('javascript', 'javascript'),
('react', 'react'),
('writing-tips', 'writing-tips'),
('productivity', 'productivity'),
('web-development', 'web-development');