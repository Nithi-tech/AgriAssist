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
 * POST /api/community/comment/[id]
 * Adds a comment to a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    const body = await request.json();
    const { author, text } = body;
    
    // Validation
    if (isNaN(postId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid post ID',
        message: 'Post ID must be a valid number'
      }, { status: 400 });
    }
    
    if (!author || !text) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Both author and text are required'
      }, { status: 400 });
    }
    
    if (author.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Invalid author name',
        message: 'Author name must be at least 2 characters'
      }, { status: 400 });
    }
    
    if (text.trim().length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid comment text',
        message: 'Comment text cannot be empty'
      }, { status: 400 });
    }
    
    console.log(`💬 Adding comment to post ${postId} by ${author}`);
    
    const posts = await readCommunityPosts();
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Post not found',
        message: `Post with ID ${postId} does not exist`
      }, { status: 404 });
    }
    
    const newComment = {
      id: Date.now(), // Simple ID generation using timestamp
      author: author.trim(),
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    posts[postIndex].comments.push(newComment);
    await writeCommunityPosts(posts);
    
    console.log(`✅ Comment added to post ${postId} by ${author}`);
    
    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        post: posts[postIndex],
        comment: newComment
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Add Comment API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add comment',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
