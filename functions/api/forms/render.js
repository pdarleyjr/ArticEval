import { createResponse, handleCORS } from '../../auth/utils.js';
import { authenticateUser } from '../../auth/middleware.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    // Authentication is optional for rendering - some forms may be public
    const authResult = await authenticateUser(request, env);
    let user = null;
    if (authResult.success) {
      user = authResult.user;
    }
    
    const url = new URL(request.url);
    const templateId = url.searchParams.get('template_id');
    const format = url.searchParams.get('format') || 'html'; // html, json, config
    const theme = url.searchParams.get('theme') || 'default';
    
    switch (request.method) {
      case 'GET':
        return await handleRenderForm(env, user, templateId, format, theme);
      case 'POST':
        return await handleValidateForm(request, env, user);
      default:
        return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('Form render API error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

/**
 * Handle GET requests - render form from template
 */
async function handleRenderForm(env, user, templateId, format, theme) {
  if (!templateId) {
    return createResponse(false, 'Template ID is required', null, 400);
  }
  
  try {
    // Get template
    const template = await env.DB.prepare(`
      SELECT ft.*, 'Anonymous' as creator_name
      FROM form_templates ft
      WHERE ft.id = ?
    `).bind(templateId).first();
    
    if (!template) {
      return createResponse(false, 'Template not found or inactive', null, 404);
    }
    
    // Check access permissions
    // Parse template sections (open access - no auth required)
    const templateConfig = JSON.parse(template.sections);
    
    switch (format) {
      case 'html':
        return await renderFormAsHTML(template, templateConfig, theme);
      case 'json':
        return await renderFormAsJSON(template, templateConfig);
      case 'config':
        return createResponse(true, 'Template configuration retrieved', {
          template: {
            id: template.id,
            name: template.name,
            description: template.description,
            sections: templateConfig,
            created_by: template.created_by,
            creator_name: template.creator_name,
            created_at: template.created_at,
            updated_at: template.updated_at
          }
        });
        return createResponse(false, 'Invalid format specified', null, 400);
    }
  } catch (error) {
    console.error('Render form error:', error);
    return createResponse(false, 'Failed to render form', null, 500);
  }
}

/**
 * Handle POST requests - validate form data against template
 */
async function handleValidateForm(request, env, user) {
  try {
    const data = await request.json();
    const { template_id, data: formData } = data;
    
    if (!template_id || !formData) {
      return createResponse(false, 'Template ID and form data are required', null, 400);
    }
    
    // Get template
    const template = await env.DB.prepare(`
      SELECT * FROM form_templates WHERE id = ?
    `).bind(template_id).first();
    
    if (!template) {
      return createResponse(false, 'Template not found', null, 404);
    }
    
    const templateConfig = JSON.parse(template.sections);
    const validation = validateFormData(formData, templateConfig);
    
    return createResponse(true, 'Form validation completed', {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error('Validate form error:', error);
    return createResponse(false, 'Failed to validate form', null, 500);
  }
}

/**
 * Render form as HTML
 */
async function renderFormAsHTML(template, templateConfig, theme) {
  const formHTML = generateFormHTML(template, templateConfig, theme);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(template.name)} - IPLC Articulation Evaluation</title>
    <style>
        ${getFormStyles(theme)}
    </style>
</head>
<body>
    <div class="form-container">
        <div class="form-header">
            <h1>${escapeHtml(template.name)}</h1>
            ${template.description ? `<p class="form-description">${escapeHtml(template.description)}</p>` : ''}
        </div>
        
        <form id="evaluation-form" class="evaluation-form">
            <input type="hidden" name="template_id" value="${template.id}">
            ${formHTML}
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Submit Evaluation</button>
                <button type="button" class="btn btn-secondary" onclick="resetForm()">Reset</button>
            </div>
        </form>
        
        <div id="form-messages" class="form-messages"></div>
    </div>
    
    <script>
        ${getFormScripts()}
    </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

/**
 * Render form as JSON structure
 */
async function renderFormAsJSON(template, templateConfig) {
  const formStructure = {
    id: template.id,
    name: template.name,
    description: template.description,
    sections: templateConfig.sections.map(section => ({
      id: section.id,
      title: section.title,
      description: section.description,
      fields: section.fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        validation: field.validation,
        scoring: field.scoring,
        attributes: field.attributes
      }))
    })),
    settings: templateConfig.settings || {}
  };
  
  return createResponse(true, 'Form structure retrieved', { form: formStructure });
}

/**
 * Generate HTML for form sections and fields
 */
function generateFormHTML(template, templateConfig, theme) {
  if (!templateConfig.sections || !Array.isArray(templateConfig.sections)) {
    return '<p class="error">Invalid form configuration</p>';
  }
  
  let html = '';
  
  for (const section of templateConfig.sections) {
    html += `<div class="form-section" data-section-id="${section.id}">`;
    
    if (section.title) {
      html += `<h2 class="section-title">${escapeHtml(section.title)}</h2>`;
    }
    
    if (section.description) {
      html += `<p class="section-description">${escapeHtml(section.description)}</p>`;
    }
    
    if (section.fields && Array.isArray(section.fields)) {
      for (const field of section.fields) {
        html += generateFieldHTML(field);
      }
    }
    
    html += '</div>';
  }
  
  return html;
}

/**
 * Generate HTML for individual form field
 */
function generateFieldHTML(field) {
  const fieldId = `field_${field.id}`;
  const required = field.required ? ' required' : '';
  const requiredLabel = field.required ? ' <span class="required">*</span>' : '';
  
  let fieldHTML = `<div class="form-field ${field.type}-field" data-field-id="${field.id}">`;
  fieldHTML += `<label for="${fieldId}" class="field-label">${escapeHtml(field.label)}${requiredLabel}</label>`;
  
  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
      fieldHTML += `<input type="${field.type}" id="${fieldId}" name="${field.id}" 
        ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ''}
        ${required} class="form-input">`;
      break;
      
    case 'textarea':
      fieldHTML += `<textarea id="${fieldId}" name="${field.id}" 
        ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ''}
        ${required} class="form-textarea"
        ${field.attributes?.rows ? `rows="${field.attributes.rows}"` : 'rows="4"'}></textarea>`;
      break;
      
    case 'number':
      fieldHTML += `<input type="number" id="${fieldId}" name="${field.id}"
        ${field.attributes?.min !== undefined ? `min="${field.attributes.min}"` : ''}
        ${field.attributes?.max !== undefined ? `max="${field.attributes.max}"` : ''}
        ${field.attributes?.step !== undefined ? `step="${field.attributes.step}"` : ''}
        ${field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ''}
        ${required} class="form-input">`;
      break;
      
    case 'select':
      fieldHTML += `<select id="${fieldId}" name="${field.id}" ${required} class="form-select">`;
      if (!field.required) {
        fieldHTML += '<option value="">Select an option</option>';
      }
      if (field.options) {
        for (const option of field.options) {
          fieldHTML += `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`;
        }
      }
      fieldHTML += '</select>';
      break;
      
    case 'radio':
      if (field.options) {
        fieldHTML += '<div class="radio-group">';
        for (const option of field.options) {
          const optionId = `${fieldId}_${option.value}`;
          fieldHTML += `
            <div class="radio-option">
              <input type="radio" id="${optionId}" name="${field.id}" value="${escapeHtml(option.value)}" ${required} class="form-radio">
              <label for="${optionId}" class="radio-label">${escapeHtml(option.label)}</label>
            </div>`;
        }
        fieldHTML += '</div>';
      }
      break;
      
    case 'checkbox':
      if (field.options) {
        fieldHTML += '<div class="checkbox-group">';
        for (const option of field.options) {
          const optionId = `${fieldId}_${option.value}`;
          fieldHTML += `
            <div class="checkbox-option">
              <input type="checkbox" id="${optionId}" name="${field.id}" value="${escapeHtml(option.value)}" class="form-checkbox">
              <label for="${optionId}" class="checkbox-label">${escapeHtml(option.label)}</label>
            </div>`;
        }
        fieldHTML += '</div>';
      }
      break;
      
    case 'rating':
      const maxRating = field.attributes?.max || 5;
      fieldHTML += '<div class="rating-group">';
      for (let i = 1; i <= maxRating; i++) {
        fieldHTML += `
          <input type="radio" id="${fieldId}_${i}" name="${field.id}" value="${i}" ${required} class="rating-input">
          <label for="${fieldId}_${i}" class="rating-label">${i}</label>`;
      }
      fieldHTML += '</div>';
      break;
      
    case 'slider':
      const min = field.attributes?.min || 0;
      const max = field.attributes?.max || 100;
      const step = field.attributes?.step || 1;
      fieldHTML += `
        <div class="slider-container">
          <input type="range" id="${fieldId}" name="${field.id}" 
            min="${min}" max="${max}" step="${step}" value="${min}" 
            ${required} class="form-slider">
          <div class="slider-value">
            <span class="slider-min">${min}</span>
            <span class="slider-current">${min}</span>
            <span class="slider-max">${max}</span>
          </div>
        </div>`;
      break;
      
    case 'date':
      fieldHTML += `<input type="date" id="${fieldId}" name="${field.id}" ${required} class="form-input">`;
      break;
      
    case 'time':
      fieldHTML += `<input type="time" id="${fieldId}" name="${field.id}" ${required} class="form-input">`;
      break;
      
    case 'file':
      fieldHTML += `<input type="file" id="${fieldId}" name="${field.id}" ${required} class="form-file"
        ${field.attributes?.accept ? `accept="${field.attributes.accept}"` : ''}
        ${field.attributes?.multiple ? 'multiple' : ''}>`;
      break;
      
    default:
      fieldHTML += `<input type="text" id="${fieldId}" name="${field.id}" ${required} class="form-input">`;
  }
  
  if (field.description) {
    fieldHTML += `<small class="field-description">${escapeHtml(field.description)}</small>`;
  }
  
  fieldHTML += '</div>';
  
  return fieldHTML;
}

