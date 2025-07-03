import { createResponse, handleCORS } from '../../auth/utils.js';
import { authenticateUser } from '../../auth/middleware.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  if (request.method !== 'GET') {
    return createResponse(false, 'Method not allowed', null, 405);
  }
  
  try {
    // Authenticate the user
    const authResult = await authenticateUser(request, env);
    
    if (!authResult.success) {
      return createResponse(false, authResult.message, null, 401);
    }
    
    const { user, sessionData } = authResult;
    
    // Return user information (excluding sensitive data)
    return createResponse(true, 'User information retrieved successfully', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login
      },
      session: {
        created_at: sessionData.created_at,
        expires_at: sessionData.expires_at,
        remember_me: sessionData.remember_me,
        is_authenticated: true
      },
      permissions: getPermissionsByRole(user.role)
    });
    
  } catch (error) {
    console.error('Get user info error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

/**
 * Get permissions based on user role
 * @param {string} role - User role (user, clinician, admin)
 * @returns {object} Permissions object
 */
function getPermissionsByRole(role) {
  const basePermissions = {
    canViewForms: true,
    canSubmitForms: true,
    canViewOwnSubmissions: true
  };
  
  const clinicianPermissions = {
    ...basePermissions,
    canCreateForms: true,
    canEditForms: true,
    canViewAllSubmissions: true,
    canDeleteSubmissions: true,
    canViewBasicAnalytics: true
  };
  
  const adminPermissions = {
    ...clinicianPermissions,
    canDeleteForms: true,
    canManageUsers: true,
    canViewAdvancedAnalytics: true,
    canAccessDashboard: true,
    canExportData: true,
    canManageSettings: true
  };
  
  switch (role) {
    case 'admin':
      return adminPermissions;
    case 'clinician':
      return clinicianPermissions;
    case 'user':
    default:
      return basePermissions;
  }
}