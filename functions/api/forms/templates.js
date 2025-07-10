import { createResponse, handleCORS, handleError } from '../../utils/api-utils.js';

export async function onRequest(request, env, context) {
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const templateId = id.match(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i) ? id : null;

    if (!env.DB) {
      return handleError('Database binding not available', 503);
    }
    
    switch (request.method) {
      case 'GET':
        return await handleGetTemplates(request, env, templateId);
      case 'POST':
        return await handleCreateTemplate(request, env);
      case 'PUT':
        if (!templateId) return handleError('A valid template ID is required in the URL for PUT requests.', 400);
        return await handleUpdateTemplate(request, env, templateId);
      case 'DELETE':
        if (!templateId) return handleError('A valid template ID is required in the URL for DELETE requests.', 400);
        return await handleDeleteTemplate(env, templateId);
      default:
        return handleError(`Method not allowed: ${request.method}`, 405);
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle GET requests - list templates or get a specific template
 */
async function handleGetTemplates(request, env, templateId) {
  try {
    // Get query parameters from the URL
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    console.log('handleGetTemplates called:', { templateId, type });
    
    if (templateId) {
      // Get a single specific template
      const template = await env.DB.prepare(
        `SELECT ft.*, 'Anonymous' as creator_name 
         FROM form_templates ft 
         WHERE ft.id = ?`
      ).bind(templateId).first();

      if (!template) {
        return handleError('Template not found', 404);
      }
      
      // Safely parse JSON sections
      if (template.sections) {
        try {
          template.sections = JSON.parse(template.sections);
        } catch (e) {
          console.warn(`Could not parse sections for template ${template.id}: ${e.message}`);
          template.sections = []; // Sanitize corrupted JSON
        }
      }
      
      return createResponse({ success: true, data: { template } });

    } else {
      // List all templates
      const dbResult = await env.DB.prepare(
        `SELECT ft.id, ft.name, ft.description, ft.sections, ft.created_by, ft.created_at, ft.updated_at,
                ft.is_locked, ft.passcode,
                'Anonymous' as creator_name,
                COUNT(fs.id) as submission_count
         FROM form_templates ft
         LEFT JOIN form_submissions fs ON ft.id = fs.template_id
         GROUP BY ft.id
         ORDER BY ft.updated_at DESC`
      ).all();

      const templates = dbResult && dbResult.results ? dbResult.results : [];

      const processedTemplates = templates.map(template => {
        if (template.sections) {
          try {
            const sections = JSON.parse(template.sections);
            if (isValidTemplateSections(sections)) {
              template.sections = sections;
            } else {
              template.sections = []; // Clear invalid sections
            }
          } catch (e) {
            console.warn(`Could not parse sections for template ${template.id}: ${e.message}`);
            template.sections = []; // Sanitize corrupted sections
          }
        }
        return template;
      });

      return createResponse({
        success: true,
        data: {
          templates: processedTemplates
        }
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle POST requests - create a new template
 */
async function handleCreateTemplate(request, env) {
  try {
    const data = await request.json();
    const { name, description, sections, createdBy, isLocked, passcode } = data;

    if (!name) {
      return handleError('Template name is a required field.', 400);
    }

    const templateSections = sections || [];
    if (templateSections.length > 0 && !isValidTemplateSections(templateSections)) {
      return handleError('The provided sections have an invalid format.', 400);
    }

    const now = new Date().toISOString();
    const { meta } = await env.DB.prepare(
      `INSERT INTO form_templates (name, description, sections, created_by, created_at, updated_at, is_locked, passcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      name,
      description || null,
      JSON.stringify(templateSections),
      createdBy || 'Anonymous',
      now,
      now,
      isLocked ? 1 : 0,
      passcode || null
    ).run();

    const newTemplateId = meta.last_row_id;
    const template = await env.DB.prepare(
      `SELECT ft.*, 'Anonymous' as creator_name FROM form_templates ft WHERE ft.id = ?`
    ).bind(newTemplateId).first();
    
    if (template.sections) {
      template.sections = JSON.parse(template.sections);
    }
    
    return createResponse({ success: true, data: { template } }, 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle PUT requests - update an existing template
 */
async function handleUpdateTemplate(request, env, templateId) {
  try {
    const existingTemplate = await env.DB.prepare('SELECT id FROM form_templates WHERE id = ?').bind(templateId).first();
    if (!existingTemplate) {
      return handleError('Template not found', 404);
    }

    const data = await request.json();
    const { name, description, sections, createdBy, isLocked, passcode } = data;

    if (sections && !isValidTemplateSections(sections)) {
      return handleError('The provided sections have an invalid format.', 400);
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE form_templates
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           sections = COALESCE(?, sections),
           created_by = COALESCE(?, created_by),
           is_locked = COALESCE(?, is_locked),
           passcode = CASE WHEN ? IS NOT NULL THEN ? ELSE passcode END,
           updated_at = ?
       WHERE id = ?`
    ).bind(
      name || null,
      description !== undefined ? description : null,
      sections ? JSON.stringify(sections) : null,
      createdBy || null,
      isLocked !== undefined ? (isLocked ? 1 : 0) : null,
      isLocked !== undefined ? 1 : null,
      passcode || null,
      now,
      templateId
    ).run();

    const template = await env.DB.prepare(
      `SELECT ft.*, 'Anonymous' as creator_name FROM form_templates ft WHERE ft.id = ?`
    ).bind(templateId).first();

    if (template.sections) {
      template.sections = JSON.parse(template.sections);
    }
    
    return createResponse({ success: true, data: { template } });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle DELETE requests - permanently delete a template
 */
async function handleDeleteTemplate(env, templateId) {
  try {
    const existingTemplate = await env.DB.prepare('SELECT id FROM form_templates WHERE id = ?').bind(templateId).first();
    if (!existingTemplate) {
      return handleError('Template not found', 404);
    }

    await env.DB.prepare('DELETE FROM form_templates WHERE id = ?').bind(templateId).run();
    
    return createResponse({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      return handleError('This template cannot be deleted because it has existing submissions.', 409);
    }
    return handleError(error);
  }
}

/**
 * Validate template sections structure
 */
function isValidTemplateSections(sections) {
  if (!Array.isArray(sections)) {
    return false;
  }

  const isSurveyJSFormat = sections.length > 0 && sections[0].elements !== undefined;

  if (isSurveyJSFormat) {
    return sections.every(page => 
      page.name && Array.isArray(page.elements) && page.elements.every(el => el.type && el.name)
    );
  } else {
    // Legacy format
    return sections.every(section =>
      section.id && section.title && Array.isArray(section.fields) && section.fields.every(field => {
        const validTypes = [
          'text', 'textarea', 'number', 'email', 'tel', 'url', 'date', 'time',
          'select', 'radio', 'checkbox', 'file', 'rating', 'slider', 'textarea-rich'
        ];
        return field.name && field.type && field.label && validTypes.includes(field.type);
      })
    );
  }
}