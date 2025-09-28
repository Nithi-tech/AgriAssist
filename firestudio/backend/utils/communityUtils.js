const fs = require('fs').promises;
const path = require('path');

const COMMUNITY_FILE_PATH = path.join(process.cwd(), 'backend', 'data', 'community.json');

/**
 * Read community posts from JSON file
 * @returns {Promise<Array>} Array of posts
 */
async function readCommunityPosts() {
  try {
    // Ensure directory exists
    const dataDir = path.dirname(COMMUNITY_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    const data = await fs.readFile(COMMUNITY_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📂 No existing community file, creating empty array');
      return [];
    }
    console.error('❌ Error reading community posts:', error);
    throw error;
  }
}

/**
 * Write community posts to JSON file
 * @param {Array} posts - Array of posts to save
 * @returns {Promise<boolean>} Success status
 */
async function writeCommunityPosts(posts) {
  try {
    // Ensure directory exists
    const dataDir = path.dirname(COMMUNITY_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(COMMUNITY_FILE_PATH, JSON.stringify(posts, null, 2));
    console.log(`💾 Community posts saved to ${COMMUNITY_FILE_PATH}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving community posts:', error);
    throw error;
  }
}

/**
 * Get all posts sorted by newest first
 * @returns {Promise<Array>} Sorted posts array
 */
async function getAllPosts() {
  try {
    const posts = await readCommunityPosts();
    // Sort by timestamp, newest first
    return posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('❌ Error getting all posts:', error);
    return [];
  }
}

/**
 * Add a new post
 * @param {string} author - Author name
 * @param {string} content - Post content
 * @returns {Promise<Object>} Created post object
 */
async function addNewPost(author, content) {
  try {
    const posts = await readCommunityPosts();
    
    // Generate new ID
    const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
    
    const newPost = {
      id: newId,
      author: author.trim(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    posts.push(newPost);
    await writeCommunityPosts(posts);
    
    console.log(`✅ New post created by ${author} (ID: ${newId})`);
    return newPost;
  } catch (error) {
    console.error('❌ Error adding new post:', error);
    throw error;
  }
}

/**
 * Like a post by ID
 * @param {number} postId - Post ID to like
 * @returns {Promise<Object|null>} Updated post or null if not found
 */
async function likePost(postId) {
  try {
    const posts = await readCommunityPosts();
    const postIndex = posts.findIndex(p => p.id === parseInt(postId));
    
    if (postIndex === -1) {
      console.log(`❌ Post with ID ${postId} not found`);
      return null;
    }
    
    posts[postIndex].likes += 1;
    await writeCommunityPosts(posts);
    
    console.log(`👍 Post ${postId} liked (total: ${posts[postIndex].likes})`);
    return posts[postIndex];
  } catch (error) {
    console.error('❌ Error liking post:', error);
    throw error;
  }
}

/**
 * Add a comment to a post
 * @param {number} postId - Post ID to comment on
 * @param {string} author - Comment author
 * @param {string} text - Comment text
 * @returns {Promise<Object|null>} Updated post or null if not found
 */
async function addComment(postId, author, text) {
  try {
    const posts = await readCommunityPosts();
    const postIndex = posts.findIndex(p => p.id === parseInt(postId));
    
    if (postIndex === -1) {
      console.log(`❌ Post with ID ${postId} not found`);
      return null;
    }
    
    const newComment = {
      id: Date.now(), // Simple ID generation
      author: author.trim(),
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    posts[postIndex].comments.push(newComment);
    await writeCommunityPosts(posts);
    
    console.log(`💬 Comment added to post ${postId} by ${author}`);
    return posts[postIndex];
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    throw error;
  }
}

/**
 * Get post statistics
 * @returns {Promise<Object>} Community statistics
 */
async function getCommunityStats() {
  try {
    const posts = await readCommunityPosts();
    
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    const activeAuthors = [...new Set(posts.map(p => p.author))].length;
    
    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      activeAuthors,
      lastActivity: posts.length > 0 ? posts[0].timestamp : null
    };
  } catch (error) {
    console.error('❌ Error getting community stats:', error);
    return {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      activeAuthors: 0,
      lastActivity: null
    };
  }
}

module.exports = {
  readCommunityPosts,
  writeCommunityPosts,
  getAllPosts,
  addNewPost,
  likePost,
  addComment,
  getCommunityStats
};