/**
 * Get CSS styles for form themes
 */
function getFormStyles(theme) {
  const baseStyles = `
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .form-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .form-header {
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    
    .form-header h1 {
      margin: 0 0 10px 0;
      font-size: 2em;
    }
    
    .form-description {
      margin: 0;
      opacity: 0.9;
    }
    
    .evaluation-form {
      padding: 30px;
    }
    
    .form-section {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #eee;
    }
    
    .form-section:last-child {
      border-bottom: none;
      margin-bottom: 20px;
    }
    
    .section-title {
      color: #333;
      margin: 0 0 15px 0;
      font-size: 1.5em;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    
    .section-description {
      color: #666;
      margin: 0 0 25px 0;
      font-style: italic;
    }
    
    .form-field {
      margin-bottom: 25px;
    }
    
    .field-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }
    
    .required {
      color: #e74c3c;
    }
    
    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s ease;
    }
    
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .radio-group, .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .radio-option, .checkbox-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .form-radio, .form-checkbox {
      margin: 0;
    }
    
    .rating-group {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .rating-input {
      display: none;
    }
    
    .rating-label {
      padding: 8px 12px;
      border: 2px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .rating-input:checked + .rating-label {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    
    .slider-container {
      width: 100%;
    }
    
    .form-slider {
      width: 100%;
      margin: 10px 0;
    }
    
    .slider-value {
      display: flex;
      justify-content: space-between;
      font-size: 0.9em;
      color: #666;
    }
    
    .field-description {
      display: block;
      margin-top: 5px;
      color: #666;
      font-size: 0.9em;
    }
    
    .form-actions {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #eee;
      display: flex;
      gap: 15px;
      justify-content: center;
    }
    
    .btn {
      padding: 12px 30px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5a67d8;
      transform: translateY(-2px);
    }
    
    .btn-secondary {
      background: #f8f9fa;
      color: #6c757d;
      border: 2px solid #dee2e6;
    }
    
    .btn-secondary:hover {
      background: #e9ecef;
    }
    
    .form-messages {
      margin-top: 20px;
      padding: 0 30px 30px;
    }
    
    .message {
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    
    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      
      .form-header, .evaluation-form {
        padding: 20px;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .radio-group, .checkbox-group {
        gap: 8px;
      }
      
      .rating-group {
        flex-wrap: wrap;
      }
    }
  `;
  
  return baseStyles;
}

