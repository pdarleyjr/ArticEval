import { createResponse, handleCORS, generateToken } from '../../auth/utils.js';
import { authenticateUser } from '../../auth/middleware.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    if (request.method === 'GET') {
      // Check session validity and return session info
      return await handleGetSession(request, env);
    } else if (request.method === 'POST') {
      // Refresh/extend session
      return await handleRefreshSession(request, env);
    } else if (request.method === 'DELETE') {
      // Invalidate session
      return await handleDeleteSession(request, env);
    } else {
      return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('Session API error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

async function handleGetSession(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (!authResult.success) {
    return createResponse(false, authResult.message, null, 401);
  }
  
  const { user, sessionData } = authResult;
  
  // Return session information
  return createResponse(true, 'Session is valid', {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login
    },
    session: {
      created_at: sessionData.created_at,
      expires_at: sessionData.expires_at,
      remember_me: sessionData.remember_me,
      is_valid: true
    }
  });
}

async function handleRefreshSession(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (!authResult.success) {
    return createResponse(false, authResult.message, null, 401);
  }
  
  const { user, sessionData } = authResult;
  
  try {
    // Parse request body for session extension options
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Continue with default values if no valid JSON body
    }
    
    const extendDuration = body.extendDuration || (sessionData.remember_me ? 30 : 1); // days
    const newExpiresAt = Date.now() + (extendDuration * 24 * 60 * 60 * 1000);
    
    // Update session in KV store
    const sessionKey = `session:${user.id}`;
    const updatedSessionData = {
      ...sessionData,
      expires_at: newExpiresAt,
      refreshed_at: Date.now()
    };
    
    // Calculate TTL for KV store (in seconds)
    const ttl = Math.floor((newExpiresAt - Date.now()) / 1000);
    
    await env.SESSION_STORE.put(sessionKey, JSON.stringify(updatedSessionData), {
      expirationTtl: ttl
    });
    
    // Generate new JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(newExpiresAt / 1000) // JWT exp is in seconds
    };
    
    const token = await generateToken(tokenPayload, env.JWT_SECRET);
    
    // Create response
    const response = createResponse(true, 'Session refreshed successfully', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      session: {
        expires_at: newExpiresAt,
        refreshed_at: updatedSessionData.refreshed_at,
        remember_me: sessionData.remember_me
      }
    });
    
    // Set new auth cookie
    const cookieOptions = [
      `auth_token=${token}`,
      'Path=/',
      `Expires=${new Date(newExpiresAt).toUTCString()}`,
      'SameSite=Strict',
      'HttpOnly'
    ];
    
    // Add Secure flag in production
    if (request.url.includes('https://')) {
      cookieOptions.push('Secure');
    }
    
    response.headers.set('Set-Cookie', cookieOptions.join('; '));
    
    return response;
    
  } catch (error) {
    console.error('Session refresh error:', error);
    return createResponse(false, 'Failed to refresh session', null, 500);
  }
}

async function handleDeleteSession(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (!authResult.success) {
    return createResponse(false, authResult.message, null, 401);
  }
  
  const { user } = authResult;
  
  try {
    // Remove session from KV store
    const sessionKey = `session:${user.id}`;
    await env.SESSION_STORE.delete(sessionKey);
    
    return createResponse(true, 'Session invalidated successfully', {
      invalidated: true,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Session deletion error:', error);
    return createResponse(false, 'Failed to invalidate session', null, 500);
  }
}