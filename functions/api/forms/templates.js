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
  console.log('=== STARTING handleGetTemplates function ===');
  console.log('Environment DB binding available:', !!env.DB);
  console.log('Template ID parameter:', templateId);
  
  try {
    if (templateId) {
      console.log('=== SINGLE TEMPLATE RETRIEVAL MODE ===');
      console.log('Querying for template ID:', templateId);
      
      // Get specific template
      const template = await env.DB.prepare(`
        SELECT ft.*, 'Anonymous' as creator_name
        FROM form_templates ft
        WHERE ft.id = ?
      `).bind(templateId).first();
      
      console.log('Single template query result:', JSON.stringify(template, null, 2));
      
      if (!template) {
        console.log('Template not found for ID:', templateId);
        return createResponse(false, 'Template not found', null, 404);
      }
      
      // Parse JSON sections
      console.log('Parsing sections for template:', template.id);
      console.log('Raw sections value:', template.sections);
      console.log('Sections type:', typeof template.sections);
      
      if (template.sections) {
        try {
          template.sections = JSON.parse(template.sections);
          console.log('Successfully parsed sections:', JSON.stringify(template.sections, null, 2));
        } catch (parseError) {
          console.error('Failed to parse template sections:', parseError);
          console.error('Raw sections content:', template.sections);
        }
      }
      
      console.log('Final template object:', JSON.stringify(template, null, 2));
      return createResponse(true, 'Template retrieved successfully', { template });
    } else {
      console.log('=== TEMPLATE LIST RETRIEVAL MODE ===');
      
      // List all templates - MODIFIED QUERY TO INCLUDE SECTIONS
      console.log('Executing templates list query...');
      const result = await env.DB.prepare(`
        SELECT ft.id, ft.name, ft.description, ft.sections, ft.created_by, ft.created_at, ft.updated_at,
               'Anonymous' as creator_name,
               COUNT(fs.id) as submission_count
        FROM form_templates ft
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id
        GROUP BY ft.id, ft.name, ft.description, ft.sections, ft.created_by, ft.created_at, ft.updated_at
        ORDER BY ft.updated_at DESC
      `).all();
      
      console.log('=== DATABASE QUERY RESULT ANALYSIS ===');
      console.log('Query success:', result.success);
      console.log('Result object keys:', Object.keys(result));
      console.log('Results array length:', result.results ? result.results.length : 'N/A');
      console.log('Full result object:', JSON.stringify(result, null, 2));
      
      if (!result.success) {
        console.error('=== DATABASE QUERY FAILED ===');
        console.error('Query error:', result.error);
        return createResponse(false, 'Database query failed', null, 500);
      }
      
      console.log('=== PROCESSING TEMPLATES ===');
      const processedTemplates = [];
      
      if (result.results && Array.isArray(result.results)) {
        for (let i = 0; i < result.results.length; i++) {
          const template = result.results[i];
          console.log(`Processing template ${i + 1}:`, template.id, template.name);
          console.log(`Template ${i + 1} raw data:`, JSON.stringify(template, null, 2));
          
          // Parse sections if present
          if (template.sections) {
            console.log(`Template ${i + 1} has sections, attempting to parse...`);
            console.log(`Raw sections value:`, template.sections);
            console.log(`Sections type:`, typeof template.sections);
            
            try {
              template.sections = JSON.parse(template.sections);
              console.log(`Template ${i + 1} sections parsed successfully:`, JSON.stringify(template.sections, null, 2));
              
              // Validate sections using our validation function
              console.log(`=== VALIDATING TEMPLATE ${i + 1} SECTIONS ===`);
              const isValid = isValidTemplateSections(template.sections);
              console.log(`Template ${i + 1} validation result:`, isValid);
              
              if (!isValid) {
                console.warn(`Template ${i + 1} failed validation - excluding from results`);
                continue;
              }
            } catch (parseError) {
              console.error(`Template ${i + 1} sections parse error:`, parseError);
              console.error(`Failed to parse sections:`, template.sections);
              template.sections = [];
            }
          } else {
            console.log(`Template ${i + 1} has no sections`);
            template.sections = [];
          }
          
          processedTemplates.push(template);
          console.log(`Template ${i + 1} added to processed list`);
        }
      } else {
        console.warn('No results array found or results is not an array');
      }
      
      console.log('=== FINAL PROCESSING COMPLETE ===');
      console.log('Total processed templates:', processedTemplates.length);
      console.log('Final templates array:', JSON.stringify(processedTemplates, null, 2));
      
      const response = createResponse(true, 'Templates retrieved successfully', {
        templates: processedTemplates
      });
      
      console.log('=== RESPONSE OBJECT ===');
      console.log('Response object:', JSON.stringify(response, null, 2));
      
      return response;
    }
  } catch (error) {
    console.error('=== CRITICAL ERROR IN handleGetTemplates ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Error object (serialized):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return createResponse(false, 'Failed to retrieve templates: ' + error.message, null, 500);
  }
}

/**
 * Handle POST requests - create new template
 */
