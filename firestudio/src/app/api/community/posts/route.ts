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
      console.log('📂 No existing community file, creating empty array');
      return [];
    }
    console.error('❌ Error reading community posts:', error);
    throw error;
  }
}

// Write community posts to JSON file
async function writeCommunityPosts(posts: any[]) {
  try {
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
 * GET /api/community/posts
 * Returns all posts sorted by newest first
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Community posts API called');
    
    const posts = await readCommunityPosts();
    
    // Sort by timestamp, newest first
    const sortedPosts = posts.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Calculate stats
    const totalLikes = posts.reduce((sum: number, post: any) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum: number, post: any) => sum + post.comments.length, 0);
    const activeAuthors = [...new Set(posts.map((p: any) => p.author))].length;
    
    const response = {
      success: true,
      data: {
        posts: sortedPosts,
        stats: {
          totalPosts: posts.length,
          totalLikes,
          totalComments,
          activeAuthors,
          lastActivity: posts.length > 0 ? sortedPosts[0].timestamp : null
        },
        metadata: {
          requestTime: new Date().toISOString(),
          source: 'community_json_file'
        }
      }
    };
    
    console.log(`✅ Returning ${sortedPosts.length} community posts`);
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Community Posts API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch community posts',
      message: error?.message || 'Unknown error',
      data: {
        posts: [],
        stats: {
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          activeAuthors: 0,
          lastActivity: null
        }
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/community/posts
 * Creates a new post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { author, content } = body;
    
    // Validation
    if (!author || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Both author and content are required'
      }, { status: 400 });
    }
    
    if (author.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Invalid author name',
        message: 'Author name must be at least 2 characters'
      }, { status: 400 });
    }
    
    if (content.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Invalid content',
        message: 'Post content must be at least 3 characters'
      }, { status: 400 });
    }
    
    console.log(`📝 Creating new post by ${author}`);
    
    const posts = await readCommunityPosts();
    
    // Generate new ID
    const newId = posts.length > 0 ? Math.max(...posts.map((p: any) => p.id)) + 1 : 1;
    
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
    
    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: newPost
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Create Post API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create post',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
