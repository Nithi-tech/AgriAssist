import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Community data utilities - inline to avoid import issues
const COMMUNITY_FILE_PATH = path.join(process.cwd(), 'backend', 'data', 'community.json');

// Read community posts from JSON file
async function readCommunityPosts() {
  try {
    const dataDir = path.dirname(COMMUNITY_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    const data = await fs.readFile(COMMUNITY_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Write community posts to JSON file
async function writeCommunityPosts(posts: any[]) {
  try {
    const dataDir = path.dirname(COMMUNITY_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(COMMUNITY_FILE_PATH, JSON.stringify(posts, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving community posts:', error);
    throw error;
  }
}

/**
 * POST /api/community/like/[id]
 * Likes a post by ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    
    if (isNaN(postId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid post ID',
        message: 'Post ID must be a valid number'
      }, { status: 400 });
    }
    
    console.log(`👍 Liking post ${postId}`);
    
    const posts = await readCommunityPosts();
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Post not found',
        message: `Post with ID ${postId} does not exist`
      }, { status: 404 });
    }
    
    posts[postIndex].likes += 1;
    await writeCommunityPosts(posts);
    
    console.log(`✅ Post ${postId} liked (total: ${posts[postIndex].likes})`);
    
    return NextResponse.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        post: posts[postIndex]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Like Post API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to like post',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
