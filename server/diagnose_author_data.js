// server/diagnose_author_data.js - Diagnostic script for author data issues
const pool = require('./config/database');

async function diagnoseAuthorData() {
  console.log('🔍 Diagnosing Author Data Issues...\n');

  try {
    // 1. Check for posts with NULL author_id
    console.log('1. Checking for posts with NULL author_id:');
    const [nullAuthors] = await pool.execute(`
      SELECT COUNT(*) as count FROM Posts WHERE author_id IS NULL
    `);
    console.log(`   Posts with NULL author_id: ${nullAuthors[0].count}\n`);

    // 2. Check for posts with invalid author_id (not in Users table)
    console.log('2. Checking for posts with invalid author_id:');
    const [orphanedPosts] = await pool.execute(`
      SELECT p.id, p.title, p.author_id
      FROM Posts p
      LEFT JOIN Users u ON p.author_id = u.id
      WHERE p.author_id IS NOT NULL AND u.id IS NULL
    `);
    console.log(`   Posts with invalid author_id: ${orphanedPosts.length}`);
    if (orphanedPosts.length > 0) {
      console.log('   Orphaned posts:');
      orphanedPosts.forEach(post => {
        console.log(`     - Post ${post.id}: "${post.title}" (author_id: ${post.author_id})`);
      });
    }
    console.log('');

    // 3. Check what users exist
    console.log('3. Available users in database:');
    const [users] = await pool.execute(`
      SELECT id, username, email FROM Users ORDER BY id
    `);
    console.log(`   Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`     - User ${user.id}: ${user.username} (${user.email})`);
    });
    console.log('');

    // 4. Check sample of posts with their author data
    console.log('4. Sample of posts with author data:');
    const [samplePosts] = await pool.execute(`
      SELECT p.id, p.title, p.author_id, u.username
      FROM Posts p
      LEFT JOIN Users u ON p.author_id = u.id
      ORDER BY p.id
      LIMIT 10
    `);
    console.log(`   Sample posts (showing first 10):`);
    samplePosts.forEach(post => {
      const authorInfo = post.username ? `"${post.username}"` : '❌ NO AUTHOR';
      console.log(`     - Post ${post.id}: "${post.title}" → ${authorInfo}`);
    });
    console.log('');

    // 5. Check posts that would fail the JOIN (these cause empty author_name)
    console.log('5. Posts that will show empty author_name:');
    const [problematicPosts] = await pool.execute(`
      SELECT p.id, p.title, p.author_id
      FROM Posts p
      LEFT JOIN Users u ON p.author_id = u.id
      WHERE u.username IS NULL
    `);
    console.log(`   Posts causing empty author_name: ${problematicPosts.length}`);
    if (problematicPosts.length > 0) {
      console.log('   These posts need fixing:');
      problematicPosts.forEach(post => {
        const authorId = post.author_id === null ? 'NULL' : post.author_id;
        console.log(`     - Post ${post.id}: "${post.title}" (author_id: ${authorId})`);
      });
    }
    console.log('');

    // 6. Summary and recommendations
    const totalProblematic = nullAuthors[0].count + orphanedPosts.length;
    console.log('📊 SUMMARY:');
    console.log(`   - Total problematic posts: ${totalProblematic}`);
    console.log(`   - Posts with NULL author_id: ${nullAuthors[0].count}`);
    console.log(`   - Posts with invalid author_id: ${orphanedPosts.length}`);
    console.log(`   - Available users to assign: ${users.length}\n`);

    if (totalProblematic > 0) {
      console.log('🔧 RECOMMENDED FIXES:');
      if (users.length > 0) {
        console.log(`   - Assign orphaned posts to User ${users[0].id} (${users[0].username})`);
        console.log('   - Run the fix script: node fix_author_data.js');
      } else {
        console.log('   - ⚠️  No users found! Create a user first.');
      }
    } else {
      console.log('✅ No author data issues found!');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    process.exit(0);
  }
}

// Run the diagnosis
diagnoseAuthorData();