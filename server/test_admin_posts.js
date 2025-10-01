// server/test_admin_posts.js - Test authenticated posts endpoint
const axios = require('axios');

async function testAdminPosts() {
  console.log('🔍 Testing Admin Posts API....\n');

  try {
    // Step 1: Login to get token
    console.log('1. Logging in to get token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'derrickbray82@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('   ✅ Login successful, token received\n');

    // Step 2: Call admin posts endpoint with token
    console.log('2. Fetching posts with authentication...');
    const postsResponse = await axios.get('http://localhost:5000/api/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const posts = postsResponse.data.posts;
    console.log(`   ✅ Received ${posts.length} posts\n`);

    // Step 3: Check author_name field
    console.log('3. Checking author_name data in response:');
    posts.forEach(post => {
      const authorName = post.author_name || 'MISSING';
      console.log(`   - Post ${post.id}: "${post.title}" → author_name: "${authorName}"`);
    });

    console.log('\n📊 SUMMARY:');
    const missingAuthors = posts.filter(post => !post.author_name);
    console.log(`   - Total posts: ${posts.length}`);
    console.log(`   - Posts with author_name: ${posts.length - missingAuthors.length}`);
    console.log(`   - Posts missing author_name: ${missingAuthors.length}`);

    if (missingAuthors.length === 0) {
      console.log('   ✅ All posts have author_name data!');
    } else {
      console.log('   ❌ Some posts are missing author_name data');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminPosts();