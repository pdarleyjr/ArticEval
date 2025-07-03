import { verifyToken, createResponse } from './utils.js';

/**
 * Authentication middleware for Cloudflare Functions
 * Verifies JWT tokens and user sessions
 */
export async function authenticateUser(request, env) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get token from cookies
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.auth_token;
      }
    }
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        statusCode: 401
      };
    }
    
    // Verify JWT token
    const decoded = await verifyToken(token, env.JWT_SECRET);
    if (!decoded) {
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401
      };
    }
    
    // Check if session exists in KV store
    const sessionKey = `session:${decoded.id}`;
    const sessionData = await env.SESSION_STORE.get(sessionKey);
    
    if (!sessionData) {
      return {
        success: false,
        error: 'Session not found or expired',
        statusCode: 401
      };
    }
    
    const session = JSON.parse(sessionData);
    
    // Verify session is still valid
    if (session.expires < Date.now()) {
      // Clean up expired session
      await env.SESSION_STORE.delete(sessionKey);
      return {
        success: false,
        error: 'Session expired',
        statusCode: 401
      };
    }
    
    // Get user data from database
    const db = env.DB;
    const user = await db.prepare('SELECT id, email, role, first_name, last_name, created_at FROM users WHERE id = ?')
      .bind(decoded.id)
      .first();
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      },
      session: {
        id: session.id,
        expires: session.expires
      }
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500
    };
  }
}

/**
 * Middleware to require authentication for a route
 * Returns authenticated user or error response
 */
export async function requireAuth(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (!authResult.success) {
    return createResponse(
      false,
      authResult.error,
      null,
      authResult.statusCode
    );
  }
  
  return authResult;
}

/**
 * Middleware to require admin role
 * Returns authenticated admin user or error response
 */
export async function requireAdmin(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (!authResult.success) {
    return createResponse(
      false,
      authResult.error,
      null,
      authResult.statusCode
    );
  }
  
  if (authResult.user.role !== 'admin') {
    return createResponse(
      false,
      'Admin access required',
      null,
      403
    );
  }
  
  return authResult;
}

/**
 * Middleware to require clinician role or higher
 * Returns authenticated clinician/admin user or error response
 */
export async function requireClinician(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (!authResult.success) {
    return createResponse(
      false,
      authResult.error,
      null,
      authResult.statusCode
    );
  }
  
  if (!['clinician', 'admin'].includes(authResult.user.role)) {
    return createResponse(
      false,
      'Clinician access required',
      null,
      403
    );
  }
  
  return authResult;
}

/**
 * Optional authentication middleware
 * Returns user if authenticated, or continues without error if not
 */
export async function optionalAuth(request, env) {
  const authResult = await authenticateUser(request, env);
  
  if (authResult.success) {
    return authResult;
  }
  
  return {
    success: true,
    user: null,
    session: null
  };
}

/**
 * Refresh user session expiration
 */
export async function refreshSession(userId, sessionId, env) {
  try {
    const sessionKey = `session:${userId}`;
    const sessionData = await env.SESSION_STORE.get(sessionKey);
    
    if (!sessionData) {
      return false;
    }
    
    const session = JSON.parse(sessionData);
    
    // Extend session by 24 hours
    session.expires = Date.now() + (24 * 60 * 60 * 1000);
    session.lastActivity = Date.now();
    
    await env.SESSION_STORE.put(sessionKey, JSON.stringify(session), {
      expirationTtl: 24 * 60 * 60 // 24 hours
    });
    
    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}