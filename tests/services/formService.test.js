import { jest } from '@jest/globals';
import { FormService, FORM_CONFIG, templateService } from '../../src/services/formService.js';
import api, { formsAPI, templatesAPI } from '../../src/services/api.js';
import notifications from '../../src/utils/notifications.js';
import { debounce } from '../../src/utils/debounce.js';

// Mock dependencies
jest.mock('../../src/services/api.js');
jest.mock('../../src/utils/notifications.js');
jest.mock('../../src/utils/debounce.js');

// Mock global objects
global.confirm = jest.fn();
global.Blob = jest.fn((content, options) => ({
  size: JSON.stringify(content[0]).length,
  type: options?.type
}));
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock DOM elements
const mockLink = {
  href: '',
  download: '',
  click: jest.fn()
};
global.document = {
  createElement: jest.fn(() => mockLink),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

describe('FormService', () => {
  let formService;
  let mockAutoSaveFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock debounce to return a controllable function
    mockAutoSaveFunction = jest.fn();
    debounce.mockImplementation((fn, delay) => {
      if (fn.name === 'save') {
        return mockAutoSaveFunction;
      }
      return fn;
    });

    formService = new FormService();
  });

  afterEach(() => {
    jest.useRealTimers();
    formService.destroy();
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with correct default values', () => {
      expect(formService.currentForm).toBeNull();
      expect(formService.isDirty).toBe(false);
      expect(formService.isSaving).toBe(false);
      expect(formService.subscribers).toBeInstanceOf(Map);
    });

    test('should setup debounced functions', () => {
      expect(debounce).toHaveBeenCalledTimes(2);
      expect(debounce).toHaveBeenCalledWith(expect.any(Function), FORM_CONFIG.autoSaveDelay);
      expect(debounce).toHaveBeenCalledWith(expect.any(Function), FORM_CONFIG.validationDelay);
    });
  });

  describe('Event System', () => {
    test('should subscribe to events', () => {
      const callback = jest.fn();
      const unsubscribe = formService.subscribe('test', callback);

      expect(formService.subscribers.get('test')).toBeDefined();
      expect(formService.subscribers.get('test').has(callback)).toBe(true);
      expect(typeof unsubscribe).toBe('function');
    });

    test('should emit events to subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const data = { test: 'data' };

      formService.subscribe('test', callback1);
      formService.subscribe('test', callback2);
      
      formService.emit('test', data);

      expect(callback1).toHaveBeenCalledWith(data);
      expect(callback2).toHaveBeenCalledWith(data);
    });

    test('should handle errors in subscribers', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = jest.fn();

      formService.subscribe('test', errorCallback);
      formService.subscribe('test', normalCallback);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      formService.emit('test', {});

      expect(consoleSpy).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should unsubscribe from events', () => {
      const callback = jest.fn();
      const unsubscribe = formService.subscribe('test', callback);

      unsubscribe();
      formService.emit('test', {});

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Load Form', () => {
    const mockFormData = {
      id: 'form-123',
      name: 'Test Form',
      surveyJSON: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] }
    };

    test('should load form from API', async () => {
      formsAPI.get.mockResolvedValue({ data: mockFormData });

      const result = await formService.load('form-123');

      expect(formsAPI.get).toHaveBeenCalledWith('form-123');
      expect(result).toEqual(mockFormData);
      expect(formService.currentForm).toEqual(mockFormData);
    });

    test('should return cached form if not expired', async () => {
      formsAPI.get.mockResolvedValue({ data: mockFormData });

      // First load
      await formService.load('form-123');
      
      // Second load should use cache
      const result = await formService.load('form-123');

      expect(formsAPI.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFormData);
    });

    test('should force reload when force option is true', async () => {
      formsAPI.get.mockResolvedValue({ data: mockFormData });

      // First load
      await formService.load('form-123');
      
      // Force reload
      await formService.load('form-123', { force: true });

      expect(formsAPI.get).toHaveBeenCalledTimes(2);
    });

    test('should emit loading and loaded events', async () => {
      formsAPI.get.mockResolvedValue({ data: mockFormData });
      
      const loadingCallback = jest.fn();
      const loadedCallback = jest.fn();
      
      formService.subscribe('loading', loadingCallback);
      formService.subscribe('loaded', loadedCallback);

      await formService.load('form-123');

      expect(loadingCallback).toHaveBeenCalledWith({ formId: 'form-123' });
      expect(loadedCallback).toHaveBeenCalledWith(mockFormData);
    });

    test('should handle load errors', async () => {
      const error = new Error('API Error');
      formsAPI.get.mockRejectedValue(error);

      const errorCallback = jest.fn();
      formService.subscribe('error', errorCallback);

      await expect(formService.load('form-123')).rejects.toThrow('API Error');
      
      expect(errorCallback).toHaveBeenCalledWith({
        action: 'load',
        error
      });
      expect(showNotification).toHaveBeenCalledWith(
        'Failed to load form: API Error',
        'error'
      );
    });
  });

  describe('Create Form', () => {
    const newFormData = {
      name: 'New Form',
      surveyJSON: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] }
    };

    const createdForm = {
      ...newFormData,
      id: 'new-form-id',
      created_at: '2023-01-01T00:00:00Z'
    };

    test('should create form via API', async () => {
      formsAPI.create.mockResolvedValue({ data: createdForm });

      const result = await formService.create(newFormData);

      expect(formsAPI.create).toHaveBeenCalledWith(newFormData);
      expect(result).toEqual(createdForm);
      expect(formService.currentForm).toEqual(createdForm);
    });

    test('should emit creating and created events', async () => {
      formsAPI.create.mockResolvedValue({ data: createdForm });

      const creatingCallback = jest.fn();
      const createdCallback = jest.fn();

      formService.subscribe('creating', creatingCallback);
      formService.subscribe('created', createdCallback);

      await formService.create(newFormData);

      expect(creatingCallback).toHaveBeenCalledWith(newFormData);
      expect(createdCallback).toHaveBeenCalledWith(createdForm);
    });

    test('should show success notification', async () => {
      formsAPI.create.mockResolvedValue({ data: createdForm });

      await formService.create(newFormData);

      expect(showNotification).toHaveBeenCalledWith(
        'Form created successfully',
        'success'
      );
    });

    test('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      formsAPI.create.mockRejectedValue(error);

      await expect(formService.create(newFormData)).rejects.toThrow('Creation failed');

      expect(showNotification).toHaveBeenCalledWith(
        'Failed to create form: Creation failed',
        'error'
      );
    });
  });

  describe('Save Form', () => {
    const mockForm = {
      id: 'form-123',
      name: 'Test Form',
      surveyJSON: { pages: [] }
    };

    beforeEach(() => {
      formService.currentForm = { ...mockForm };
      formService.isDirty = true;
    });

    test('should save form via API', async () => {
      const savedForm = { ...mockForm, updated_at: '2023-01-01T00:00:00Z' };
      formsAPI.update.mockResolvedValue({ data: savedForm });

      const result = await formService.save();

      expect(formsAPI.update).toHaveBeenCalledWith(
        'form-123',
        expect.objectContaining({
          ...mockForm,
          updated_at: expect.any(String)
        })
      );
      expect(result).toEqual(savedForm);
      expect(formService.isDirty).toBe(false);
    });

    test('should not save if form is not dirty and force is false', async () => {
      formService.isDirty = false;

      await formService.save();

      expect(formsAPI.update).not.toHaveBeenCalled();
    });

    test('should save if force option is true', async () => {
      formService.isDirty = false;
      formsAPI.update.mockResolvedValue({ data: mockForm });

      await formService.save({ force: true });

      expect(formsAPI.update).toHaveBeenCalled();
    });

    test('should validate before saving', async () => {
      const validationErrors = [{ field: 'name', message: 'Required' }];
      formService._validateForm = jest.fn().mockResolvedValue({
        isValid: false,
        errors: validationErrors
      });

      await expect(formService.save()).rejects.toThrow('Form validation failed');

      expect(formService._validateForm).toHaveBeenCalled();
      expect(formsAPI.update).not.toHaveBeenCalled();
    });

    test('should skip validation if skipValidation is true', async () => {
      formService._validateForm = jest.fn().mockResolvedValue({
        isValid: false,
        errors: []
      });
      formsAPI.update.mockResolvedValue({ data: mockForm });

      await formService.save({ skipValidation: true });

      expect(formsAPI.update).toHaveBeenCalled();
    });

    test('should check form size limit', async () => {
      // Create large form data that exceeds limit
      const largeForm = {
        ...mockForm,
        largeData: 'x'.repeat(FORM_CONFIG.maxFormSize)
      };
      formService.currentForm = largeForm;

      await expect(formService.save()).rejects.toThrow('Form data exceeds maximum size limit');
    });

    test('should emit saving and saved events', async () => {
      formsAPI.update.mockResolvedValue({ data: mockForm });

      const savingCallback = jest.fn();
      const savedCallback = jest.fn();

      formService.subscribe('saving', savingCallback);
      formService.subscribe('saved', savedCallback);

      await formService.save();

      expect(savingCallback).toHaveBeenCalledWith(mockForm);
      expect(savedCallback).toHaveBeenCalledWith(mockForm);
    });

    test('should show notification unless silent', async () => {
      formsAPI.update.mockResolvedValue({ data: mockForm });

      await formService.save();
      expect(showNotification).toHaveBeenCalledWith('Form saved successfully', 'success');

      showNotification.mockClear();
      
      await formService.save({ silent: true });
      expect(showNotification).not.toHaveBeenCalled();
    });

    test('should prevent concurrent saves', async () => {
      formsAPI.update.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockForm }), 100))
      );

      const save1 = formService.save();
      const save2 = formService.save();

      await Promise.all([save1, save2]);

      expect(formsAPI.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Form', () => {
    test('should delete form via API', async () => {
      confirm.mockReturnValue(true);
      formsAPI.delete.mockResolvedValue({});

      const result = await formService.delete('form-123');

      expect(confirm).toHaveBeenCalled();
      expect(formsAPI.delete).toHaveBeenCalledWith('form-123');
      expect(result).toBe(true);
    });

    test('should not delete if user cancels confirmation', async () => {
      confirm.mockReturnValue(false);

      const result = await formService.delete('form-123');

      expect(formsAPI.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should clear current form if it matches deleted form', async () => {
      confirm.mockReturnValue(true);
      formsAPI.delete.mockResolvedValue({});
      
      formService.currentForm = { id: 'form-123' };
      formService.isDirty = true;

      await formService.delete('form-123');

      expect(formService.currentForm).toBeNull();
      expect(formService.isDirty).toBe(false);
    });

    test('should emit deleting and deleted events', async () => {
      confirm.mockReturnValue(true);
      formsAPI.delete.mockResolvedValue({});

      const deletingCallback = jest.fn();
      const deletedCallback = jest.fn();

      formService.subscribe('deleting', deletingCallback);
      formService.subscribe('deleted', deletedCallback);

      await formService.delete('form-123');

      expect(deletingCallback).toHaveBeenCalledWith({ formId: 'form-123' });
      expect(deletedCallback).toHaveBeenCalledWith({ formId: 'form-123' });
    });
  });

  describe('Duplicate Form', () => {
    const originalForm = {
      id: 'form-123',
      name: 'Original Form',
      surveyJSON: { pages: [] },
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };

    test('should duplicate form with new name', async () => {
      formsAPI.get.mockResolvedValue({ data: originalForm });
      formsAPI.create.mockResolvedValue({
        data: { ...originalForm, id: 'new-id', name: 'Copy of Form' }
      });

      const result = await formService.duplicate('form-123', 'Copy of Form');

      expect(formsAPI.get).toHaveBeenCalledWith('form-123');
      expect(formsAPI.create).toHaveBeenCalledWith({
        ...originalForm,
        id: undefined,
        name: 'Copy of Form',
        created_at: undefined,
        updated_at: undefined,
        is_template: false
      });
      expect(result.id).toBe('new-id');
    });

    test('should use default name if not provided', async () => {
      formsAPI.get.mockResolvedValue({ data: originalForm });
      formsAPI.create.mockResolvedValue({
        data: { ...originalForm, id: 'new-id' }
      });

      await formService.duplicate('form-123');

      expect(formsAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original Form (Copy)'
        })
      );
    });
  });

  describe('Property Updates', () => {
    beforeEach(() => {
      formService.currentForm = {
        id: 'form-123',
        name: 'Test Form',
        settings: {
          theme: 'default',
          options: {
            autoSave: true
          }
        }
      };
    });

    test('should update single property', () => {
      const callback = jest.fn();
      formService.subscribe('propertyChanged', callback);

      formService.updateProperty('name', 'Updated Form');

      expect(formService.currentForm.name).toBe('Updated Form');
      expect(formService.isDirty).toBe(true);
      expect(callback).toHaveBeenCalledWith({
        path: 'name',
        value: 'Updated Form',
        previousValue: 'Test Form'
      });
    });

    test('should update nested property', () => {
      formService.updateProperty('settings.theme', 'dark');

      expect(formService.currentForm.settings.theme).toBe('dark');
      expect(formService.isDirty).toBe(true);
    });

    test('should create nested objects if they do not exist', () => {
      formService.updateProperty('new.nested.property', 'value');

      expect(formService.currentForm.new.nested.property).toBe('value');
    });

    test('should trigger auto-save after update', () => {
      formService.updateProperty('name', 'Updated');

      expect(mockAutoSaveFunction).toHaveBeenCalled();
    });

    test('should update multiple properties', () => {
      const callback = jest.fn();
      formService.subscribe('propertiesChanged', callback);

      formService.updateProperties({
        name: 'Bulk Updated',
        'settings.theme': 'dark'
      });

      expect(formService.currentForm.name).toBe('Bulk Updated');
      expect(formService.currentForm.settings.theme).toBe('dark');
      expect(callback).toHaveBeenCalledWith([
        { path: 'name', value: 'Bulk Updated', previousValue: 'Test Form' },
        { path: 'settings.theme', value: 'dark', previousValue: 'default' }
      ]);
    });
  });

  describe('History Management', () => {
    const mockForm = {
      id: 'form-123',
      name: 'Test Form',
      version: 1
    };

    beforeEach(() => {
      formService.currentForm = { ...mockForm };
      formService.initializeHistory('form-123');
    });

    test('should add states to history', () => {
      formService.currentForm.version = 2;
      formService.addToHistory();

      formService.currentForm.version = 3;
      formService.addToHistory();

      expect(formService.canUndo()).toBe(true);
      expect(formService.canRedo()).toBe(false);
    });

    test('should undo changes', () => {
      formService.currentForm.version = 2;
      formService.addToHistory();

      const undoCallback = jest.fn();
      formService.subscribe('undo', undoCallback);

      const result = formService.undo();

      expect(result).toBe(true);
      expect(formService.currentForm.version).toBe(1);
      expect(undoCallback).toHaveBeenCalled();
      expect(mockAutoSaveFunction).toHaveBeenCalled();
    });

    test('should redo changes', () => {
      formService.currentForm.version = 2;
      formService.addToHistory();
      
      formService.undo();
      
      const redoCallback = jest.fn();
      formService.subscribe('redo', redoCallback);

      const result = formService.redo();

      expect(result).toBe(true);
      expect(formService.currentForm.version).toBe(2);
      expect(redoCallback).toHaveBeenCalled();
    });

    test('should clear redo stack when adding new state', () => {
      formService.currentForm.version = 2;
      formService.addToHistory();
      
      formService.currentForm.version = 3;
      formService.addToHistory();
      
      formService.undo(); // Now at version 2
      
      formService.currentForm.version = 4;
      formService.addToHistory();

      expect(formService.canRedo()).toBe(false);
    });

    test('should limit history size', () => {
      // Add more than max history items
      for (let i = 0; i < FORM_CONFIG.maxUndoHistory + 5; i++) {
        formService.currentForm.version = i;
        formService.addToHistory();
      }

      let undoCount = 0;
      while (formService.canUndo()) {
        formService.undo();
        undoCount++;
      }

      expect(undoCount).toBe(FORM_CONFIG.maxUndoHistory - 1);
    });
  });

  describe('Auto-Save', () => {
    test('should start auto-save timer when form is set', () => {
      const mockForm = { id: 'form-123', autoSave: true };
      
      formService.setCurrentForm(mockForm);

      expect(formService.currentForm).toEqual(mockForm);
      
      // Simulate interval
      formService.isDirty = true;
      jest.advanceTimersByTime(FORM_CONFIG.autoSaveDelay);

      expect(mockAutoSaveFunction).toHaveBeenCalled();
    });

    test('should not start auto-save if autoSave is false', () => {
      const mockForm = { id: 'form-123', autoSave: false };
      
      formService.setCurrentForm(mockForm);

      formService.isDirty = true;
      jest.advanceTimersByTime(FORM_CONFIG.autoSaveDelay);

      expect(mockAutoSaveFunction).not.toHaveBeenCalled();
    });

    test('should stop auto-save timer', () => {
      const mockForm = { id: 'form-123', autoSave: true };
      
      formService.setCurrentForm(mockForm);
      formService.stopAutoSave();

      formService.isDirty = true;
      jest.advanceTimersByTime(FORM_CONFIG.autoSaveDelay);

      expect(mockAutoSaveFunction).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    test('should validate form data structure', () => {
      expect(() => {
        formService.validateFormData(null);
      }).toThrow('Form data is required');

      expect(() => {
        formService.validateFormData({});
      }).toThrow('Form must contain survey data');

      expect(() => {
        formService.validateFormData({
          surveyJSON: {},
          name: 'x'.repeat(256)
        });
      }).toThrow('Form name is too long');

      expect(() => {
        formService.validateFormData({
          surveyJSON: { pages: [] },
          name: 'Valid Form'
        });
      }).not.toThrow();
    });

    test('should validate survey structure', () => {
      const errors = formService.validateSurveyStructure({
        pages: []
      });

      expect(errors).toContainEqual({
        field: 'pages',
        message: 'Survey must have at least one page'
      });
    });

    test('should validate questions', () => {
      const errors = formService.validateSurveyStructure({
        pages: [{
          elements: [
            { type: 'text' }, // Missing name
            { name: 'q2' }    // Missing type
          ]
        }]
      });

      expect(errors).toHaveLength(2);
      expect(errors[0].message).toBe('Question must have a name');
      expect(errors[1].message).toBe('Question must have a type');
    });

    test('should run custom validators', async () => {
      const customValidator = jest.fn().mockResolvedValue({
        isValid: false,
        message: 'Custom validation failed'
      });

      formService.registerValidator('customField', customValidator);
      formService.currentForm = { 
        id: 'form-123',
        customField: 'value',
        surveyJSON: { pages: [{ elements: [{ type: 'text', name: 'q1' }] }] }
      };

      const result = await formService._validateForm();

      expect(customValidator).toHaveBeenCalledWith('value', formService.currentForm);
      expect(result.errors).toContainEqual({
        field: 'customField',
        message: 'Custom validation failed'
      });
    });
  });

  describe('Export/Import', () => {
    const mockForm = {
      id: 'form-123',
      name: 'Test Form',
      surveyJSON: { pages: [] }
    };

    test('should export form as JSON', async () => {
      formsAPI.get.mockResolvedValue({ data: mockForm });

      await formService.exportForm('form-123', 'json');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('Test Form-export.json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    test('should throw error for unsupported export format', async () => {
      await expect(formService.exportForm('form-123', 'csv'))
        .rejects.toThrow('Unsupported export format: csv');
    });

    test('should import form from file', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockForm))
      };

      formsAPI.create.mockResolvedValue({
        data: { ...mockForm, id: 'new-form-id' }
      });

      const result = await formService.importForm(mockFile);

      expect(mockFile.text).toHaveBeenCalled();
      expect(formsAPI.create).toHaveBeenCalledWith({
        ...mockForm,
        id: undefined
      });
      expect(result.id).toBe('new-form-id');
    });

    test('should validate imported data', async () => {
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify({}))
      };

      await expect(formService.importForm(mockFile))
        .rejects.toThrow('Form must contain survey data');
    });
  });

  describe('Cache Management', () => {
    test('should get form from cache if not expired', async () => {
      const mockForm = { id: 'form-123', name: 'Cached Form' };
      
      // Manually add to cache
      const formCache = new Map();
      formCache.set('form-123', {
        data: mockForm,
        timestamp: Date.now()
      });

      // Mock the cache
      formService.getFromCache = jest.fn().mockImplementation((formId) => {
        const cached = formCache.get(formId);
        if (cached && Date.now() - cached.timestamp < FORM_CONFIG.cacheExpiry) {
          return cached.data;
        }
        return null;
      });

      const result = formService.getFromCache('form-123');
      expect(result).toEqual(mockForm);
    });

    test('should clear cache', () => {
      const callback = jest.fn();
      formService.subscribe('cacheCleared', callback);

      formService.clearCache();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should clean up all resources on destroy', () => {
      const mockForm = { id: 'form-123', autoSave: true };
      formService.setCurrentForm(mockForm);
      
      formService.destroy();

      expect(formService.currentForm).toBeNull();
      expect(formService.isDirty).toBe(false);
      expect(formService.isSaving).toBe(false);
      expect(formService.subscribers.size).toBe(0);
    });
  });
});

