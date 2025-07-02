import { hashPassword, generateToken, generateSessionId, createResponse, handleCORS, validateEmail, validatePassword } from '../../auth/utils.js';

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
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role = 'user',
      autoLogin = true 
    } = await request.json();
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return createResponse(false, 'Email, password, first name, and last name are required', null, 400);
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return createResponse(false, 'Invalid email format', null, 400);
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return createResponse(false, `Password validation failed: ${passwordValidation.errors.join(', ')}`, null, 400);
    }
    
    // Validate role
    const allowedRoles = ['user', 'clinician', 'admin'];
    if (!allowedRoles.includes(role)) {
      return createResponse(false, 'Invalid role specified', null, 400);
    }
    
    // Validate name fields
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return createResponse(false, 'First name and last name must be at least 2 characters long', null, 400);
    }
    
    const db = env.DB;
    
    // Check if user already exists
    const existingUser = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();
    
    if (existingUser) {
      return createResponse(false, 'An account with this email already exists', null, 409);
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user in database
    const now = new Date().toISOString();
    const insertResult = await db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      email.toLowerCase(),
      passwordHash,
      firstName.trim(),
      lastName.trim(),
      role,
      now,
      true
    ).run();
    
    if (!insertResult.success) {
      console.error('User creation failed:', insertResult);
      return createResponse(false, 'Failed to create user account', null, 500);
    }
    
    const userId = insertResult.meta.last_row_id;
    
    // Prepare user data for response
    const userData = {
      id: userId,
      email: email.toLowerCase(),
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim()
    };
    
    let responseData = {
      user: userData,
      message: 'Account created successfully'
    };
    
    // Auto-login if requested
    if (autoLogin) {
      // Generate JWT token
      const token = generateToken({
        id: userId,
        email: email.toLowerCase(),
        role
      }, env.JWT_SECRET);
      
      // Create session
      const sessionId = generateSessionId();
      const sessionExpires = Date.now() + 24 * 60 * 60 * 1000; // 1 day
      
      const sessionData = {
        id: sessionId,
        userId,
        email: email.toLowerCase(),
        role,
        createdAt: Date.now(),
        expires: sessionExpires,
        lastActivity: Date.now(),
        rememberMe: false
      };
      
      // Store session in KV
      const sessionKey = `session:${userId}`;
      await env.sessions.put(sessionKey, JSON.stringify(sessionData), {
        expirationTtl: Math.floor((sessionExpires - Date.now()) / 1000)
      });
      
      // Add login data to response
      responseData = {
        ...responseData,
        token,
        sessionId,
        expires: sessionExpires,
        message: 'Account created and logged in successfully'
      };
    }
    
    // Create response
    const response = createResponse(true, responseData.message, responseData, 201);
    
    // Set cookie if auto-login is enabled
    if (autoLogin && responseData.token) {
      const cookieExpires = new Date(responseData.expires).toUTCString();
      const cookieOptions = [
        `auth_token=${responseData.token}`,
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
    }
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return createResponse(false, 'Invalid JSON in request body', null, 400);
    }
    
    // Handle database constraint errors
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return createResponse(false, 'An account with this email already exists', null, 409);
    }
    
    return createResponse(false, 'Internal server error', null, 500);
  }
}