async function handleCreateTemplate(request, env) {
  console.log('=== STARTING handleCreateTemplate ===');
  try {
    const data = await request.json();
    console.log('Request data:', JSON.stringify(data, null, 2));
    const { name, description, sections } = data;
    
    // Validate required fields - only name is required for initial creation
    if (!name) {
      console.log('Validation failed: name is required');
      return createResponse(false, 'Template name is required', null, 400);
    }
    
    // Use empty sections array if not provided (for initial template creation)
    const templateSections = sections || [];
    console.log('Template sections:', JSON.stringify(templateSections, null, 2));
    
    // Validate sections structure only if sections are provided
    if (templateSections.length > 0 && !isValidTemplateSections(templateSections)) {
      console.log('Validation failed: invalid template sections');
      return createResponse(false, 'Invalid template sections', null, 400);
    }
    
    const now = new Date().toISOString();
    console.log('Creating template with name:', name, 'description:', description);
    
    // Insert new template
    const result = await env.DB.prepare(`
      INSERT INTO form_templates (name, description, sections, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      description || null,
      JSON.stringify(templateSections),
      null, // No user tracking in open access mode
      now,
      now
    ).run();
    
    console.log('Database insert result:', JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.error('Database insert failed:', result.error);
      return createResponse(false, 'Failed to create template', null, 500);
    }
    
    console.log('Template created with ID:', result.meta.last_row_id);
    
    // Get the created template
    const template = await env.DB.prepare(`
      SELECT ft.*, 'Anonymous' as creator_name
      FROM form_templates ft
      WHERE ft.id = ?
    `).bind(result.meta.last_row_id).first();
    
    console.log('Retrieved created template:', JSON.stringify(template, null, 2));
    
    if (template.sections) {
      template.sections = JSON.parse(template.sections);
    }
    
    console.log('Template creation successful');
    return createResponse(true, 'Template created successfully', { template }, 201);
  } catch (error) {
    console.error('Create template error:', error);
    console.error('Error stack:', error.stack);
    return createResponse(false, 'Failed to create template: ' + error.message, null, 500);
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
  console.log('=== STARTING TEMPLATE SECTIONS VALIDATION ===');
  console.log('Sections input:', JSON.stringify(sections, null, 2));
  console.log('Sections type:', typeof sections);
  console.log('Is array:', Array.isArray(sections));
  
  if (!sections || !Array.isArray(sections)) {
    console.log('VALIDATION FAILED: Sections is not an array or is null/undefined');
    return false;
  }
  
  console.log('Sections array length:', sections.length);
  
  // Validate each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`=== VALIDATING SECTION ${i + 1} ===`);
    console.log(`Section ${i + 1} data:`, JSON.stringify(section, null, 2));
    
    // Check section structure
    console.log(`Section ${i + 1} has id:`, !!section.id, 'Value:', section.id);
    console.log(`Section ${i + 1} has title:`, !!section.title, 'Value:', section.title);
    console.log(`Section ${i + 1} has fields:`, !!section.fields, 'Type:', typeof section.fields);
    console.log(`Section ${i + 1} fields is array:`, Array.isArray(section.fields));
    
    if (!section.id || !section.title || !section.fields || !Array.isArray(section.fields)) {
      console.log(`VALIDATION FAILED: Section ${i + 1} missing required properties`);
      console.log(`Missing - id: ${!section.id}, title: ${!section.title}, fields: ${!section.fields}, fields array: ${!Array.isArray(section.fields)}`);
      return false;
    }
    
    console.log(`Section ${i + 1} fields array length:`, section.fields.length);
    
    // Validate each field
    for (let j = 0; j < section.fields.length; j++) {
      const field = section.fields[j];
      console.log(`=== VALIDATING SECTION ${i + 1} FIELD ${j + 1} ===`);
      console.log(`Field ${j + 1} data:`, JSON.stringify(field, null, 2));
      
      console.log(`Field ${j + 1} has name:`, !!field.name, 'Value:', field.name);
      console.log(`Field ${j + 1} has type:`, !!field.type, 'Value:', field.type);
      console.log(`Field ${j + 1} has label:`, !!field.label, 'Value:', field.label);
      
      if (!field.name || !field.type || !field.label) {
        console.log(`VALIDATION FAILED: Section ${i + 1} Field ${j + 1} missing required properties`);
        console.log(`Missing - name: ${!field.name}, type: ${!field.type}, label: ${!field.label}`);
        return false;
      }
      
      // Check valid field types
      const validTypes = [
        'text', 'textarea', 'number', 'email', 'tel', 'url', 'date', 'time',
        'select', 'radio', 'checkbox', 'file', 'rating', 'slider', 'textarea-rich'
      ];
      
      console.log(`Field ${j + 1} type validation:`, field.type, 'Valid:', validTypes.includes(field.type));
      
      if (!validTypes.includes(field.type)) {
        console.log(`VALIDATION FAILED: Section ${i + 1} Field ${j + 1} has invalid type: ${field.type}`);
        console.log('Valid types:', validTypes);
        return false;
      }
      
      console.log(`Field ${j + 1} validation PASSED`);
    }
    
    console.log(`Section ${i + 1} validation PASSED`);
  }
  
  console.log('=== ALL SECTIONS VALIDATION PASSED ===');
  return true;
}