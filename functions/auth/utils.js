/**
 * Hash a password using Web Crypto API (Cloudflare Workers compatible)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export the derived key
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  
  // Combine salt and hash
  const hashArray = new Uint8Array(salt.length + exportedKey.byteLength);
  hashArray.set(salt);
  hashArray.set(new Uint8Array(exportedKey), salt.length);
  
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, hashArray));
}

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Whether password is valid
 */
export async function verifyPassword(password, hash) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Decode the hash
    const hashArray = new Uint8Array(atob(hash).split('').map(char => char.charCodeAt(0)));
    
    // Extract salt (first 16 bytes)
    const salt = hashArray.slice(0, 16);
    const storedHash = hashArray.slice(16);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive key using same parameters
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export the derived key
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    const newHash = new Uint8Array(exportedKey);
    
    // Compare hashes
    if (storedHash.length !== newHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < storedHash.length; i++) {
      result |= storedHash[i] ^ newHash[i];
    }
    
    return result === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a JWT token for a user using Web Crypto API
 * @param {Object} user - User object
 * @param {string} jwtSecret - JWT secret key
 * @returns {Promise<string>} - JWT token
 */
export async function generateToken(user, jwtSecret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadBase64 = btoa(JSON.stringify(payload)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const message = `${headerBase64}.${payloadBase64}`;
  
  // Import secret key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[=]/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${message}.${signatureBase64}`;
}

/**
 * Verify and decode a JWT token using Web Crypto API
 * @param {string} token - JWT token
 * @param {string} jwtSecret - JWT secret key
 * @returns {Promise<Object|null>} - Decoded token payload or null if invalid
 */
export async function verifyToken(token, jwtSecret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerBase64, payloadBase64, signatureBase64] = parts;
    const message = `${headerBase64}.${payloadBase64}`;
    
    const encoder = new TextEncoder();
    
    // Import secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Decode signature
    const signature = new Uint8Array(
      atob(signatureBase64.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Verify signature
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));
    
    if (!isValid) return null;
    
    // Decode payload
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique session ID using Web Crypto API
 * @returns {string} - Session ID
 */
export function generateSessionId() {
  return crypto.randomUUID();
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