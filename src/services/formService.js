// Form Service - Form data management and business logic
import api, { formsAPI, templatesAPI } from './api.js';
import notifications from '../utils/notifications.js';
import { debounce } from '../utils/debounce.js';

// Form service configuration
const FORM_CONFIG = {
  autoSaveDelay: 5000,
  maxFormSize: 10 * 1024 * 1024, // 10MB
  maxUndoHistory: 50,
  cacheExpiry: 30 * 60 * 1000, // 30 minutes
  validationDelay: 300
};

// Form cache
const formCache = new Map();

// Form history for undo/redo
const formHistory = new Map();

// Active auto-save timers
const autoSaveTimers = new Map();

// Form validators
const validators = new Map();

export class FormService {
  constructor() {
    this.currentForm = null;
    this.isDirty = false;
    this.isSaving = false;
    this.subscribers = new Map();
    
    // Setup auto-save
    this.autoSave = debounce(this.save.bind(this), FORM_CONFIG.autoSaveDelay);
    
    // Setup validation
    this.validateForm = debounce(this._validateForm.bind(this), FORM_CONFIG.validationDelay);
  }
  
  // Subscribe to form changes
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }
  
  // Emit event
  emit(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} subscriber:`, error);
        }
      });
    }
  }
  
  // Load form by ID
  async load(formId, options = {}) {
    try {
      // Check cache first
      if (!options.force && formCache.has(formId)) {
        const cached = formCache.get(formId);
        if (Date.now() - cached.timestamp < FORM_CONFIG.cacheExpiry) {
          this.setCurrentForm(cached.data);
          return cached.data;
        }
      }
      
      // Show loading state
      this.emit('loading', { formId });
      
      // Fetch from API
      const response = await formsAPI.get(formId);
      const formData = response.data;
      
      // Validate form data
      this.validateFormData(formData);
      
      // Cache the form
      formCache.set(formId, {
        data: formData,
        timestamp: Date.now()
      });
      
      // Set as current form
      this.setCurrentForm(formData);
      
      // Initialize history
      this.initializeHistory(formId);
      
      this.emit('loaded', formData);
      
      return formData;
      
    } catch (error) {
      this.emit('error', { action: 'load', error });
      notifications.error(`Failed to load form: ${error.message}`);
      throw error;
    }
  }
  
  // Create new form
  async create(formData) {
    try {
      // Validate form data
      this.validateFormData(formData);
      
      this.emit('creating', formData);
      
      // Create via API
      const response = await formsAPI.create(formData);
      const newForm = response.data;
      
      // Cache the new form
      formCache.set(newForm.id, {
        data: newForm,
        timestamp: Date.now()
      });
      
      // Set as current form
      this.setCurrentForm(newForm);
      
      // Initialize history
      this.initializeHistory(newForm.id);
      
      this.emit('created', newForm);
      notifications.success('Form created successfully');
      
      return newForm;
      
    } catch (error) {
      this.emit('error', { action: 'create', error });
      notifications.error(`Failed to create form: ${error.message}`);
      throw error;
    }
  }
  
  // Save current form
  async save(options = {}) {
    if (!this.currentForm || this.isSaving) {
      return;
    }
    
    // Check if form is dirty
    if (!options.force && !this.isDirty) {
      return;
    }
    
    try {
      this.isSaving = true;
      this.emit('saving', this.currentForm);
      
      // Validate before saving
      const validationResult = await this._validateForm();
      if (!validationResult.isValid && !options.skipValidation) {
        throw new Error('Form validation failed');
      }
      
      // Prepare save data
      const saveData = this.prepareSaveData(this.currentForm);
      
      // Check size limit
      const dataSize = new Blob([JSON.stringify(saveData)]).size;
      if (dataSize > FORM_CONFIG.maxFormSize) {
        throw new Error('Form data exceeds maximum size limit');
      }
      
      // Save via API
      const response = await formsAPI.update(this.currentForm.id, saveData);
      const savedForm = response.data;
      
      // Update cache
      formCache.set(savedForm.id, {
        data: savedForm,
        timestamp: Date.now()
      });
      
      // Update current form
      this.currentForm = { ...this.currentForm, ...savedForm };
      this.isDirty = false;
      
      // Add to history
      this.addToHistory();
      
      this.emit('saved', savedForm);
      
      if (!options.silent) {
        notifications.success('Form saved successfully');
      }
      
      return savedForm;
      
    } catch (error) {
      this.emit('error', { action: 'save', error });
      notifications.error(`Failed to save form: ${error.message}`);
      throw error;
      
    } finally {
      this.isSaving = false;
    }
  }
  
  // Delete form
  async delete(formId) {
    try {
      const confirmDelete = await this.confirmDeletion(formId);
      if (!confirmDelete) {
        return false;
      }
      
      this.emit('deleting', { formId });
      
      // Delete via API
      await formsAPI.delete(formId);
      
      // Remove from cache
      formCache.delete(formId);
      
      // Clear history
      formHistory.delete(formId);
      
      // Clear current form if it's the deleted one
      if (this.currentForm && this.currentForm.id === formId) {
        this.currentForm = null;
        this.isDirty = false;
      }
      
      this.emit('deleted', { formId });
      notifications.success('Form deleted successfully');
      
      return true;
      
    } catch (error) {
      this.emit('error', { action: 'delete', error });
      notifications.error(`Failed to delete form: ${error.message}`);
      throw error;
    }
  }
  
  // Duplicate form
  async duplicate(formId, newName) {
    try {
      this.emit('duplicating', { formId });
      
      // Load original form
      const response = await formsAPI.get(formId);
      const originalForm = response.data;
      
      // Create duplicate data
      const duplicateData = {
        ...originalForm,
        id: undefined,
        name: newName || `${originalForm.name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
        is_template: false
      };
      
      // Create new form
      const newForm = await this.create(duplicateData);
      
      this.emit('duplicated', { original: formId, duplicate: newForm.id });
      
      return newForm;
      
    } catch (error) {
      this.emit('error', { action: 'duplicate', error });
      notifications.error(`Failed to duplicate form: ${error.message}`);
      throw error;
    }
  }
  
  // Update form property
  updateProperty(path, value) {
    if (!this.currentForm) {
      return;
    }
    
    // Store previous value for undo
    const previousValue = this.getPropertyValue(path);
    
    // Update property
    this.setPropertyValue(path, value);
    
    // Mark as dirty
    this.isDirty = true;
    
    // Emit change event
    this.emit('propertyChanged', {
      path,
      value,
      previousValue
    });
    
    // Trigger auto-save
    if (this.currentForm.autoSave !== false) {
      this.autoSave();
    }
    
    // Validate
    this.validateForm();
  }
  
  // Bulk update properties
  updateProperties(updates) {
    if (!this.currentForm) {
      return;
    }
    
    // Apply all updates
    const changes = [];
    
    Object.entries(updates).forEach(([path, value]) => {
      const previousValue = this.getPropertyValue(path);
      this.setPropertyValue(path, value);
      
      changes.push({
        path,
        value,
        previousValue
      });
    });
    
    // Mark as dirty
    this.isDirty = true;
    
    // Emit bulk change event
    this.emit('propertiesChanged', changes);
    
    // Trigger auto-save
    if (this.currentForm.autoSave !== false) {
      this.autoSave();
    }
    
    // Validate
    this.validateForm();
  }
  
  // Get property value by path
  getPropertyValue(path) {
    const parts = path.split('.');
    let value = this.currentForm;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  // Set property value by path
  setPropertyValue(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let target = this.currentForm;
    
    for (const part of parts) {
      if (!target[part] || typeof target[part] !== 'object') {
        target[part] = {};
      }
      target = target[part];
    }
    
    target[lastPart] = value;
  }
  
  // Initialize history for form
  initializeHistory(formId) {
    if (!formHistory.has(formId)) {
      formHistory.set(formId, {
        stack: [],
        pointer: -1
      });
    }
    
    // Add initial state
    this.addToHistory();
  }
  
  // Add current state to history
  addToHistory() {
    if (!this.currentForm) {
      return;
    }
    
    const formId = this.currentForm.id;
    const history = formHistory.get(formId);
    
    if (!history) {
      return;
    }
    
    // Remove states after current pointer
    history.stack = history.stack.slice(0, history.pointer + 1);
    
    // Add new state
    history.stack.push({
      data: JSON.parse(JSON.stringify(this.currentForm)),
      timestamp: Date.now()
    });
    
    // Limit history size
    if (history.stack.length > FORM_CONFIG.maxUndoHistory) {
      history.stack.shift();
    } else {
      history.pointer++;
    }
  }
  
  // Undo last change
  undo() {
    if (!this.canUndo()) {
      return false;
    }
    
    const formId = this.currentForm.id;
    const history = formHistory.get(formId);
    
    // Move pointer back
    history.pointer--;
    
    // Restore state
    const state = history.stack[history.pointer];
    this.currentForm = JSON.parse(JSON.stringify(state.data));
    this.isDirty = true;
    
    this.emit('undo', this.currentForm);
    
    // Trigger auto-save
    this.autoSave();
    
    return true;
  }
  
  // Redo last undone change
  redo() {
    if (!this.canRedo()) {
      return false;
    }
    
    const formId = this.currentForm.id;
    const history = formHistory.get(formId);
    
    // Move pointer forward
    history.pointer++;
    
    // Restore state
    const state = history.stack[history.pointer];
    this.currentForm = JSON.parse(JSON.stringify(state.data));
    this.isDirty = true;
    
    this.emit('redo', this.currentForm);
    
    // Trigger auto-save
    this.autoSave();
    
    return true;
  }
  
  // Check if can undo
  canUndo() {
    if (!this.currentForm) {
      return false;
    }
    
    const history = formHistory.get(this.currentForm.id);
    return history && history.pointer > 0;
  }
  
  // Check if can redo
  canRedo() {
    if (!this.currentForm) {
      return false;
    }
    
    const history = formHistory.get(this.currentForm.id);
    return history && history.pointer < history.stack.length - 1;
  }
  
  // Set current form
  setCurrentForm(formData) {
    this.currentForm = formData;
    this.isDirty = false;
    
    // Setup auto-save timer
    if (formData && formData.autoSave !== false) {
      this.startAutoSave();
    } else {
      this.stopAutoSave();
    }
  }
  
  // Start auto-save
  startAutoSave() {
    if (!this.currentForm) {
      return;
    }
    
    const formId = this.currentForm.id;
    
    // Clear existing timer
    this.stopAutoSave();
    
    // Set new timer
    const timer = setInterval(() => {
      if (this.isDirty && !this.isSaving) {
        this.save({ silent: true });
      }
    }, FORM_CONFIG.autoSaveDelay);
    
    autoSaveTimers.set(formId, timer);
  }
  
  // Stop auto-save
  stopAutoSave() {
    if (!this.currentForm) {
      return;
    }
    
    const formId = this.currentForm.id;
    const timer = autoSaveTimers.get(formId);
    
    if (timer) {
      clearInterval(timer);
      autoSaveTimers.delete(formId);
    }
  }
  
  // Validate form data structure
  validateFormData(formData) {
    if (!formData) {
      throw new Error('Form data is required');
    }
    
    if (!formData.surveyJSON && !formData.survey) {
      throw new Error('Form must contain survey data');
    }
    
    if (formData.name && formData.name.length > 255) {
      throw new Error('Form name is too long');
    }
    
    // Additional validation rules can be added here
  }
  
  // Validate form content
  async _validateForm() {
    if (!this.currentForm) {
      return { isValid: false, errors: ['No form loaded'] };
    }
    
    const errors = [];
    
    try {
      // Run custom validators
      for (const [field, validator] of validators) {
        const value = this.getPropertyValue(field);
        const result = await validator(value, this.currentForm);
        
        if (!result.isValid) {
          errors.push({
            field,
            message: result.message
          });
        }
      }
      
      // Validate survey structure
      if (this.currentForm.surveyJSON) {
        const surveyErrors = this.validateSurveyStructure(this.currentForm.surveyJSON);
        errors.push(...surveyErrors);
      }
      
      const isValid = errors.length === 0;
      
      this.emit('validated', { isValid, errors });
      
      return { isValid, errors };
      
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: [{ field: 'general', message: error.message }]
      };
    }
  }
  
  // Validate survey structure
  validateSurveyStructure(surveyJSON) {
    const errors = [];
    
    // Check pages
    if (!surveyJSON.pages || surveyJSON.pages.length === 0) {
      errors.push({
        field: 'pages',
        message: 'Survey must have at least one page'
      });
    }
    
    // Check questions
    let hasQuestions = false;
    surveyJSON.pages?.forEach((page, pageIndex) => {
      if (page.elements && page.elements.length > 0) {
        hasQuestions = true;
        
        // Validate each question
        page.elements.forEach((element, elementIndex) => {
          if (!element.type) {
            errors.push({
              field: `pages[${pageIndex}].elements[${elementIndex}]`,
              message: 'Question must have a type'
            });
          }
          
          if (!element.name) {
            errors.push({
              field: `pages[${pageIndex}].elements[${elementIndex}]`,
              message: 'Question must have a name'
            });
          }
        });
      }
    });
    
    if (!hasQuestions) {
      errors.push({
        field: 'questions',
        message: 'Survey must have at least one question'
      });
    }
    
    return errors;
  }
  
  // Prepare form data for saving
  prepareSaveData(formData) {
    // Clone data
    const saveData = JSON.parse(JSON.stringify(formData));
    
    // Remove client-only fields
    delete saveData._isDirty;
    delete saveData._validationErrors;
    
    // Update timestamp
    saveData.updated_at = new Date().toISOString();
    
    return saveData;
  }
  
  // Confirm form deletion
  async confirmDeletion(formId) {
    // In a real app, this would show a confirmation dialog
    return confirm('Are you sure you want to delete this form? This action cannot be undone.');
  }
  
  // Register custom validator
  registerValidator(field, validator) {
    validators.set(field, validator);
  }
  
  // Unregister validator
  unregisterValidator(field) {
    validators.delete(field);
  }
  
  // Clear all caches
  clearCache() {
    formCache.clear();
    this.emit('cacheCleared');
  }
  
  // Get form from cache
  getFromCache(formId) {
    const cached = formCache.get(formId);
    
    if (cached && Date.now() - cached.timestamp < FORM_CONFIG.cacheExpiry) {
      return cached.data;
    }
    
    return null;
  }
  
  // Export form
  async exportForm(formId, format = 'json') {
    try {
      const form = await this.load(formId);
      
      let exportData;
      let filename;
      let mimeType;
      
      switch (format) {
        case 'json':
          exportData = JSON.stringify(form, null, 2);
          filename = `${form.name || 'form'}-export.json`;
          mimeType = 'application/json';
          break;
          
        case 'pdf':
          // Would require PDF generation logic
          throw new Error('PDF export not implemented');
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Create download
      const blob = new Blob([exportData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.emit('exported', { formId, format });
      notifications.success('Form exported successfully');
      
    } catch (error) {
      this.emit('error', { action: 'export', error });
      notifications.error(`Failed to export form: ${error.message}`);
      throw error;
    }
  }
  
  // Import form
  async importForm(file) {
    try {
      const text = await file.text();
      const formData = JSON.parse(text);
      
      // Validate imported data
      this.validateFormData(formData);
      
      // Remove ID to create new form
      delete formData.id;
      
      // Create new form
      const newForm = await this.create(formData);
      
      this.emit('imported', newForm);
      notifications.success('Form imported successfully');
      
      return newForm;
      
    } catch (error) {
      this.emit('error', { action: 'import', error });
      notifications.error(`Failed to import form: ${error.message}`);
      throw error;
    }
  }
  
  // Clean up
  destroy() {
    // Stop auto-save
    this.stopAutoSave();
    
    // Clear caches
    formCache.clear();
    formHistory.clear();
    
    // Clear timers
    autoSaveTimers.forEach(timer => clearInterval(timer));
    autoSaveTimers.clear();
    
    // Clear subscribers
    this.subscribers.clear();
    
    // Clear state
    this.currentForm = null;
    this.isDirty = false;
    this.isSaving = false;
  }
}

// Create singleton instance
const formService = new FormService();

// Export instance and class
export default formService;
export { FORM_CONFIG };

// Template management utilities
export const templateService = {
  // List available templates
  async listTemplates() {
    try {
      const response = await templatesAPI.list();
      return response.data;
    } catch (error) {
      notifications.error('Failed to load templates');
      throw error;
    }
  },
  
  // Load template
  async loadTemplate(templateId) {
    try {
      const response = await templatesAPI.get(templateId);
      return response.data;
    } catch (error) {
      notifications.error('Failed to load template');
      throw error;
    }
  },
  
  // Create form from template
  async createFromTemplate(templateId, formName) {
    try {
      const template = await templateService.loadTemplate(templateId);
      
      const formData = {
        ...template,
        id: undefined,
        name: formName || `New ${template.name}`,
        is_template: false,
        template_id: templateId
      };
      
      return await formService.create(formData);
      
    } catch (error) {
      notifications.error('Failed to create form from template');
      throw error;
    }
  },
  
  // Save form as template
  async saveAsTemplate(formId, templateName) {
    try {
      const form = await formService.load(formId);
      
      const templateData = {
        ...form,
        id: undefined,
        name: templateName || `${form.name} Template`,
        is_template: true,
        source_form_id: formId
      };
      
      const response = await templatesAPI.create(templateData);
      notifications.success('Template created successfully');
      
      return response.data;
      
    } catch (error) {
      notifications.error('Failed to create template');
      throw error;
    }
  }
};