// create_blog_tables.js - Create new blog database structure
const pool = require('./config/database');
const fs = require('fs');

(async () => {
  try {
    console.log('🚀 Creating new blog database structure...\n');

    // Create Posts table
    await pool.execute(`
      CREATE TABLE Posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        featured_image VARCHAR(500) NULL,
        author_id INT NOT NULL,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        meta_title VARCHAR(60) NULL,
        meta_description VARCHAR(160) NULL,
        view_count INT DEFAULT 0,
        FOREIGN KEY (author_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Posts table created');

    // Create Categories table
    await pool.execute(`
      CREATE TABLE Categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Categories table created');

    // Create Tags table
    await pool.execute(`
      CREATE TABLE Tags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) UNIQUE NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tags table created');

    // Create Post_Categories junction table
    await pool.execute(`
      CREATE TABLE Post_Categories (
        post_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Post_Categories table created');

    // Create Post_Tags junction table
    await pool.execute(`
      CREATE TABLE Post_Tags (
        post_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (post_id, tag_id),
        FOREIGN KEY (post_id) REFERENCES Posts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Post_Tags table created');

    // Create Blog_Settings table
    await pool.execute(`
      CREATE TABLE Blog_Settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Blog_Settings table created');

    // Add indexes for performance
    await pool.execute('CREATE INDEX idx_posts_status_published ON Posts(status, published_at DESC)');
    await pool.execute('CREATE INDEX idx_posts_author ON Posts(author_id)');
    await pool.execute('CREATE INDEX idx_posts_slug ON Posts(slug)');
    console.log('✅ Performance indexes created');

    // Insert default categories
    await pool.execute(`
      INSERT INTO Categories (name, slug, description, color) VALUES
      ('Writing', 'writing', 'Posts about writing and creativity', '#8B5CF6'),
      ('Technology', 'technology', 'Tech-related posts', '#3B82F6'),
      ('Personal', 'personal', 'Personal thoughts and experiences', '#EF4444'),
      ('Tutorials', 'tutorials', 'How-to guides and tutorials', '#10B981')
    `);
    console.log('✅ Default categories created');

    // Insert default tags
    await pool.execute(`
      INSERT INTO Tags (name, slug) VALUES
      ('javascript', 'javascript'),
      ('writing-tips', 'writing-tips'),
      ('productivity', 'productivity'),
      ('web-development', 'web-development'),
      ('react', 'react')
    `);
    console.log('✅ Default tags created');

    // Insert blog settings
    await pool.execute(`
      INSERT INTO Blog_Settings (setting_key, setting_value) VALUES
      ('site_title', 'My Blog'),
      ('site_description', 'A personal blog about writing and creativity'),
      ('posts_per_page', '10'),
      ('allow_comments', 'true'),
      ('comment_moderation', 'true')
    `);
    console.log('✅ Blog settings created');

    console.log('\n🎉 Blog database structure created successfully!');
    console.log('\nNext step: Run data migration to convert your existing content.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating blog structure:', error.message);
    process.exit(1);
  }
})();