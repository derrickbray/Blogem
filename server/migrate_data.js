// migrate_data.js - Convert existing Projects/Stories/Chapters to Blog Posts
const pool = require('./config/database');

// Helper function to create URL-friendly slug
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

(async () => {
  try {
    console.log('🔄 Starting data migration...\n');

    // Get all projects with their stories and chapters
    const [projects] = await pool.execute(`
      SELECT p.id, p.title, p.description, p.owner_id, p.created_at
      FROM projects p
    `);

    console.log(`Found ${projects.length} project(s) to migrate`);

    for (const project of projects) {
      console.log(`\n📋 Processing Project: "${project.title}"`);

      // Get all stories for this project
      const [stories] = await pool.execute(`
        SELECT s.id, s.title, s.description
        FROM stories s
        WHERE s.project_id = ?
        ORDER BY s.order_index, s.id
      `, [project.id]);

      console.log(`  Found ${stories.length} story(ies)`);

      // Collect all content
      let postContent = '';

      for (const story of stories) {
        console.log(`    Processing story: "${story.title}"`);

        // Add story as a section header
        postContent += `<h2>${story.title}</h2>\n`;

        if (story.description) {
          postContent += `<p><em>${story.description}</em></p>\n`;
        }

        // Get all chapters for this story
        const [chapters] = await pool.execute(`
          SELECT c.title, c.content
          FROM chapters c
          WHERE c.story_id = ?
          ORDER BY c.order_index, c.id
        `, [story.id]);

        console.log(`      Found ${chapters.length} chapter(s)`);

        for (const chapter of chapters) {
          console.log(`        Adding chapter: "${chapter.title}"`);

          // Add chapter as subsection
          postContent += `<h3>${chapter.title}</h3>\n`;
          postContent += `${chapter.content}\n\n`;
        }
      }

      // If no stories/chapters, use project description as content
      if (!postContent.trim()) {
        postContent = project.description ? `<p>${project.description}</p>` : '<p>This post is currently empty.</p>';
      }

      // Create excerpt from first 150 characters of plain text
      const excerptText = postContent.replace(/<[^>]*>/g, '').substring(0, 150);
      const excerpt = excerptText.length > 150 ? excerptText + '...' : excerptText;

      // Generate slug
      const slug = createSlug(project.title);

      // Insert new blog post
      const [result] = await pool.execute(`
        INSERT INTO Posts (
          title, slug, excerpt, content, author_id,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
      `, [
        project.title,
        slug,
        excerpt,
        postContent,
        project.owner_id,
        project.created_at,
        project.created_at
      ]);

      const newPostId = result.insertId;
      console.log(`  ✅ Created blog post with ID: ${newPostId}`);

      // Assign to a default category (Writing)
      const [writingCategory] = await pool.execute(`
        SELECT id FROM Categories WHERE slug = 'writing'
      `);

      if (writingCategory.length > 0) {
        await pool.execute(`
          INSERT INTO Post_Categories (post_id, category_id) VALUES (?, ?)
        `, [newPostId, writingCategory[0].id]);
        console.log(`  ✅ Assigned to "Writing" category`);
      }

      // Update Files table - change references from project/story/chapter to post
      const [fileUpdates] = await pool.execute(`
        UPDATE Files
        SET entity_type = 'post', entity_id = ?
        WHERE (entity_type = 'project' AND entity_id = ?)
           OR (entity_type = 'story' AND entity_id IN (SELECT id FROM stories WHERE project_id = ?))
           OR (entity_type = 'chapter' AND entity_id IN (
             SELECT c.id FROM chapters c
             JOIN stories s ON c.story_id = s.id
             WHERE s.project_id = ?
           ))
      `, [newPostId, project.id, project.id, project.id]);

      if (fileUpdates.affectedRows > 0) {
        console.log(`  ✅ Migrated ${fileUpdates.affectedRows} file(s) to new post`);
      }
    }

    // Show migration results
    console.log('\n📊 Migration Summary:');
    const [postCount] = await pool.execute('SELECT COUNT(*) as count FROM Posts');
    const [categoryCount] = await pool.execute('SELECT COUNT(*) as count FROM Categories');
    const [tagCount] = await pool.execute('SELECT COUNT(*) as count FROM Tags');

    console.log(`  Blog Posts: ${postCount[0].count}`);
    console.log(`  Categories: ${categoryCount[0].count}`);
    console.log(`  Tags: ${tagCount[0].count}`);

    // Show created posts
    const [posts] = await pool.execute(`
      SELECT id, title, slug, status, LENGTH(content) as content_length
      FROM Posts
    `);

    console.log('\n📝 Created Posts:');
    posts.forEach(post => {
      console.log(`  - "${post.title}" (${post.slug}) - ${post.content_length} chars [${post.status}]`);
    });

    console.log('\n🎉 Data migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the migrated posts');
    console.log('2. Update API endpoints for blog functionality');
    console.log('3. Update frontend components');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
})();