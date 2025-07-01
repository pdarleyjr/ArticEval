import { requireAuth, handleCors, addCorsHeaders } from '../../auth/middleware.js';

export async function onRequestOptions(context) {
  return handleCors();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const corsHeaders = addCorsHeaders();
  
  try {
    // Authenticate user
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get form templates for the user
    const templates = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at, updated_at 
      FROM form_templates 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    // Get total count
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM form_templates 
      WHERE user_id = ?
    `).bind(user.id).first();

    return new Response(JSON.stringify({
      success: true,
      data: {
        templates: templates.results || [],
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error fetching form templates:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch form templates'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const corsHeaders = addCorsHeaders();
  
  try {
    // Authenticate user
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;

    // Parse request body
    const body = await request.json();
    const { name, description, form_schema } = body;

    // Validate required fields
    if (!name || !form_schema) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Name and form schema are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate form_schema is valid JSON
    if (typeof form_schema !== 'object') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Form schema must be a valid JSON object'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Create new form template
    const templateId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO form_templates (id, user_id, name, description, form_schema, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      templateId,
      user.id,
      name,
      description || null,
      JSON.stringify(form_schema),
      now,
      now
    ).run();

    // Return created template
    const template = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at, updated_at 
      FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...template,
        form_schema: JSON.parse(template.form_schema)
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error creating form template:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to create form template'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const corsHeaders = addCorsHeaders();
  
  try {
    // Authenticate user
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;

    // Get template ID from URL
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');

    if (!templateId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Template ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if template exists and belongs to user
    const existingTemplate = await env.DB.prepare(`
      SELECT id FROM form_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.id).first();

    if (!existingTemplate) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Form template not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, form_schema } = body;

    // Validate required fields
    if (!name || !form_schema) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Name and form schema are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate form_schema is valid JSON
    if (typeof form_schema !== 'object') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Form schema must be a valid JSON object'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Update form template
    const now = new Date().toISOString();

    await env.DB.prepare(`
      UPDATE form_templates 
      SET name = ?, description = ?, form_schema = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      name,
      description || null,
      JSON.stringify(form_schema),
      now,
      templateId,
      user.id
    ).run();

    // Return updated template
    const template = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at, updated_at 
      FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...template,
        form_schema: JSON.parse(template.form_schema)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error updating form template:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to update form template'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const corsHeaders = addCorsHeaders();
  
  try {
    // Authenticate user
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;

    // Get template ID from URL
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');

    if (!templateId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Template ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if template exists and belongs to user
    const existingTemplate = await env.DB.prepare(`
      SELECT id FROM form_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.id).first();

    if (!existingTemplate) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Form template not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Delete the template (this will cascade delete submissions due to foreign key)
    await env.DB.prepare(`
      DELETE FROM form_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Form template deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error deleting form template:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to delete form template'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}