import bcrypt from 'bcryptjs';

// Generate a secure random session ID
export async function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password using bcrypt
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password against hash
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate a secure user ID
export function generateUserId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create session cookie
export function createSessionCookie(sessionId, maxAge = 30 * 24 * 60 * 60) { // 30 days default
  return `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}

// Parse cookies from request headers
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Create authenticated user response (without sensitive data)
export function createUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at
  };
}

// Database helper: Create user
export async function createUser(env, userData) {
  const { username, email, password } = userData;
  
  // Validate input
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required');
  }
  
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  // Check if user already exists
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  ).bind(email, username).first();

  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Create new user
  const userId = generateUserId();
  const passwordHash = await hashPassword(password);
  
  const result = await env.DB.prepare(`
    INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(userId, username, email, passwordHash).run();

  if (!result.success) {
    throw new Error('Failed to create user');
  }

  return {
    id: userId,
    username,
    email,
    created_at: new Date().toISOString()
  };
}

// Database helper: Get user by email
export async function getUserByEmail(env, email) {
  return await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();
}

// Database helper: Get user by ID
export async function getUserById(env, userId) {
  return await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();
}

// Database helper: Create session
export async function createSession(env, userId) {
  const sessionId = await generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const result = await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).bind(sessionId, userId, expiresAt.toISOString()).run();

  if (!result.success) {
    throw new Error('Failed to create session');
  }

  return sessionId;
}

// Database helper: Get session with user
export async function getSessionWithUser(env, sessionId) {
  const result = await env.DB.prepare(`
    SELECT 
      s.id as session_id,
      s.user_id,
      s.expires_at,
      u.id,
      u.username,
      u.email,
      u.created_at as user_created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();

  if (!result) {
    return null;
  }

  return {
    session: {
      id: result.session_id,
      user_id: result.user_id,
      expires_at: result.expires_at
    },
    user: {
      id: result.id,
      username: result.username,
      email: result.email,
      created_at: result.user_created_at
    }
  };
}

// Database helper: Delete session
export async function deleteSession(env, sessionId) {
  return await env.DB.prepare(
    'DELETE FROM sessions WHERE id = ?'
  ).bind(sessionId).run();
}

// Database helper: Clean up expired sessions
export async function cleanupExpiredSessions(env) {
  return await env.DB.prepare(
    'DELETE FROM sessions WHERE expires_at <= datetime("now")'
  ).run();
}