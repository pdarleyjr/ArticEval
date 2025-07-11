// Main entry point for the Form Builder application
import './styles/main.scss';

// Core modules
import { initializeDragDrop } from './core/dragDrop.js';
import { initializeEventHandlers } from './core/eventHandlers.js';
import { configureSurvey } from './core/surveyConfig.js';

// Services
import { FormService } from './services/formService.js';

// State management
import store from './state/store.js';

// Components
import { ElementTypeDialog } from './components/dialogs/ElementTypeDialog.js';
import { EditDialog } from './components/dialogs/EditDialog.js';
import { AIHelper } from './components/aiHelper.js';
import { PreviewModal } from './components/PreviewModal.js';

// Utilities
import notifications from './utils/notifications.js';
import { debounce } from './utils/debounce.js';

// Initialize the application
class FormBuilder {
  constructor() {
    this.initialized = false;
    this.survey = null;
    this.formService = new FormService();
    this.aiHelper = new AIHelper();
  }

  async init() {
    if (this.initialized) {
      console.warn('FormBuilder already initialized');
      return;
    }

    try {
      // Show loading state
      this.showLoadingState();

      // API is already initialized when imported
      
      // Configure SurveyJS
      this.survey = await configureSurvey();

      // Set up drag and drop
      initializeDragDrop(this.survey);

      // Set up event handlers
      initializeEventHandlers(this.survey);

      // Initialize components
      this.initializeComponents();

      // Load saved form if exists
      await this.loadSavedForm();

      // Set up auto-save
      this.setupAutoSave();

      // Hide loading state
      this.hideLoadingState();

      this.initialized = true;
      notifications.success('Form Builder loaded successfully');

    } catch (error) {
      console.error('Failed to initialize Form Builder:', error);
      notifications.error('Failed to initialize Form Builder');
      this.hideLoadingState();
    }
  }

  initializeComponents() {
    // Initialize dialogs
    window.elementTypeDialog = new ElementTypeDialog();
    window.editDialog = new EditDialog();
    window.previewModal = new PreviewModal();

    // Initialize AI Helper
    this.aiHelper.init();

    // Set up toolbox
    this.setupToolbox();

    // Set up property panel
    this.setupPropertyPanel();

    // Set up navigation
    this.setupNavigation();
  }

  setupToolbox() {
    const toolboxElement = document.getElementById('toolbox');
    if (!toolboxElement) return;

    // Search functionality
    const searchInput = toolboxElement.querySelector('#toolbox-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterToolboxItems(e.target.value);
      }, 300));
    }

    // Category expansion
    const categoryHeaders = toolboxElement.querySelectorAll('.toolbox-category-header');
    categoryHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const category = header.closest('.toolbox-category');
        category.classList.toggle('toolbox-category--collapsed');
      });
    });
  }

  setupPropertyPanel() {
    const propertyPanel = document.getElementById('property-panel');
    if (!propertyPanel) return;

    // Panel toggle
    const toggleBtn = propertyPanel.querySelector('.property-panel-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        propertyPanel.classList.toggle('property-panel--collapsed');
      });
    }

    // Subscribe to selection changes
    store.subscribe('selectedElement', (element) => {
      this.updatePropertyPanel(element);
    });
  }

  setupNavigation() {
    // Save button
    const saveBtn = document.getElementById('save-form');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveForm());
    }

    // Preview button
    const previewBtn = document.getElementById('preview-form');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.previewForm());
    }

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
      undoBtn.addEventListener('click', () => store.undo());
      store.subscribe('canUndo', (canUndo) => {
        undoBtn.disabled = !canUndo;
      });
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => store.redo());
      store.subscribe('canRedo', (canRedo) => {
        redoBtn.disabled = !canRedo;
      });
    }
  }

  setupAutoSave() {
    const autoSave = debounce(() => {
      this.saveForm(true);
    }, 30000); // Auto-save every 30 seconds

    store.subscribe('formData', () => {
      autoSave();
    });
  }

  async loadSavedForm() {
    const formId = this.getFormIdFromUrl();
    if (!formId) return;

    try {
      const formData = await this.formService.getForm(formId);
      if (formData) {
        this.survey.fromJSON(formData);
        store.set('formData', formData);
        notifications.success('Form loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load form:', error);
      notifications.error('Failed to load form');
    }
  }

  async saveForm(isAutoSave = false) {
    try {
      const formData = this.survey.toJSON();
      const formId = this.getFormIdFromUrl() || this.generateFormId();
      
      await this.formService.saveForm(formId, formData);
      
      if (!isAutoSave) {
        notifications.success('Form saved successfully');
      }
      
      // Update URL if new form
      if (!this.getFormIdFromUrl()) {
        window.history.replaceState({}, '', `?id=${formId}`);
      }
    } catch (error) {
      console.error('Failed to save form:', error);
      notifications.error('Failed to save form');
    }
  }

  async previewForm() {
    try {
      // Show loading state
      const loadingEl = this.showPreviewLoadingState();
      
      // Lazy load the PreviewModal component
      if (!window.previewModal) {
        const { PreviewModal } = await import('./components/PreviewModal.js');
        // PreviewModal constructor automatically attaches to window.previewModal
        new PreviewModal();
      }
      
      // Hide loading state
      if (loadingEl) {
        loadingEl.remove();
      }
      
      // Show the preview
      const formData = this.survey.toJSON();
      window.previewModal.show(formData);
    } catch (error) {
      console.error('Failed to load preview component:', error);
      notifications.error('Failed to load preview. Please try again.');
    }
  }
  
  showPreviewLoadingState() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'preview-loading';
    loadingEl.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Loading preview...</p>
    `;
    document.body.appendChild(loadingEl);
    return loadingEl;
  }

  filterToolboxItems(searchTerm) {
    const items = document.querySelectorAll('.toolbox-item');
    const categories = document.querySelectorAll('.toolbox-category');
    
    items.forEach(item => {
      const label = item.querySelector('.toolbox-item-label').textContent.toLowerCase();
      const matches = label.includes(searchTerm.toLowerCase());
      item.style.display = matches ? '' : 'none';
    });

    // Hide empty categories
    categories.forEach(category => {
      const visibleItems = category.querySelectorAll('.toolbox-item:not([style*="display: none"])');
      category.style.display = visibleItems.length > 0 ? '' : 'none';
    });
  }

  updatePropertyPanel(element) {
    const propertyContent = document.querySelector('.property-panel-content');
    if (!propertyContent) return;

    if (!element) {
      propertyContent.innerHTML = '<p class="property-panel-empty">Select an element to edit its properties</p>';
      return;
    }

    // Property panel content will be handled by SurveyJS property grid
    // This is just a placeholder for custom property handling if needed
  }

  showLoadingState() {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.display = 'flex';
    }
  }

  hideLoadingState() {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  getFormIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  generateFormId() {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  // Create global instance
  window.formBuilder = new FormBuilder();
  
  // Initialize the application
  window.formBuilder.init().catch(error => {
    console.error('Failed to initialize application:', error);
  });
}

// Export for testing
export { FormBuilder };