/**
 * API Utility Functions
 * These utility functions are used across all API endpoints for consistent response handling
 */

/**
 * Create a standardized JSON response with CORS headers
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response} Formatted response with CORS headers
 */
export function createResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}

/**
 * Handle CORS preflight requests
 * @returns {Response} Empty response with CORS headers
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