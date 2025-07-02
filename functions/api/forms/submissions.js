import { createResponse, handleCORS } from '../../auth/utils.js';
import { authenticateUser } from '../../auth/middleware.js';

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
    const submissionId = url.searchParams.get('id');
    const templateId = url.searchParams.get('template_id');
    
    switch (request.method) {
      case 'GET':
        return await handleGetSubmissions(env, user, submissionId, templateId, url.searchParams);
      case 'POST':
        return await handleCreateSubmission(request, env, user);
      case 'PUT':
        return await handleUpdateSubmission(request, env, user, submissionId);
      case 'DELETE':
        return await handleDeleteSubmission(env, user, submissionId);
      default:
        return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('Submissions API error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

/**
 * Handle GET requests - list submissions or get specific submission
 */
async function handleGetSubmissions(env, user, submissionId, templateId, searchParams) {
  try {
    if (submissionId) {
      // Get specific submission
      return await getSubmissionById(env, user, submissionId);
    } else {
      // List submissions with filtering and pagination
      return await listSubmissions(env, user, templateId, searchParams);
    }
  } catch (error) {
    console.error('Get submissions error:', error);
    return createResponse(false, 'Failed to retrieve submissions', null, 500);
  }
}

/**
 * Get specific submission by ID
 */
async function getSubmissionById(env, user, submissionId) {
  let query = `
    SELECT fs.*, ft.name as template_name, u.name as submitter_name, u.email as submitter_email
    FROM form_submissions fs
    LEFT JOIN form_templates ft ON fs.template_id = ft.id
    LEFT JOIN users u ON fs.submitted_by = u.id
    WHERE fs.id = ?
  `;
  
  // Apply user-based filtering
  if (user.role === 'user') {
    query += ` AND fs.submitted_by = ?`;
  }
  
  const params = [submissionId];
  if (user.role === 'user') {
    params.push(user.id);
  }
  
  const submission = await env.DB.prepare(query).bind(...params).first();
  
  if (!submission) {
    return createResponse(false, 'Submission not found', null, 404);
  }
  
  // Parse JSON data
  if (submission.data) {
    submission.data = JSON.parse(submission.data);
  }
  if (submission.client_data) {
    submission.client_data = JSON.parse(submission.client_data);
  }
  
  return createResponse(true, 'Submission retrieved successfully', { submission });
}

/**
 * List submissions with filtering and pagination
 */
async function listSubmissions(env, user, templateId, searchParams) {
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100);
  const offset = (page - 1) * limit;
  const status = searchParams.get('status');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  
  let whereConditions = [];
  let params = [];
  
  // Apply user-based filtering
  if (user.role === 'user') {
    whereConditions.push('fs.submitted_by = ?');
    params.push(user.id);
  }
  
  // Template filter
  if (templateId) {
    whereConditions.push('fs.template_id = ?');
    params.push(templateId);
  }
  
  // Status filter
  if (status) {
    whereConditions.push('fs.status = ?');
    params.push(status);
  }
  
  // Date range filter
  if (startDate) {
    whereConditions.push('fs.submitted_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereConditions.push('fs.submitted_at <= ?');
    params.push(endDate);
  }
  
  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM form_submissions fs
    ${whereClause}
  `;
  
  const countResult = await env.DB.prepare(countQuery).bind(...params).first();
  const total = countResult.total;
  
  // Get submissions
  const query = `
    SELECT fs.id, fs.template_id, fs.submitted_by, fs.submitted_at, fs.status, fs.score,
           ft.name as template_name, u.name as submitter_name, u.email as submitter_email
    FROM form_submissions fs
    LEFT JOIN form_templates ft ON fs.template_id = ft.id
    LEFT JOIN users u ON fs.submitted_by = u.id
    ${whereClause}
    ORDER BY fs.submitted_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const submissions = await env.DB.prepare(query).bind(...params, limit, offset).all();
  
  return createResponse(true, 'Submissions retrieved successfully', {
    submissions: submissions.results || [],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

/**
 * Handle POST requests - create new submission
 */
async function handleCreateSubmission(request, env, user) {
  try {
    const data = await request.json();
    const { template_id, data: formData, client_data } = data;
    
    // Validate required fields
    if (!template_id || !formData) {
      return createResponse(false, 'Template ID and form data are required', null, 400);
    }
    
    // Get template to validate against
    const template = await env.DB.prepare(`
      SELECT * FROM form_templates WHERE id = ? AND is_active = 1
    `).bind(template_id).first();
    
    if (!template) {
      return createResponse(false, 'Template not found or inactive', null, 404);
    }
    
    // Parse template config
    const templateConfig = JSON.parse(template.config);
    
    // Validate form data against template
    const validation = validateSubmissionData(formData, templateConfig);
    if (!validation.isValid) {
      return createResponse(false, `Validation failed: ${validation.errors.join(', ')}`, null, 400);
    }
    
    // Calculate score if template has scoring
    const score = calculateScore(formData, templateConfig);
    
    const now = new Date().toISOString();
    
    // Insert submission
    const result = await env.DB.prepare(`
      INSERT INTO form_submissions (template_id, submitted_by, data, client_data, status, score, submitted_at)
      VALUES (?, ?, ?, ?, 'completed', ?, ?)
    `).bind(
      template_id,
      user.id,
      JSON.stringify(formData),
      client_data ? JSON.stringify(client_data) : null,
      score,
      now
    ).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to create submission', null, 500);
    }
    
    // Track analytics
    await trackSubmissionAnalytics(env, template_id, user.id, now);
    
    // Get the created submission
    const submission = await env.DB.prepare(`
      SELECT fs.*, ft.name as template_name
      FROM form_submissions fs
      LEFT JOIN form_templates ft ON fs.template_id = ft.id
      WHERE fs.id = ?
    `).bind(result.meta.last_row_id).first();
    
    if (submission.data) {
      submission.data = JSON.parse(submission.data);
    }
    if (submission.client_data) {
      submission.client_data = JSON.parse(submission.client_data);
    }
    
    return createResponse(true, 'Submission created successfully', { submission }, 201);
  } catch (error) {
    console.error('Create submission error:', error);
    return createResponse(false, 'Failed to create submission', null, 500);
  }
}

/**
 * Handle PUT requests - update existing submission
 */
async function handleUpdateSubmission(request, env, user, submissionId) {
  if (!submissionId) {
    return createResponse(false, 'Submission ID is required', null, 400);
  }
  
  try {
    // Check if submission exists and user has permission to edit
    let query = `SELECT * FROM form_submissions WHERE id = ?`;
    let params = [submissionId];
    
    if (user.role === 'user') {
      query += ` AND submitted_by = ?`;
      params.push(user.id);
    }
    
    const existingSubmission = await env.DB.prepare(query).bind(...params).first();
    
    if (!existingSubmission) {
      return createResponse(false, 'Submission not found or access denied', null, 404);
    }
    
    const data = await request.json();
    const { data: formData, status, score } = data;
    
    let updateFields = [];
    let updateParams = [];
    
    // Update form data if provided
    if (formData) {
      // Get template to validate against
      const template = await env.DB.prepare(`
        SELECT * FROM form_templates WHERE id = ? AND is_active = 1
      `).bind(existingSubmission.template_id).first();
      
      if (template) {
        const templateConfig = JSON.parse(template.config);
        const validation = validateSubmissionData(formData, templateConfig);
        
        if (!validation.isValid) {
          return createResponse(false, `Validation failed: ${validation.errors.join(', ')}`, null, 400);
        }
        
        updateFields.push('data = ?');
        updateParams.push(JSON.stringify(formData));
        
        // Recalculate score
        const newScore = calculateScore(formData, templateConfig);
        updateFields.push('score = ?');
        updateParams.push(newScore);
      }
    }
    
    // Update status if provided (clinicians and admins only)
    if (status && ['clinician', 'admin'].includes(user.role)) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    
    // Update score if provided (clinicians and admins only)
    if (score !== undefined && ['clinician', 'admin'].includes(user.role)) {
      updateFields.push('score = ?');
      updateParams.push(score);
    }
    
    if (updateFields.length === 0) {
      return createResponse(false, 'No valid fields to update', null, 400);
    }
    
    const updateQuery = `
      UPDATE form_submissions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    updateParams.push(submissionId);
    
    const result = await env.DB.prepare(updateQuery).bind(...updateParams).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to update submission', null, 500);
    }
    
    // Get the updated submission
    const submission = await env.DB.prepare(`
      SELECT fs.*, ft.name as template_name
      FROM form_submissions fs
      LEFT JOIN form_templates ft ON fs.template_id = ft.id
      WHERE fs.id = ?
    `).bind(submissionId).first();
    
    if (submission.data) {
      submission.data = JSON.parse(submission.data);
    }
    if (submission.client_data) {
      submission.client_data = JSON.parse(submission.client_data);
    }
    
    return createResponse(true, 'Submission updated successfully', { submission });
  } catch (error) {
    console.error('Update submission error:', error);
    return createResponse(false, 'Failed to update submission', null, 500);
  }
}

/**
 * Handle DELETE requests - delete submission
 */
async function handleDeleteSubmission(env, user, submissionId) {
  if (!submissionId) {
    return createResponse(false, 'Submission ID is required', null, 400);
  }
  
  // Check permissions - only clinicians and admins can delete submissions
  if (!['clinician', 'admin'].includes(user.role)) {
    return createResponse(false, 'Insufficient permissions to delete submissions', null, 403);
  }
  
  try {
    // Check if submission exists
    const existingSubmission = await env.DB.prepare(`
      SELECT * FROM form_submissions WHERE id = ?
    `).bind(submissionId).first();
    
    if (!existingSubmission) {
      return createResponse(false, 'Submission not found', null, 404);
    }
    
    // Delete submission
    const result = await env.DB.prepare(`
      DELETE FROM form_submissions WHERE id = ?
    `).bind(submissionId).run();
    
    if (!result.success) {
      return createResponse(false, 'Failed to delete submission', null, 500);
    }
    
    return createResponse(true, 'Submission deleted successfully', null);
  } catch (error) {
    console.error('Delete submission error:', error);
    return createResponse(false, 'Failed to delete submission', null, 500);
  }
}

/**
 * Validate submission data against template configuration
 */
function validateSubmissionData(data, templateConfig) {
  const errors = [];
  
  if (!templateConfig.sections || !Array.isArray(templateConfig.sections)) {
    errors.push('Invalid template configuration');
    return { isValid: false, errors };
  }
  
  for (const section of templateConfig.sections) {
    if (!section.fields || !Array.isArray(section.fields)) {
      continue;
    }
    
    for (const field of section.fields) {
      const fieldValue = data[field.id];
      
      // Check required fields
      if (field.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
        errors.push(`Field '${field.label}' is required`);
        continue;
      }
      
      // Skip validation if field is not provided and not required
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        continue;
      }
      
      // Type-specific validation
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
            errors.push(`Field '${field.label}' must be a valid email`);
          }
          break;
        case 'number':
          if (isNaN(fieldValue)) {
            errors.push(`Field '${field.label}' must be a number`);
          }
          break;
        case 'url':
          try {
            new URL(fieldValue);
          } catch {
            errors.push(`Field '${field.label}' must be a valid URL`);
          }
          break;
        case 'select':
        case 'radio':
          if (field.options && !field.options.some(opt => opt.value === fieldValue)) {
            errors.push(`Field '${field.label}' contains an invalid option`);
          }
          break;
      }
      
      // Length validation
      if (field.maxLength && typeof fieldValue === 'string' && fieldValue.length > field.maxLength) {
        errors.push(`Field '${field.label}' exceeds maximum length of ${field.maxLength}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Calculate score based on form data and template configuration
 */
function calculateScore(data, templateConfig) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  for (const section of templateConfig.sections) {
    for (const field of section.fields) {
      if (field.scoring) {
        const fieldValue = data[field.id];
        maxPossibleScore += field.scoring.maxPoints || 0;
        
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          switch (field.type) {
            case 'rating':
            case 'slider':
              totalScore += parseInt(fieldValue) || 0;
              break;
            case 'radio':
            case 'select':
              const option = field.options?.find(opt => opt.value === fieldValue);
              if (option && option.points) {
                totalScore += option.points;
              }
              break;
            case 'checkbox':
              if (Array.isArray(fieldValue)) {
                for (const value of fieldValue) {
                  const option = field.options?.find(opt => opt.value === value);
                  if (option && option.points) {
                    totalScore += option.points;
                  }
                }
              }
              break;
          }
        }
      }
    }
  }
  
  return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : null;
}

/**
 * Track submission analytics
 */
async function trackSubmissionAnalytics(env, templateId, userId, timestamp) {
  try {
    await env.DB.prepare(`
      INSERT INTO analytics_events (event_type, template_id, user_id, timestamp, metadata)
      VALUES ('form_submission', ?, ?, ?, ?)
    `).bind(
      templateId,
      userId,
      timestamp,
      JSON.stringify({ action: 'completed' })
    ).run();
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request if analytics fails
  }
}