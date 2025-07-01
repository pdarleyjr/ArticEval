import { addCorsHeaders } from '../../auth/middleware.js';

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: addCorsHeaders()
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // Add CORS headers
  const corsHeaders = addCorsHeaders();
  
  try {
    // Get template ID from URL
    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    const format = url.searchParams.get('format') || 'html'; // html or json

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

    // Get form template
    const template = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at
      FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();

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

    const formSchema = JSON.parse(template.form_schema);

    // Return JSON format if requested
    if (format === 'json') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          description: template.description,
          schema: formSchema,
          created_at: template.created_at
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Generate HTML form
    const htmlForm = generateFormHTML(template, formSchema);

    return new Response(htmlForm, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error rendering form:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to render form'
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

    // Parse form data (handle both JSON and form-encoded data)
    let submissionData;
    const contentType = request.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json();
      submissionData = body.submission_data || body;
    } else if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      submissionData = {};
      for (const [key, value] of formData.entries()) {
        submissionData[key] = value;
      }
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid content type. Use application/json or application/x-www-form-urlencoded'
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
    `).bind(templateId).first();

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

    // Validate submission data
    const formSchema = JSON.parse(template.form_schema);
    const validationResult = validateSubmissionData(submissionData, formSchema);
    
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid form data',
        errors: validationResult.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Create form submission
    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO form_submissions (id, template_id, submission_data, submitted_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      submissionId,
      templateId,
      JSON.stringify(submissionData),
      now
    ).run();

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Form submitted successfully',
      data: {
        submission_id: submissionId,
        submitted_at: now
      }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to submit form'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Helper function to generate HTML form
function generateFormHTML(template, formSchema) {
  const fields = formSchema.fields || [];
  
  let formFields = fields.map(field => {
    let html = `<div class="form-group">`;
    html += `<label for="${field.name}">${field.label || field.name}`;
    if (field.required) {
      html += ' <span class="required">*</span>';
    }
    html += '</label>';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        html += `<input type="${field.type}" id="${field.name}" name="${field.name}" `;
        if (field.placeholder) html += `placeholder="${field.placeholder}" `;
        if (field.required) html += 'required ';
        html += '/>';
        break;
      case 'number':
        html += `<input type="number" id="${field.name}" name="${field.name}" `;
        if (field.min !== undefined) html += `min="${field.min}" `;
        if (field.max !== undefined) html += `max="${field.max}" `;
        if (field.required) html += 'required ';
        html += '/>';
        break;
      case 'textarea':
        html += `<textarea id="${field.name}" name="${field.name}" `;
        if (field.placeholder) html += `placeholder="${field.placeholder}" `;
        if (field.required) html += 'required ';
        html += '></textarea>';
        break;
      case 'select':
        html += `<select id="${field.name}" name="${field.name}" `;
        if (field.required) html += 'required ';
        html += '>';
        if (!field.required) {
          html += '<option value="">-- Select an option --</option>';
        }
        if (field.options) {
          field.options.forEach(option => {
            html += `<option value="${option.value}">${option.label}</option>`;
          });
        }
        html += '</select>';
        break;
      case 'checkbox':
        html += `<input type="checkbox" id="${field.name}" name="${field.name}" value="true" `;
        if (field.required) html += 'required ';
        html += '/>';
        break;
      case 'radio':
        if (field.options) {
          field.options.forEach((option, index) => {
            html += `<div class="radio-option">`;
            html += `<input type="radio" id="${field.name}_${index}" name="${field.name}" value="${option.value}" `;
            if (field.required) html += 'required ';
            html += '/>';
            html += `<label for="${field.name}_${index}">${option.label}</label>`;
            html += '</div>';
          });
        }
        break;
      default:
        html += `<input type="text" id="${field.name}" name="${field.name}" `;
        if (field.required) html += 'required ';
        html += '/>';
    }

    if (field.description) {
      html += `<small class="field-description">${field.description}</small>`;
    }

    html += '</div>';
    return html;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .form-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 10px; }
        .description { color: #666; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: 500; 
            color: #333;
        }
        .required { color: #e74c3c; }
        input, textarea, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        textarea { resize: vertical; min-height: 100px; }
        .radio-option { margin-bottom: 8px; }
        .radio-option input { width: auto; margin-right: 8px; }
        .radio-option label { display: inline; font-weight: normal; }
        input[type="checkbox"] { width: auto; margin-right: 8px; }
        .field-description { 
            display: block; 
            color: #666; 
            font-size: 12px; 
            margin-top: 5px;
        }
        .submit-btn {
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }
        .submit-btn:hover { background-color: #0056b3; }
        .success-message, .error-message {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .success-message {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>${template.name}</h1>
        ${template.description ? `<p class="description">${template.description}</p>` : ''}
        
        <form id="dynamicForm" method="POST">
            ${formFields}
            <button type="submit" class="submit-btn">Submit</button>
        </form>
    </div>

    <script>
        document.getElementById('dynamicForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitData = {};
            
            // Convert FormData to object
            for (const [key, value] of formData.entries()) {
                submitData[key] = value;
            }
            
            try {
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ submission_data: submitData })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    const successDiv = document.createElement('div');
                    successDiv.className = 'success-message';
                    successDiv.textContent = 'Form submitted successfully!';
                    this.parentNode.insertBefore(successDiv, this);
                    this.reset();
                } else {
                    throw new Error(result.message || 'Failed to submit form');
                }
            } catch (error) {
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Error: ' + error.message;
                this.parentNode.insertBefore(errorDiv, this);
            }
        });
    </script>
</body>
</html>`;
}

// Helper function to validate submission data against form schema
function validateSubmissionData(submissionData, formSchema) {
  const errors = [];
  
  try {
    if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
      return { isValid: true, errors: [] };
    }

    for (const field of formSchema.fields) {
      const value = submissionData[field.name];
      
      // Check required fields
      if (field.required && (!value || value === '')) {
        errors.push(`${field.label || field.name} is required`);
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value || value === '') continue;

      // Type validation
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field.label || field.name} must be a valid email address`);
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`${field.label || field.name} must be a valid number`);
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push(`${field.label || field.name} must be a valid URL`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: true, errors: [] };
  }
}