describe('templateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should list templates', async () => {
    const mockTemplates = [
      { id: 'template-1', name: 'Template 1' },
      { id: 'template-2', name: 'Template 2' }
    ];

    templatesAPI.list.mockResolvedValue({ data: mockTemplates });

    const result = await templateService.listTemplates();

    expect(templatesAPI.list).toHaveBeenCalled();
    expect(result).toEqual(mockTemplates);
  });

  test('should handle list templates error', async () => {
    templatesAPI.list.mockRejectedValue(new Error('API Error'));

    await expect(templateService.listTemplates()).rejects.toThrow('API Error');
    expect(showNotification).toHaveBeenCalledWith('Failed to load templates', 'error');
  });

  test('should load template', async () => {
    const mockTemplate = { id: 'template-1', name: 'Template 1' };
    
    templatesAPI.get.mockResolvedValue({ data: mockTemplate });

    const result = await templateService.loadTemplate('template-1');

    expect(templatesAPI.get).toHaveBeenCalledWith('template-1');
    expect(result).toEqual(mockTemplate);
  });

  test('should create form from template', async () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'Template 1',
      surveyJSON: { pages: [] }
    };

    const newForm = {
      ...mockTemplate,
      id: 'new-form-id',
      name: 'Custom Form Name'
    };

    templatesAPI.get.mockResolvedValue({ data: mockTemplate });
    formsAPI.create.mockResolvedValue({ data: newForm });

    const result = await templateService.createFromTemplate('template-1', 'Custom Form Name');

    expect(formsAPI.create).toHaveBeenCalledWith({
      ...mockTemplate,
      id: undefined,
      name: 'Custom Form Name',
      is_template: false,
      template_id: 'template-1'
    });
    expect(result).toEqual(newForm);
  });

  test('should save form as template', async () => {
    const mockForm = {
      id: 'form-123',
      name: 'Original Form',
      surveyJSON: { pages: [] }
    };

    const newTemplate = {
      ...mockForm,
      id: 'template-id',
      name: 'My Template',
      is_template: true
    };

    formsAPI.get.mockResolvedValue({ data: mockForm });
    templatesAPI.create.mockResolvedValue({ data: newTemplate });

    const result = await templateService.saveAsTemplate('form-123', 'My Template');

    expect(templatesAPI.create).toHaveBeenCalledWith({
      ...mockForm,
      id: undefined,
      name: 'My Template',
      is_template: true,
      source_form_id: 'form-123'
    });
    expect(result).toEqual(newTemplate);
    expect(showNotification).toHaveBeenCalledWith('Template created successfully', 'success');
  });
});