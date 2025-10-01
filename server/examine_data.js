// examine_data.js - Check current database content
const pool = require('./config/database');

(async () => {
  try {
    const [projects] = await pool.execute('SELECT id, title, description FROM projects');
    const [stories] = await pool.execute('SELECT id, title, project_id FROM stories');
    const [chapters] = await pool.execute('SELECT id, title, story_id, LENGTH(content) as content_length FROM chapters');

    console.log('\n=== CURRENT DATA ===');

    console.log('\nProjects:');
    projects.forEach(p => console.log(`- ${p.title}: ${p.description || 'No description'}`));

    console.log('\nStories:');
    stories.forEach(s => console.log(`- ${s.title} (Project ${s.project_id})`));

    console.log('\nChapters:');
    chapters.forEach(c => console.log(`- ${c.title} (Story ${c.story_id}) - ${c.content_length} chars`));

    // Get a sample of chapter content
    const [sampleChapter] = await pool.execute('SELECT title, content FROM chapters LIMIT 1');
    if (sampleChapter.length > 0) {
      console.log('\nSample Chapter Content:');
      console.log(`Title: ${sampleChapter[0].title}`);
      console.log(`Content preview: ${sampleChapter[0].content.substring(0, 200)}...`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();