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

    // Return a user-friendly, standardized error response
    return createResponse(
        {
            error: true,
            message: `An internal server error occurred: ${errorMessage}`,
            details: 'Please try again later or contact support if the problem persists.'
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