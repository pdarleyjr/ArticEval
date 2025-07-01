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
    const templateId = url.searchParams.get('template_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = `
      SELECT fs.id, fs.template_id, fs.submission_data, fs.submitted_at,
             ft.name as template_name
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE ft.user_id = ?
    `;
    let params = [user.id];

    // Filter by template if specified
    if (templateId) {
      query += ` AND fs.template_id = ?`;
      params.push(templateId);
    }

    query += ` ORDER BY fs.submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const submissions = await env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE ft.user_id = ?
    `;
    let countParams = [user.id];

    if (templateId) {
      countQuery += ` AND fs.template_id = ?`;
      countParams.push(templateId);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    // Parse submission data
    const processedSubmissions = (submissions.results || []).map(submission => ({
      ...submission,
      submission_data: JSON.parse(submission.submission_data)
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        submissions: processedSubmissions,
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
    console.error('Error fetching form submissions:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch form submissions'
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
    // Parse request body
    const body = await request.json();
    const { template_id, submission_data } = body;

    // Validate required fields
    if (!template_id || !submission_data) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Template ID and submission data are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate submission_data is valid JSON
    if (typeof submission_data !== 'object') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Submission data must be a valid JSON object'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if template exists
    const template = await env.DB.prepare(`
      SELECT id, form_schema FROM form_templates 
      WHERE id = ?
    `).bind(template_id).first();

    if (!template) {
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

    // Basic validation: check if submitted data matches form schema structure
    const formSchema = JSON.parse(template.form_schema);
    const validationResult = validateSubmissionData(submission_data, formSchema);
    
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid submission data',
        errors: validationResult.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Create new form submission
    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO form_submissions (id, template_id, submission_data, submitted_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      submissionId,
      template_id,
      JSON.stringify(submission_data),
      now
    ).run();

    // Return created submission
    const submission = await env.DB.prepare(`
      SELECT fs.id, fs.template_id, fs.submission_data, fs.submitted_at,
             ft.name as template_name
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE fs.id = ?
    `).bind(submissionId).first();

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...submission,
        submission_data: JSON.parse(submission.submission_data)
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error creating form submission:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to create form submission'
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

    // Get submission ID from URL
    const url = new URL(request.url);
    const submissionId = url.searchParams.get('id');

    if (!submissionId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Submission ID is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check if submission exists and user owns the template
    const existingSubmission = await env.DB.prepare(`
      SELECT fs.id 
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE fs.id = ? AND ft.user_id = ?
    `).bind(submissionId, user.id).first();

    if (!existingSubmission) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Form submission not found'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Delete the submission
    await env.DB.prepare(`
      DELETE FROM form_submissions 
      WHERE id = ?
    `).bind(submissionId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Form submission deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error deleting form submission:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to delete form submission'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Helper function to validate submission data against form schema
function validateSubmissionData(submissionData, formSchema) {
  const errors = [];
  
  try {
    // Basic validation - check if formSchema has fields
    if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
      return { isValid: true, errors: [] }; // Allow if no validation schema
    }

    // Check required fields
    for (const field of formSchema.fields) {
      if (field.required && (!submissionData[field.name] || submissionData[field.name] === '')) {
        errors.push(`Field '${field.label || field.name}' is required`);
      }

      // Type validation for specific field types
      if (submissionData[field.name] !== undefined && submissionData[field.name] !== '') {
        const value = submissionData[field.name];
        
        switch (field.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`Field '${field.label || field.name}' must be a valid email address`);
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Field '${field.label || field.name}' must be a valid number`);
            }
            break;
          case 'url':
            try {
              new URL(value);
            } catch {
              errors.push(`Field '${field.label || field.name}' must be a valid URL`);
            }
            break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: true, errors: [] }; // Allow submission if validation fails
  }
}