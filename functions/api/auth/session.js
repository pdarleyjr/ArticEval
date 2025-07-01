import { getSessionWithUser, createUserResponse } from '../../auth/utils.js';

export async function onRequestGet({ request, env }) {
  try {
    // Get session ID from cookie
    const cookieHeader = request.headers.get('Cookie');
    let sessionId = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      const sessionCookie = cookies.find(cookie => cookie.startsWith('session_id='));
      if (sessionCookie) {
        sessionId = sessionCookie.split('=')[1];
      }
    }

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        authenticated: false,
        message: 'No session found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get session with user data
    const sessionData = await getSessionWithUser(env, sessionId);

    if (!sessionData) {
      return new Response(JSON.stringify({
        success: false,
        authenticated: false,
        message: 'Invalid or expired session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return user data (without sensitive info)
    return new Response(JSON.stringify({
      success: true,
      authenticated: true,
      user: createUserResponse(sessionData.user)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      authenticated: false,
      message: 'Session validation failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS request for CORS
export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}