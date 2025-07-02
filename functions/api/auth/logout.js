import { createResponse, handleCORS } from '../../auth/utils.js';
import { authenticateUser } from '../../auth/middleware.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  if (request.method !== 'POST') {
    return createResponse(false, 'Method not allowed', null, 405);
  }
  
  try {
    // Get current user session (optional - logout should work even if session is invalid)
    const authResult = await authenticateUser(request, env);
    
    if (authResult.success && authResult.user) {
      // Remove session from KV store
      const sessionKey = `session:${authResult.user.id}`;
      try {
        await env.sessions.delete(sessionKey);
      } catch (error) {
        console.warn('Failed to delete session from KV:', error);
        // Continue with logout even if KV deletion fails
      }
    }
    
    // Create logout response
    const response = createResponse(true, 'Logged out successfully', { 
      loggedOut: true,
      timestamp: Date.now()
    });
    
    // Clear the auth cookie by setting it to expire immediately
    const clearCookieOptions = [
      'auth_token=',
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'SameSite=Strict',
      'HttpOnly'
    ];
    
    // Add Secure flag in production
    if (request.url.includes('https://')) {
      clearCookieOptions.push('Secure');
    }
    
    response.headers.set('Set-Cookie', clearCookieOptions.join('; '));
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should still try to clear the cookie
    const response = createResponse(true, 'Logged out successfully', { 
      loggedOut: true,
      timestamp: Date.now(),
      note: 'Session cleanup may have encountered issues'
    });
    
    // Clear the auth cookie
    const clearCookieOptions = [
      'auth_token=',
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'SameSite=Strict',
      'HttpOnly'
    ];
    
    if (request.url.includes('https://')) {
      clearCookieOptions.push('Secure');
    }
    
    response.headers.set('Set-Cookie', clearCookieOptions.join('; '));
    
    return response;
  }
}