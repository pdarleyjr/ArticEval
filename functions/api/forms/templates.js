import { createResponse, handleCORS } from '../../auth/utils.js';
import { authenticateUser, requireRole } from '../../auth/middleware.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    // Authenticate user for all operations
    const authResult = await authenticateUser(request, env);
    if (!authResult.success) {
      return createResponse(false, authResult.message, null, 401);
    }
    
    const { user } = authResult;
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    switch (request.method) {
      case 'GET':
        return await handleGetTemplates(env, templateId, user);
      case 'POST':
        return await handleCreateTemplate(request, env, user);
      case 'PUT':
        return await handleUpdateTemplate(request, env, user, templateId);
      case 'DELETE':
        return await handleDeleteTemplate(env, user, templateId);
      default:
        return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('Templates API error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

/**
 * Handle GET requests - list templates or get specific template
 */
async function handleGetTemplates(env, templateId, user) {
  try {
    if (templateId) {
      // Get specific template
      const template = await env.DB.prepare(`
        SELECT ft.*, u.name as creator_name 
        FROM form_templates ft
        LEFT JOIN users u ON ft.created_by = u.id
        WHERE ft.id = ? AND ft.is_active = 1
      `).bind(templateId).first();
      
      if (!template) {
        return createResponse(false, 'Template not found', null, 404);
      }
      
      // Parse JSON config
      if (template.config) {
        template.config = JSON.parse(template.config);
      }
      
      return createResponse(true, 'Template retrieved successfully', { template });
    } else {
      // List all active templates
      const templates = await env.DB.prepare(`
        SELECT ft.id, ft.name, ft.description, ft.created_by, ft.created_at, ft.updated_at,
               u.name as creator_name,
               COUNT(fs.id) as submission_count
        FROM form_templates ft
        LEFT JOIN users u ON ft.created_by = u.id
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id
        WHERE ft.is_active = 1
        GROUP BY ft.id, ft.name, ft.description, ft.created_by, ft.created_at, ft.updated_at, u.name
        ORDER BY ft.updated_at DESC
      `).all();
      
      return createResponse(true, 'Templates retrieved successfully', { 
        templates: templates.results || [] 
      });
    }
  } catch (error) {
    console.error('Get templates error:', error);
    return createResponse(false, 'Failed to retrieve templates', null, 500);
  }
}

/**
 * Handle POST requests - create new template
 */
async function handleCreateTemplate(request, env, user) {
  // Check permissions - only clinicians and admins can create templates
  if (!['clinician', 'admin'].includes(user.role)) {
    return createResponse(false, 'Insufficient permissions to create templates', null, 403);
  }
  
  try {
    const data = await request.json();
    const { name, description, config } = data;
    
    // Validate required fields
    if (!name || !config) {
      return createResponse(false, 'Name and config are required', null, 400);
    }
    
    // Validate config structure
    if (!isValidTemplateConfig(config)) {
      return createResponse(false, 'Invalid template configuration', null, 400);
    }
    
    const now = new Date().toISOString();
    
    // Insert new template
    const result = await env.DB.prepare(`
      INSERT INTO form_templates (name, description, config, created_by, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      name,
      description || null,
      JSON.stringify(config),
      user.id,
      now,
      now
    ).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to create template', null, 500);
    }
    
    // Get the created template
    const template = await env.DB.prepare(`
      SELECT ft.*, u.name as creator_name 
      FROM form_templates ft
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE ft.id = ?
    `).bind(result.meta.last_row_id).first();
    
    if (template.config) {
      template.config = JSON.parse(template.config);
    }
    
    return createResponse(true, 'Template created successfully', { template }, 201);
  } catch (error) {
    console.error('Create template error:', error);
    return createResponse(false, 'Failed to create template', null, 500);
  }
}

/**
 * Handle PUT requests - update existing template
 */
async function handleUpdateTemplate(request, env, user, templateId) {
  if (!templateId) {
    return createResponse(false, 'Template ID is required', null, 400);
  }
  
  // Check permissions - only clinicians and admins can edit templates
  if (!['clinician', 'admin'].includes(user.role)) {
    return createResponse(false, 'Insufficient permissions to edit templates', null, 403);
  }
  
  try {
    // Check if template exists and user has permission to edit
    const existingTemplate = await env.DB.prepare(`
      SELECT * FROM form_templates WHERE id = ? AND is_active = 1
    `).bind(templateId).first();
    
    if (!existingTemplate) {
      return createResponse(false, 'Template not found', null, 404);
    }
    
    // Check if user can edit this template (creator or admin)
    if (existingTemplate.created_by !== user.id && user.role !== 'admin') {
      return createResponse(false, 'Insufficient permissions to edit this template', null, 403);
    }
    
    const data = await request.json();
    const { name, description, config } = data;
    
    // Validate config if provided
    if (config && !isValidTemplateConfig(config)) {
      return createResponse(false, 'Invalid template configuration', null, 400);
    }
    
    const now = new Date().toISOString();
    
    // Update template
    const result = await env.DB.prepare(`
      UPDATE form_templates 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          config = COALESCE(?, config),
          updated_at = ?
      WHERE id = ?
    `).bind(
      name || null,
      description !== undefined ? description : null,
      config ? JSON.stringify(config) : null,
      now,
      templateId
    ).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to update template', null, 500);
    }
    
    // Get the updated template
    const template = await env.DB.prepare(`
      SELECT ft.*, u.name as creator_name 
      FROM form_templates ft
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE ft.id = ?
    `).bind(templateId).first();
    
    if (template.config) {
      template.config = JSON.parse(template.config);
    }
    
    return createResponse(true, 'Template updated successfully', { template });
  } catch (error) {
    console.error('Update template error:', error);
    return createResponse(false, 'Failed to update template', null, 500);
  }
}

/**
 * Handle DELETE requests - soft delete template
 */
async function handleDeleteTemplate(env, user, templateId) {
  if (!templateId) {
    return createResponse(false, 'Template ID is required', null, 400);
  }
  
  // Check permissions - only admins can delete templates
  if (user.role !== 'admin') {
    return createResponse(false, 'Insufficient permissions to delete templates', null, 403);
  }
  
  try {
    // Check if template exists
    const existingTemplate = await env.DB.prepare(`
      SELECT * FROM form_templates WHERE id = ? AND is_active = 1
    `).bind(templateId).first();
    
    if (!existingTemplate) {
      return createResponse(false, 'Template not found', null, 404);
    }
    
    // Check if template has submissions
    const submissionCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM form_submissions WHERE template_id = ?
    `).bind(templateId).first();
    
    if (submissionCount.count > 0) {
      // Soft delete to preserve data integrity
      const result = await env.DB.prepare(`
        UPDATE form_templates SET is_active = 0, updated_at = ? WHERE id = ?
      `).bind(new Date().toISOString(), templateId).run();
      
      if (!result.success) {
        return createResponse(false, 'Failed to delete template', null, 500);
      }
      
      return createResponse(true, 'Template deactivated successfully (submissions preserved)', null);
    } else {
      // Hard delete if no submissions exist
      const result = await env.DB.prepare(`
        DELETE FROM form_templates WHERE id = ?
      `).bind(templateId).run();
      
      if (!result.success) {
        return createResponse(false, 'Failed to delete template', null, 500);
      }
      
      return createResponse(true, 'Template deleted successfully', null);
    }
  } catch (error) {
    console.error('Delete template error:', error);
    return createResponse(false, 'Failed to delete template', null, 500);
  }
}

/**
 * Validate template configuration structure
 * @param {object} config - Template configuration
 * @returns {boolean} True if valid
 */
function isValidTemplateConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Check required properties
  if (!config.sections || !Array.isArray(config.sections)) {
    return false;
  }
  
  // Validate each section
  for (const section of config.sections) {
    if (!section.id || !section.title || !section.fields || !Array.isArray(section.fields)) {
      return false;
    }
    
    // Validate each field
    for (const field of section.fields) {
      if (!field.id || !field.type || !field.label) {
        return false;
      }
      
      // Check valid field types
      const validTypes = [
        'text', 'textarea', 'number', 'email', 'tel', 'url', 'date', 'time',
        'select', 'radio', 'checkbox', 'file', 'rating', 'slider', 'textarea-rich'
      ];
      
      if (!validTypes.includes(field.type)) {
        return false;
      }
    }
  }
  
  return true;
}