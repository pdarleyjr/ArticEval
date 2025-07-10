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
 * Create a standardized JSON error response
 * @param {Error|string} error - The error object or a string message
 * @param {number} [status=500] - The HTTP status code
 * @returns {Response} A formatted JSON error response
 */
export function handleError(error, status = 500) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    // Log the full error for server-side debugging
    console.error(`API Error (Status: ${status}): ${errorMessage}`, {
        stack: errorStack,
        timestamp: new Date().toISOString()
    });

    // Determine user-friendly message based on status code
    let userMessage = 'An error occurred. Please try again later.';
    
    if (status === 400) {
        userMessage = 'Invalid request. Please check your input and try again.';
    } else if (status === 401) {
        userMessage = 'Authentication required. Please log in and try again.';
    } else if (status === 403) {
        userMessage = 'You do not have permission to access this resource.';
    } else if (status === 404) {
        userMessage = 'The requested resource was not found.';
    } else if (status === 409) {
        userMessage = 'The request could not be completed due to a conflict.';
    } else if (status === 503) {
        userMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (status >= 500) {
        userMessage = 'Server error. Please try again later.';
    }

    // Return a user-friendly, standardized error response
    // Do not expose internal error messages or stack traces
    return createResponse(
        {
            error: true,
            message: userMessage
        },
        status
    );
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