import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Whether password is valid
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @param {string} jwtSecret - JWT secret key
 * @returns {string} - JWT token
 */
export function generateToken(user, jwtSecret) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    jwtSecret
  );
}

// Alias for compatibility
export const generateJWT = generateToken;

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @param {string} jwtSecret - JWT secret key
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export function verifyToken(token, jwtSecret) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique session ID
 * @returns {string} - Session ID
 */
export function generateSessionId() {
  return uuidv4();
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Alias for compatibility
export const validateEmail = isValidEmail;

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create standardized API response
 * @param {boolean} success - Whether operation was successful
 * @param {string} message - Response message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Response} - Cloudflare Response object
 */
export function createResponse(success, message, data = null, statusCode = 200) {
  return new Response(
    JSON.stringify({
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}

/**
 * Handle CORS preflight requests
 * @returns {Response} - CORS response
 */
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}