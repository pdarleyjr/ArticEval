import { getSessionWithUser } from './utils.js';

/**
 * Middleware to authenticate requests
 * Returns user data if authenticated, null if not
 */
export async function authenticateRequest(request, env) {
  try {
    // Get session ID from cookie
    const cookieHeader = request.headers.get('Cookie');
    let sessionId = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      const sessionCookie = cookies.find(cookie => cookie.startsWith('session='));
      if (sessionCookie) {
        sessionId = sessionCookie.split('=')[1];
      }
    }

    if (!sessionId) {
      return null;
    }

    // Get session with user data
    const sessionData = await getSessionWithUser(env, sessionId);
    
    if (!sessionData) {
      return null;
    }

    return sessionData.user;
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns error response if not authenticated
 */
export async function requireAuth(request, env) {
  const user = await authenticateRequest(request, env);
  
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Authentication required'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return user;
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

/**
 * Handle OPTIONS request for CORS
 */
export function handleCors() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}