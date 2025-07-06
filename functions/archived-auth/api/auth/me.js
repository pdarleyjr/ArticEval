import { createResponse, handleCORS } from '../../auth/utils.js';

export async function onRequest(context) {
  const { request } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  // Return message that authentication is disabled
  return createResponse(false, 'User authentication has been disabled. This system now operates in open-access mode.', null, 200);
}