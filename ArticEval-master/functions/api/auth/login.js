import { verifyPassword, generateToken, generateSessionId, createResponse, handleCORS } from '../../auth/utils.js';

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
    const { email, password, rememberMe = false } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return createResponse(false, 'Email and password are required', null, 400);
    }
    
    // Get user from database
    const db = env.DB;
    const user = await db.prepare(
      'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();
    
    if (!user) {
      return createResponse(false, 'Invalid email or password', null, 401);
    }
    
    // Check if user is active
    if (!user.is_active) {
      return createResponse(false, 'Account is deactivated. Please contact administrator.', null, 401);
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return createResponse(false, 'Invalid email or password', null, 401);
    }
    
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    }, env.JWT_SECRET);
    
    // Create session
    const sessionId = generateSessionId();
    const sessionExpires = Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000; // 30 days or 1 day
    
    const sessionData = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
      expires: sessionExpires,
      lastActivity: Date.now(),
      rememberMe
    };
    
    // Store session in KV
    const sessionKey = `session:${user.id}`;
    await env.SESSIONS.put(sessionKey, JSON.stringify(sessionData), {
      expirationTtl: Math.floor((sessionExpires - Date.now()) / 1000)
    });
    
    // Update last login
    await db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run();
    
    // Prepare user data for response (exclude sensitive info)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };
    
    // Create response with cookie
    const response = createResponse(true, 'Login successful', {
      user: userData,
      token,
      sessionId,
      expires: sessionExpires
    });
    
    // Set HTTP-only cookie for browser sessions
    const cookieExpires = new Date(sessionExpires).toUTCString();
    const cookieOptions = [
      `auth_token=${token}`,
      `Path=/`,
      `Expires=${cookieExpires}`,
      `SameSite=Strict`,
      `HttpOnly`
    ];
    
    // Add Secure flag in production
    if (request.url.includes('https://')) {
      cookieOptions.push('Secure');
    }
    
    response.headers.set('Set-Cookie', cookieOptions.join('; '));
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return createResponse(false, 'Invalid JSON in request body', null, 400);
    }
    
    return createResponse(false, 'Internal server error', null, 500);
  }
}