/**
 * Get JavaScript for form functionality
 */
function getFormScripts() {
  return `
    // Form submission handling
    document.getElementById('evaluation-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {};
      
      // Convert FormData to object
      for (let [key, value] of formData.entries()) {
        if (data[key]) {
          // Handle multiple values (checkboxes)
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      }
      
      try {
        showMessage('Submitting form...', 'info');
        
        const response = await fetch('/api/forms/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: data.template_id,
            data: data
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showMessage('Form submitted successfully!', 'success');
          this.reset();
        } else {
          showMessage('Error: ' + result.message, 'error');
        }
      } catch (error) {
        showMessage('Error submitting form. Please try again.', 'error');
      }
    });
    
    // Slider value updates
    document.querySelectorAll('.form-slider').forEach(slider => {
      const container = slider.closest('.slider-container');
      const currentSpan = container.querySelector('.slider-current');
      
      slider.addEventListener('input', function() {
        currentSpan.textContent = this.value;
      });
    });
    
    // Reset form function
    function resetForm() {
      document.getElementById('evaluation-form').reset();
      document.querySelectorAll('.slider-current').forEach(span => {
        const slider = span.closest('.slider-container').querySelector('.form-slider');
        span.textContent = slider.min;
      });
      clearMessages();
    }
    
    // Message display functions
    function showMessage(text, type) {
      const messagesContainer = document.getElementById('form-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + type;
      messageDiv.textContent = text;
      
      clearMessages();
      messagesContainer.appendChild(messageDiv);
      
      // Auto-remove success messages
      if (type === 'success') {
        setTimeout(() => {
          messageDiv.remove();
        }, 5000);
      }
    }
    
    function clearMessages() {
      document.getElementById('form-messages').innerHTML = '';
    }
  `;
}

