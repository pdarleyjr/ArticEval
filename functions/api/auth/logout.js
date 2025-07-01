export async function onRequestPost({ request, env }) {
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

    // Delete session from database if it exists
    if (sessionId) {
      try {
        const stmt = env.DB.prepare('DELETE FROM sessions WHERE id = ?');
        await stmt.bind(sessionId).run();
      } catch (error) {
        console.error('Error deleting session:', error);
        // Continue with logout even if session deletion fails
      }
    }

    // Create response that clears the session cookie
    const response = new Response(JSON.stringify({
      success: true,
      message: 'Logout successful'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
      }
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear the cookie and return success
    return new Response(JSON.stringify({
      success: true,
      message: 'Logout successful'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
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