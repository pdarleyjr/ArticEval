import { createUser, createSession, createSessionCookie, createUserResponse } from '../../auth/utils.js';

export async function onRequestPost({ request, env }) {
  try {
    // Parse request body
    const body = await request.json();
    const { username, email, password } = body;

    // Create new user
    const user = await createUser(env, { username, email, password });

    // Create session for the new user
    const sessionId = await createSession(env, user.id);

    // Create response with user data (without sensitive info)
    const responseData = {
      success: true,
      message: 'User registered successfully',
      user: createUserResponse(user)
    };

    // Create response with session cookie
    const response = new Response(JSON.stringify(responseData), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createSessionCookie(sessionId)
      }
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    
    // Return appropriate error response
    const errorResponse = {
      success: false,
      message: error.message || 'Registration failed'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle OPTIONS request for CORS
export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}