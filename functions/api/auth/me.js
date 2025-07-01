import { requireAuth, handleCors, addCorsHeaders } from '../../auth/middleware.js';
import { createUserResponse } from '../../auth/utils.js';

export async function onRequestGet({ request, env }) {
  try {
    // Check authentication
    const user = await requireAuth(request, env);
    
    // If requireAuth returns a Response (error), return it
    if (user instanceof Response) {
      return addCorsHeaders(user);
    }

    // Return user profile data
    const response = new Response(JSON.stringify({
      success: true,
      user: createUserResponse(user)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Get user profile error:', error);
    
    const response = new Response(JSON.stringify({
      success: false,
      message: 'Failed to get user profile'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });

    return addCorsHeaders(response);
  }
}

// Handle OPTIONS request for CORS
export async function onRequestOptions({ request }) {
  return handleCors();
}