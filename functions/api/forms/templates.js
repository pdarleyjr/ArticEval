import { createResponse, handleCORS } from '../../auth/utils.js';

export async function onRequest(context) {
  console.log('Templates API called - context:', typeof context);
  const { request, env } = context;
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  console.log('Environment bindings available:', Object.keys(env || {}));
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return handleCORS();
  }
  
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    console.log('Template ID from params:', templateId);
    
    // Test DB connection
    console.log('Testing DB connection...');
    if (!env.DB) {
      console.error('DB binding not available');
      return createResponse(false, 'Database not available', null, 500);
    }
    console.log('DB binding available');
    
    switch (request.method) {
      case 'GET':
        console.log('Calling handleGetTemplates');
        return await handleGetTemplates(env, templateId);
      case 'POST':
        console.log('Calling handleCreateTemplate');
        return await handleCreateTemplate(request, env);
      case 'PUT':
        console.log('Calling handleUpdateTemplate');
        return await handleUpdateTemplate(request, env, templateId);
      case 'DELETE':
        console.log('Calling handleDeleteTemplate');
        return await handleDeleteTemplate(env, templateId);
      default:
        console.log('Method not allowed:', request.method);
        return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('Templates API error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return createResponse(false, 'Internal server error: ' + error.message, null, 500);
  }
}

/**
 * Handle GET requests - list templates or get specific template
 */
async function handleGetTemplates(env, templateId) {
  try {
    if (templateId) {
      // Get specific template
      const template = await env.DB.prepare(`
        SELECT ft.*, 'Anonymous' as creator_name
        FROM form_templates ft
        WHERE ft.id = ?
      `).bind(templateId).first();
      
      if (!template) {
        return createResponse(false, 'Template not found', null, 404);
      }
      
      // Parse JSON sections
      if (template.sections) {
        template.sections = JSON.parse(template.sections);
      }
      
      return createResponse(true, 'Template retrieved successfully', { template });
    } else {
      // List all templates
      const templates = await env.DB.prepare(`
        SELECT ft.id, ft.name, ft.description, ft.created_by, ft.created_at, ft.updated_at,
               'Anonymous' as creator_name,
               COUNT(fs.id) as submission_count
        FROM form_templates ft
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id
        GROUP BY ft.id, ft.name, ft.description, ft.created_by, ft.created_at, ft.updated_at
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
async function handleCreateTemplate(request, env) {
  try {
    const data = await request.json();
    const { name, description, sections } = data;
    
    // Validate required fields
    if (!name || !sections) {
      return createResponse(false, 'Name and sections are required', null, 400);
    }
    
    // Validate sections structure
    if (!isValidTemplateSections(sections)) {
      return createResponse(false, 'Invalid template sections', null, 400);
    }
    
    const now = new Date().toISOString();
    
    // Insert new template
    const result = await env.DB.prepare(`
      INSERT INTO form_templates (name, description, sections, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      description || null,
      JSON.stringify(sections),
      null, // No user tracking in open access mode
      now,
      now
    ).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to create template', null, 500);
    }
    
    // Get the created template
    const template = await env.DB.prepare(`
      SELECT ft.*, 'Anonymous' as creator_name
      FROM form_templates ft
      WHERE ft.id = ?
    `).bind(result.meta.last_row_id).first();
    
    if (template.sections) {
      template.sections = JSON.parse(template.sections);
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
async function handleUpdateTemplate(request, env, templateId) {
  if (!templateId) {
    return createResponse(false, 'Template ID is required', null, 400);
  }
  
  try {
    // Check if template exists
    const existingTemplate = await env.DB.prepare(`
      SELECT * FROM form_templates WHERE id = ?
    `).bind(templateId).first();
    
    if (!existingTemplate) {
      return createResponse(false, 'Template not found', null, 404);
    }
    
    const data = await request.json();
    const { name, description, sections } = data;
    
    // Validate sections if provided
    if (sections && !isValidTemplateSections(sections)) {
      return createResponse(false, 'Invalid template sections', null, 400);
    }
    
    const now = new Date().toISOString();
    
    // Update template
    const result = await env.DB.prepare(`
      UPDATE form_templates
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          sections = COALESCE(?, sections),
          updated_at = ?
      WHERE id = ?
    `).bind(
      name || null,
      description !== undefined ? description : null,
      sections ? JSON.stringify(sections) : null,
      now,
      templateId
    ).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to update template', null, 500);
    }
    
    // Get the updated template
    const template = await env.DB.prepare(`
      SELECT ft.*, 'Anonymous' as creator_name
      FROM form_templates ft
      WHERE ft.id = ?
    `).bind(templateId).first();
    
    if (template.sections) {
      template.sections = JSON.parse(template.sections);
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
async function handleDeleteTemplate(env, templateId) {
  if (!templateId) {
    return createResponse(false, 'Template ID is required', null, 400);
  }
  
  try {
    // Check if template exists
    const existingTemplate = await env.DB.prepare(`
      SELECT * FROM form_templates WHERE id = ?
    `).bind(templateId).first();
    
    if (!existingTemplate) {
      return createResponse(false, 'Template not found', null, 404);
    }
    
    // Check if template has submissions
    const submissionCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM form_submissions WHERE template_id = ?
    `).bind(templateId).first();
    
    // Hard delete since this is open access (no soft delete needed)
    const result = await env.DB.prepare(`
      DELETE FROM form_templates WHERE id = ?
    `).bind(templateId).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to delete template', null, 500);
    }
    
    return createResponse(true, 'Template deleted successfully', null);
  } catch (error) {
    console.error('Delete template error:', error);
    return createResponse(false, 'Failed to delete template', null, 500);
  }
}

/**
 * Validate template sections structure
 * @param {array} sections - Template sections
 * @returns {boolean} True if valid
 */
function isValidTemplateSections(sections) {
  if (!sections || !Array.isArray(sections)) {
    return false;
  }
  
  // Validate each section
  for (const section of sections) {
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