/**
 * Validate form data (enhanced version from submissions.js)
 */
function validateFormData(data, templateConfig) {
  const errors = [];
  const warnings = [];
  
  if (!templateConfig.sections || !Array.isArray(templateConfig.sections)) {
    errors.push('Invalid template configuration');
    return { isValid: false, errors, warnings };
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
          } else {
            const numValue = parseFloat(fieldValue);
            if (field.attributes?.min !== undefined && numValue < field.attributes.min) {
              errors.push(`Field '${field.label}' must be at least ${field.attributes.min}`);
            }
            if (field.attributes?.max !== undefined && numValue > field.attributes.max) {
              errors.push(`Field '${field.label}' must be at most ${field.attributes.max}`);
            }
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
        case 'checkbox':
          if (Array.isArray(fieldValue)) {
            for (const value of fieldValue) {
              if (field.options && !field.options.some(opt => opt.value === value)) {
                errors.push(`Field '${field.label}' contains an invalid option: ${value}`);
              }
            }
          }
          break;
      }
      
      // Length validation
      if (field.maxLength && typeof fieldValue === 'string' && fieldValue.length > field.maxLength) {
        errors.push(`Field '${field.label}' exceeds maximum length of ${field.maxLength}`);
      }
      
      // Custom validation rules
      if (field.validation) {
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(fieldValue)) {
            errors.push(field.validation.message || `Field '${field.label}' format is invalid`);
          }
        }
      }
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}