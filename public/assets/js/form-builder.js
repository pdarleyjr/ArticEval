// @ts-nocheck
/* eslint-disable */
/** @format */

/**
 * Custom Form Builder for IPLC ArticEval
 * Creates JSON definitions compatible with SurveyJS Form Library
 * Enhanced with comprehensive SLP/OT evaluation sections
 * @class IPLCFormBuilder
 */
class IPLCFormBuilder {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.templateId = null;
        this.formData = {
            title: '',
            description: '',
            pages: [{
                name: 'page1',
                title: 'Page 1',
                elements: []
            }],
            isFormLocked: false,
            formPasscode: ''
        };
        this.currentPageIndex = 0;
        this.selectedElement = null;
        
        // Undo/Redo system
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Field templates
        this.fieldTemplates = this.initFieldTemplates();
        
        // Initialize form builder tour
        this.tour = new FormBuilderTour();
        
        // Check if this is the first time user
        if (!localStorage.getItem('formBuilderTourCompleted')) {
            // Show tour after a short delay to let the form builder fully load
            setTimeout(() => {
                this.tour.startTour();
            }, 1000);
        }
        
        this.init();
    }

    init() {
        try {
            this.checkForEditMode();
            this.initializeBuilder();
            this.loadQuickTemplates();
        } catch (error) {
            console.error('FormBuilder: Critical error during initialization:', error);
            this.showNotification('Form builder initialization failed: ' + error.message, 'error');
            
            // Show fallback error state
            const container = this.container;
            if (container) {
                // Clear container using secure DOM manipulation
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                
                const errorDiv = HtmlEscape.createElement('div', {
                    style: 'text-align: center; padding: 2rem; color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 0.25rem; margin: 1rem;'
                });
                
                const title = HtmlEscape.createElement('h3');
                HtmlEscape.setTextContent(title, 'Form Builder Initialization Error');
                errorDiv.appendChild(title);
                
                const errorPara = HtmlEscape.createElement('p');
                const errorStrong = HtmlEscape.createElement('strong');
                HtmlEscape.setTextContent(errorStrong, 'Error: ');
                errorPara.appendChild(errorStrong);
                errorPara.appendChild(HtmlEscape.createTextNode(error.message));
                errorDiv.appendChild(errorPara);
                
                const refreshPara = HtmlEscape.createElement('p');
                HtmlEscape.setTextContent(refreshPara, 'Please refresh the page to try again.');
                errorDiv.appendChild(refreshPara);
                
                const refreshButton = HtmlEscape.createElement('button', {
                    className: 'btn btn-danger touch-target'
                });
                HtmlEscape.setTextContent(refreshButton, 'Refresh Page');
                refreshButton.addEventListener('click', () => window.location.reload());
                errorDiv.appendChild(refreshButton);
                
                container.appendChild(errorDiv);
            }
            
            // Re-throw for debugging in development
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                throw error;
            }
        }
    }

    // Task B: Enhanced loadQuickTemplates with robust error handling
    async loadQuickTemplates() {
        const dropdown = document.getElementById('quickTemplateSelect');
        
        if (!dropdown) {
            console.warn('FormBuilder: Quick templates dropdown not found');
            return;
        }

        let response = null;
        
        try {
            // Show loading state with visual feedback
            // Clear existing options safely
            while (dropdown.firstChild) {
                dropdown.removeChild(dropdown.firstChild);
            }
            
            // Create loading option using HtmlEscape
            const loadingOption = HtmlEscape.createElement('option', {
                value: ''
            });
            HtmlEscape.setTextContent(loadingOption, 'Loading templates...');
            dropdown.appendChild(loadingOption);
            
            dropdown.disabled = true;
            dropdown.style.cursor = 'wait';
            
            // Show loading notification for better UI feedback
            this.showNotification('Loading templates...', 'info');

            // Fetch templates from API endpoint with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            try {
                response = await fetch('/api/forms/templates', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                // Handle specific fetch errors
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out. Please check your connection and try again.');
                } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
                    throw new Error('Network error. Please check your internet connection.');
                } else {
                    throw new Error(`Network request failed: ${fetchError.message}`);
                }
            }

            // Check if request was successful (MDN: fetch doesn't reject on HTTP errors)
            if (!response.ok) {
                // Provide specific error messages based on status code
                let errorMessage = '';
                switch (response.status) {
                    case 404:
                        errorMessage = 'Templates endpoint not found. Please contact support.';
                        break;
                    case 500:
                    case 502:
                    case 503:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    case 401:
                    case 403:
                        errorMessage = 'Access denied. Please check your permissions.';
                        break;
                    default:
                        errorMessage = `Server returned error ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            // Parse JSON response with explicit error handling
            let result;
            try {
                const responseText = await response.text();
                if (!responseText) {
                    throw new Error('Empty response from server');
                }
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('FormBuilder: JSON parsing error:', parseError);
                console.error('FormBuilder: Raw response:', responseText);
                throw new Error('Invalid response format from server. Please try again.');
            }

            // Check if API response indicates success
            if (!result.success) {
                throw new Error(result.message || 'Failed to load templates from server');
            }

            // Extract templates from response with validation
            const templates = result.data?.templates || result.data || [];
            
            // Validate templates array
            if (!Array.isArray(templates)) {
                console.error('FormBuilder: Invalid templates data structure:', templates);
                throw new Error('Invalid templates data received from server');
            }

            // Clear dropdown safely
            while (dropdown.firstChild) {
                dropdown.removeChild(dropdown.firstChild);
            }
            
            // Add default option using HtmlEscape
            const defaultOption = HtmlEscape.createElement('option', {
                value: ''
            });
            HtmlEscape.setTextContent(defaultOption, 'Select a template...');
            dropdown.appendChild(defaultOption);

            // Populate dropdown with templates
            if (templates.length > 0) {
                templates.forEach((template, index) => {
                    try {
                        // Validate template object
                        if (!template || typeof template !== 'object') {
                            console.warn(`FormBuilder: Invalid template at index ${index}:`, template);
                            return;
                        }
                        
                        const option = document.createElement('option');
                        option.value = template.id || '';
                        option.textContent = template.name || `Template ${template.id || index + 1}`;
                        
                        // Add description as title attribute for tooltip
                        if (template.description) {
                            option.title = template.description;
                        }
                        
                        dropdown.appendChild(option);
                    } catch (optionError) {
                        console.error(`FormBuilder: Error creating option for template ${index}:`, optionError);
                    }
                });
                
                // Show success notification
                this.showNotification(`Loaded ${templates.length} template${templates.length !== 1 ? 's' : ''}`, 'success');
            } else {
                // No templates found
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No templates available';
                option.disabled = true;
                dropdown.appendChild(option);
                
                // Show info notification
                this.showNotification('No templates available yet', 'info');
            }

        } catch (error) {
            console.error('FormBuilder: Error loading quick templates:', error);
            console.error('FormBuilder: Error stack:', error.stack);
            
            // Show detailed error state in dropdown safely
            while (dropdown.firstChild) {
                dropdown.removeChild(dropdown.firstChild);
            }
            
            const errorOption = HtmlEscape.createElement('option', {
                value: ''
            });
            HtmlEscape.setTextContent(errorOption, `⚠️ ${error.message}`);
            dropdown.appendChild(errorOption);
            
            // Add retry option
            const retryOption = document.createElement('option');
            retryOption.value = 'retry';
            retryOption.textContent = '🔄 Click to retry';
            dropdown.appendChild(retryOption);
            
            // Show user-friendly error notification with toast/alert
            this.showNotification(`Failed to load templates: ${error.message}`, 'error');
            
            // Log to console for debugging
            if (response) {
                console.error('FormBuilder: Response status:', response.status);
                console.error('FormBuilder: Response headers:', response.headers);
            }
            
        } finally {
            // Re-enable dropdown and restore cursor
            dropdown.disabled = false;
            dropdown.style.cursor = 'pointer';
            
            // Add retry handler if error occurred
            if (dropdown.querySelector('option[value="retry"]')) {
                dropdown.addEventListener('change', (e) => {
                    if (e.target.value === 'retry') {
                        e.target.value = ''; // Reset selection
                        this.loadQuickTemplates(); // Retry loading
                    }
                }, { once: true });
            }
        }
    }

    // Task A: Load and apply a specific quick template by ID
    async loadQuickTemplate(templateId) {
        if (!templateId) {
            return;
        }

        try {
            // Show loading state
            this.showNotification('Loading template...', 'info');

            // Fetch individual template from API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            let response;
            try {
                response = await fetch(`/api/forms/templates/${templateId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out. Please check your connection and try again.');
                }
                throw new Error(`Network error: ${fetchError.message}`);
            }

            // Check if request was successful
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load template (HTTP ${response.status}): ${errorText}`);
            }

            // Parse JSON response
            const template = await response.json();

            // Apply the template to the current form
            await this.applyTemplate(template);

        } catch (error) {
            console.error('FormBuilder: Error loading quick template:', error);
            this.showNotification('Failed to load template: ' + error.message, 'error');
        }
    }

    // Task A: Apply template to current form with format conversion
    async applyTemplate(template) {
        try {
            // Save current state to history before applying template
            this.saveToHistory();

            // Update form metadata
            if (template.name) {
                this.formData.title = template.name;
                const titleInput = document.getElementById('formTitle');
                if (titleInput) {
                    titleInput.value = template.name;
                }
            }

            if (template.description) {
                this.formData.description = template.description;
                const descInput = document.getElementById('formDescription');
                if (descInput) {
                    descInput.value = template.description;
                }
            }

            // Apply template sections/pages
            if (template.sections && Array.isArray(template.sections)) {
                // Check if this is SurveyJS format (pages with elements) or legacy format
                if (template.sections.length > 0 && template.sections[0].elements !== undefined) {
                    // SurveyJS format - use directly
                    this.formData.pages = template.sections;
                } else {
                    // Legacy format - convert to SurveyJS format
                    this.formData = this.convertLegacyToSurveyJS(template.sections);
                }
            } else if (template.pages && Array.isArray(template.pages)) {
                // Direct pages format
                this.formData.pages = template.pages;
            }

            // Preserve form settings if they exist in template
            if (template.showLogo !== undefined) {
                this.formData.showLogo = template.showLogo;
                const logoCheckbox = document.getElementById('showLogoCheckbox');
                if (logoCheckbox) {
                    logoCheckbox.checked = template.showLogo;
                }
            }

            // Reset current page to first page
            this.currentPageIndex = 0;
            this.selectedElement = null;

            // Re-render the form builder
            this.renderPageTabs();
            this.renderFormElements();

            // Update page title input
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle && this.formData.pages[0]) {
                pageTitle.value = this.formData.pages[0].title || '';
            }

            // Clear properties panel
            const propertiesPanel = document.getElementById('propertiesPanel');
            if (propertiesPanel) {
                // Clear panel content safely
                while (propertiesPanel.firstChild) {
                    propertiesPanel.removeChild(propertiesPanel.firstChild);
                }
                
                // Create empty properties message
                const emptyDiv = HtmlEscape.createElement('div', {
                    className: 'empty-properties'
                });
                HtmlEscape.setTextContent(emptyDiv, 'Select an element to edit its properties');
                propertiesPanel.appendChild(emptyDiv);
            }

            // Mark as unsaved changes
            this.hasUnsavedChanges = true;
            this.debouncedSave();

            // Show success notification
            this.showNotification(`Template "${template.name || 'Unknown'}" applied successfully!`, 'success');

            // Reset dropdown selection
            const dropdown = document.getElementById('quickTemplateSelect');
            if (dropdown) {
                dropdown.value = '';
            }

        } catch (error) {
            console.error('FormBuilder: Error applying template:', error);
            this.showNotification('Failed to apply template: ' + error.message, 'error');
        }
    }

    // Task A: Convert legacy template format to SurveyJS format
    convertLegacyToSurveyJS(legacySections) {
        const formData = {
            title: this.formData.title || '',
            description: this.formData.description || '',
            pages: []
        };

        // Convert each legacy section to a SurveyJS page
        if (legacySections && Array.isArray(legacySections)) {
            legacySections.forEach((section, index) => {
                const page = {
                    name: section.id || `page${index + 1}`,
                    title: section.title || section.name || `Page ${index + 1}`,
                    elements: []
                };

                // Convert legacy fields to SurveyJS elements
                if (section.fields && Array.isArray(section.fields)) {
                    section.fields.forEach(field => {
                        const element = {
                            type: this.mapLegacyFieldType(field.type),
                            name: field.name || field.id || `field_${Date.now()}`,
                            title: field.label || field.title || field.name || 'Untitled Field'
                        };

                        // Map common field properties
                        if (field.required) {
                            element.isRequired = true;
                        }

                        if (field.placeholder) {
                            element.placeholder = field.placeholder;
                        }

                        if (field.description) {
                            element.description = field.description;
                        }

                        // Map choices for selection fields
                        if (field.options && Array.isArray(field.options)) {
                            element.choices = field.options;
                        } else if (field.choices && Array.isArray(field.choices)) {
                            element.choices = field.choices;
                        }

                        // Map input type for text fields
                        if (field.inputType) {
                            element.inputType = field.inputType;
                        }

                        // Map validation rules
                        if (field.validation) {
                            if (field.validation.minLength) element.minLength = field.validation.minLength;
                            if (field.validation.maxLength) element.maxLength = field.validation.maxLength;
                            if (field.validation.min) element.min = field.validation.min;
                            if (field.validation.max) element.max = field.validation.max;
                        }

                        page.elements.push(element);
                    });
                }

                formData.pages.push(page);
            });
        }

        // Ensure at least one page exists
        if (formData.pages.length === 0) {
            formData.pages.push({
                name: 'page1',
                title: 'Page 1',
                elements: []
            });
        }

        return formData;
    }

    // Task A: Map legacy field types to SurveyJS element types
    mapLegacyFieldType(legacyType) {
        const typeMapping = {
            // Text inputs
            'text': 'text',
            'textarea': 'comment',
            'textinput': 'text',
            'input': 'text',
            
            // Specialized text inputs
            'email': 'text',
            'tel': 'text',
            'phone': 'text',
            'number': 'text',
            'date': 'text',
            'time': 'text',
            'datetime': 'text',
            'url': 'text',
            'password': 'text',
            
            // Selection inputs
            'select': 'dropdown',
            'dropdown': 'dropdown',
            'radio': 'radiogroup',
            'radiogroup': 'radiogroup',
            'checkbox': 'checkbox',
            'checkboxes': 'checkbox',
            'multiselect': 'checkbox',
            
            // Other field types
            'boolean': 'boolean',
            'yesno': 'boolean',
            'rating': 'rating',
            'scale': 'rating',
            'slider': 'rating',
            'file': 'file',
            'upload': 'file',
            'signature': 'signaturepad',
            'signaturepad': 'signaturepad',
            
            // Layout elements
            'html': 'html',
            'content': 'html',
            'section': 'panel',
            'panel': 'panel',
            'group': 'panel',
            'fieldset': 'panel',
            
            // Matrix types
            'matrix': 'matrix',
            'table': 'matrix',
            'grid': 'matrix'
        };

        // Return mapped type or default to 'text'
        return typeMapping[legacyType?.toLowerCase()] || 'text';
    }
    
    // Reusable builder initialization method - can be called to reset builder state
    initializeBuilder() {
        
        
        // Clear any existing state that might cause read-only issues
        this.selectedElement = null;
        this.copiedElement = null;
        
        // Ensure form is not accidentally locked
        if (!this.formData.isFormLocked) {
            // Reset UI to editable state
            const draggables = document.querySelectorAll('.draggable-element');
            draggables.forEach(el => {
                el.setAttribute('draggable', 'true');
                el.style.opacity = '1';
                el.style.cursor = 'move';
            });
        }
        
        // Render the builder interface
        this.render();
        
        // Re-attach all event listeners
        this.attachEventListeners();
        
        // Setup auto-save functionality
        this.setupAutoSave();
        
        // Register custom question types with SurveyJS
        this.registerCustomQuestionTypes();
        
        // Add complex editor styles
        this.addComplexEditorStyles();
        
        // Restore panel state from localStorage
        this.restorePanelState();
        
        // Setup touch gestures for mobile
        this.setupTouchGestures();
        
        // Initialize auto-pagination
        this.initializeAutoPagination();
        
        // Ensure builder is in correct state
        this.updateLockUI();
        
        
    }
    
    // Restore properties panel state from localStorage
    restorePanelState() {
        const isCollapsed = localStorage.getItem('propertiesPanel_collapsed') === 'true';
        const propertiesPanel = document.getElementById('builderProperties');
        const toggleIcon = document.getElementById('toggleIcon');
        const builderCanvas = document.querySelector('.builder-canvas');
        
        if (isCollapsed && propertiesPanel) {
            propertiesPanel.classList.add('collapsed');
            if (toggleIcon) {
                toggleIcon.textContent = '▶';
            }
            // Also expand the canvas when panel is collapsed
            if (builderCanvas) {
                builderCanvas.classList.add('expanded');
            }
        }
    }

    render() {
        // Clear container using secure DOM manipulation
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'form-builder-container';

        // Create header
        const header = document.createElement('div');
        header.className = 'builder-header';
        
        const h2 = document.createElement('h2');
        h2.textContent = this.options.mode === 'edit' ? 'Edit Form' : 'Create New Form';
        header.appendChild(h2);

        // Create builder actions
        const actions = document.createElement('div');
        actions.className = 'builder-actions';

        // Create action buttons
        const actionButtons = [
            { action: 'undo', class: 'btn btn-secondary btn-sm touch-target', title: 'Undo (Ctrl+Z)', icon: '↶', text: '' },
            { action: 'redo', class: 'btn btn-secondary btn-sm touch-target', title: 'Redo (Ctrl+Y)', icon: '↷', text: '' },
            { separator: true },
            { action: 'startTour', class: 'btn btn-secondary touch-target', title: 'Start Tour (?)', icon: '🎓', text: ' Tour' },
            { action: 'showHelp', class: 'btn btn-secondary touch-target', title: 'Help (F1)', icon: '❓', text: ' Help' },
            { separator: true },
            { action: 'preview', class: 'btn btn-secondary touch-target', title: '', icon: '👁️', text: ' Preview' },
            { action: 'saveAsTemplate', class: 'btn btn-info touch-target', title: 'Save as Template', icon: '📋', text: ' Save as Template' },
            { action: 'toggleFormLock', class: 'btn btn-warning touch-target', title: 'Lock/Unlock Form', icon: '🔓', text: ' Lock Form', lockButton: true },
            { action: 'save', class: 'btn btn-primary touch-target', title: '', icon: '💾', text: ' Save Form' }
        ];

        actionButtons.forEach(buttonInfo => {
            if (buttonInfo.separator) {
                const sep = document.createElement('span');
                sep.style.cssText = 'width: 1px; height: 24px; background: #ddd; margin: 0 0.5rem;';
                actions.appendChild(sep);
            } else {
                const btn = document.createElement('button');
                btn.className = buttonInfo.class;
                btn.setAttribute('data-action', buttonInfo.action);
                if (buttonInfo.title) btn.title = buttonInfo.title;
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'icon';
                if (buttonInfo.lockButton) iconSpan.id = 'lockIcon';
                iconSpan.textContent = buttonInfo.icon;
                btn.appendChild(iconSpan);
                
                if (buttonInfo.text) {
                    if (buttonInfo.lockButton) {
                        const textSpan = document.createElement('span');
                        textSpan.id = 'lockText';
                        textSpan.textContent = 'Lock Form';
                        btn.appendChild(textSpan);
                    } else {
                        btn.appendChild(document.createTextNode(buttonInfo.text));
                    }
                }
                
                actions.appendChild(btn);
            }
        });

        header.appendChild(actions);
        mainContainer.appendChild(header);

        // Create main builder section
        const builderMain = document.createElement('div');
        builderMain.className = 'builder-main';

        // Create left panel (toolbox)
        const toolbox = document.createElement('div');
        toolbox.className = 'builder-toolbox';

        // Creator field
        const creatorField = document.createElement('div');
        creatorField.className = 'creator-field';
        const creatorLabel = document.createElement('label');
        creatorLabel.setAttribute('for', 'creatorName');
        creatorLabel.textContent = 'Created by';
        const creatorInput = document.createElement('input');
        creatorInput.type = 'text';
        creatorInput.id = 'creatorName';
        creatorInput.placeholder = 'Your name';
        creatorField.appendChild(creatorLabel);
        creatorField.appendChild(creatorInput);
        toolbox.appendChild(creatorField);

        // Quick Templates section
        const quickTemplates = document.createElement('div');
        quickTemplates.className = 'quick-templates-section';
        const quickH3 = document.createElement('h3');
        quickH3.textContent = 'Quick Templates';
        quickTemplates.appendChild(quickH3);
        
        const quickSelect = document.createElement('select');
        quickSelect.id = 'quickTemplateSelect';
        quickSelect.className = 'template-select';
        quickSelect.addEventListener('change', (e) => this.loadQuickTemplate(e.target.value));
        const quickDefaultOption = document.createElement('option');
        quickDefaultOption.value = '';
        quickDefaultOption.textContent = 'Select a template...';
        quickSelect.appendChild(quickDefaultOption);
        quickTemplates.appendChild(quickSelect);
        
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-sm btn-secondary touch-target';
        refreshBtn.setAttribute('data-action', 'refreshTemplates');
        refreshBtn.title = 'Refresh Templates';
        const refreshIcon = document.createElement('span');
        refreshIcon.className = 'icon';
        refreshIcon.textContent = '🔄';
        refreshBtn.appendChild(refreshIcon);
        quickTemplates.appendChild(refreshBtn);
        toolbox.appendChild(quickTemplates);

        // Field Templates section
        const fieldTemplates = document.createElement('div');
        fieldTemplates.className = 'field-templates-section';
        const fieldH3 = document.createElement('h3');
        fieldH3.textContent = 'Field Templates';
        fieldTemplates.appendChild(fieldH3);
        
        const fieldSelect = document.createElement('select');
        fieldSelect.id = 'fieldTemplateSelect';
        fieldSelect.className = 'template-select';
        fieldSelect.addEventListener('change', (e) => this.insertFieldTemplate(e.target.value));
        const fieldDefaultOption = document.createElement('option');
        fieldDefaultOption.value = '';
        fieldDefaultOption.textContent = 'Select a field template...';
        fieldSelect.appendChild(fieldDefaultOption);
        
        // Add field template options
        Object.entries(this.fieldTemplates).forEach(([key, template]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = template.name;
            fieldSelect.appendChild(option);
        });
        
        fieldTemplates.appendChild(fieldSelect);
        toolbox.appendChild(fieldTemplates);

        // Form Elements section
        const elementsH3 = document.createElement('h3');
        elementsH3.textContent = 'Form Elements';
        toolbox.appendChild(elementsH3);
        
        const elementCategories = document.createElement('div');
        elementCategories.className = 'element-categories';
        this.renderToolboxCategories(elementCategories);
        toolbox.appendChild(elementCategories);

        builderMain.appendChild(toolbox);

        // Create center panel (canvas)
        const canvas = document.createElement('div');
        canvas.className = 'builder-canvas';

        // Form metadata drawer
        const details = document.createElement('details');
        details.id = 'metaDrawer';
        details.className = 'form-metadata-drawer';
        
        const summary = document.createElement('summary');
        summary.className = 'form-metadata-summary';
        const summaryIcon = document.createElement('span');
        summaryIcon.className = 'summary-icon';
        summaryIcon.textContent = '📝';
        const summaryText = document.createElement('span');
        summaryText.className = 'summary-text';
        summaryText.textContent = 'Form Details';
        const summaryChevron = document.createElement('span');
        summaryChevron.className = 'summary-chevron';
        summaryChevron.textContent = '▶';
        summary.appendChild(summaryIcon);
        summary.appendChild(summaryText);
        summary.appendChild(summaryChevron);
        details.appendChild(summary);
        
        const metaContent = document.createElement('div');
        metaContent.className = 'form-metadata-content';
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.id = 'formTitle';
        titleInput.placeholder = 'Form Title';
        titleInput.value = this.formData.title || '';
        titleInput.className = 'form-title-input';
        const descTextarea = document.createElement('textarea');
        descTextarea.id = 'formDescription';
        descTextarea.placeholder = 'Form Description';
        descTextarea.className = 'form-description-input';
        descTextarea.textContent = this.formData.description || '';
        metaContent.appendChild(titleInput);
        metaContent.appendChild(descTextarea);
        details.appendChild(metaContent);
        canvas.appendChild(details);

        // Page navigation
        const pageNav = document.createElement('div');
        pageNav.className = 'page-navigation';
        const pageTabs = document.createElement('div');
        pageTabs.className = 'page-tabs';
        pageTabs.id = 'pageTabs';
        pageNav.appendChild(pageTabs);
        
        const addPageBtn = document.createElement('button');
        addPageBtn.className = 'btn btn-sm btn-secondary touch-target';
        addPageBtn.setAttribute('data-action', 'addPage');
        const addPageIcon = document.createElement('span');
        addPageIcon.className = 'icon';
        addPageIcon.textContent = '➕';
        addPageBtn.appendChild(addPageIcon);
        addPageBtn.appendChild(document.createTextNode(' Add Page'));
        pageNav.appendChild(addPageBtn);
        canvas.appendChild(pageNav);

        // Form page
        const formPage = document.createElement('div');
        formPage.className = 'form-page';
        formPage.id = 'formPage';
        
        const pageTitleContainer = document.createElement('div');
        pageTitleContainer.className = 'page-title-container';
        const pageTitleInput = document.createElement('input');
        pageTitleInput.type = 'text';
        pageTitleInput.id = 'pageTitle';
        pageTitleInput.placeholder = 'Page Title';
        pageTitleInput.className = 'page-title-input';
        pageTitleContainer.appendChild(pageTitleInput);
        formPage.appendChild(pageTitleContainer);
        
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.id = 'dropZone';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Drag elements here to build your form';
        dropZone.appendChild(emptyState);
        formPage.appendChild(dropZone);
        canvas.appendChild(formPage);

        builderMain.appendChild(canvas);

        // Create right panel (properties)
        const properties = document.createElement('div');
        properties.className = 'builder-properties';
        properties.id = 'builderProperties';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'properties-toggle touch-target';
        toggleBtn.setAttribute('data-action', 'togglePropertiesPanel');
        toggleBtn.title = 'Toggle Properties Panel';
        const toggleIcon = document.createElement('span');
        toggleIcon.id = 'toggleIcon';
        toggleIcon.textContent = '◀';
        toggleBtn.appendChild(toggleIcon);
        properties.appendChild(toggleBtn);
        
        const propsH3 = document.createElement('h3');
        propsH3.textContent = 'Element Properties';
        properties.appendChild(propsH3);
        
        const propsPanel = document.createElement('div');
        propsPanel.id = 'propertiesPanel';
        propsPanel.className = 'properties-content';
        const emptyProps = document.createElement('div');
        emptyProps.className = 'empty-properties';
        emptyProps.textContent = 'Select an element to edit its properties';
        propsPanel.appendChild(emptyProps);
        properties.appendChild(propsPanel);

        // Form Settings Section
        const formSettings = document.createElement('div');
        formSettings.className = 'form-settings-section';
        formSettings.style.cssText = 'margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e1e4e8;';
        
        const settingsH3 = document.createElement('h3');
        settingsH3.textContent = 'Form Settings';
        formSettings.appendChild(settingsH3);
        
        const propGroup = document.createElement('div');
        propGroup.className = 'property-group';
        
        const propLabel = document.createElement('label');
        propLabel.className = 'property-label';
        
        const logoCheckbox = document.createElement('input');
        logoCheckbox.type = 'checkbox';
        logoCheckbox.id = 'showLogoCheckbox';
        logoCheckbox.checked = this.formData.showLogo !== false;
        logoCheckbox.addEventListener('change', (e) => this.updateFormSetting('showLogo', e.target.checked));
        
        propLabel.appendChild(logoCheckbox);
        propLabel.appendChild(document.createTextNode(' Show IPLC Logo'));
        propGroup.appendChild(propLabel);
        
        const small = document.createElement('small');
        small.style.cssText = 'display: block; color: #666; margin-top: 0.25rem;';
        small.textContent = 'Displays the IPLC logo at the top of the form';
        propGroup.appendChild(small);
        
        formSettings.appendChild(propGroup);
        properties.appendChild(formSettings);

        builderMain.appendChild(properties);
        mainContainer.appendChild(builderMain);

        // Add to container
        this.container.appendChild(mainContainer);

        this.renderPageTabs();
        this.renderFormElements();
        this.addStyles();
    }

    renderToolboxCategories(container) {
        const categories = [
            {
                name: 'Basic Elements',
                elements: [
                    { type: 'text', icon: '📝', label: 'Text Input' },
                    { type: 'comment', icon: '📄', label: 'Text Area' },
                    { type: 'dropdown', icon: '📋', label: 'Dropdown' },
                    { type: 'radiogroup', icon: '⭕', label: 'Radio Group' },
                    { type: 'checkbox', icon: '☑️', label: 'Checkbox' },
                    { type: 'boolean', icon: '✅', label: 'Yes/No' },
                    { type: 'rating', icon: '⭐', label: 'Rating' },
                    { type: 'signaturepad', icon: '✍️', label: 'Signature Field' }
                ]
            },
            {
                name: 'Relevant Background History',
                elements: [
                    { type: 'client-info', icon: '👤', label: 'Client Demographics', custom: true, category: 'client-info' },
                    { type: 'referral-info', icon: '📋', label: 'Referral Information', custom: true, category: 'client-info' },
                    { type: 'insurance-info', icon: '🏥', label: 'Insurance Information', custom: true, category: 'client-info' },
                    { type: 'parent-caregiver', icon: '👥', label: 'Parent/Caregiver Info', custom: true, category: 'client-info' },
                    { type: 'medical-history', icon: '📑', label: 'Medical History', custom: true, category: 'client-info' }
                ]
            },
            {
                name: 'SLP Components',
                elements: [
                    { type: 'oral-mechanism', icon: '👄', label: 'Oral Mechanism Exam', custom: true, category: 'slp' },
                    { type: 'language-assessment', icon: '💬', label: 'Language Assessment', custom: true, category: 'slp' },
                    { type: 'articulation-assessment', icon: '🗣️', label: 'Articulation Assessment', custom: true, category: 'slp' },
                    { type: 'fluency-voice', icon: '🎵', label: 'Fluency & Voice', custom: true, category: 'slp' },
                    { type: 'pragmatic-skills', icon: '🤝', label: 'Pragmatic Skills', custom: true, category: 'slp' },
                    { type: 'feeding-swallowing', icon: '🥄', label: 'Feeding/Swallowing', custom: true, category: 'slp' },
                    { type: 'test-scores', icon: '📊', label: 'Test Scores Section', custom: true, category: 'slp' }
                ]
            },
            {
                name: 'OT Components',
                elements: [
                    { type: 'adl-skills', icon: '🚿', label: 'ADL Skills', custom: true, category: 'ot' },
                    { type: 'sensory-processing', icon: '✋', label: 'Sensory Processing', custom: true, category: 'ot' },
                    { type: 'motor-skills', icon: '🏃', label: 'Motor Skills', custom: true, category: 'ot' },
                    { type: 'visual-perceptual', icon: '👁️', label: 'Visual Perceptual', custom: true, category: 'ot' },
                    { type: 'fine-motor', icon: '✊', label: 'Fine Motor Skills', custom: true, category: 'ot' },
                    { type: 'gross-motor', icon: '🏃‍♂️', label: 'Gross Motor Skills', custom: true, category: 'ot' },
                    { type: 'handwriting', icon: '✏️', label: 'Handwriting Assessment', custom: true, category: 'ot' }
                ]
            },
            {
                name: 'Clinical Documentation',
                elements: [
                    { type: 'iplc-logo', icon: '🏥', label: 'IPLC Logo', custom: true, category: 'clinical-doc' },
                    { type: 'iplc-header', icon: '🏥', label: 'IPLC Header', custom: true, category: 'clinical-doc' },
                    { type: 'background-history', icon: '📚', label: 'Background History', custom: true, category: 'clinical-doc' },
                    { type: 'behavioral-observations', icon: '👀', label: 'Behavioral Observations', custom: true, category: 'clinical-doc' },
                    { type: 'clinical-impressions', icon: '🔍', label: 'Clinical Impressions', custom: true, category: 'clinical-doc' },
                    { type: 'goals-objectives', icon: '🎯', label: 'Goals & Objectives', custom: true, category: 'clinical-doc' },
                    { type: 'recommendations', icon: '💡', label: 'Recommendations', custom: true, category: 'clinical-doc' },
                    { type: 'signature-section', icon: '✍️', label: 'Signatures & Consent', custom: true, category: 'clinical-doc' }
                ]
            },
            {
                name: 'AI Features',
                elements: [
                    { type: 'ai-summary', icon: '🤖', label: 'AI Summary', custom: true, category: 'ai' },
                    { type: 'ai-goals', icon: '🎯', label: 'AI Goal Generator', custom: true, category: 'ai' },
                    { type: 'ai-recommendations', icon: '💡', label: 'AI Recommendations', custom: true, category: 'ai' }
                ]
            }
        ];

        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category.name;
            categoryDiv.appendChild(categoryTitle);
            
            category.elements.forEach(el => {
                const elementDiv = document.createElement('div');
                elementDiv.className = 'draggable-element';
                elementDiv.setAttribute('data-type', el.type);
                if (el.custom) {
                    elementDiv.setAttribute('data-custom', 'true');
                }
                if (el.category) {
                    elementDiv.setAttribute('data-category', el.category);
                }
                elementDiv.setAttribute('draggable', 'true');
                
                const iconSpan = document.createElement('span');
                iconSpan.className = 'icon';
                iconSpan.textContent = el.icon;
                elementDiv.appendChild(iconSpan);
                
                elementDiv.appendChild(document.createTextNode(' ' + el.label));
                
                categoryDiv.appendChild(elementDiv);
            });
            
            container.appendChild(categoryDiv);
        });
    }

    // Toggle properties panel visibility
    togglePropertiesPanel() {
        const propertiesPanel = document.getElementById('builderProperties');
        const toggleIcon = document.getElementById('toggleIcon');
        const isCollapsed = propertiesPanel.classList.contains('collapsed');
        
        const builderCanvas = document.querySelector('.builder-canvas');
        
        if (isCollapsed) {
            // Expand panel
            propertiesPanel.classList.remove('collapsed');
            toggleIcon.textContent = '◀';
            localStorage.setItem('propertiesPanel_collapsed', 'false');
            
            // Remove expanded class from canvas
            if (builderCanvas) {
                builderCanvas.classList.remove('expanded');
            }
            
            // Show notification
            this.showNotification('Properties panel expanded');
        } else {
            // Collapse panel
            propertiesPanel.classList.add('collapsed');
            toggleIcon.textContent = '▶';
            localStorage.setItem('propertiesPanel_collapsed', 'true');
            
            // Add expanded class to canvas to use full width
            if (builderCanvas) {
                builderCanvas.classList.add('expanded');
            }
            
            // Show notification
            this.showNotification('Properties panel collapsed');
        }
        
        // Trigger window resize event for any components that need to recalculate
        window.dispatchEvent(new Event('resize'));
    }

    addStyles() {
        if (document.getElementById('form-builder-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'form-builder-styles';
        styles.textContent = `
            :root {
                --builder-bg: #ffffff;
                --header-bg: #ffffff;
                --border-color: #e1e4e8;
                --toolbox-bg: #ffffff;
                --canvas-bg: #f8f9fa;
                --properties-bg: #ffffff;
                --text-color: #2c3e50;
                --text-light: #586069;
                --primary-color: #0B60D1;
                --primary-hover: #0952a5;
                --danger-color: #d32f2f;
                --danger-hover: #c62828;
                --touch-target-size: 44px;
                --focus-outline: 3px solid var(--primary-hover);
            }
            .form-builder-container {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                background: var(--builder-bg);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .builder-header {
                background: var(--header-bg);
                padding: 1rem 2rem;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .builder-main {
                flex: 1;
                display: flex;
                overflow: hidden;
                width: 100%;
            }
            .builder-toolbox, .builder-properties {
                background: var(--toolbox-bg);
                border-right: 1px solid var(--border-color);
                padding: 1rem;
                overflow-y: auto;
                flex-shrink: 0;
            }
            .builder-toolbox { width: 280px; }
            .builder-properties { width: 300px; border-left: 1px solid var(--border-color); border-right: none; }
            
            .touch-target, .btn, button, input[type="button"], input[type="submit"], [role="button"] {
                min-width: var(--touch-target-size);
                min-height: var(--touch-target-size);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 1rem;
                margin: 4px;
                cursor: pointer;
                border-radius: 4px;
                border: 1px solid var(--border-color);
                background-color: var(--builder-bg);
                color: var(--text-color);
                font-size: 1rem;
                transition: all 0.2s ease;
                -webkit-tap-highlight-color: transparent;
            }
            .touch-target:focus, .btn:focus, button:focus {
                outline: none;
                box-shadow: 0 0 0 2px var(--builder-bg), 0 0 0 4px var(--primary-color);
            }
            
            .btn-primary { background-color: var(--primary-color); color: white; border-color: var(--primary-color); }
            .btn-primary:hover { background-color: var(--primary-hover); border-color: var(--primary-hover); }
            .btn-danger { background-color: var(--danger-color); color: white; border-color: var(--danger-color); }
            .btn-danger:hover { background-color: var(--danger-hover); border-color: var(--danger-hover); }
            
            /* Element type buttons in modal */
            .element-type-btn {
                padding: 10px 20px;
                border: 1px solid #ddd;
                background-color: white;
                color: var(--text-color);
                transition: all 0.3s ease;
                cursor: pointer;
                text-align: center;
                font-size: 14px;
                font-weight: 500;
            }
            .element-type-btn:hover {
                background-color: #f5f5f5;
                border-color: var(--primary-color);
                transform: translateY(-2px);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            .element-type-btn:active {
                transform: translateY(0);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .draggable-element, .form-element, .page-tab {
                min-height: var(--touch-target-size);
                 align-items: center;
            }
            
            .draggable-element {
                background: #f6f8fa;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 0.75rem;
                margin-bottom: 0.5rem;
                cursor: move;
                display: flex;
                gap: 0.5rem;
                user-select: none;
            }

            .form-element {
                background: white;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 1rem;
                margin-bottom: 1rem;
                cursor: pointer;
                position: relative;
            }
            .form-element.selected {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(11, 96, 209, 0.25);
            }

            .page-tab.active { background: var(--primary-color); color: white; }

            .modal-header .btn-close, .remove-btn {
                 background: none;
                 border: none;
                 font-size: 1.5rem;
            }
            .remove-btn { color: var(--danger-color); }
            .remove-btn:hover { background-color: var(--danger-color); color:white; }
        `;
        document.head.appendChild(styles);
    }

    renderPageTabs() {
        const tabsContainer = document.getElementById('pageTabs');
        // Clear container safely
        while (tabsContainer.firstChild) {
            tabsContainer.removeChild(tabsContainer.firstChild);
        }
        
        // Create tabs using DOM manipulation
        this.formData.pages.forEach((page, index) => {
            const tab = document.createElement('div');
            tab.className = `page-tab touch-target ${index === this.currentPageIndex ? 'active' : ''}`;
            tab.setAttribute('data-page-index', index);
            tab.textContent = page.title || `Page ${index + 1}`;
            
            // Add pointer event handler
            tab.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const pageIndex = parseInt(tab.dataset.pageIndex);
                this.switchPage(pageIndex);
            });
            
            tabsContainer.appendChild(tab);
        });
    }

    renderFormElements() {
        const dropZone = document.getElementById('dropZone');
        const currentPage = this.formData.pages[this.currentPageIndex];
        
        // Clear drop zone safely
        while (dropZone.firstChild) {
            dropZone.removeChild(dropZone.firstChild);
        }
        
        if (!currentPage.elements || currentPage.elements.length === 0) {
            // Create empty state using DOM manipulation
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Drag elements here to build your form';
            dropZone.appendChild(emptyState);
            return;
        }

        // Use secure DOM manipulation to render elements
        currentPage.elements.forEach((element, index) => {
            const elementDOM = this.renderFormElementDOM(element, index);
            dropZone.appendChild(elementDOM);
        });
        
        // T-Fix-4: Apply touch-target styles after rendering
        this.addTouchTargets();
    }
    // T-Fix-4: Add touch-target class to interactive elements
    addTouchTargets() {
        // Query for all interactive elements that need touch compliance
        const interactiveElements = document.querySelectorAll([
            'button:not(.touch-target)',
            'input[type="button"]:not(.touch-target)',
            'input[type="submit"]:not(.touch-target)',
            '[role="button"]:not(.touch-target)',
            '.draggable-element:not(.touch-target)',
            '.form-element:not(.touch-target)',
            '.page-tab:not(.touch-target)',
            '.edit-btn:not(.touch-target)',
            '.remove-btn:not(.touch-target)',
            '.element-type-btn:not(.touch-target)',
            'select:not(.touch-target)',
            'a[href]:not(.touch-target)',
            '.clickable:not(.touch-target)'
        ].join(', '));
        
        // Add touch-target class to all interactive elements
        interactiveElements.forEach(element => {
            // Skip if element already has adequate size
            const rect = element.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // WCAG 2.5.5 requires minimum 44x44 CSS pixels
            if (width < 44 || height < 44) {
                element.classList.add('touch-target');
            }
        });
        
        // Apply touch-target styles to small inputs that need larger hit areas
        const smallInputs = document.querySelectorAll([
            'input[type="checkbox"]:not(.touch-target)',
            'input[type="radio"]:not(.touch-target)'
        ].join(', '));
        
        smallInputs.forEach(input => {
            // For checkboxes and radios, we need to ensure the label provides adequate target
            const label = input.closest('label');
            if (label) {
                label.classList.add('touch-target');
            } else {
                // If no parent label, add touch-target to the input itself
                input.classList.add('touch-target');
            }
        });
        
        // Log touch target application for debugging
        console.log(`FormBuilder: Applied touch-target class to ${interactiveElements.length} interactive elements`);
    }
    
    renderFormElement(element, index) {
        // Check if this is a panel with sub-elements
        const isPanelType = element.type === 'panel' || element.type === 'paneldynamic';
        const hasSubElements = isPanelType && element.elements && element.elements.length > 0;
        
        // Add special styling for pre-configured panels
        const isPreConfigured = element.name && (
            element.name.includes('client_demographics') ||
            element.name.includes('oral_mechanism') ||
            element.name.includes('language_assessment') ||
            element.name.includes('medical_history') ||
            element.name.includes('insurance_information') ||
            element.name.includes('parent_caregiver') ||
            element.name.includes('referral_information') ||
            element.name.includes('articulation_assessment') ||
            element.name.includes('fluency_voice') ||
            element.name.includes('pragmatic_skills') ||
            element.name.includes('feeding_swallowing') ||
            element.name.includes('adl_assessment') ||
            element.name.includes('sensory_processing') ||
            element.name.includes('motor_skills') ||
            element.name.includes('visual_perceptual') ||
            element.name.includes('fine_motor') ||
            element.name.includes('gross_motor') ||
            element.name.includes('handwriting_assessment') ||
            element.name.includes('background_history') ||
            element.name.includes('behavioral_observations') ||
            element.name.includes('clinical_impressions') ||
            element.name.includes('recommendations_section') ||
            element.name.includes('signatures')
        );
        
        const elementTypeIcon = this.getElementTypeIcon(element.type);
        
        // Task F: Use centralized divider injection system
        const topDivider = this.createSectionDivider('element-separator', index === 0);
        const bottomDivider = this.createSectionDivider(isPanelType ? 'panel-separator' : 'element-separator');
        
        return `
            ${topDivider}
            <div class="form-element ${this.selectedElement === index ? 'selected' : ''} ${isPanelType ? 'panel-element' : ''} ${isPreConfigured ? 'pre-configured' : ''}"
                 data-index="${index}"
                 data-action="selectElement"
                 title="${isPanelType ? 'Double-click to edit panel and its elements' : 'Double-click to edit'}">
                <div class="element-header">
                    <div class="element-info">
                        <span class="element-type-icon">${elementTypeIcon}</span>
                        <span class="element-type">${element.title || element.name || 'Untitled'}</span>
                        ${hasSubElements ? `<span class="sub-element-indicator" style="font-size: 0.8em; color: #666; margin-left: 0.5rem;">(${element.elements.length} fields)</span>` : ''}
                        ${isPreConfigured ? '<span class="pre-configured-badge" style="font-size: 0.7em; background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 0.5rem;">Pre-configured</span>' : ''}
                    </div>
                    <div class="element-actions">
                        <button data-action="editElement" data-index="${index}" title="${isPanelType ? 'Edit Panel & Elements' : 'Edit'}" class="edit-btn ${isPanelType ? 'panel-edit' : ''} touch-target">
                            ✏️
                        </button>
                        <button data-action="moveElement" data-index="${index}" data-direction="-1" title="Move Up" class="touch-target">↑</button>
                        <button data-action="moveElement" data-index="${index}" data-direction="1" title="Move Down" class="touch-target">↓</button>
                        <button data-action="duplicateElement" data-index="${index}" title="Duplicate" class="touch-target">📋</button>
                        <button data-action="deleteElement" data-index="${index}" title="Delete" class="touch-target">🗑️</button>
                    </div>
                </div>
                ${hasSubElements ? this.renderPanelPreview(element) : ''}
            </div>
            ${bottomDivider}
        `;
    }
    
    // Get icon for element type
    getElementTypeIcon(type) {
        const icons = {
            'text': '📝',
            'comment': '📄',
            'dropdown': '📋',
            'radiogroup': '⭕',
            'checkbox': '☑️',
            'boolean': '✅',
            'rating': '⭐',
            'signaturepad': '✍️',
            'panel': '📦',
            'paneldynamic': '📦',
            'matrix': '📊',
            'matrixdynamic': '📊',
            'html': '📄',
            'ai-summary': '🤖'
        };
        return icons[type] || '📝';
    }
    
    // Task F: Centralized section divider creation system
    createSectionDivider(type = 'default', isFirst = false) {
        const dividerTypes = {
            'default': 'section-divider',
            'element-separator': 'section-divider',
            'panel-separator': 'section-divider panel-separator',
            'subtle': 'section-divider subtle',
            'gradient': 'section-divider gradient'
        };
        
        const className = dividerTypes[type] || 'section-divider';
        const role = 'presentation';
        const ariaHidden = 'true';
        
        // Skip divider for first element to avoid extra spacing at top
        if (isFirst) {
            return '';
        }
        
        return `<hr class="${className}" role="${role}" aria-hidden="${ariaHidden}">`;
    }
    
    // Inject dividers into preview content for visual consistency
    injectDividersIntoPreview() {
        // Find all SurveyJS elements in preview and add dividers between them
        const surveyContainer = document.getElementById('surveyPreview');
        if (!surveyContainer) return;
        
        // Wait for Survey.js to render content
        setTimeout(() => {
            const questions = surveyContainer.querySelectorAll('.sv-question, .sv-panel');
            questions.forEach((question, index) => {
                if (index > 0) {
                    // Create divider element
                    const divider = document.createElement('hr');
                    divider.className = 'section-divider';
                    divider.role = 'presentation';
                    divider.setAttribute('aria-hidden', 'true');
                    
                    // Insert before current question
                    question.parentNode.insertBefore(divider, question);
                }
            });
        }, 100);
    }
    
    // Apply consistent divider styling throughout the form builder
    applyCentralizedDividerStyling() {
        // Update all existing dividers to use centralized styling
        const existingDividers = document.querySelectorAll('.form-element hr, .drop-zone hr');
        existingDividers.forEach(divider => {
            if (!divider.classList.contains('section-divider')) {
                divider.className = 'section-divider';
                divider.role = 'presentation';
                divider.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    // Render a preview of panel contents
    renderPanelPreview(panel) {
        if (!panel.elements || panel.elements.length === 0) return '';
        
        const maxPreviewItems = 3;
        const elements = panel.elements.slice(0, maxPreviewItems);
        const moreCount = panel.elements.length - maxPreviewItems;
        
        return `
            <div class="panel-preview" style="margin-top: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85em; color: #6c757d;">
                <div style="margin-bottom: 0.25rem; font-weight: 500;">Contains:</div>
                ${elements.map(el => `
                    <div style="margin-left: 1rem; padding: 2px 0;">
                        • ${el.title || el.name || 'Untitled'} (${el.type})
                    </div>
                `).join('')}
                ${moreCount > 0 ? `<div style="margin-left: 1rem; padding: 2px 0; font-style: italic;">... and ${moreCount} more</div>` : ''}
            </div>
        `;
    }

    attachEventListeners() {
        
        // Track unsaved changes
        this.hasUnsavedChanges = false;
        
        document.getElementById('formTitle').addEventListener('input', (e) => {
            this.formData.title = e.target.value;
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        });

        document.getElementById('formDescription').addEventListener('input', (e) => {
            this.formData.description = e.target.value;
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        });

        document.getElementById('pageTitle').addEventListener('input', (e) => {
            this.formData.pages[this.currentPageIndex].title = e.target.value;
            this.renderPageTabs();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        });

        // Track creator name changes
        const creatorInput = document.getElementById('creatorName');
        if (creatorInput) {
            creatorInput.addEventListener('input', (e) => {
                this.hasUnsavedChanges = true;
                this.debouncedSave();
            });
        }

        
        this.setupDragAndDrop();
        
        this.setupKeyboardShortcuts();
        this.setupTouchGestures();
        
        // Add keyboard navigation for properties panel
        document.addEventListener('keydown', (e) => {
            // Escape key collapses properties panel
            if (e.key === 'Escape') {
                const propertiesPanel = document.getElementById('builderProperties');
                if (propertiesPanel && !propertiesPanel.classList.contains('collapsed')) {
                    this.togglePropertiesPanel();
                }
            }
        });

        // Add event delegation for form elements
        this.setupFormElementEventDelegation();
    }

    // Setup event delegation for form elements using Pointer Events API
    setupFormElementEventDelegation() {
            const dropZone = document.getElementById('dropZone');
            if (!dropZone) return;
    
            let lastPointerDownTime = 0;
            let lastPointerDownTarget = null;
            const DOUBLE_TAP_THRESHOLD = 300; // milliseconds
    
            // Handle pointer down events on form elements
            dropZone.addEventListener('pointerdown', (e) => {
                e.preventDefault(); // Prevent default touch behavior
                
                const formElement = e.target.closest('.form-element');
                if (!formElement) return;
                
                const index = parseInt(formElement.dataset.index);
                if (isNaN(index)) return;
    
                const currentTime = Date.now();
                
                // Check for double-tap/double-click
                if (lastPointerDownTarget === formElement &&
                    (currentTime - lastPointerDownTime) < DOUBLE_TAP_THRESHOLD) {
                    // Double-tap/double-click detected
                    this.editElement(index);
                    e.stopPropagation();
                    // Reset to prevent triple tap
                    lastPointerDownTime = 0;
                    lastPointerDownTarget = null;
                } else {
                    // Single tap/click
                    this.selectElement(index);
                    lastPointerDownTime = currentTime;
                    lastPointerDownTarget = formElement;
                }
            });
    
            // Handle button clicks within form elements using event delegation
            dropZone.addEventListener('pointerdown', (e) => {
                const button = e.target.closest('button[data-action]');
                if (!button) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const action = button.dataset.action;
                const index = parseInt(button.dataset.index);
                const direction = button.dataset.direction ? parseInt(button.dataset.direction) : null;
                
                switch (action) {
                    case 'editElement':
                        this.editElement(index);
                        break;
                    case 'moveElement':
                        this.moveElement(index, direction);
                        break;
                    case 'duplicateElement':
                        this.duplicateElement(index);
                        break;
                    case 'deleteElement':
                        this.deleteElement(index);
                        break;
                }
            });
        }
    // Task I: Enhanced iPad touch gesture system to prevent blur/touchstart conflicts
    setupTouchGestures() {
        const propertiesPanel = document.getElementById('builderProperties');
        if (!propertiesPanel) return;
        
        // Task I: Enhanced touch gesture state with iPad-specific handling
        this.touchGestureState = {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            startTime: 0,
            minimumSwipeDistance: 80, // Increased threshold to prevent accidental triggers
            maximumSwipeTime: 1000, // Maximum time for a valid swipe gesture
            verticalTolerance: 40, // Allow some vertical movement
            isValidSwipeGesture: false,
            targetElement: null,
            preventBlurConflicts: true
        };
        
        // Task I: iPad-specific device detection for enhanced handling
        const isIPadDevice = /iPad/.test(navigator.userAgent) ||
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Task I: Enhanced touchstart handler with input element detection
        propertiesPanel.addEventListener('touchstart', (e) => {
            // Task I: Prevent gesture detection on form inputs to avoid blur conflicts
            const target = e.target;
            const isFormElement = target.matches('input, textarea, select, button, [contenteditable]') ||
                                 target.closest('input, textarea, select, button, [contenteditable]');
            
            // Task I: Skip gesture detection for form elements to prevent blur/focus conflicts
            if (isFormElement) {
                this.touchGestureState.isActive = false;
                return;
            }
            
            // Task I: Only start gesture tracking for panel container touches
            const isPanelContainer = target.classList.contains('builder-properties') ||
                                   target.classList.contains('properties-content') ||
                                   target.closest('.builder-properties:not(input):not(textarea):not(select):not(button)');
            
            if (!isPanelContainer) {
                this.touchGestureState.isActive = false;
                return;
            }
            
            // Task I: Initialize enhanced gesture tracking
            this.touchGestureState.isActive = true;
            this.touchGestureState.startX = e.touches[0].clientX;
            this.touchGestureState.startY = e.touches[0].clientY;
            this.touchGestureState.currentX = this.touchGestureState.startX;
            this.touchGestureState.currentY = this.touchGestureState.startY;
            this.touchGestureState.startTime = Date.now();
            this.touchGestureState.targetElement = target;
            this.touchGestureState.isValidSwipeGesture = false;
            
            // Task I: iPad-specific gesture initialization
            if (isIPadDevice) {
                // Add visual feedback for iPad users
                propertiesPanel.style.transition = 'transform 0.1s ease-out';
            }
        }, { passive: true });
        
        // Task I: Enhanced touchmove handler with gesture validation
        propertiesPanel.addEventListener('touchmove', (e) => {
            if (!this.touchGestureState.isActive) return;
            
            this.touchGestureState.currentX = e.touches[0].clientX;
            this.touchGestureState.currentY = e.touches[0].clientY;
            
            const deltaX = this.touchGestureState.currentX - this.touchGestureState.startX;
            const deltaY = Math.abs(this.touchGestureState.currentY - this.touchGestureState.startY);
            const elapsedTime = Date.now() - this.touchGestureState.startTime;
            
            // Task I: Validate swipe gesture criteria
            const isHorizontalSwipe = Math.abs(deltaX) > deltaY;
            const isRightwardSwipe = deltaX > 0;
            const hasMinimumDistance = Math.abs(deltaX) >= this.touchGestureState.minimumSwipeDistance;
            const isWithinTimeLimit = elapsedTime <= this.touchGestureState.maximumSwipeTime;
            const isWithinVerticalTolerance = deltaY <= this.touchGestureState.verticalTolerance;
            
            // Task I: Only trigger on valid horizontal right swipe
            if (isHorizontalSwipe && isRightwardSwipe && hasMinimumDistance &&
                isWithinTimeLimit && isWithinVerticalTolerance) {
                
                this.touchGestureState.isValidSwipeGesture = true;
                
                // Task I: Visual feedback during swipe for iPad
                if (isIPadDevice) {
                    const swipeProgress = Math.min(Math.abs(deltaX) / this.touchGestureState.minimumSwipeDistance, 1);
                    propertiesPanel.style.transform = `translateX(${swipeProgress * 10}px)`;
                    propertiesPanel.style.opacity = `${1 - swipeProgress * 0.2}`;
                }
                
                // Task I: Execute panel collapse for valid gesture
                if (!propertiesPanel.classList.contains('collapsed')) {
                    this.togglePropertiesPanel();
                    this.touchGestureState.isActive = false;
                    
                    // Task I: Reset visual feedback
                    if (isIPadDevice) {
                        setTimeout(() => {
                            propertiesPanel.style.transform = '';
                            propertiesPanel.style.opacity = '';
                            propertiesPanel.style.transition = '';
                        }, 300);
                    }
                    
                    // Task I: Show user-friendly notification
                    this.showNotification('Properties panel collapsed via swipe gesture');
                }
            } else if (deltaY > this.touchGestureState.verticalTolerance * 2) {
                // Task I: Cancel gesture if too much vertical movement (likely scrolling)
                this.touchGestureState.isActive = false;
                
                // Task I: Reset visual feedback
                if (isIPadDevice) {
                    propertiesPanel.style.transform = '';
                    propertiesPanel.style.opacity = '';
                }
            }
        }, { passive: true });
        
        // Task I: Enhanced touchend handler with gesture completion
        propertiesPanel.addEventListener('touchend', (e) => {
            if (!this.touchGestureState.isActive) return;
            
            // Task I: Reset visual feedback for iPad
            if (isIPadDevice) {
                propertiesPanel.style.transform = '';
                propertiesPanel.style.opacity = '';
                propertiesPanel.style.transition = '';
            }
            
            // Task I: Reset gesture state
            this.touchGestureState.isActive = false;
            this.touchGestureState.isValidSwipeGesture = false;
            this.touchGestureState.targetElement = null;
        }, { passive: true });
        
        // Task I: Touch cancel handler for iPad reliability
        propertiesPanel.addEventListener('touchcancel', (e) => {
            if (!this.touchGestureState.isActive) return;
            
            // Task I: Emergency cleanup for cancelled touches
            if (isIPadDevice) {
                propertiesPanel.style.transform = '';
                propertiesPanel.style.opacity = '';
                propertiesPanel.style.transition = '';
            }
            
            // Task I: Reset all gesture state
            this.touchGestureState.isActive = false;
            this.touchGestureState.isValidSwipeGesture = false;
            this.touchGestureState.targetElement = null;
        }, { passive: true });
        
        // Task I: Focus/blur event handling to prevent conflicts with touch gestures
        if (this.touchGestureState.preventBlurConflicts) {
            this.setupFocusBlurConflictPrevention(propertiesPanel);
        }
        
        
    }
    
    // Task I: Setup focus/blur conflict prevention for iPad
    setupFocusBlurConflictPrevention(propertiesPanel) {
        // Task I: Track focus/blur events to prevent gesture conflicts
        this.focusBlurState = {
            lastFocusTime: 0,
            lastBlurTime: 0,
            preventGestureWindow: 300 // 300ms window to prevent gestures after focus/blur
        };
        
        // Task I: Monitor focus events on form inputs
        propertiesPanel.addEventListener('focusin', (e) => {
            this.focusBlurState.lastFocusTime = Date.now();
            
            // Task I: Temporarily disable touch gestures during focus
            if (this.touchGestureState) {
                this.touchGestureState.isActive = false;
            }
        }, { passive: true });
        
        // Task I: Monitor blur events on form inputs
        propertiesPanel.addEventListener('focusout', (e) => {
            this.focusBlurState.lastBlurTime = Date.now();
            
            // Task I: Temporarily disable touch gestures after blur
            if (this.touchGestureState) {
                this.touchGestureState.isActive = false;
            }
            
            // Task I: Add a brief delay before re-enabling gestures
            setTimeout(() => {
                // Reset gesture state after focus/blur events settle
                if (this.touchGestureState) {
                    this.touchGestureState.isActive = false;
                    this.touchGestureState.isValidSwipeGesture = false;
                }
            }, this.focusBlurState.preventGestureWindow);
        }, { passive: true });
        
        // Task I: Prevent gesture activation near focus/blur events
        const originalTouchStart = propertiesPanel.ontouchstart;
        
        // Task I: Enhanced validation for touch start events
        this.validateTouchStart = (e) => {
            const currentTime = Date.now();
            const timeSinceFocus = currentTime - this.focusBlurState.lastFocusTime;
            const timeSinceBlur = currentTime - this.focusBlurState.lastBlurTime;
            
            // Task I: Prevent gestures if too close to focus/blur events
            if (timeSinceFocus < this.focusBlurState.preventGestureWindow ||
                timeSinceBlur < this.focusBlurState.preventGestureWindow) {
                
                if (this.touchGestureState) {
                    this.touchGestureState.isActive = false;
                }
                return false;
            }
            
            return true;
        };
        
        // Task E: Setup iPad settings panel closes fix - Apply debouncing to correct SurveyJS Creator property grid components
        this.setupPropertyGridFocusBlurDebouncing();
        
        
    }
    
    // Task E: Setup property grid focus/blur debouncing for iPad settings panel closes issue
    setupPropertyGridFocusBlurDebouncing() {
        // Task C: Declare the isSettingUpHandlers guard variable to prevent infinite loops
        let isSettingUpHandlers = false;
        
        // T-Fix-2: Add missing isDragging flag for property grid drag tracking
        let isDragging = false;
        
        // Add retry counter to prevent infinite loops
        let retryCount = 0;
        const maxRetries = 10;
        
        // Task E: Wait for DOM to be ready and search for property grid elements
        const setupPropertyGridHandlers = () => {
            // Task C: Prevent concurrent handler setup to avoid infinite loops
            if (isSettingUpHandlers) {
                return;
            }
            isSettingUpHandlers = true;
            // Task E: Find all SurveyJS Creator property grid components (correct class names)
            const propertyGridElements = document.querySelectorAll([
                // SurveyJS v2+ selectors
                '.svc-property-grid',
                '.svc-property-grid-placeholder',
                '[class*="svc-property-grid"]',
                // SurveyJS v1 selectors (CRITICAL FIX)
                '.svd-property-grid',
                '.svd-property-grid-placeholder',
                '[class*="svd-property-grid"]',
                // Also target any dynamically loaded SurveyJS Creator property grids
                '[data-sv-drop-target-survey-element*="property"]',
                '.svc-side-bar__container .svc-property-panel',
                '#propertiesPanel' // Include the properties panel container itself
            ].join(', '));
            
            
            
            // Task E: Apply debouncing and event.stopPropagation() to each property grid element
            propertyGridElements.forEach((element, index) => {
                
                
                // Task E: Enhanced blur event debouncing with event.stopPropagation()
                element.addEventListener('blur', (e) => {
                    
                    
                    // Task E: Add event.stopPropagation() as required by task
                    e.stopPropagation();
                    
                    // Task E: Apply 300ms debouncing using existing infrastructure
                    this.focusBlurState.lastBlurTime = Date.now();
                    
                    // Task E: Temporarily disable touch gestures to prevent panel closing
                    if (this.touchGestureState) {
                        this.touchGestureState.isActive = false;
                        this.touchGestureState.isValidSwipeGesture = false;
                    }
                    
                    // Task E: Extended debouncing window for property grid stability
                    setTimeout(() => {
                        // Reset gesture state after property grid blur events settle
                        if (this.touchGestureState) {
                            this.touchGestureState.isActive = false;
                            this.touchGestureState.isValidSwipeGesture = false;
                        }
                    }, this.focusBlurState.preventGestureWindow);
                    
                }, { passive: false, capture: true }); // Use capture phase for early intervention
                
                // Task E: Enhanced touchstart event debouncing with event.stopPropagation()
                element.addEventListener('touchstart', (e) => {
                    
                    
                    // Task E: Add event.stopPropagation() as required by task
                    e.stopPropagation();
                    
                    // Task E: Check if we're within debouncing window from recent blur
                    const currentTime = Date.now();
                    const timeSinceBlur = currentTime - this.focusBlurState.lastBlurTime;
                    
                    if (timeSinceBlur < this.focusBlurState.preventGestureWindow) {
                        
                        
                        // Task E: Prevent gesture activation if too close to blur event
                        if (this.touchGestureState) {
                            this.touchGestureState.isActive = false;
                            this.touchGestureState.isValidSwipeGesture = false;
                        }
                        
                        // Task E: Optionally prevent default to avoid unwanted interactions
                        e.preventDefault();
                        return false;
                    }
                    
                    // Task E: Apply enhanced validation using existing infrastructure
                    if (!this.validateTouchStart || !this.validateTouchStart(e)) {
                        
                        if (this.touchGestureState) {
                            this.touchGestureState.isActive = false;
                        }
                        e.preventDefault();
                        return false;
                    }
                    
                }, { passive: false, capture: true }); // Use capture phase for early intervention
                
                // Task E: Focus event handling for comprehensive coverage
                element.addEventListener('focus', (e) => {
                    
                    
                    // Task E: Add event.stopPropagation() for consistency
                    e.stopPropagation();
                    
                    // Task E: Update focus timing for debouncing
                    this.focusBlurState.lastFocusTime = Date.now();
                    
                    // Task E: Disable touch gestures during focus to prevent conflicts
                    if (this.touchGestureState) {
                        this.touchGestureState.isActive = false;
                        this.touchGestureState.isValidSwipeGesture = false;
                    }
                    
                }, { passive: false, capture: true });
            });
            
            // Task E: Also monitor for dynamically added property grid elements
            if (propertyGridElements.length > 0) {
                console.log(`FormBuilder: Successfully setup handlers for ${propertyGridElements.length} property grid elements`);
            } else if (retryCount < maxRetries) {
                retryCount++;
                console.warn(`FormBuilder: Task E - No property grid elements found, will retry (${retryCount}/${maxRetries})`);
                // Task E: Retry setup after short delay for dynamically loaded content
                setTimeout(() => {
                    isSettingUpHandlers = false; // Task C: Reset guard before retry
                    setupPropertyGridHandlers();
                }, 1000);
            } else {
                console.warn('FormBuilder: Task E - Property grid elements not found after maximum retries. This form builder may use a custom property panel instead of SurveyJS Creator property grid.');
            }
            
            // Task C: Reset guard flag after setup is complete
            isSettingUpHandlers = false;
        };
        
        // Task E: Initial setup
        setupPropertyGridHandlers();
        
        // Task C & E: Setup mutation observer with throttling to prevent infinite loops
        if (typeof MutationObserver !== 'undefined') {
            // Task C: Throttling state using requestAnimationFrame pattern
            let ticking = false;
            let pendingResetup = false;
            
            const propertyGridObserver = new MutationObserver((mutations) => {
                let shouldResetup = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        // Task E: Check if any added nodes contain property grid elements
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const hasPropertyGrid = node.classList?.contains('svc-property-grid') ||
                                                      node.classList?.contains('svc-property-grid-placeholder') ||
                                                      node.classList?.contains('svd-property-grid') ||
                                                      node.classList?.contains('svd-property-grid-placeholder') ||
                                                      node.querySelector?.('.svc-property-grid, .svc-property-grid-placeholder, .svd-property-grid, .svd-property-grid-placeholder');
                                if (hasPropertyGrid) {
                                    shouldResetup = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldResetup) {
                    pendingResetup = true;
                    
                    // Task C: Use requestAnimationFrame throttling to prevent infinite loops
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            if (pendingResetup) {
                                console.log('FormBuilder: Property grid elements detected, setting up handlers');
                                setupPropertyGridHandlers();
                                pendingResetup = false;
                            }
                            ticking = false;
                        });
                        
                        ticking = true;
                    }
                }
            });
            
            // Task E: Observe the entire document for property grid changes
            propertyGridObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });
            
            // Task E: Store observer for cleanup
            this.propertyGridObserver = propertyGridObserver;
        }
    }
    
    setupDragAndDrop() {
        
        const draggables = document.querySelectorAll('.draggable-element');
        const dropZone = document.getElementById('dropZone');
        
        
        

        // Task H: iPad/iOS device detection for iPadDragFix
        this.iPadDragFix = {
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), // iPad Pro detection
            isIPad: /iPad/.test(navigator.userAgent) ||
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
            isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
            touchStartTime: 0,
            lastTouchEnd: 0,
            preventGestureConflicts: true,
            enhancedPointerCapture: true,
            debugMode: false
        };

        // Log iPad detection for debugging
        if (this.iPadDragFix.isIPad) {
            
        }

        // Initialize drag state with iPad-specific enhancements
        this.dragState = {
            isDragging: false,
            dragElement: null,
            dragClone: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
            elementData: null,
            // Task H: iPad-specific drag state
            pointerCapture: {
                active: false,
                pointerId: null,
                element: null
            },
            gesturePreventionActive: false,
            dragStartTime: 0,
            minimumDragDistance: this.iPadDragFix.isIPad ? 10 : 5
        };

        // Task H: Setup iPad-specific gesture conflict prevention
        if (this.iPadDragFix.isIOS && this.iPadDragFix.preventGestureConflicts) {
            this.setupiPadGestureConflictPrevention();
            
            // Task F: Setup enhanced pointer lost handling for drag stickiness prevention
            this.setupiPadPointerLostHandling();
        }

        // Setup draggable elements with iPad-enhanced Pointer Events
        draggables.forEach((draggable, index) => {
            
            
            // Clone and replace to remove all existing event listeners
            const newDraggable = draggable.cloneNode(true);
            draggable.parentNode.replaceChild(newDraggable, draggable);
            
            // Task H: iPad-optimized element styling
            this.applyiPadDragOptimizations(newDraggable);
            
            // Task H: Enhanced pointer down handler with iPad optimizations
            newDraggable.addEventListener('pointerdown', (e) => {
                if (this.formData.isFormLocked) return;
                
                
                // Task H: iPad-specific preventDefault timing
                if (this.iPadDragFix.isIPad) {
                    // Immediate preventDefault for iPad to prevent scroll conflicts
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Prevent double-tap zoom on iPad
                    const currentTime = Date.now();
                    if (currentTime - this.iPadDragFix.lastTouchEnd < 300) {
                        return; // Ignore rapid successive touches
                    }
                } else {
                    e.preventDefault();
                }
                
                // Task H: Enhanced pointer capture for iPad
                const success = this.initializeiPadPointerCapture(e, newDraggable);
                if (!success && this.iPadDragFix.isIPad) {
                    console.warn('FormBuilder: iPad pointer capture failed, using fallback');
                    return;
                }
                
                // Store drag data with enhanced timing
                this.dragState.isDragging = true;
                this.dragState.dragElement = newDraggable;
                this.dragState.startX = e.clientX;
                this.dragState.startY = e.clientY;
                this.dragState.dragStartTime = Date.now();
                this.dragState.elementData = {
                    elementType: newDraggable.dataset.type,
                    isCustom: newDraggable.dataset.custom === 'true',
                    category: newDraggable.dataset.category || ''
                };
                
                // Task H: iPad-optimized visual clone creation
                this.createiPadOptimizedDragClone(e, newDraggable);
                
                // Add dragging class to original element
                newDraggable.classList.add('dragging');
                
                // Task H: iPad-specific gesture prevention
                if (this.iPadDragFix.isIPad) {
                    this.activateiPadGesturePrevention();
                }
            });
            
            // Task H: Enhanced pointer move handler with iPad coordination
            newDraggable.addEventListener('pointermove', (e) => {
                if (!this.dragState.isDragging || !this.dragState.dragClone) return;
                
                // Task H: iPad-specific preventDefault coordination
                if (this.iPadDragFix.isIPad) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check minimum drag distance for iPad
                    const deltaX = Math.abs(e.clientX - this.dragState.startX);
                    const deltaY = Math.abs(e.clientY - this.dragState.startY);
                    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    if (dragDistance < this.dragState.minimumDragDistance) {
                        return; // Don't start dragging until minimum distance is met
                    }
                } else {
                    e.preventDefault();
                }
                
                // Task H: Enhanced clone position update with iPad smoothing
                this.updateiPadDragClonePosition(e);
                
                // Task H: iPad-optimized drop zone detection
                this.updateiPadDropZoneDetection(e);
            });
            
            // Task H: Enhanced pointer up handler with iPad cleanup
            newDraggable.addEventListener('pointerup', (e) => {
                if (!this.dragState.isDragging) return;

                // Task D: Explicitly release pointer capture on pointerup
                if (this.dragState.pointerCapture.active) {
                    try {
                        newDraggable.releasePointerCapture(e.pointerId);
                    } catch (err) { /* Ignore errors if capture was already lost */ }
                }
                
                // Task H: iPad-specific cleanup timing
                if (this.iPadDragFix.isIPad) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.iPadDragFix.lastTouchEnd = Date.now();
                }
                
                // Check if dropped on drop zone with iPad-enhanced detection
                const dropSuccess = this.handleiPadDragDrop(e);
                
                // Task H: iPad-optimized cleanup
                this.cleanupiPadDragOperation(e);
            });
            
            // Task D: Enhanced pointer cancel handler for iPad reliability
            newDraggable.addEventListener('pointercancel', (e) => {
                if (!this.dragState.isDragging) return;

                // Task D: Explicitly release pointer capture directly in the cancel handler
                if (this.dragState.pointerCapture.active) {
                    try {
                        newDraggable.releasePointerCapture(e.pointerId);
                    } catch (err) { /* Ignore errors if capture was already lost */ }
                }
                
                if (this.iPadDragFix.isIPad) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                this.emergencyiPadDragCleanup();
            });

            // Task D: Add lostpointercapture event listener to handle system-level interruptions
            newDraggable.addEventListener('lostpointercapture', (e) => {
                if (!this.dragState.isDragging) return;

                // This event fires when capture is lost for any reason (e.g., pointercancel)
                // It's a reliable way to trigger cleanup.
                this.emergencyiPadDragCleanup();
            });
        });

        // Task H: Add iPad-enhanced visual feedback styles
        if (!document.getElementById('pointer-drag-styles')) {
            this.createiPadOptimizedDragStyles();
        }
    }

    // Task H: Setup iPad gesture conflict prevention
    setupiPadGestureConflictPrevention() {
        
        
        // Prevent iOS Safari's default gestures during drag operations
        document.addEventListener('gesturestart', (e) => {
            if (this.dragState.isDragging || this.dragState.gesturePreventionActive) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        
        document.addEventListener('gesturechange', (e) => {
            if (this.dragState.isDragging || this.dragState.gesturePreventionActive) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        
        document.addEventListener('gestureend', (e) => {
            if (this.dragState.isDragging || this.dragState.gesturePreventionActive) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        
        // Prevent context menu on iPad long press during drag
        document.addEventListener('contextmenu', (e) => {
            if (this.dragState.isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
    }

    // Task H: Apply iPad-specific drag optimizations to elements
    applyiPadDragOptimizations(element) {
        // Enhanced touch-action for iPad
        element.style.touchAction = 'none';
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.msUserSelect = 'none';
        
        if (this.iPadDragFix.isIPad) {
            // iPad-specific optimizations
            element.style.webkitTouchCallout = 'none';
            element.style.webkitTapHighlightColor = 'transparent';
            element.style.webkitUserDrag = 'none';
            
            // Enhanced cursor feedback for iPad with Apple Pencil
            element.style.cursor = 'grab';
            
            // Prevent iOS momentum scrolling conflicts
            element.style.webkitOverflowScrolling = 'auto';
        }
    }

    // Task H: Initialize iPad-enhanced pointer capture
    initializeiPadPointerCapture(e, element) {
        try {
            if (this.iPadDragFix.enhancedPointerCapture) {
                // Enhanced pointer capture for iPad
                element.setPointerCapture(e.pointerId);
                
                // Store capture info for iPad tracking
                this.dragState.pointerCapture = {
                    active: true,
                    pointerId: e.pointerId,
                    element: element
                };
                
                if (this.iPadDragFix.debugMode) {
                    
                }
                
                return true;
            }
        } catch (error) {
            console.warn('FormBuilder: iPad pointer capture failed:', error);
            return false;
        }
        
        return true;
    }

    // Task H: Create iPad-optimized drag clone
    createiPadOptimizedDragClone(e, element) {
        const clone = element.cloneNode(true);
        
        // iPad-optimized clone styling
        clone.style.position = 'fixed';
        clone.style.pointerEvents = 'none';
        clone.style.zIndex = '9999';
        clone.style.opacity = this.iPadDragFix.isIPad ? '0.85' : '0.8'; // Slightly more visible on iPad
        clone.style.transform = this.iPadDragFix.isIPad ? 'scale(1.08)' : 'scale(1.05)'; // Larger for iPad
        clone.style.transition = this.iPadDragFix.isIPad ? 'transform 0.15s' : 'transform 0.2s'; // Faster on iPad
        clone.style.width = element.offsetWidth + 'px';
        
        // iPad-specific enhancements
        if (this.iPadDragFix.isIPad) {
            clone.style.borderRadius = '8px';
            clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
            clone.style.webkitTransform = clone.style.transform; // Webkit fallback
        }
        
        // Position clone at pointer with iPad offset compensation
        const rect = element.getBoundingClientRect();
        this.dragState.offsetX = e.clientX - rect.left;
        this.dragState.offsetY = e.clientY - rect.top;
        
        // iPad-specific offset adjustments
        if (this.iPadDragFix.isIPad) {
            this.dragState.offsetY -= 10; // Compensate for finger offset on iPad
        }
        
        clone.style.left = (e.clientX - this.dragState.offsetX) + 'px';
        clone.style.top = (e.clientY - this.dragState.offsetY) + 'px';
        
        document.body.appendChild(clone);
        this.dragState.dragClone = clone;
    }

    // Task H: Update iPad drag clone position with smoothing
    updateiPadDragClonePosition(e) {
        if (!this.dragState.dragClone) return;
        
        let x = e.clientX - this.dragState.offsetX;
        let y = e.clientY - this.dragState.offsetY;
        
        // iPad-specific position smoothing
        if (this.iPadDragFix.isIPad) {
            // Apply slight smoothing for iPad touch input
            const smoothingFactor = 0.1;
            const currentX = parseFloat(this.dragState.dragClone.style.left) || x;
            const currentY = parseFloat(this.dragState.dragClone.style.top) || y;
            
            x = currentX + (x - currentX) * (1 - smoothingFactor);
            y = currentY + (y - currentY) * (1 - smoothingFactor);
        }
        
        this.dragState.dragClone.style.left = x + 'px';
        this.dragState.dragClone.style.top = y + 'px';
    }

    // Task H: iPad-optimized drop zone detection
    updateiPadDropZoneDetection(e) {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;
        
        const dropRect = dropZone.getBoundingClientRect();
        
        // iPad-enhanced hit detection with expanded touch area
        let tolerance = this.iPadDragFix.isIPad ? 15 : 5;
        
        const isOverDropZone = e.clientX >= dropRect.left - tolerance &&
                              e.clientX <= dropRect.right + tolerance &&
                              e.clientY >= dropRect.top - tolerance &&
                              e.clientY <= dropRect.bottom + tolerance;
        
        if (isOverDropZone) {
            dropZone.classList.add('drag-over');
            
            // iPad-specific visual feedback
            if (this.iPadDragFix.isIPad && this.dragState.dragClone) {
                this.dragState.dragClone.style.transform = 'scale(1.12)';
            }
        } else {
            dropZone.classList.remove('drag-over');
            
            // Reset clone scale on iPad
            if (this.iPadDragFix.isIPad && this.dragState.dragClone) {
                this.dragState.dragClone.style.transform = 'scale(1.08)';
            }
        }
    }

    // Task H: Handle iPad drag drop with enhanced detection
    handleiPadDragDrop(e) {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return false;
        
        const dropRect = dropZone.getBoundingClientRect();
        
        // iPad-enhanced drop detection with tolerance
        const tolerance = this.iPadDragFix.isIPad ? 15 : 0;
        const isOverDropZone = e.clientX >= dropRect.left - tolerance &&
                              e.clientX <= dropRect.right + tolerance &&
                              e.clientY >= dropRect.top - tolerance &&
                              e.clientY <= dropRect.bottom + tolerance;
        
        if (isOverDropZone && this.dragState.elementData) {
            
            
            this.addElement(
                this.dragState.elementData.elementType,
                this.dragState.elementData.isCustom,
                this.dragState.elementData.category
            );
            
            // iPad-specific success feedback
            if (this.iPadDragFix.isIPad) {
                this.showNotification('Element added successfully', 'success');
                
                // Haptic feedback simulation for iPad
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
            
            return true;
        }
        
        dropZone.classList.remove('drag-over');
        return false;
    }

    // Task H: iPad-optimized drag operation cleanup
    cleanupiPadDragOperation(e) {
        // Clean up drag clone
        if (this.dragState.dragClone) {
            if (this.iPadDragFix.isIPad) {
                // Animated removal for iPad
                this.dragState.dragClone.style.transition = 'all 0.2s ease-out';
                this.dragState.dragClone.style.opacity = '0';
                this.dragState.dragClone.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    if (this.dragState.dragClone) {
                        this.dragState.dragClone.remove();
                    }
                }, 200);
            } else {
                this.dragState.dragClone.remove();
            }
        }
        
        // Clean up drag element
        if (this.dragState.dragElement) {
            this.dragState.dragElement.classList.remove('dragging');
            
            // Release pointer capture with iPad error handling
            if (this.dragState.pointerCapture.active && e.pointerId) {
                try {
                    this.dragState.dragElement.releasePointerCapture(e.pointerId);
                } catch (error) {
                    if (this.iPadDragFix.debugMode) {
                        console.warn('FormBuilder: iPad pointer capture release failed:', error);
                    }
                }
            }
        }
        
        // Deactivate iPad gesture prevention
        if (this.iPadDragFix.isIPad) {
            this.deactivateiPadGesturePrevention();
        }
        
        // Reset drag state
        this.dragState = {
            isDragging: false,
            dragElement: null,
            dragClone: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
            elementData: null,
            pointerCapture: {
                active: false,
                pointerId: null,
                element: null
            },
            gesturePreventionActive: false,
            dragStartTime: 0,
            minimumDragDistance: this.iPadDragFix.isIPad ? 10 : 5
        };
    }

    // Task F: Emergency iPad drag cleanup for pointer cancel events - Enhanced with pointer capture cleanup
    emergencyiPadDragCleanup() {
        
        
        // Task F: Force release any active pointer capture to prevent stickiness
        if (this.dragState.pointerCapture.active && this.dragState.pointerCapture.element) {
            try {
                // Release capture using stored pointerId and element
                this.dragState.pointerCapture.element.releasePointerCapture(this.dragState.pointerCapture.pointerId);
                
            } catch (error) {
                console.warn('FormBuilder: Emergency pointer capture release failed:', error);
                
                // Task F: Fallback - try to release capture on all potentially capturing elements
                this.forceReleaseAllPointerCaptures();
            }
        }
        
        // Force remove drag clone
        if (this.dragState.dragClone) {
            this.dragState.dragClone.remove();
        }
        
        // Force remove dragging class
        if (this.dragState.dragElement) {
            this.dragState.dragElement.classList.remove('dragging');
        }
        
        // Force clean drop zone state
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.remove('drag-over');
        }
        
        // Force deactivate gesture prevention
        this.deactivateiPadGesturePrevention();
        
        // Task F: Clear any pending iPad-specific timeouts
        this.clearIpadDragTimeouts();
        
        // Reset all state
        this.dragState = {
            isDragging: false,
            dragElement: null,
            dragClone: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
            elementData: null,
            pointerCapture: {
                active: false,
                pointerId: null,
                element: null
            },
            gesturePreventionActive: false,
            dragStartTime: 0,
            minimumDragDistance: this.iPadDragFix.isIPad ? 10 : 5
        };
    }

    // Task H: Activate iPad gesture prevention
    activateiPadGesturePrevention() {
        this.dragState.gesturePreventionActive = true;
        
        // Prevent Safari's pull-to-refresh on iPad
        document.body.style.overscrollBehavior = 'none';
        document.body.style.webkitOverflowScrolling = 'auto';
    }

    // Task H: Deactivate iPad gesture prevention
    deactivateiPadGesturePrevention() {
        this.dragState.gesturePreventionActive = false;
        
        // Restore normal scrolling behavior
        document.body.style.overscrollBehavior = '';
        document.body.style.webkitOverflowScrolling = '';
    }

    // Task F: Force release all pointer captures to prevent stickiness
    forceReleaseAllPointerCaptures() {
        
        
        try {
            // Find all draggable elements and attempt to release any captures
            const draggableElements = document.querySelectorAll('.draggable-element');
            draggableElements.forEach(element => {
                try {
                    // Try to release capture for common pointer IDs (1-10)
                    for (let pointerId = 1; pointerId <= 10; pointerId++) {
                        element.releasePointerCapture(pointerId);
                    }
                } catch (error) {
                    // Expected to fail for non-captured pointers - silently continue
                }
            });
            
            // Also try to release on document body and drop zone
            const criticalElements = [document.body, document.getElementById('dropZone')];
            criticalElements.forEach(element => {
                if (element) {
                    try {
                        for (let pointerId = 1; pointerId <= 10; pointerId++) {
                            element.releasePointerCapture(pointerId);
                        }
                    } catch (error) {
                        // Expected to fail for non-captured pointers - silently continue
                    }
                }
            });
            
        } catch (error) {
            console.warn('FormBuilder: Force pointer capture release encountered error:', error);
        }
    }
    
    // Task F: Clear iPad-specific drag timeouts to prevent stickiness
    clearIpadDragTimeouts() {
        if (this.iPadDragFix.isIPad) {
            // Clear any potential timeouts that might cause sticky behavior
            if (this.iPadDragTimeout) {
                clearTimeout(this.iPadDragTimeout);
                this.iPadDragTimeout = null;
            }
            
            if (this.iPadStickinessCheckTimeout) {
                clearTimeout(this.iPadStickinessCheckTimeout);
                this.iPadStickinessCheckTimeout = null;
            }
            
            // Reset iPad-specific timing flags
            this.iPadDragFix.lastTouchEnd = 0;
            this.iPadDragFix.touchStartTime = 0;
        }
    }
    
    // Task F: Enhanced pointer lost event handling for iPad stickiness prevention
    setupiPadPointerLostHandling() {
        
        
        // Handle lostpointercapture events to prevent stickiness
        document.addEventListener('lostpointercapture', (e) => {
            if (this.dragState.isDragging && this.dragState.pointerCapture.pointerId === e.pointerId) {
                
                
                // Trigger emergency cleanup
                this.emergencyiPadDragCleanup();
                
                // Show user notification
                if (this.iPadDragFix.isIPad) {
                    this.showNotification('Drag operation interrupted - try again', 'warning');
                }
            }
        }, { passive: true });
        
        // Handle gotpointercapture events for tracking
        document.addEventListener('gotpointercapture', (e) => {
            if (this.iPadDragFix.debugMode) {
                console.log('FormBuilder: Pointer capture acquired:', e.pointerId);
            }
        }, { passive: true });
        
        // Task F: Handle multi-touch conflicts that can cause stickiness
        document.addEventListener('pointerdown', (e) => {
            if (this.dragState.isDragging && e.pointerId !== this.dragState.pointerCapture.pointerId) {
                
                
                // Prevent secondary touches from interfering
                if (this.iPadDragFix.isIPad) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }, { passive: false, capture: true });
        
        // Task F: Periodic stickiness check for iPad
        if (this.iPadDragFix.isIPad) {
            this.startiPadStickinessMonitoring();
        }
    }
    
    // Task F: Monitor for iPad drag stickiness and auto-recover
    startiPadStickinessMonitoring() {
        setInterval(() => {
            // Check if drag has been active for too long (indicates potential stickiness)
            if (this.dragState.isDragging && this.dragState.dragStartTime > 0) {
                const dragDuration = Date.now() - this.dragState.dragStartTime;
                
                // If drag has been active for more than 10 seconds, consider it stuck
                if (dragDuration > 10000) {
                    console.warn('FormBuilder: iPad drag stickiness detected, auto-recovering');
                    
                    this.emergencyiPadDragCleanup();
                    this.showNotification('Drag operation reset due to inactivity', 'info');
                }
            }
        }, 2000); // Check every 2 seconds
    }
    
    // Task F: Enhanced cleanup for iPad drag operations with comprehensive pointer capture handling
    cleanupiPadDragOperation(e) {
        
        
        // Task F: Enhanced pointer capture cleanup with fallback mechanisms
        if (this.dragState.pointerCapture.active && this.dragState.pointerCapture.element && e.pointerId) {
            try {
                // Primary cleanup - release specific pointer capture
                this.dragState.pointerCapture.element.releasePointerCapture(e.pointerId);
                
            } catch (error) {
                console.warn('FormBuilder: iPad pointer capture release failed, using fallback:', error);
                
                // Task F: Fallback 1 - Force release all captures on the element
                this.forceReleaseAllPointerCaptures();
                
                // Task F: Fallback 2 - Emergency timeout cleanup
                this.iPadStickinessCheckTimeout = setTimeout(() => {
                    
                    this.emergencyiPadDragCleanup();
                }, 100);
            }
        }
        
        // Clean up drag clone with iPad-specific animation
        if (this.dragState.dragClone) {
            if (this.iPadDragFix.isIPad) {
                // Animated removal for iPad
                this.dragState.dragClone.style.transition = 'all 0.2s ease-out';
                this.dragState.dragClone.style.opacity = '0';
                this.dragState.dragClone.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    if (this.dragState.dragClone) {
                        this.dragState.dragClone.remove();
                    }
                }, 200);
            } else {
                this.dragState.dragClone.remove();
            }
        }
        
        // Clean up drag element state
        if (this.dragState.dragElement) {
            this.dragState.dragElement.classList.remove('dragging');
            
            // Task F: Additional iPad-specific cleanup for dragging element
            if (this.iPadDragFix.isIPad) {
                // Reset any iPad-specific styles that might be stuck
                this.dragState.dragElement.style.transform = '';
                this.dragState.dragElement.style.zIndex = '';
                this.dragState.dragElement.style.pointerEvents = '';
            }
        }
        
        // Clean up drop zone state
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.remove('drag-over');
        }
        
        // Deactivate gesture prevention
        this.deactivateiPadGesturePrevention();
        
        // Task F: Clear iPad-specific timeouts
        this.clearIpadDragTimeouts();
        
        // Reset drag state with enhanced iPad cleanup
        this.dragState = {
            isDragging: false,
            dragElement: null,
            dragClone: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0,
            elementData: null,
            pointerCapture: {
                active: false,
                pointerId: null,
                element: null
            },
            gesturePreventionActive: false,
            dragStartTime: 0,
            minimumDragDistance: this.iPadDragFix.isIPad ? 10 : 5
        };
        
        
    }
    
    // Task H: Create iPad-optimized drag styles
    createiPadOptimizedDragStyles() {
        const styles = document.createElement('style');
        styles.id = 'pointer-drag-styles';
        styles.textContent = `
            .draggable-element {
                cursor: grab;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: none; /* Critical for preventing browser scroll on touch */
                user-select: none;
                -webkit-user-select: none;
            }
            
            .draggable-element:active {
                cursor: grabbing;
            }
            
            .draggable-element.dragging {
                opacity: 0.5;
                cursor: grabbing;
            }
            
            /* Task H: iPad-specific optimizations */
            @supports (-webkit-touch-callout: none) {
                .draggable-element {
                    -webkit-touch-callout: none;
                    -webkit-user-drag: none;
                    -webkit-tap-highlight-color: transparent;
                    -webkit-overflow-scrolling: auto;
                }
                
                .draggable-element:active {
                    -webkit-transform: scale(1.02);
                    transform: scale(1.02);
                    transition: transform 0.1s ease-out;
                }
            }
            
            /* iPad Pro and Apple Pencil optimizations */
            @media (hover: hover) and (pointer: fine) and (max-device-width: 1366px) {
                .draggable-element {
                    cursor: grab;
                    transition: all 0.15s ease-out;
                }
                
                .draggable-element:hover {
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
            }
            
            @media (hover: none) and (pointer: coarse) {
                /* Touch device styles with iPad enhancements */
                .draggable-element {
                    cursor: pointer;
                    -webkit-user-drag: none;
                    -khtml-user-drag: none;
                    -moz-user-drag: none;
                    -o-user-drag: none;
                    user-drag: none;
                    /* Enhanced touch feedback for iPad */
                    min-height: 48px;
                    position: relative;
                }
                
                .draggable-element::after {
                    content: '';
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    right: -8px;
                    bottom: -8px;
                    pointer-events: none;
                    border-radius: 8px;
                    background: transparent;
                    transition: background 0.15s ease-out;
                }
                
                .draggable-element:active::after {
                    background: rgba(0,0,0,0.05);
                }
            }
            
            /* Drop zone enhancements for iPad */
            .drop-zone.drag-over {
                background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
                border: 3px dashed #0B60D1;
                transform: scale(1.02);
                transition: all 0.2s ease-out;
            }
            
            /* iPad-specific drag clone animations */
            @supports (-webkit-touch-callout: none) {
                .drag-clone {
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    perspective: 1000px;
                    -webkit-perspective: 1000px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    addElement(type, isCustom = false, category = '') {
        // Check if form is locked
        if (this.checkFormLocked()) {
            return;
        }
        
        this.saveToHistory();
        const element = isCustom ? this.createCustomElement(type, category) : this.createDefaultElement(type, category);
        const currentPage = this.formData.pages[this.currentPageIndex];
        
        if (!currentPage.elements) {
            currentPage.elements = [];
        }
        
        currentPage.elements.push(element);
        this.renderFormElements();
        this.selectElement(currentPage.elements.length - 1);
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    createDefaultElement(type, category = '') {
        const baseElement = {
            type: type,
            name: `${type}_${Date.now()}`,
            title: this.getDefaultTitle(type)
        };

        // Add type-specific defaults
        switch (type) {
            case 'dropdown':
            case 'radiogroup':
            case 'checkbox':
                baseElement.choices = ['Option 1', 'Option 2', 'Option 3'];
                break;
            case 'rating':
                baseElement.rateMax = 5;
                break;
            case 'boolean':
                baseElement.labelTrue = 'Yes';
                baseElement.labelFalse = 'No';
                break;
            case 'signaturepad':
                baseElement.width = '300';
                baseElement.height = '150';
                baseElement.penColor = '#000080';
                baseElement.backgroundColor = '#ffffff';
                break;
        }

        // Add category-based auto-seeding
        if (category) {
            this.applyCategoryDefaults(baseElement, type, category);
        }

        return baseElement;
    }

    applyCategoryDefaults(element, type, category) {
        // Apply category-specific defaults based on evidence-based practices
        switch (category) {
            case 'client-info':
                switch (type) {
                    case 'text':
                        // Auto-seed text fields based on common client info patterns
                        if (element.title.toLowerCase().includes('name')) {
                            element.placeholder = 'Enter full name';
                            element.isRequired = true;
                        } else if (element.title.toLowerCase().includes('phone')) {
                            element.inputType = 'tel';
                            element.placeholder = '(XXX) XXX-XXXX';
                        } else if (element.title.toLowerCase().includes('email')) {
                            element.inputType = 'email';
                            element.placeholder = 'email@example.com';
                        } else if (element.title.toLowerCase().includes('date') || element.title.toLowerCase().includes('dob')) {
                            element.inputType = 'date';
                        }
                        break;
                    case 'dropdown':
                        if (element.title.toLowerCase().includes('gender')) {
                            element.choices = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
                        } else if (element.title.toLowerCase().includes('state')) {
                            element.choices = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
                        }
                        break;
                }
                break;
            
            case 'slp':
                switch (type) {
                    case 'rating':
                        element.rateMax = 5;
                        element.rateMin = 1;
                        element.title = element.title || 'Severity Rating';
                        element.minRateDescription = 'WNL/Normal';
                        element.maxRateDescription = 'Severe';
                        break;
                    case 'radiogroup':
                        if (element.title.toLowerCase().includes('severity')) {
                            element.choices = ['Within Normal Limits', 'Mild', 'Moderate', 'Severe', 'Profound'];
                        }
                        break;
                    case 'checkbox':
                        if (element.title.toLowerCase().includes('concern')) {
                            element.choices = [
                                'Articulation',
                                'Language Comprehension',
                                'Language Expression',
                                'Fluency/Stuttering',
                                'Voice Quality',
                                'Pragmatic/Social Skills',
                                'Feeding/Swallowing'
                            ];
                        }
                        break;
                }
                break;
            
            case 'ot':
                switch (type) {
                    case 'dropdown':
                        if (element.title.toLowerCase().includes('hand')) {
                            element.choices = ['Right', 'Left', 'Ambidextrous'];
                        }
                        break;
                    case 'rating':
                        element.rateMax = 10;
                        element.title = element.title || 'Functional Level';
                        element.minRateDescription = 'Unable';
                        element.maxRateDescription = 'Independent';
                        break;
                    case 'checkbox':
                        if (element.title.toLowerCase().includes('skill')) {
                            element.choices = [
                                'Fine Motor Coordination',
                                'Gross Motor Coordination',
                                'Bilateral Coordination',
                                'Motor Planning',
                                'Sensory Processing',
                                'Visual-Motor Integration',
                                'Strength and Endurance'
                            ];
                        }
                        break;
                }
                break;
            
            case 'clinical-doc':
                switch (type) {
                    case 'comment':
                        element.rows = 5;
                        element.placeholder = 'Enter detailed observations...';
                        if (element.title.toLowerCase().includes('recommendation')) {
                            element.placeholder = 'Enter specific recommendations based on assessment findings...';
                            element.rows = 6;
                        } else if (element.title.toLowerCase().includes('goal')) {
                            element.placeholder = 'Enter SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)...';
                        }
                        break;
                    case 'text':
                        if (element.title.toLowerCase().includes('date')) {
                            element.inputType = 'date';
                            element.defaultValueExpression = 'today()';
                        }
                        break;
                }
                break;
            
            case 'ai':
                switch (type) {
                    case 'comment':
                        element.rows = 8;
                        element.readOnly = true;
                        element.placeholder = 'AI-generated content will appear here...';
                        element.description = 'This field will be populated by AI based on your form responses';
                        break;
                }
                break;
        }
    }

    createCustomElement(type, category = '') {
        const customElements = {
            'iplc-logo': {
                type: 'html',
                name: 'iplc_logo',
                html: `<div style="text-align: center; margin-bottom: 2rem;">
                    <img src="/assets/images/iplc-logo.png" alt="IPLC Logo" style="max-width: 800px; height: auto;">
                </div>`
            },
            'iplc-header': {
                type: 'html',
                name: 'iplc_header',
                html: `<div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 2rem;">
                    <h1 style="margin: 0;">IPLC ASSOCIATES, INC.</h1>
                    <p style="margin: 0.5rem 0;">Speech Language Pathology & Occupational Therapy Services</p>
                    <p style="margin: 0;">Phone: (305) 253-7342 | Fax: (305) 253-0003</p>
                </div>`
            },
            'client-info': {
                type: 'panel',
                name: 'client_demographics',
                title: 'IDENTIFYING INFORMATION',
                elements: [
                    { type: 'text', name: 'client_name', title: 'NAME', isRequired: true, placeholder: 'Enter full name' },
                    { type: 'text', name: 'clinician_name', title: 'Clinician\'s Name', isRequired: true, placeholder: 'Enter clinician name' },
                    { type: 'text', name: 'date_of_birth', title: 'Date of Birth', inputType: 'date', isRequired: true },
                    { type: 'expression', name: 'age', title: 'Age (auto-calculated)', expression: 'calculateAge({date_of_birth})', description: 'Automatically calculated from date of birth' },
                    { type: 'text', name: 'evaluation_date', title: 'Evaluation Date', inputType: 'date', isRequired: true, defaultValueExpression: 'today()' },
                    { type: 'text', name: 'evaluation_location', title: 'Evaluation Location', isRequired: true, placeholder: 'Enter evaluation location' },
                    { type: 'text', name: 'examiner', title: 'Examiner', isRequired: true, placeholder: 'Enter examiner name' }
                ]
            },
            'insurance-info': {
                type: 'panel',
                name: 'insurance_information',
                title: 'Insurance Information',
                elements: [
                    { type: 'text', name: 'insurance_provider', title: 'Insurance Provider', isRequired: true, placeholder: 'e.g., BCBS, United Healthcare' },
                    { type: 'text', name: 'policy_number', title: 'Policy Number', isRequired: true, placeholder: 'Policy #' },
                    { type: 'text', name: 'group_number', title: 'Group Number', placeholder: 'Group #' },
                    { type: 'text', name: 'subscriber_name', title: 'Subscriber Name', placeholder: 'Policy holder name' },
                    { type: 'dropdown', name: 'relationship_to_client', title: 'Relationship to Client', choices: ['Self', 'Parent', 'Spouse', 'Child', 'Other'] },
                    { type: 'text', name: 'authorization_number', title: 'Authorization Number', placeholder: 'Auth #' },
                    { type: 'text', name: 'auth_visits', title: 'Authorized Visits', inputType: 'number', placeholder: 'Number of visits' }
                ]
            },
            'parent-caregiver': {
                type: 'panel',
                name: 'parent_caregiver_info',
                title: 'Parent/Caregiver Information',
                elements: [
                    { type: 'text', name: 'parent1_name', title: 'Parent/Guardian 1 Name', isRequired: true, placeholder: 'Full name' },
                    { type: 'text', name: 'parent1_phone', title: 'Phone Number', inputType: 'tel', isRequired: true, placeholder: '(XXX) XXX-XXXX' },
                    { type: 'text', name: 'parent1_email', title: 'Email Address', inputType: 'email', placeholder: 'email@example.com' },
                    { type: 'dropdown', name: 'parent1_relationship', title: 'Relationship', choices: ['Mother', 'Father', 'Guardian', 'Foster Parent', 'Grandparent', 'Other'] },
                    { type: 'text', name: 'parent2_name', title: 'Parent/Guardian 2 Name', placeholder: 'Full name' },
                    { type: 'text', name: 'parent2_phone', title: 'Phone Number', inputType: 'tel', placeholder: '(XXX) XXX-XXXX' },
                    { type: 'dropdown', name: 'preferred_contact', title: 'Preferred Contact Method', choices: ['Phone', 'Email', 'Text', 'In-Person'] }
                ]
            },
            'medical-history': {
                type: 'panel',
                name: 'medical_history_section',
                title: 'Medical History',
                elements: [
                    { type: 'checkbox', name: 'medical_conditions', title: 'Current Medical Conditions',
                      choices: ['Autism Spectrum Disorder', 'ADHD', 'Cerebral Palsy', 'Down Syndrome', 'Epilepsy', 'Hearing Loss', 'Vision Problems', 'Developmental Delay', 'Genetic Syndrome', 'Prematurity', 'Other'] },
                    { type: 'comment', name: 'medications', title: 'Current Medications', rows: 3, placeholder: 'List all current medications with dosages' },
                    { type: 'comment', name: 'allergies', title: 'Known Allergies', rows: 2, placeholder: 'List any medication, food, or environmental allergies' },
                    { type: 'comment', name: 'hospitalizations', title: 'Previous Hospitalizations/Surgeries', rows: 3, placeholder: 'Include dates and reasons' },
                    { type: 'radiogroup', name: 'birth_history', title: 'Birth History Complications', choices: ['None', 'Premature Birth', 'NICU Stay', 'Complications During Delivery', 'Other'] },
                    { type: 'text', name: 'gestational_age', title: 'Gestational Age at Birth (weeks)', inputType: 'number', min: 20, max: 45 }
                ]
            },
            'referral-info': {
                type: 'panel',
                name: 'referral_information',
                title: 'Referral Information',
                elements: [
                    { type: 'text', name: 'referring_physician', title: 'Referring Physician', isRequired: true },
                    { type: 'text', name: 'physician_phone', title: 'Physician Phone', inputType: 'tel' },
                    { type: 'text', name: 'referral_date', title: 'Referral Date', inputType: 'date' },
                    { type: 'checkbox', name: 'referral_reason', title: 'Reason for Referral',
                      choices: ['Speech Delay', 'Language Delay', 'Articulation', 'Fluency', 'Voice', 'Feeding/Swallowing', 'Motor Delays', 'Sensory Processing', 'Handwriting', 'ADL Skills'] }
                ]
            },
            'oral-mechanism': {
                type: 'panel',
                name: 'oral_mechanism_exam',
                title: 'Oral Mechanism Examination',
                elements: [
                    {
                        type: 'matrix',
                        name: 'oral_structures',
                        title: 'Oral Structures Assessment',
                        columns: ['WNL', 'Concern', 'Unable to Assess'],
                        rows: ['Lips (Symmetry/Strength)', 'Tongue (Movement/Strength)', 'Teeth/Dentition', 'Hard Palate', 'Soft Palate/Velum', 'Uvula', 'Tonsils', 'Jaw (ROM/Strength)']
                    },
                    {
                        type: 'radiogroup',
                        name: 'oral_motor_function',
                        title: 'Overall Oral Motor Function',
                        choices: ['Within Normal Limits', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment'],
                        isRequired: true
                    },
                    {
                        type: 'comment',
                        name: 'oral_mechanism_notes',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Describe specific concerns, asymmetries, or functional limitations observed during oral mechanism exam...'
                    }
                ]
            },
            'language-assessment': {
                type: 'panel',
                name: 'language_assessment',
                title: 'Language Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'receptive_language',
                        title: 'Receptive Language Skills',
                        columns: ['Age Appropriate', 'Mild Delay', 'Moderate Delay', 'Severe Delay'],
                        rows: [
                            'Following 1-step directions',
                            'Following 2-3 step directions',
                            'Following complex directions',
                            'Understanding questions (who/what/where)',
                            'Understanding questions (when/why/how)',
                            'Understanding spatial concepts',
                            'Understanding temporal concepts',
                            'Receptive vocabulary',
                            'Understanding grammar structures',
                            'Understanding figurative language'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'expressive_language',
                        title: 'Expressive Language Skills',
                        columns: ['Age Appropriate', 'Mild Delay', 'Moderate Delay', 'Severe Delay'],
                        rows: [
                            'Vocabulary size/diversity',
                            'Word retrieval',
                            'Sentence length (MLU)',
                            'Sentence complexity',
                            'Grammar/syntax',
                            'Verb tense usage',
                            'Pronoun usage',
                            'Question formulation',
                            'Narrative skills',
                            'Topic maintenance'
                        ]
                    },
                    {
                        type: 'text',
                        name: 'mlu_calculation',
                        title: 'Mean Length of Utterance (MLU)',
                        inputType: 'number',
                        placeholder: 'Calculate MLU from language sample',
                        description: 'Total morphemes ÷ Total utterances'
                    },
                    {
                        type: 'comment',
                        name: 'language_sample',
                        title: 'Language Sample',
                        rows: 6,
                        placeholder: 'Document representative language sample with context (play, conversation, narrative retell)...'
                    },
                    {
                        type: 'dropdown',
                        name: 'primary_language',
                        title: 'Primary Language',
                        choices: ['English', 'Spanish', 'English/Spanish Bilingual', 'Other'],
                        isRequired: true
                    }
                ]
            },
            'articulation-assessment': {
                type: 'panel',
                name: 'articulation_assessment',
                title: 'Articulation/Phonology Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'speech_sound_errors',
                        title: 'Speech Sound Error Patterns',
                        columns: ['Not Present', 'Inconsistent', 'Consistent', 'Stimulable'],
                        rows: [
                            'Initial consonant deletion',
                            'Final consonant deletion',
                            'Cluster reduction',
                            'Fronting (k→t, g→d)',
                            'Backing',
                            'Stopping (fricatives→stops)',
                            'Gliding (r→w, l→w/j)',
                            'Vocalization (er→uh)',
                            'Deaffrication',
                            'Assimilation',
                            'Syllable deletion'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'sound_production',
                        title: 'Individual Sound Production',
                        columns: ['Correct', 'Substitution', 'Omission', 'Distortion', 'Addition'],
                        rows: [
                            '/p/, /b/, /m/',
                            '/t/, /d/, /n/',
                            '/k/, /g/, /ŋ/',
                            '/f/, /v/',
                            '/θ/ (th), /ð/ (th)',
                            '/s/, /z/',
                            '/ʃ/ (sh), /ʒ/ (zh)',
                            '/tʃ/ (ch), /dʒ/ (j)',
                            '/r/, /ɝ/ (er)',
                            '/l/',
                            '/w/, /j/ (y)',
                            '/h/',
                            'Blends (st, sp, sk, etc.)'
                        ]
                    },
                    {
                        type: 'dropdown',
                        name: 'speech_intelligibility',
                        title: 'Overall Speech Intelligibility',
                        choices: [
                            '90-100% - Fully intelligible',
                            '75-90% - Mostly intelligible',
                            '50-75% - Moderately intelligible',
                            '25-50% - Limited intelligibility',
                            '<25% - Severely limited'
                        ],
                        isRequired: true
                    },
                    {
                        type: 'radiogroup',
                        name: 'stimulability',
                        title: 'Overall Stimulability',
                        choices: [
                            'Highly stimulable - Easily imitates correct productions',
                            'Moderately stimulable - Imitates with cues',
                            'Minimally stimulable - Difficulty with imitation',
                            'Not stimulable - Unable to imitate'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'articulation_notes',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document specific error patterns, stimulability for individual sounds, contextual variations, and notable observations...'
                    }
                ]
            },
            'fluency-voice': {
                type: 'panel',
                name: 'fluency_voice_assessment',
                title: 'Fluency & Voice Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'fluency_behaviors',
                        title: 'Fluency Behaviors',
                        columns: ['Not Observed', 'Rare (<3%)', 'Occasional (3-10%)', 'Frequent (>10%)'],
                        rows: [
                            'Sound repetitions',
                            'Syllable repetitions',
                            'Word repetitions',
                            'Phrase repetitions',
                            'Prolongations',
                            'Blocks',
                            'Interjections',
                            'Revisions',
                            'Circumlocutions'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'secondary_behaviors',
                        title: 'Secondary Behaviors',
                        columns: ['Not Present', 'Mild', 'Moderate', 'Severe'],
                        rows: [
                            'Eye blinking/squeezing',
                            'Facial tension',
                            'Head movements',
                            'Body movements',
                            'Audible breathing',
                            'Pitch rise',
                            'Avoidance behaviors'
                        ]
                    },
                    {
                        type: 'rating',
                        name: 'stuttering_severity',
                        title: 'Overall Stuttering Severity',
                        rateMin: 0,
                        rateMax: 7,
                        minRateDescription: 'No stuttering',
                        maxRateDescription: 'Very severe'
                    },
                    {
                        type: 'matrix',
                        name: 'voice_characteristics',
                        title: 'Voice Characteristics',
                        columns: ['WNL', 'Mild', 'Moderate', 'Severe'],
                        rows: [
                            'Pitch (too high/low)',
                            'Loudness (too loud/soft)',
                            'Quality - Hoarse',
                            'Quality - Breathy',
                            'Quality - Strained',
                            'Quality - Rough',
                            'Nasal resonance'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'fluency_voice_notes',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document speaking rate, environmental factors, emotional impact, coping strategies, and voice use patterns...'
                    }
                ]
            },
            'pragmatic-skills': {
                type: 'panel',
                name: 'pragmatic_skills_assessment',
                title: 'Pragmatic Skills Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'communicative_functions',
                        title: 'Communicative Functions',
                        columns: ['Not Observed', 'Emerging', 'Inconsistent', 'Consistent'],
                        rows: [
                            'Requesting (objects/actions)',
                            'Requesting information',
                            'Commenting/labeling',
                            'Greeting/leave-taking',
                            'Protesting/rejecting',
                            'Responding to questions',
                            'Initiating interaction',
                            'Maintaining topic',
                            'Turn-taking',
                            'Repairing breakdowns'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'social_communication',
                        title: 'Social Communication Skills',
                        columns: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
                        rows: [
                            'Eye contact during interaction',
                            'Joint attention',
                            'Facial expressions match context',
                            'Body language appropriate',
                            'Respects personal space',
                            'Understands nonverbal cues',
                            'Uses gestures appropriately',
                            'Adjusts to listener needs',
                            'Follows social rules',
                            'Shows empathy/perspective'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'conversational_skills',
                        title: 'Conversational Skills',
                        columns: ['Significant Difficulty', 'Some Difficulty', 'Adequate', 'Good'],
                        rows: [
                            'Topic initiation',
                            'Topic maintenance',
                            'Topic shifts',
                            'Relevance of comments',
                            'Providing background info',
                            'Clarification strategies',
                            'Narrative skills',
                            'Understanding humor/sarcasm',
                            'Register variation'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'pragmatic_profile',
                        title: 'Overall Pragmatic Profile',
                        choices: [
                            'Age-appropriate pragmatic skills',
                            'Mild pragmatic difficulties',
                            'Moderate pragmatic difficulties',
                            'Severe pragmatic difficulties',
                            'Social communication disorder suspected'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'pragmatic_observations',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document specific examples of pragmatic strengths/challenges, contexts where difficulties arise, cultural considerations...'
                    }
                ]
            },
            'feeding-swallowing': {
                type: 'panel',
                name: 'feeding_swallowing_assessment',
                title: 'Feeding & Swallowing Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'oral_phase_skills',
                        title: 'Oral Phase Skills',
                        columns: ['WNL', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment'],
                        rows: [
                            'Lip closure',
                            'Lip strength',
                            'Tongue lateralization',
                            'Tongue elevation',
                            'Bolus formation',
                            'Bolus control',
                            'Oral transit time',
                            'Oral residue',
                            'Chewing pattern'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'pharyngeal_signs',
                        title: 'Pharyngeal Phase Signs/Symptoms',
                        columns: ['Not Observed', 'Occasional', 'Frequent', 'Consistent'],
                        rows: [
                            'Coughing during/after',
                            'Throat clearing',
                            'Wet vocal quality',
                            'Multiple swallows',
                            'Delayed swallow trigger',
                            'Nasal regurgitation',
                            'Food refusal/aversion',
                            'Pocketing food'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'texture_tolerance',
                        title: 'Texture Tolerance',
                        columns: ['Tolerated Well', 'Some Difficulty', 'Significant Difficulty', 'Unable/Unsafe'],
                        rows: [
                            'Thin liquids',
                            'Nectar-thick liquids',
                            'Honey-thick liquids',
                            'Puree',
                            'Minced & moist',
                            'Soft & bite-sized',
                            'Regular solids',
                            'Mixed consistencies'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'diet_level',
                        title: 'Recommended Diet Level',
                        choices: [
                            'Regular diet - no restrictions',
                            'Soft mechanical diet',
                            'Minced & moist diet',
                            'Pureed diet',
                            'IDDSI Level 4',
                            'IDDSI Level 5',
                            'IDDSI Level 6',
                            'IDDSI Level 7',
                            'NPO - nothing by mouth'
                        ]
                    },
                    {
                        type: 'checkbox',
                        name: 'compensatory_strategies',
                        title: 'Compensatory Strategies Trialed',
                        choices: [
                            'Chin tuck',
                            'Head turn',
                            'Effortful swallow',
                            'Multiple swallows',
                            'Liquid wash',
                            'Pacing strategies',
                            'Smaller bolus size',
                            'Alternating liquids/solids'
                        ],
                        hasOther: true
                    },
                    {
                        type: 'comment',
                        name: 'feeding_observations',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document feeding position, duration, caregiver interaction, behavioral responses, safety concerns, instrumental assessment needs...'
                    }
                ]
            },
            'test-scores': {
                type: 'matrixdynamic',
                name: 'standardized_tests',
                title: 'Standardized Test Results',
                columns: [
                    { name: 'test_name', title: 'Test Name', cellType: 'text' },
                    { name: 'standard_score', title: 'Standard Score', cellType: 'text' },
                    { name: 'percentile', title: 'Percentile', cellType: 'text' },
                    { name: 'age_equivalent', title: 'Age Equivalent', cellType: 'text' }
                ],
                rowCount: 1,
                addRowText: 'Add Test'
            },
            'signaturepad': {
                type: 'signaturepad',
                name: `signature_${Date.now()}`,
                title: 'Signature',
                width: '300',
                height: '150',
                penColor: '#000080',
                backgroundColor: '#ffffff'
            },
            'adl-skills': {
                type: 'panel',
                name: 'adl_assessment',
                title: 'Activities of Daily Living (ADL) Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'self_care_skills',
                        title: 'Self-Care Skills',
                        columns: ['Independent', 'Supervision', 'Min Assist (25%)', 'Mod Assist (50%)', 'Max Assist (75%)', 'Dependent'],
                        rows: [
                            'Feeding/Eating',
                            'Grooming (hair, teeth, face)',
                            'Bathing/Showering',
                            'Upper body dressing',
                            'Lower body dressing',
                            'Toileting',
                            'Toilet hygiene',
                            'Personal device care',
                            'Functional mobility',
                            'Sleep/rest patterns'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'instrumental_adl',
                        title: 'Instrumental ADL (IADL)',
                        columns: ['Independent', 'Needs Cueing', 'Needs Assistance', 'Unable', 'N/A'],
                        rows: [
                            'Meal preparation',
                            'Shopping',
                            'Money management',
                            'Medication management',
                            'Home management',
                            'Communication device use',
                            'Community mobility',
                            'Child rearing',
                            'Pet care',
                            'Safety procedures'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'adl_performance_pattern',
                        title: 'Overall ADL Performance Pattern',
                        choices: [
                            'Age-appropriate independence',
                            'Mild delays/difficulties',
                            'Moderate delays/difficulties',
                            'Severe delays/difficulties',
                            'Unable to perform most ADLs'
                        ]
                    },
                    {
                        type: 'checkbox',
                        name: 'adl_barriers',
                        title: 'Barriers to ADL Performance',
                        choices: [
                            'Motor planning difficulties',
                            'Strength/endurance limitations',
                            'Sensory processing challenges',
                            'Cognitive/attention issues',
                            'Behavioral resistance',
                            'Environmental barriers',
                            'Lack of practice/experience',
                            'Fear/anxiety'
                        ],
                        hasOther: true
                    },
                    {
                        type: 'comment',
                        name: 'adl_observations',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document specific ADL challenges, adaptive strategies used, environmental modifications needed, caregiver involvement...'
                    }
                ]
            },
            'sensory-processing': {
                type: 'panel',
                name: 'sensory_processing_assessment',
                title: 'Sensory Processing Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'sensory_systems',
                        title: 'Sensory Systems Processing',
                        columns: ['Typical Response', 'Over-Responsive', 'Under-Responsive', 'Sensory Seeking', 'Sensory Avoiding'],
                        rows: [
                            'Auditory (sound)',
                            'Visual (sight)',
                            'Tactile (touch)',
                            'Vestibular (movement)',
                            'Proprioceptive (body awareness)',
                            'Gustatory (taste)',
                            'Olfactory (smell)',
                            'Interoception (internal body signals)'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'sensory_behaviors',
                        title: 'Sensory-Related Behaviors',
                        columns: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
                        rows: [
                            'Covers ears to sounds',
                            'Seeks/avoids certain textures',
                            'Difficulty with clothing/tags',
                            'Seeks intense movement',
                            'Avoids playground equipment',
                            'Crashes into things',
                            'Poor awareness of body in space',
                            'Picky eater (textures/tastes)',
                            'Sensitive to lights',
                            'Difficulty sitting still'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'sensory_modulation',
                        title: 'Sensory Modulation in Daily Activities',
                        columns: ['No Issues', 'Mild Issues', 'Moderate Issues', 'Severe Issues'],
                        rows: [
                            'Self-care routines',
                            'Meal times',
                            'Play activities',
                            'Social participation',
                            'Learning/attention',
                            'Sleep patterns',
                            'Transitions',
                            'Community outings'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'sensory_profile_pattern',
                        title: 'Primary Sensory Profile Pattern',
                        choices: [
                            'Typical sensory processing',
                            'Sensory sensitivity/over-responsivity',
                            'Sensory under-responsivity',
                            'Sensory seeking',
                            'Sensory avoiding',
                            'Mixed pattern',
                            'Fluctuating pattern'
                        ],
                        isRequired: true
                    },
                    {
                        type: 'dropdown',
                        name: 'sensory_assessment_tool',
                        title: 'Formal Assessment Tool Used',
                        choices: [
                            'Sensory Profile 2',
                            'Sensory Processing Measure (SPM)',
                            'Sensory Integration and Praxis Tests (SIPT)',
                            'Clinical Observations',
                            'Other standardized tool',
                            'Informal assessment only'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'sensory_impact',
                        title: 'Functional Impact',
                        rows: 4,
                        placeholder: 'Describe how sensory processing differences impact daily functioning, participation, and quality of life...'
                    }
                ]
            },
            'motor-skills': {
                type: 'panel',
                name: 'motor_skills_assessment',
                title: 'Motor Skills Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'gross_motor_skills',
                        title: 'Gross Motor Skills',
                        columns: ['Age Appropriate', 'Mild Delay', 'Moderate Delay', 'Severe Delay', 'Unable'],
                        rows: [
                            'Static balance (standing)',
                            'Dynamic balance (walking)',
                            'Running',
                            'Jumping',
                            'Hopping (one foot)',
                            'Skipping',
                            'Ball skills (throw/catch)',
                            'Climbing stairs',
                            'Coordination (bilateral)',
                            'Motor planning'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'fine_motor_skills',
                        title: 'Fine Motor Skills',
                        columns: ['Age Appropriate', 'Mild Delay', 'Moderate Delay', 'Severe Delay', 'Unable'],
                        rows: [
                            'Grasp patterns',
                            'In-hand manipulation',
                            'Bilateral hand use',
                            'Tool use (scissors, utensils)',
                            'Precision/dexterity',
                            'Hand strength',
                            'Visual-motor control',
                            'Speed of manipulation'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'postural_control',
                        title: 'Postural Control & Core Stability',
                        columns: ['WNL', 'Mild Deficit', 'Moderate Deficit', 'Severe Deficit'],
                        rows: [
                            'Head control',
                            'Trunk control',
                            'Sitting posture',
                            'Standing posture',
                            'Protective reactions',
                            'Righting reactions',
                            'Core strength',
                            'Endurance'
                        ]
                    },
                    {
                        type: 'dropdown',
                        name: 'motor_assessment_tool',
                        title: 'Standardized Assessment Used',
                        choices: [
                            'Peabody Developmental Motor Scales-2 (PDMS-2)',
                            'Bruininks-Oseretsky Test of Motor Proficiency-3 (BOT-3)',
                            'Movement Assessment Battery for Children-2 (MABC-2)',
                            'School Function Assessment (SFA)',
                            'Clinical observations only',
                            'Other'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'motor_coordination_level',
                        title: 'Overall Motor Coordination',
                        choices: [
                            'Well-coordinated movements',
                            'Mild incoordination',
                            'Moderate incoordination',
                            'Severe incoordination',
                            'Dyspraxia suspected'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'motor_observations',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document quality of movement, compensatory patterns, fatigue, motor planning difficulties, environmental factors...'
                    }
                ]
            },
            'visual-perceptual': {
                type: 'panel',
                name: 'visual_perceptual_assessment',
                title: 'Visual Perceptual Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'visual_perceptual_skills',
                        title: 'Visual Perceptual Skills',
                        columns: ['Age Appropriate', 'Mild Difficulty', 'Moderate Difficulty', 'Severe Difficulty'],
                        rows: [
                            'Visual discrimination',
                            'Visual memory',
                            'Visual sequential memory',
                            'Visual figure-ground',
                            'Visual closure',
                            'Visual spatial relations',
                            'Form constancy',
                            'Visual attention',
                            'Visual scanning'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'visual_motor_integration',
                        title: 'Visual Motor Integration',
                        columns: ['WNL', 'Below Average', 'Poor', 'Very Poor'],
                        rows: [
                            'Copying shapes',
                            'Drawing skills',
                            'Writing/pre-writing',
                            'Cutting skills',
                            'Constructional skills',
                            'Eye-hand coordination',
                            'Spatial organization',
                            'Line orientation'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'ocular_motor_skills',
                        title: 'Ocular Motor Skills',
                        columns: ['Intact', 'Mild Difficulty', 'Moderate Difficulty', 'Severe Difficulty'],
                        rows: [
                            'Visual tracking (smooth pursuits)',
                            'Saccades (eye jumps)',
                            'Convergence/divergence',
                            'Visual fixation',
                            'Peripheral vision awareness',
                            'Depth perception'
                        ]
                    },
                    {
                        type: 'dropdown',
                        name: 'vp_assessment_tool',
                        title: 'Assessment Tool Used',
                        choices: [
                            'Beery VMI-6',
                            'Test of Visual Perceptual Skills-4 (TVPS-4)',
                            'Motor-Free Visual Perception Test-4 (MVPT-4)',
                            'Developmental Test of Visual Perception-3 (DTVP-3)',
                            'Clinical observations only',
                            'Other'
                        ]
                    },
                    {
                        type: 'checkbox',
                        name: 'functional_vision_concerns',
                        title: 'Functional Vision Concerns',
                        choices: [
                            'Difficulty copying from board',
                            'Loses place when reading',
                            'Poor spacing in writing',
                            'Difficulty with puzzles',
                            'Trouble finding items',
                            'Bumps into objects',
                            'Difficulty catching balls',
                            'Eye fatigue/headaches'
                        ],
                        hasOther: true
                    },
                    {
                        type: 'comment',
                        name: 'vp_observations',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document compensatory strategies, environmental modifications, impact on academic/functional tasks...'
                    }
                ]
            },
            'fine-motor': {
                type: 'panel',
                name: 'fine_motor_assessment',
                title: 'Fine Motor Skills Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'grasp_patterns',
                        title: 'Grasp Pattern Development',
                        columns: ['Present', 'Emerging', 'Not Present', 'Atypical'],
                        rows: [
                            'Palmar grasp',
                            'Radial palmar grasp',
                            'Radial digital grasp',
                            'Static tripod grasp',
                            'Dynamic tripod grasp',
                            'Lateral tripod grasp',
                            'Quadrupod grasp',
                            'Hook grasp',
                            'Power grasp'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'manipulation_skills',
                        title: 'In-Hand Manipulation Skills',
                        columns: ['Proficient', 'Functional', 'Emerging', 'Unable'],
                        rows: [
                            'Translation (finger to palm)',
                            'Translation (palm to finger)',
                            'Shift',
                            'Simple rotation',
                            'Complex rotation',
                            'Stabilization'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'fine_motor_tasks',
                        title: 'Functional Fine Motor Tasks',
                        columns: ['Independent', 'Min Difficulty', 'Mod Difficulty', 'Max Difficulty', 'Unable'],
                        rows: [
                            'Buttons',
                            'Zippers',
                            'Snaps',
                            'Shoe tying',
                            'Opening containers',
                            'Using utensils',
                            'Turning pages',
                            'Using scissors',
                            'Stringing beads',
                            'Building with blocks'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'hand_dominance',
                        title: 'Hand Dominance',
                        choices: [
                            'Right hand dominant',
                            'Left hand dominant',
                            'Mixed dominance',
                            'Not yet established'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'hand_strength',
                        title: 'Hand Strength & Endurance',
                        columns: ['WNL', 'Mild Weakness', 'Moderate Weakness', 'Severe Weakness'],
                        rows: [
                            'Grip strength',
                            'Pinch strength (lateral)',
                            'Pinch strength (tip)',
                            'Pinch strength (3-jaw)',
                            'Hand endurance',
                            'Finger isolation'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'fine_motor_notes',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document hand preference, compensatory patterns, fatigue, tremor, associated movements...'
                    }
                ]
            },
            'gross-motor': {
                type: 'panel',
                name: 'gross_motor_assessment',
                title: 'Gross Motor Skills Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'locomotor_skills',
                        title: 'Locomotor Skills',
                        columns: ['Typical', '1-3 mo Delay', '3-6 mo Delay', '>6 mo Delay', 'Unable'],
                        rows: [
                            'Rolling',
                            'Crawling',
                            'Creeping on hands/knees',
                            'Cruising',
                            'Walking independently',
                            'Running',
                            'Jumping (2 feet)',
                            'Hopping (1 foot)',
                            'Galloping',
                            'Skipping'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'ball_skills',
                        title: 'Ball Skills',
                        columns: ['Age Appropriate', 'Emerging', 'Delayed', 'Significantly Delayed'],
                        rows: [
                            'Rolling ball',
                            'Throwing overhand',
                            'Throwing underhand',
                            'Catching large ball',
                            'Catching small ball',
                            'Kicking stationary ball',
                            'Kicking rolling ball',
                            'Bouncing ball',
                            'Hitting ball with bat'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'balance_skills',
                        title: 'Balance & Coordination',
                        columns: ['WNL', 'Mild Impairment', 'Moderate Impairment', 'Severe Impairment'],
                        rows: [
                            'Static balance (eyes open)',
                            'Static balance (eyes closed)',
                            'Single leg stance',
                            'Tandem walking',
                            'Walking on tiptoes',
                            'Walking on heels',
                            'Balance beam walking',
                            'Jumping jacks',
                            'Cross-lateral movements'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'playground_skills',
                        title: 'Playground Skills',
                        columns: ['Independent', 'Supervision', 'Physical Assist', 'Unable', 'Fearful'],
                        rows: [
                            'Climbing stairs',
                            'Climbing ladder',
                            'Sliding',
                            'Swinging (pumping legs)',
                            'Climbing structures',
                            'Navigating obstacles',
                            'Playing on equipment'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'gross_motor_quality',
                        title: 'Overall Movement Quality',
                        choices: [
                            'Smooth, coordinated movements',
                            'Mild awkwardness/clumsiness',
                            'Moderate coordination difficulties',
                            'Severe coordination impairment',
                            'Significant motor planning issues'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'gross_motor_notes',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document gait pattern, muscle tone, range of motion, endurance, safety awareness, fear/confidence levels...'
                    }
                ]
            },
            'handwriting': {
                type: 'panel',
                name: 'handwriting_assessment',
                title: 'Handwriting Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'prewriting_skills',
                        title: 'Pre-Writing Skills',
                        columns: ['Mastered', 'Emerging', 'Difficulty', 'Unable'],
                        rows: [
                            'Vertical line',
                            'Horizontal line',
                            'Circle',
                            'Cross (+)',
                            'Square',
                            'Diagonal lines',
                            'Triangle',
                            'Diamond'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'letter_formation',
                        title: 'Letter Formation',
                        columns: ['Correct', 'Minor Errors', 'Major Errors', 'Illegible'],
                        rows: [
                            'Uppercase letters',
                            'Lowercase letters',
                            'Letter reversals',
                            'Number formation',
                            'Consistent size',
                            'Consistent slant',
                            'Starting points',
                            'Directionality'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'handwriting_components',
                        title: 'Handwriting Components',
                        columns: ['Good', 'Fair', 'Poor', 'Very Poor'],
                        rows: [
                            'Line adherence',
                            'Letter spacing',
                            'Word spacing',
                            'Margin use',
                            'Overall legibility',
                            'Writing speed',
                            'Writing pressure',
                            'Pencil control'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'pencil_grip',
                        title: 'Pencil Grip Pattern',
                        choices: [
                            'Dynamic tripod',
                            'Lateral tripod',
                            'Dynamic quadrupod',
                            'Lateral quadrupod',
                            'Fisted grasp',
                            'Thumb wrap',
                            'Other atypical pattern'
                        ]
                    },
                    {
                        type: 'radiogroup',
                        name: 'writing_posture',
                        title: 'Writing Posture',
                        choices: [
                            'Appropriate sitting posture',
                            'Slouches in chair',
                            'Leans on desk/table',
                            'Head too close to paper',
                            'Unusual paper position',
                            'Excessive body movements'
                        ]
                    },
                    {
                        type: 'checkbox',
                        name: 'handwriting_difficulties',
                        title: 'Specific Difficulties Observed',
                        choices: [
                            'Poor letter memory',
                            'Slow writing speed',
                            'Hand fatigue',
                            'Difficulty copying',
                            'Poor near/far point copying',
                            'Avoidance of writing tasks',
                            'Frustration with writing',
                            'Difficulty with cursive'
                        ],
                        hasOther: true
                    },
                    {
                        type: 'dropdown',
                        name: 'handwriting_program',
                        title: 'Handwriting Program/Approach',
                        choices: [
                            'Handwriting Without Tears',
                            'Zaner-Bloser',
                            "D'Nealian",
                            'Cursive First',
                            'School curriculum',
                            'Other structured program',
                            'No specific program'
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'handwriting_notes',
                        title: 'Clinical Observations',
                        rows: 4,
                        placeholder: 'Document writing samples collected, environmental factors, adaptive equipment needs, motivation level...'
                    }
                ]
            },
            'background-history': {
                type: 'panel',
                name: 'background_history',
                title: 'Background & Developmental History',
                elements: [
                    {
                        type: 'matrix',
                        name: 'developmental_milestones',
                        title: 'Developmental Milestones',
                        columns: ['On Time', 'Early', 'Delayed', 'Not Yet Achieved', 'Unknown'],
                        rows: [
                            'Smiled socially (2-3 months)',
                            'Rolled over (4-6 months)',
                            'Sat without support (6-8 months)',
                            'Crawled (7-10 months)',
                            'Walked independently (12-15 months)',
                            'First words (12-18 months)',
                            'Two-word phrases (18-24 months)',
                            'Toilet trained (2-3 years)',
                            'Dressed independently (3-4 years)',
                            'Rode bicycle (5-7 years)'
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'educational_history',
                        title: 'Educational History',
                        elements: [
                            { type: 'text', name: 'current_school', title: 'Current School/Program', placeholder: 'School name and location' },
                            { type: 'dropdown', name: 'grade_level', title: 'Current Grade/Level',
                              choices: ['Early Intervention', 'Preschool', 'Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Post-Secondary', 'Other'] },
                            { type: 'radiogroup', name: 'educational_setting', title: 'Educational Setting',
                              choices: ['General Education', 'Inclusion with Support', 'Resource Room', 'Self-Contained', 'Special School', 'Home School', 'Virtual/Online'] },
                            { type: 'checkbox', name: 'support_services', title: 'Current Support Services',
                              choices: ['IEP', '504 Plan', 'Speech Therapy', 'Occupational Therapy', 'Physical Therapy', 'Behavioral Support', 'Academic Tutoring', 'Aide/Paraprofessional', 'Counseling', 'Other'],
                              hasOther: true },
                            { type: 'comment', name: 'academic_concerns', title: 'Academic Concerns', rows: 3,
                              placeholder: 'Describe any academic challenges, strengths, or specific concerns...' }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'therapy_history',
                        title: 'Previous Therapy History',
                        elements: [
                            { type: 'matrix', name: 'previous_therapies', title: 'Previous Therapy Services',
                              columns: ['Never', 'Currently', 'Past (Discontinued)', 'Recommended but Not Received'],
                              rows: ['Speech-Language Therapy', 'Occupational Therapy', 'Physical Therapy', 'ABA Therapy', 'Psychological/Counseling', 'Social Skills Group', 'Feeding Therapy', 'Other Specialty Services'] },
                            { type: 'comment', name: 'therapy_details', title: 'Previous Therapy Details', rows: 4,
                              placeholder: 'Include dates, duration, frequency, provider names, and outcomes of previous therapies...' }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'family_dynamics',
                        title: 'Family & Social History',
                        elements: [
                            { type: 'dropdown', name: 'family_structure', title: 'Family Structure',
                              choices: ['Two-parent household', 'Single parent', 'Joint custody', 'Guardian/Relative care', 'Foster care', 'Group home', 'Other'] },
                            { type: 'text', name: 'siblings', title: 'Number of Siblings', inputType: 'number', min: 0 },
                            { type: 'text', name: 'languages_home', title: 'Languages Spoken at Home', placeholder: 'List all languages' },
                            { type: 'radiogroup', name: 'family_history_delays', title: 'Family History of Speech/Language/Learning Delays',
                              choices: ['Yes - Immediate family', 'Yes - Extended family', 'No', 'Unknown'] },
                            { type: 'comment', name: 'family_concerns', title: 'Family Concerns & Priorities', rows: 3,
                              placeholder: 'What are the family\'s main concerns and goals for therapy?' }
                        ]
                    }
                ]
            },
            'behavioral-observations': {
                type: 'panel',
                name: 'behavioral_observations',
                title: 'Behavioral Observations',
                elements: [
                    {
                        type: 'matrix',
                        name: 'attention_behaviors',
                        title: 'Attention & Engagement',
                        columns: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'],
                        rows: [
                            'Maintains attention to task',
                            'Follows multi-step directions',
                            'Transitions between activities',
                            'Sits appropriately during activities',
                            'Participates willingly',
                            'Shows interest in materials',
                            'Completes tasks independently',
                            'Requires redirection',
                            'Demonstrates task persistence'
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'behavioral_regulation',
                        title: 'Behavioral Regulation',
                        columns: ['Not Observed', 'Mild', 'Moderate', 'Severe', 'Constant'],
                        rows: [
                            'Tantrums/meltdowns',
                            'Physical aggression',
                            'Verbal aggression',
                            'Self-injurious behavior',
                            'Property destruction',
                            'Elopement/running',
                            'Withdrawal/shutdown',
                            'Repetitive behaviors',
                            'Sensory seeking',
                            'Avoidance behaviors'
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'cooperation_rapport',
                        title: 'Cooperation & Rapport',
                        elements: [
                            { type: 'rating', name: 'cooperation_level', title: 'Overall Cooperation Level',
                              rateMin: 1, rateMax: 5,
                              minRateDescription: 'Uncooperative', maxRateDescription: 'Highly Cooperative' },
                            { type: 'rating', name: 'rapport_establishment', title: 'Ease of Rapport Establishment',
                              rateMin: 1, rateMax: 5,
                              minRateDescription: 'Very Difficult', maxRateDescription: 'Very Easy' },
                            { type: 'checkbox', name: 'motivators_observed', title: 'Effective Motivators/Reinforcers',
                              choices: ['Verbal praise', 'Stickers/tokens', 'Preferred toys', 'Movement breaks', 'Food items', 'Technology/screens', 'Social interaction', 'Preferred topics', 'Choice-making', 'Other'],
                              hasOther: true }
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'communication_behaviors',
                        title: 'Communication Behaviors During Assessment',
                        columns: ['Consistently', 'Frequently', 'Occasionally', 'Rarely', 'Never'],
                        rows: [
                            'Made eye contact',
                            'Responded to name',
                            'Initiated communication',
                            'Used gestures',
                            'Demonstrated joint attention',
                            'Showed communicative intent',
                            'Protested appropriately',
                            'Requested assistance',
                            'Commented on activities',
                            'Engaged in reciprocal interaction'
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'environmental_factors',
                        title: 'Environmental Factors',
                        elements: [
                            { type: 'checkbox', name: 'environmental_supports', title: 'Environmental Supports Needed',
                              choices: ['Reduced distractions', 'Visual supports', 'Movement breaks', 'Sensory tools', 'Preferred seating', 'Adjusted lighting', 'Noise reduction', 'Structured schedule', 'Clear boundaries', 'Other'],
                              hasOther: true },
                            { type: 'comment', name: 'behavioral_notes', title: 'Additional Behavioral Observations', rows: 4,
                              placeholder: 'Document specific behaviors, triggers, successful strategies, and other relevant observations...' }
                        ]
                    }
                ]
            },
            'clinical-impressions': {
                type: 'panel',
                name: 'clinical_impressions',
                title: 'Clinical Impressions & Diagnosis',
                elements: [
                    {
                        type: 'panel',
                        name: 'diagnostic_impressions',
                        title: 'Diagnostic Impressions',
                        elements: [
                            { type: 'text', name: 'primary_diagnosis', title: 'Primary Diagnosis', placeholder: 'ICD-10 code and description', isRequired: true },
                            { type: 'text', name: 'secondary_diagnosis', title: 'Secondary Diagnosis', placeholder: 'ICD-10 code and description' },
                            { type: 'text', name: 'tertiary_diagnosis', title: 'Additional Diagnosis', placeholder: 'ICD-10 code and description' },
                            { type: 'dropdown', name: 'severity_rating', title: 'Overall Severity Rating',
                              choices: ['Mild', 'Mild-Moderate', 'Moderate', 'Moderate-Severe', 'Severe', 'Profound'],
                              isRequired: true }
                        ]
                    },
                    {
                        type: 'matrix',
                        name: 'differential_considerations',
                        title: 'Differential Diagnostic Considerations',
                        columns: ['Primary Concern', 'Rule Out', 'Contributing Factor', 'Not Applicable'],
                        rows: [
                            'Language Disorder',
                            'Speech Sound Disorder',
                            'Childhood Apraxia of Speech',
                            'Autism Spectrum Disorder',
                            'ADHD',
                            'Intellectual Disability',
                            'Hearing Loss',
                            'Social Communication Disorder',
                            'Selective Mutism',
                            'Developmental Coordination Disorder',
                            'Learning Disability',
                            'Anxiety Disorder'
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'prognostic_indicators',
                        title: 'Prognostic Indicators',
                        elements: [
                            { type: 'radiogroup', name: 'prognosis', title: 'Overall Prognosis for Improvement',
                              choices: ['Excellent', 'Good', 'Fair', 'Guarded', 'Poor'],
                              isRequired: true },
                            { type: 'checkbox', name: 'positive_prognostic_factors', title: 'Positive Prognostic Factors',
                              choices: ['Young age', 'High motivation', 'Family support', 'Cognitive strengths', 'Good attention', 'Previous therapy success', 'Stimulability', 'Social engagement', 'No comorbidities', 'Consistent attendance expected'],
                              hasOther: true },
                            { type: 'checkbox', name: 'negative_prognostic_factors', title: 'Factors That May Impact Progress',
                              choices: ['Multiple diagnoses', 'Severe presentation', 'Limited family support', 'Inconsistent attendance', 'Cognitive limitations', 'Behavioral challenges', 'Medical complications', 'Limited stimulability', 'Previous therapy plateau', 'Environmental barriers'],
                              hasOther: true }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'clinical_summary',
                        title: 'Clinical Summary',
                        elements: [
                            { type: 'comment', name: 'strengths_summary', title: 'Summary of Strengths', rows: 3,
                              placeholder: 'Summarize the client\'s strengths and assets...' },
                            { type: 'comment', name: 'concerns_summary', title: 'Summary of Concerns', rows: 3,
                              placeholder: 'Summarize primary areas of concern...' },
                            { type: 'comment', name: 'clinical_rationale', title: 'Clinical Rationale', rows: 4,
                              placeholder: 'Provide clinical reasoning for diagnosis and treatment recommendations...' }
                        ]
                    }
                ]
            },
            'recommendations': {
                type: 'panel',
                name: 'recommendations_section',
                title: 'Recommendations',
                elements: [
                    {
                        type: 'panel',
                        name: 'service_recommendations',
                        title: 'Recommended Services',
                        elements: [
                            { type: 'radiogroup', name: 'therapy_recommended', title: 'Is therapy recommended?',
                              choices: ['Yes - Immediate start', 'Yes - Within 3 months', 'Yes - Monitor and re-evaluate', 'No - Not needed at this time', 'No - Discharge'],
                              isRequired: true },
                            { type: 'dropdown', name: 'service_delivery_model', title: 'Service Delivery Model',
                              choices: ['Individual therapy', 'Group therapy', 'Individual + Group combination', 'Consultative model', 'Parent training/coaching', 'Intensive program', 'Teletherapy', 'Hybrid (in-person + tele)'] },
                            { type: 'dropdown', name: 'frequency_recommendation', title: 'Recommended Frequency',
                              choices: ['5x per week', '3x per week', '2x per week', '1x per week', '2x per month', '1x per month', 'As needed', 'Other'] },
                            { type: 'dropdown', name: 'session_duration', title: 'Recommended Session Duration',
                              choices: ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '90 minutes'] },
                            { type: 'dropdown', name: 'service_setting', title: 'Recommended Setting',
                              choices: ['Clinic', 'School', 'Home', 'Community', 'Daycare/Preschool', 'Teletherapy', 'Multiple settings'] },
                            { type: 'text', name: 'duration_recommendation', title: 'Recommended Duration of Services',
                              placeholder: 'e.g., 6 months with re-evaluation' }
                        ]
                    },
                    {
                        type: 'checkbox',
                        name: 'therapy_approaches',
                        title: 'Recommended Therapy Approaches',
                        choices: [
                            'Traditional articulation therapy',
                            'Phonological approach',
                            'Motor-based approach (PROMPT, DTTC)',
                            'Language stimulation techniques',
                            'Social communication intervention',
                            'AAC implementation',
                            'Fluency shaping techniques',
                            'Voice therapy techniques',
                            'Oral motor exercises',
                            'Sensory integration techniques',
                            'Cognitive-communication strategies',
                            'Parent/caregiver training',
                            'Collaborative consultation',
                            'Other evidence-based approach'
                        ],
                        hasOther: true
                    },
                    {
                        type: 'panel',
                        name: 'referral_recommendations',
                        title: 'Referral Recommendations',
                        elements: [
                            { type: 'checkbox', name: 'referrals_needed', title: 'Additional Evaluations/Referrals Recommended',
                              choices: [
                                  'Audiological evaluation',
                                  'Psychological/neuropsychological evaluation',
                                  'Occupational therapy evaluation',
                                  'Physical therapy evaluation',
                                  'Developmental pediatrician',
                                  'Neurologist',
                                  'ENT/Otolaryngologist',
                                  'Feeding team evaluation',
                                  'Assistive technology evaluation',
                                  'Educational evaluation',
                                  'ABA assessment',
                                  'Genetic testing',
                                  'Vision screening',
                                  'Dental evaluation'
                              ],
                              hasOther: true },
                            { type: 'comment', name: 'referral_rationale', title: 'Referral Rationale', rows: 3,
                              placeholder: 'Explain the rationale for each referral recommendation...' }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'home_program',
                        title: 'Home Program Recommendations',
                        elements: [
                            { type: 'checkbox', name: 'home_strategies', title: 'Recommended Home Strategies',
                              choices: [
                                  'Daily reading activities',
                                  'Language expansion techniques',
                                  'Speech sound practice',
                                  'Oral motor exercises',
                                  'Social skills practice',
                                  'Visual schedules/supports',
                                  'Sensory diet activities',
                                  'Communication temptations',
                                  'Play-based interventions',
                                  'Technology/app support',
                                  'Behavior management strategies',
                                  'Environmental modifications'
                              ],
                              hasOther: true },
                            { type: 'comment', name: 'parent_education_topics', title: 'Parent Education Topics', rows: 3,
                              placeholder: 'List specific topics for parent education and training...' },
                            { type: 'comment', name: 'home_program_details', title: 'Specific Home Program Activities', rows: 4,
                              placeholder: 'Provide detailed home activity recommendations...' }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'follow_up_plan',
                        title: 'Follow-Up Plan',
                        elements: [
                            { type: 'dropdown', name: 'follow_up_timeline', title: 'Recommended Follow-Up',
                              choices: ['1 month', '3 months', '6 months', '1 year', 'As needed', 'Upon completion of therapy', 'No follow-up needed'] },
                            { type: 'comment', name: 'follow_up_instructions', title: 'Follow-Up Instructions', rows: 3,
                              placeholder: 'Specific instructions for follow-up, re-evaluation criteria, or discharge planning...' },
                            { type: 'comment', name: 'additional_recommendations', title: 'Additional Recommendations', rows: 4,
                              placeholder: 'Any other recommendations, considerations, or important information...' }
                        ]
                    }
                ]
            },
            'goals-objectives': {
                type: 'paneldynamic',
                name: 'treatment_goals',
                title: 'Treatment Goals',
                templateElements: [
                    { type: 'text', name: 'goal_area', title: 'Goal Area' },
                    { type: 'comment', name: 'goal_description', title: 'Goal Description', rows: 2 },
                    { type: 'dropdown', name: 'timeframe', title: 'Timeframe', choices: ['1 month', '3 months', '6 months', '1 year'] }
                ],
                panelCount: 1,
                panelAddText: 'Add Goal'
            },
            'signature-section': {
                type: 'panel',
                name: 'signatures',
                title: 'Signatures and Consent',
                elements: [
                    {
                        type: 'signaturepad',
                        name: 'therapist_signature',
                        title: 'Therapist Signature',
                        width: '300',
                        height: '150',
                        penColor: '#000080'
                    },
                    { type: 'text', name: 'therapist_name', title: 'Therapist Name (Print)', isRequired: true },
                    { type: 'text', name: 'license_number', title: 'License Number', isRequired: true },
                    { type: 'text', name: 'signature_date', title: 'Date', inputType: 'date', isRequired: true }
                ]
            },
            'ai-goals': {
                type: 'panel',
                name: 'ai_goals_generator',
                title: 'AI Goal Generator',
                elements: [
                    {
                        type: 'panel',
                        name: 'goal_parameters',
                        title: 'Goal Generation Parameters',
                        elements: [
                            { type: 'dropdown', name: 'goal_type', title: 'Goal Type',
                              choices: ['Long-term goals', 'Short-term objectives', 'Both goals and objectives'],
                              isRequired: true },
                            { type: 'dropdown', name: 'goal_framework', title: 'Goal Framework',
                              choices: ['SMART goals', 'GAS (Goal Attainment Scaling)', 'Functional outcomes', 'Academic standards-based', 'Developmental milestones'],
                              isRequired: true },
                            { type: 'text', name: 'number_of_goals', title: 'Number of Goals to Generate',
                              inputType: 'number', min: 1, max: 10, defaultValue: '3' },
                            { type: 'checkbox', name: 'goal_areas', title: 'Areas to Address',
                              choices: [
                                  'Articulation/Speech Sounds',
                                  'Expressive Language',
                                  'Receptive Language',
                                  'Pragmatic/Social Language',
                                  'Fluency',
                                  'Voice',
                                  'Feeding/Swallowing',
                                  'AAC Use',
                                  'Literacy/Pre-literacy',
                                  'Executive Function',
                                  'Fine Motor Skills',
                                  'Gross Motor Skills',
                                  'Sensory Processing',
                                  'Activities of Daily Living',
                                  'Handwriting',
                                  'Visual Perceptual Skills',
                                  'Play Skills',
                                  'Self-Regulation'
                              ],
                              isRequired: true }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'goal_customization',
                        title: 'Goal Customization',
                        elements: [
                            { type: 'dropdown', name: 'measurement_method', title: 'Preferred Measurement Method',
                              choices: ['Percentage accuracy', 'Frequency count', 'Duration measure', 'Likert scale', 'Task analysis', 'Rubric-based', 'Mixed methods'] },
                            { type: 'dropdown', name: 'goal_timeframe', title: 'Goal Timeframe',
                              choices: ['4 weeks', '6 weeks', '3 months', '6 months', '1 year', 'IEP annual', 'Insurance authorization period'] },
                            { type: 'radiogroup', name: 'baseline_included', title: 'Include Baseline Data in Goals?',
                              choices: ['Yes - Use assessment data', 'Yes - Estimate baseline', 'No - Goals only'] },
                            { type: 'dropdown', name: 'goal_complexity', title: 'Goal Complexity Level',
                              choices: ['Basic/Foundational', 'Intermediate', 'Advanced', 'Mixed levels based on assessment'] }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'goal_context',
                        title: 'Contextual Factors',
                        elements: [
                            { type: 'checkbox', name: 'goal_settings', title: 'Settings for Goal Implementation',
                              choices: ['Therapy room', 'Classroom', 'Home', 'Community', 'Playground', 'Cafeteria', 'All settings'],
                              hasOther: true },
                            { type: 'checkbox', name: 'goal_partners', title: 'Communication Partners',
                              choices: ['Therapist', 'Parents/Caregivers', 'Teachers', 'Peers', 'Siblings', 'Unfamiliar adults', 'All partners'],
                              hasOther: true },
                            { type: 'comment', name: 'special_considerations', title: 'Special Considerations for Goals',
                              rows: 3, placeholder: 'Cultural factors, family priorities, medical considerations, etc.' }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'goal_bank_integration',
                        title: 'Goal Bank Integration',
                        elements: [
                            { type: 'radiogroup', name: 'use_goal_bank', title: 'Reference Goal Bank?',
                              choices: ['Yes - Match to standardized goals', 'Yes - Adapt from goal bank', 'No - Generate unique goals'] },
                            { type: 'checkbox', name: 'goal_categories', title: 'Goal Bank Categories to Include',
                              choices: ['Early intervention (0-3)', 'Preschool (3-5)', 'School-age (5-12)', 'Adolescent (12-18)', 'Adult (18+)', 'Geriatric (65+)'],
                              visibleIf: "{use_goal_bank} != 'No - Generate unique goals'" }
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'generated_goals_output',
                        title: 'AI-Generated Goals',
                        rows: 12,
                        readOnly: true,
                        placeholder: 'Goals will be generated based on assessment data and selected parameters...',
                        description: 'Click "Generate Goals" button to create customized goals based on your specifications'
                    },
                    {
                        type: 'html',
                        name: 'generate_button',
                        html: '<div style="text-align: center; margin: 20px 0;"><button type="button" class="btn btn-primary touch-target" data-action="generateAIGoals">🎯 Generate Goals</button></div>'
                    },
                    {
                        type: 'panel',
                        name: 'goal_editing',
                        title: 'Goal Refinement',
                        elements: [
                            { type: 'rating', name: 'goal_satisfaction', title: 'Satisfaction with Generated Goals',
                              rateMin: 1, rateMax: 5,
                              minRateDescription: 'Needs Major Revision', maxRateDescription: 'Excellent' },
                            { type: 'comment', name: 'goal_modifications', title: 'Goal Modifications/Edits',
                              rows: 8, placeholder: 'Copy generated goals here to edit and customize further...' }
                        ]
                    }
                ]
            },
            'ai-recommendations': {
                type: 'panel',
                name: 'ai_recommendations_generator',
                title: 'AI Recommendations Generator',
                elements: [
                    {
                        type: 'panel',
                        name: 'recommendation_scope',
                        title: 'Recommendation Scope',
                        elements: [
                            { type: 'checkbox', name: 'recommendation_types', title: 'Types of Recommendations to Generate',
                              choices: [
                                  'Service delivery recommendations',
                                  'Frequency and duration',
                                  'Therapy approaches/techniques',
                                  'Home program activities',
                                  'School/classroom strategies',
                                  'Environmental modifications',
                                  'Adaptive equipment/tools',
                                  'Referrals to other professionals',
                                  'Parent/caregiver training topics',
                                  'Progress monitoring methods',
                                  'Discharge criteria'
                              ],
                              isRequired: true },
                            { type: 'radiogroup', name: 'recommendation_detail', title: 'Level of Detail',
                              choices: ['Brief bullet points', 'Detailed explanations', 'Mixed based on type'] },
                            { type: 'radiogroup', name: 'evidence_level', title: 'Include Evidence Base?',
                              choices: ['Yes - Include research support', 'Yes - Include clinical rationale', 'No - Recommendations only'] }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'recommendation_customization',
                        title: 'Customization Parameters',
                        elements: [
                            { type: 'checkbox', name: 'consider_factors', title: 'Factors to Consider',
                              choices: [
                                  'Age/developmental level',
                                  'Severity of impairment',
                                  'Cognitive abilities',
                                  'Physical/medical factors',
                                  'Family resources',
                                  'Cultural background',
                                  'Previous therapy response',
                                  'School/work demands',
                                  'Insurance limitations',
                                  'Geographic location/access'
                              ] },
                            { type: 'dropdown', name: 'recommendation_priority', title: 'Prioritization Method',
                              choices: ['Severity-based', 'Functional impact', 'Family priorities', 'School/work priorities', 'Developmental sequence', 'Mixed approach'] },
                            { type: 'radiogroup', name: 'recommendation_format', title: 'Output Format',
                              choices: ['Narrative paragraphs', 'Bulleted lists', 'Numbered priorities', 'Categorized sections'] }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'therapy_approach_selection',
                        title: 'Therapy Approach Preferences',
                        elements: [
                            { type: 'checkbox', name: 'preferred_approaches', title: 'Preferred Intervention Approaches',
                              choices: [
                                  'Evidence-based practice only',
                                  'Traditional/conventional methods',
                                  'Neurodevelopmental approaches',
                                  'Sensory integration-based',
                                  'Technology-assisted intervention',
                                  'Play-based/naturalistic',
                                  'Structured/behavioral approaches',
                                  'Family-centered practice',
                                  'Collaborative/consultative',
                                  'Intensive/massed practice',
                                  'Distributed practice',
                                  'Telepractice compatible'
                              ] },
                            { type: 'comment', name: 'approach_notes', title: 'Specific Approach Preferences/Restrictions',
                              rows: 3, placeholder: 'Note any specific approaches to include or avoid...' }
                        ]
                    },
                    {
                        type: 'panel',
                        name: 'recommendation_library',
                        title: 'Recommendation Library Options',
                        elements: [
                            { type: 'radiogroup', name: 'use_templates', title: 'Use Recommendation Templates?',
                              choices: ['Yes - Best practice templates', 'Yes - Facility-specific templates', 'No - Generate unique recommendations'] },
                            { type: 'checkbox', name: 'include_resources', title: 'Include Resource Links?',
                              choices: ['Parent handouts', 'Video demonstrations', 'App recommendations', 'Book/material suggestions', 'Website resources', 'Community resources'] }
                        ]
                    },
                    {
                        type: 'comment',
                        name: 'generated_recommendations_output',
                        title: 'AI-Generated Recommendations',
                        rows: 15,
                        readOnly: true,
                        placeholder: 'Recommendations will be generated based on assessment findings and selected parameters...',
                        description: 'Click "Generate Recommendations" button to create customized recommendations'
                    },
                    {
                        type: 'html',
                        name: 'generate_recommendations_button',
                        html: '<div style="text-align: center; margin: 20px 0;"><button type="button" class="btn btn-primary touch-target" data-action="generateAIRecommendations">💡 Generate Recommendations</button></div>'
                    },
                    {
                        type: 'panel',
                        name: 'recommendation_refinement',
                        title: 'Recommendation Refinement',
                        elements: [
                            { type: 'radiogroup', name: 'recommendation_completeness', title: 'Are recommendations comprehensive?',
                              choices: ['Yes - Ready to use', 'Mostly - Minor edits needed', 'Partially - Significant additions needed', 'No - Major revision required'] },
                            { type: 'comment', name: 'recommendation_edits', title: 'Edited Recommendations',
                              rows: 10, placeholder: 'Copy and edit recommendations here for final version...' },
                            { type: 'comment', name: 'additional_recommendations', title: 'Additional Recommendations to Add',
                              rows: 5, placeholder: 'Add any recommendations not captured by AI...' }
                        ]
                    }
                ]
            },
            'ai-summary': {
                type: 'ai-summary',
                name: `ai_summary_${Date.now()}`,
                title: 'AI-Generated Summary',
                description: 'This summary is automatically generated based on your form responses',
                selectedFields: [],
                summaryType: 'comprehensive', // comprehensive or brief
                displayMode: 'seamless', // seamless, highlighted, expandable
                allowRuntimeSelection: true, // Allow users to select fields at runtime
                minHeight: 200,
                placeholder: 'AI summary will appear here after you complete the selected fields...',
                loadingText: 'Generating summary...',
                errorText: 'Unable to generate summary. Please try again.',
                isRequired: false,
                visibleIf: '',
                enableIf: '',
                customType: 'ai-summary'
            }
        };

        return customElements[type] || this.createDefaultElement('panel');
    }

    getDefaultTitle(type) {
        const titles = {
            text: 'Text Question',
            comment: 'Comment Box',
            dropdown: 'Dropdown Question',
            radiogroup: 'Radio Group Question',
            checkbox: 'Checkbox Question',
            boolean: 'Yes/No Question',
            rating: 'Rating Question',
            matrix: 'Matrix Question',
            matrixdropdown: 'Matrix Dropdown',
            matrixdynamic: 'Dynamic Matrix',
            multipletext: 'Multiple Text',
            html: 'HTML Content',
            signaturepad: 'Signature',
            expression: 'Calculated Value',
            file: 'File Upload',
            imagepicker: 'Image Selection',
            panel: 'Section',
            paneldynamic: 'Repeatable Section'
        };
        return titles[type] || 'New Element';
    }

    selectElement(index) {
        this.selectedElement = index;
        this.renderFormElements();
        this.showElementProperties();
    }

    showElementProperties() {
        if (this.selectedElement === null) return;

        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const propertiesPanel = document.getElementById('propertiesPanel');

        // Clear the panel
        while (propertiesPanel.firstChild) {
            propertiesPanel.removeChild(propertiesPanel.firstChild);
        }

        // Create Name (ID) property group
        const nameGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const nameLabel = HtmlEscape.createElement('label', { className: 'property-label', textContent: 'Name (ID)' });
        const nameInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'property-input',
            value: element.name || ''
        });
        nameInput.addEventListener('change', (e) => this.updateElementProperty('name', e.target.value));
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        propertiesPanel.appendChild(nameGroup);

        // Create Title property group
        const titleGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const titleLabel = HtmlEscape.createElement('label', { className: 'property-label', textContent: 'Title' });
        const titleInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'property-input',
            value: element.title || ''
        });
        titleInput.addEventListener('change', (e) => this.updateElementProperty('title', e.target.value));
        titleGroup.appendChild(titleLabel);
        titleGroup.appendChild(titleInput);
        propertiesPanel.appendChild(titleGroup);

        // Create Description property group
        const descGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const descLabel = HtmlEscape.createElement('label', { className: 'property-label', textContent: 'Description' });
        const descTextarea = HtmlEscape.createElement('textarea', {
            className: 'property-input',
            rows: '2'
        });
        descTextarea.value = element.description || '';
        descTextarea.addEventListener('change', (e) => this.updateElementProperty('description', e.target.value));
        descGroup.appendChild(descLabel);
        descGroup.appendChild(descTextarea);
        propertiesPanel.appendChild(descGroup);

        // Create Required checkbox group
        const requiredGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const requiredLabel = HtmlEscape.createElement('label', { className: 'property-label' });
        const requiredCheckbox = HtmlEscape.createElement('input', {
            type: 'checkbox',
            className: 'property-checkbox'
        });
        if (element.isRequired) requiredCheckbox.checked = true;
        requiredCheckbox.addEventListener('change', (e) => this.updateElementProperty('isRequired', e.target.checked));
        requiredLabel.appendChild(requiredCheckbox);
        requiredLabel.appendChild(document.createTextNode(' Required'));
        requiredGroup.appendChild(requiredLabel);
        propertiesPanel.appendChild(requiredGroup);

        // Add type-specific properties
        if (element.type === 'dropdown' || element.type === 'radiogroup' || element.type === 'checkbox') {
            this.appendChoicesEditor(propertiesPanel, element);
        }

        // Add panel-specific properties
        if (element.type === 'panel') {
            this.appendPanelProperties(propertiesPanel, element);
        }

        // Add matrix-specific properties
        if (element.type === 'matrix') {
            this.appendMatrixProperties(propertiesPanel, element);
        }

        // Add dynamic matrix properties
        if (element.type === 'matrixdynamic') {
            this.appendMatrixDynamicProperties(propertiesPanel, element);
        }

        // Add dynamic panel properties
        if (element.type === 'paneldynamic') {
            this.appendPanelDynamicProperties(propertiesPanel, element);
        }

        // Add text-specific properties
        if (element.type === 'text') {
            this.appendTextProperties(propertiesPanel, element);
        }

        // Add comment-specific properties
        if (element.type === 'comment') {
            this.appendCommentProperties(propertiesPanel, element);
        }

        // Add rating-specific properties
        if (element.type === 'rating') {
            this.appendRatingProperties(propertiesPanel, element);
        }

        // Add boolean-specific properties
        if (element.type === 'boolean') {
            this.appendBooleanProperties(propertiesPanel, element);
        }

        // Add signature-specific properties
        if (element.type === 'signaturepad') {
            this.appendSignatureProperties(propertiesPanel, element);
        }

        // Add HTML element properties
        if (element.type === 'html') {
            this.appendHtmlProperties(propertiesPanel, element);
        }

        // Add styling controls section for all elements
        const stylingGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const stylingH4 = HtmlEscape.createElement('h4', { textContent: 'Styling Controls' });
        stylingH4.style.marginBottom = '0.5rem';
        stylingGroup.appendChild(stylingH4);
        this.appendStylingControls(stylingGroup, element);
        propertiesPanel.appendChild(stylingGroup);

        // Add validation rules section
        const validationGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const validationH4 = HtmlEscape.createElement('h4', { textContent: 'Validation Rules' });
        validationH4.style.marginBottom = '0.5rem';
        validationGroup.appendChild(validationH4);
        this.appendValidationRules(validationGroup, element);
        propertiesPanel.appendChild(validationGroup);

        // Add AI Summary specific properties
        if (element.type === 'ai-summary' || element.customType === 'ai-summary') {
            this.appendAISummaryProperties(propertiesPanel, element);
        }

        // Add conditional logic section
        const conditionalGroup = HtmlEscape.createElement('div', { className: 'property-group' });
        const conditionalH4 = HtmlEscape.createElement('h4', { textContent: 'Conditional Logic' });
        conditionalH4.style.marginBottom = '0.5rem';
        conditionalGroup.appendChild(conditionalH4);
        
        const conditionalBtn = HtmlEscape.createElement('button', {
            className: 'btn btn-sm btn-secondary conditional-logic-btn touch-target'
        });
        conditionalBtn.setAttribute('data-action', 'showConditionalLogicEditor');
        const btnIcon = HtmlEscape.createElement('span', { className: 'icon', textContent: '⚙️' });
        conditionalBtn.appendChild(btnIcon);
        conditionalBtn.appendChild(document.createTextNode(' Configure Conditions'));
        conditionalGroup.appendChild(conditionalBtn);

        if (element.visibleIf) {
            const conditionPreview = HtmlEscape.createElement('div', {
                className: 'current-condition-preview',
                textContent: 'Current: '
            });
            const codeElement = HtmlEscape.createElement('code', { textContent: element.visibleIf });
            conditionPreview.appendChild(codeElement);
            conditionalGroup.appendChild(conditionPreview);
        }

        propertiesPanel.appendChild(conditionalGroup);
    }

    // Get choices editor HTML for dropdown/radio/checkbox
    getChoicesEditorHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">Choices</label>
                <div class="choices-editor">
                    ${(element.choices || []).map((choice, i) => `
                        <div class="choice-item">
                            <input type="text" class="property-input" value="${this.escapeHtml(choice)}"
                                   onchange="formBuilder.updateChoice(${i}, this.value)">
                            <button data-action="removeChoice" data-index="${i}" class="remove-btn touch-target">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm add-choice touch-target" data-action="addChoice">
                        <span class="icon">➕</span> Add Choice
                    </button>
                </div>
            </div>
            ${element.type === 'checkbox' ? `
                <div class="property-group">
                    <label class="property-label">
                        <input type="checkbox" ${element.hasOther ? 'checked' : ''}
                               onchange="formBuilder.updateElementProperty('hasOther', this.checked)">
                        Include "Other" option
                    </label>
                </div>
            ` : ''}
        `;
    }

    // Get panel properties HTML
    getPanelPropertiesHTML(element) {
        return `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Panel Elements</h4>
                <div class="panel-elements-editor">
                    ${(element.elements || []).map((el, i) => `
                        <div class="panel-element-item">
                            <div class="element-summary">
                                <span class="element-type-badge">${el.type}</span>
                                <span class="element-name">${el.title || el.name || 'Untitled'}</span>
                                <div class="element-actions">
                                    <button data-action="editPanelElement" data-index="${i}" class="edit-btn touch-target" title="Edit">✏️</button>
                                    <button data-action="movePanelElement" data-index="${i}" data-direction="-1" class="move-btn touch-target" title="Move Up">↑</button>
                                    <button data-action="movePanelElement" data-index="${i}" data-direction="1" class="move-btn touch-target" title="Move Down">↓</button>
                                    <button data-action="removePanelElement" data-index="${i}" class="remove-btn touch-target" title="Remove">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm add-panel-element touch-target" data-action="addPanelElement">
                        <span class="icon">➕</span> Add Element to Panel
                    </button>
                </div>
            </div>
        `;
    }

    // Get matrix properties HTML
    getMatrixPropertiesHTML(element) {
        return `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Matrix Configuration</h4>
                
                <div class="matrix-columns-editor">
                    <label class="property-label">Columns</label>
                    ${(element.columns || []).map((col, i) => `
                        <div class="matrix-item">
                            <input type="text" class="property-input" value="${this.escapeHtml(col)}"
                                   onchange="formBuilder.updateMatrixColumn(${i}, this.value)">
                            <button data-action="removeMatrixColumn" data-index="${i}" class="remove-btn touch-target">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm touch-target" data-action="addMatrixColumn">
                        <span class="icon">➕</span> Add Column
                    </button>
                </div>
                
                <div class="matrix-rows-editor" style="margin-top: 1rem;">
                    <label class="property-label">Rows</label>
                    ${(element.rows || []).map((row, i) => `
                        <div class="matrix-item">
                            <input type="text" class="property-input" value="${this.escapeHtml(row)}"
                                   onchange="formBuilder.updateMatrixRow(${i}, this.value)">
                            <button data-action="removeMatrixRow" data-index="${i}" class="remove-btn touch-target">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm touch-target" data-action="addMatrixRow">
                        <span class="icon">➕</span> Add Row
                    </button>
                </div>
            </div>
        `;
    }

    // Get dynamic matrix properties HTML
    getMatrixDynamicPropertiesHTML(element) {
        return `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Dynamic Matrix Configuration</h4>
                
                <div class="property-field">
                    <label class="property-label">Initial Row Count</label>
                    <input type="number" class="property-input" min="0" value="${element.rowCount || 1}"
                           onchange="formBuilder.updateElementProperty('rowCount', parseInt(this.value))">
                </div>
                
                <div class="property-field">
                    <label class="property-label">Add Row Button Text</label>
                    <input type="text" class="property-input" value="${element.addRowText || 'Add Row'}"
                           onchange="formBuilder.updateElementProperty('addRowText', this.value)">
                </div>
                
                <div class="property-field">
                    <label class="property-label">
                        <input type="checkbox" ${element.allowRowsDeletion !== false ? 'checked' : ''}
                               onchange="formBuilder.updateElementProperty('allowRowsDeletion', this.checked)">
                        Allow Row Deletion
                    </label>
                </div>
                
                <div class="matrix-columns-editor">
                    <label class="property-label">Column Definitions</label>
                    ${(element.columns || []).map((col, i) => `
                        <div class="matrix-column-def">
                            <input type="text" class="property-input" placeholder="Column name"
                                   value="${col.name || ''}"
                                   onchange="formBuilder.updateMatrixDynamicColumn(${i}, 'name', this.value)">
                            <input type="text" class="property-input" placeholder="Column title"
                                   value="${col.title || ''}"
                                   onchange="formBuilder.updateMatrixDynamicColumn(${i}, 'title', this.value)">
                            <select class="property-input" onchange="formBuilder.updateMatrixDynamicColumn(${i}, 'cellType', this.value)">
                                <option value="text" ${col.cellType === 'text' ? 'selected' : ''}>Text</option>
                                <option value="dropdown" ${col.cellType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                                <option value="checkbox" ${col.cellType === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                                <option value="radiogroup" ${col.cellType === 'radiogroup' ? 'selected' : ''}>Radio</option>
                                <option value="boolean" ${col.cellType === 'boolean' ? 'selected' : ''}>Yes/No</option>
                            </select>
                            <button data-action="removeMatrixDynamicColumn" data-index="${i}" class="remove-btn touch-target">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm touch-target" data-action="addMatrixDynamicColumn">
                        <span class="icon">➕</span> Add Column
                    </button>
                </div>
            </div>
        `;
    }

    // Get dynamic panel properties HTML
    getPanelDynamicPropertiesHTML(element) {
        return `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Dynamic Panel Configuration</h4>
                
                <div class="property-field">
                    <label class="property-label">Initial Panel Count</label>
                    <input type="number" class="property-input" min="0" value="${element.panelCount || 1}"
                           onchange="formBuilder.updateElementProperty('panelCount', parseInt(this.value))">
                </div>
                
                <div class="property-field">
                    <label class="property-label">Add Panel Button Text</label>
                    <input type="text" class="property-input" value="${element.panelAddText || 'Add Panel'}"
                           onchange="formBuilder.updateElementProperty('panelAddText', this.value)">
                </div>
                
                <div class="property-field">
                    <label class="property-label">Remove Panel Button Text</label>
                    <input type="text" class="property-input" value="${element.panelRemoveText || 'Remove'}"
                           onchange="formBuilder.updateElementProperty('panelRemoveText', this.value)">
                </div>
                
                <div class="panel-template-editor">
                    <label class="property-label">Template Elements</label>
                    ${(element.templateElements || []).map((el, i) => `
                        <div class="panel-element-item">
                            <div class="element-summary">
                                <span class="element-type-badge">${el.type}</span>
                                <span class="element-name">${el.title || el.name || 'Untitled'}</span>
                                <div class="element-actions">
                                    <button data-action="editPanelElement" data-index="${i}" class="edit-btn touch-target" title="Edit">✏️</button>
                                    <button data-action="movePanelElement" data-index="${i}" data-direction="-1" class="move-btn touch-target" title="Move Up">↑</button>
                                    <button data-action="movePanelElement" data-index="${i}" data-direction="1" class="move-btn touch-target" title="Move Down">↓</button>
                                    <button data-action="removePanelElement" data-index="${i}" class="remove-btn touch-target" title="Remove">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm touch-target" data-action="addPanelDynamicElement">
                        <span class="icon">➕</span> Add Template Element
                    </button>
                </div>
            </div>
        `;
    }

    // Get text field properties HTML
    getTextPropertiesHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">Placeholder</label>
                <input type="text" class="property-input" value="${element.placeholder || ''}"
                       onchange="formBuilder.updateElementProperty('placeholder', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Input Type</label>
                <select class="property-input" onchange="formBuilder.updateElementProperty('inputType', this.value)">
                    <option value="text" ${element.inputType === 'text' || !element.inputType ? 'selected' : ''}>Text</option>
                    <option value="email" ${element.inputType === 'email' ? 'selected' : ''}>Email</option>
                    <option value="tel" ${element.inputType === 'tel' ? 'selected' : ''}>Phone</option>
                    <option value="number" ${element.inputType === 'number' ? 'selected' : ''}>Number</option>
                    <option value="date" ${element.inputType === 'date' ? 'selected' : ''}>Date</option>
                    <option value="time" ${element.inputType === 'time' ? 'selected' : ''}>Time</option>
                    <option value="datetime-local" ${element.inputType === 'datetime-local' ? 'selected' : ''}>Date & Time</option>
                    <option value="password" ${element.inputType === 'password' ? 'selected' : ''}>Password</option>
                    <option value="url" ${element.inputType === 'url' ? 'selected' : ''}>URL</option>
                </select>
            </div>
            ${element.inputType === 'number' ? `
                <div class="property-field">
                    <label class="property-label">Min Value</label>
                    <input type="number" class="property-input" value="${element.min || ''}"
                           onchange="formBuilder.updateElementProperty('min', this.value ? parseFloat(this.value) : null)">
                </div>
                <div class="property-field">
                    <label class="property-label">Max Value</label>
                    <input type="number" class="property-input" value="${element.max || ''}"
                           onchange="formBuilder.updateElementProperty('max', this.value ? parseFloat(this.value) : null)">
                </div>
                <div class="property-field">
                    <label class="property-label">Step</label>
                    <input type="number" class="property-input" value="${element.step || ''}"
                           onchange="formBuilder.updateElementProperty('step', this.value ? parseFloat(this.value) : null)">
                </div>
            ` : ''}
        `;
    }

    // Get comment field properties HTML
    getCommentPropertiesHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">Placeholder</label>
                <input type="text" class="property-input" value="${element.placeholder || ''}"
                       onchange="formBuilder.updateElementProperty('placeholder', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Rows</label>
                <input type="number" class="property-input" min="1" value="${element.rows || 4}"
                       onchange="formBuilder.updateElementProperty('rows', parseInt(this.value))">
            </div>
            <div class="property-group">
                <label class="property-label">
                    <input type="checkbox" ${element.readOnly ? 'checked' : ''}
                           onchange="formBuilder.updateElementProperty('readOnly', this.checked)">
                    Read-only
                </label>
            </div>
        `;
    }

    // Get rating properties HTML
    getRatingPropertiesHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">Minimum Rating</label>
                <input type="number" class="property-input" min="0" value="${element.rateMin || 1}"
                       onchange="formBuilder.updateElementProperty('rateMin', parseInt(this.value))">
            </div>
            <div class="property-group">
                <label class="property-label">Maximum Rating</label>
                <input type="number" class="property-input" min="1" value="${element.rateMax || 5}"
                       onchange="formBuilder.updateElementProperty('rateMax', parseInt(this.value))">
            </div>
            <div class="property-group">
                <label class="property-label">Min Description</label>
                <input type="text" class="property-input" value="${element.minRateDescription || ''}"
                       onchange="formBuilder.updateElementProperty('minRateDescription', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Max Description</label>
                <input type="text" class="property-input" value="${element.maxRateDescription || ''}"
                       onchange="formBuilder.updateElementProperty('maxRateDescription', this.value)">
            </div>
        `;
    }

    // Get boolean properties HTML
    getBooleanPropertiesHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">True Label</label>
                <input type="text" class="property-input" value="${element.labelTrue || 'Yes'}"
                       onchange="formBuilder.updateElementProperty('labelTrue', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">False Label</label>
                <input type="text" class="property-input" value="${element.labelFalse || 'No'}"
                       onchange="formBuilder.updateElementProperty('labelFalse', this.value)">
            </div>
        `;
    }

    // Get signature properties HTML
    getSignaturePropertiesHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">Width</label>
                <input type="text" class="property-input" value="${element.width || '300'}"
                       onchange="formBuilder.updateElementProperty('width', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Height</label>
                <input type="text" class="property-input" value="${element.height || '150'}"
                       onchange="formBuilder.updateElementProperty('height', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Pen Color</label>
                <input type="color" class="property-input" value="${element.penColor || '#000080'}"
                       onchange="formBuilder.updateElementProperty('penColor', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Background Color</label>
                <input type="color" class="property-input" value="${element.backgroundColor || '#ffffff'}"
                       onchange="formBuilder.updateElementProperty('backgroundColor', this.value)">
            </div>
        `;
    }

    // Get HTML element properties
    getHtmlPropertiesHTML(element) {
        return `
            <div class="property-group">
                <label class="property-label">HTML Content</label>
                <textarea class="property-input" rows="6"
                       onchange="formBuilder.updateElementProperty('html', this.value)">${element.html || ''}</textarea>
                <small style="color: #666;">Enter HTML content to display</small>
            </div>
        `;
    }

    // Escape HTML for safe display
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to render panel elements list
    renderPanelElementsList(container, elements) {
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Iterate through elements and create DOM
        elements.forEach((el, idx) => {
            // Create main item container
            const itemDiv = HtmlEscape.createElement('div', {
                className: 'panel-element-item',
                'data-index': idx,
                style: 'background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.25rem; padding: 0.75rem; margin-bottom: 0.5rem;'
            });

            // Create flex container
            const flexDiv = HtmlEscape.createElement('div', {
                style: 'display: flex; justify-content: space-between; align-items: center;'
            });

            // Create info container
            const infoDiv = HtmlEscape.createElement('div');
            
            // Create title
            const titleStrong = HtmlEscape.createElement('strong');
            HtmlEscape.setTextContent(titleStrong, el.title || el.name || 'Untitled');
            infoDiv.appendChild(titleStrong);

            // Create type span
            const typeSpan = HtmlEscape.createElement('span', {
                style: 'color: #6c757d; font-size: 0.875rem; margin-left: 0.5rem;'
            });
            HtmlEscape.setTextContent(typeSpan, `(${el.type})`);
            infoDiv.appendChild(typeSpan);

            // Create buttons container
            const buttonsDiv = HtmlEscape.createElement('div');

            // Create edit button
            const editBtn = HtmlEscape.createElement('button', {
                className: 'btn btn-sm btn-primary edit-sub-element touch-target',
                'data-index': idx
            });
            HtmlEscape.setTextContent(editBtn, 'Edit');
            buttonsDiv.appendChild(editBtn);

            // Create remove button
            const removeBtn = HtmlEscape.createElement('button', {
                className: 'btn btn-sm btn-danger remove-sub-element touch-target',
                'data-index': idx,
                style: 'margin-left: 0.25rem;'
            });
            HtmlEscape.setTextContent(removeBtn, 'Remove');
            buttonsDiv.appendChild(removeBtn);

            // Assemble the structure
            flexDiv.appendChild(infoDiv);
            flexDiv.appendChild(buttonsDiv);
            itemDiv.appendChild(flexDiv);
            container.appendChild(itemDiv);
        });
    }

    // Helper function to render form elements using DOM manipulation instead of innerHTML
    renderFormElementDOM(container, elements) {
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Iterate through elements and create DOM
        elements.forEach((element, index) => {
            // Skip if element is marked as hidden
            if (element.visibleIf === false) return;

            // Handle section dividers
            if (element.type === 'section') {
                const divider = this.createSectionDivider(element.title || 'Section');
                container.appendChild(divider);
                return;
            }

            // Create main element container
            const elementDiv = HtmlEscape.createElement('div', {
                className: 'form-element',
                'data-element-index': index
            });

            // Add selected class if this is the selected element
            if (index === this.selectedElement) {
                elementDiv.classList.add('selected');
            }

            // Create element header
            const headerDiv = HtmlEscape.createElement('div', {
                className: 'element-header'
            });

            // Add element type icon
            const iconSpan = HtmlEscape.createElement('span', {
                className: 'element-type-icon',
                style: 'margin-right: 8px;'
            });
            iconSpan.textContent = this.getElementTypeIcon(element.type); // Use textContent for emoji
            headerDiv.appendChild(iconSpan);

            // Add element title
            const titleSpan = HtmlEscape.createElement('span', {
                className: 'element-title'
            });
            HtmlEscape.setTextContent(titleSpan, element.title || element.name || 'Untitled');
            headerDiv.appendChild(titleSpan);

            // Add pre-configured panel badge if applicable
            const preConfiguredPanels = [
                'oralMotorPanel', 'phoneticInventoryPanel', 'syllableStructurePanel',
                'inconsistencyPanel', 'prosodyPanel', 'stimulabilityPanel'
            ];
            if (preConfiguredPanels.includes(element.name)) {
                const badge = HtmlEscape.createElement('span', {
                    className: 'badge bg-info ms-2'
                });
                HtmlEscape.setTextContent(badge, 'Pre-configured Panel');
                headerDiv.appendChild(badge);
            }

            // Create actions container
            const actionsDiv = HtmlEscape.createElement('div', {
                className: 'element-actions'
            });

            // Create select button
            const selectBtn = HtmlEscape.createElement('button', {
                className: 'btn btn-sm btn-outline-primary',
                onclick: `window.formBuilder.selectElement(${index})`
            });
            const editIcon = HtmlEscape.createElement('i', {
                className: 'bi bi-pencil'
            });
            selectBtn.appendChild(editIcon);
            selectBtn.appendChild(document.createTextNode(' Edit'));
            actionsDiv.appendChild(selectBtn);

            // Create duplicate button
            const duplicateBtn = HtmlEscape.createElement('button', {
                className: 'btn btn-sm btn-outline-secondary',
                onclick: `window.formBuilder.duplicateElement(${index})`
            });
            const duplicateIcon = HtmlEscape.createElement('i', {
                className: 'bi bi-files'
            });
            duplicateBtn.appendChild(duplicateIcon);
            actionsDiv.appendChild(duplicateBtn);

            // Create delete button
            const deleteBtn = HtmlEscape.createElement('button', {
                className: 'btn btn-sm btn-outline-danger',
                onclick: `window.formBuilder.deleteElement(${index})`
            });
            const deleteIcon = HtmlEscape.createElement('i', {
                className: 'bi bi-trash'
            });
            deleteBtn.appendChild(deleteIcon);
            actionsDiv.appendChild(deleteBtn);

            // Assemble header
            headerDiv.appendChild(actionsDiv);
            elementDiv.appendChild(headerDiv);

            // Add panel preview for panel elements
            if (element.type === 'panel' && element.elements && element.elements.length > 0) {
                const previewDiv = this.renderPanelPreviewDOM(element.elements);
                elementDiv.appendChild(previewDiv);
            }

            container.appendChild(elementDiv);
        });
    }

    // Helper function to render panel preview using DOM manipulation
    renderPanelPreviewDOM(elements) {
        const previewDiv = HtmlEscape.createElement('div', {
            className: 'panel-preview',
            style: 'margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;'
        });

        const titleDiv = HtmlEscape.createElement('div', {
            style: 'font-size: 0.9em; color: #6c757d; margin-bottom: 5px;'
        });
        HtmlEscape.setTextContent(titleDiv, 'Panel Elements:');
        previewDiv.appendChild(titleDiv);

        const listDiv = HtmlEscape.createElement('div', {
            style: 'display: flex; flex-wrap: wrap; gap: 5px;'
        });

        elements.forEach(subElement => {
            const itemSpan = HtmlEscape.createElement('span', {
                className: 'badge bg-secondary'
            });
            HtmlEscape.setTextContent(itemSpan, subElement.title || subElement.name || 'Untitled');
            listDiv.appendChild(itemSpan);
        });

        previewDiv.appendChild(listDiv);
        return previewDiv;
    }

    // Helper function to create panel edit modal using DOM manipulation
    createPanelEditModal(panel, panelIndex) {
        // Create modal backdrop
        const backdrop = HtmlEscape.createElement('div', {
            style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 2000; display: flex; align-items: center; justify-content: center;',
            id: 'panel-edit-backdrop'
        });

        // Create modal dialog
        const dialog = HtmlEscape.createElement('div', {
            className: 'modal-dialog modal-lg',
            style: 'background-color: white; border-radius: 0.5rem; box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;'
        });

        // Create modal header
        const header = HtmlEscape.createElement('div', {
            className: 'modal-header',
            style: 'padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; flex-shrink: 0;'
        });

        const title = HtmlEscape.createElement('h5', {
            className: 'modal-title',
            style: 'margin: 0; font-size: 1.25rem; font-weight: 500;'
        });
        HtmlEscape.setTextContent(title, `Edit Panel: ${panel.title || panel.name}`);
        header.appendChild(title);

        const closeBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn-close',
            style: 'background: transparent; border: none; font-size: 1.5rem; cursor: pointer;',
            onclick: 'window.formBuilder.closePanelEditModal()'
        });
        HtmlEscape.setTextContent(closeBtn, '×');
        header.appendChild(closeBtn);

        // Create modal body
        const body = HtmlEscape.createElement('div', {
            className: 'modal-body',
            style: 'padding: 1.5rem; overflow-y: auto; flex: 1 1 auto;'
        });

        // Panel Properties section
        const propertiesSection = HtmlEscape.createElement('div', {
            className: 'mb-4'
        });

        const propertiesTitle = HtmlEscape.createElement('h6', {
            style: 'font-weight: 600; margin-bottom: 1rem;'
        });
        HtmlEscape.setTextContent(propertiesTitle, 'Panel Properties');
        propertiesSection.appendChild(propertiesTitle);

        // Name field
        const nameGroup = HtmlEscape.createElement('div', {
            className: 'mb-3'
        });
        const nameLabel = HtmlEscape.createElement('label', {
            className: 'form-label',
            for: 'panel-name'
        });
        HtmlEscape.setTextContent(nameLabel, 'Panel Name (Internal ID)');
        nameGroup.appendChild(nameLabel);

        const nameInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'form-control',
            id: 'panel-name',
            value: panel.name || '',
            placeholder: 'e.g., personal_info'
        });
        nameGroup.appendChild(nameInput);

        propertiesSection.appendChild(nameGroup);

        // Title field
        const titleGroup = HtmlEscape.createElement('div', {
            className: 'mb-3'
        });
        const titleLabel = HtmlEscape.createElement('label', {
            className: 'form-label',
            for: 'panel-title'
        });
        HtmlEscape.setTextContent(titleLabel, 'Panel Title (Display Name)');
        titleGroup.appendChild(titleLabel);

        const titleInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'form-control',
            id: 'panel-title',
            value: panel.title || '',
            placeholder: 'e.g., Personal Information'
        });
        titleGroup.appendChild(titleInput);

        propertiesSection.appendChild(titleGroup);
        body.appendChild(propertiesSection);

        // Panel Elements section
        const elementsSection = HtmlEscape.createElement('div');

        const elementsTitle = HtmlEscape.createElement('h6', {
            style: 'font-weight: 600; margin-bottom: 1rem;'
        });
        HtmlEscape.setTextContent(elementsTitle, 'Panel Elements');
        elementsSection.appendChild(elementsTitle);

        const elementsListContainer = HtmlEscape.createElement('div', {
            id: 'panel-elements-list',
            className: 'panel-elements-container',
            style: 'min-height: 100px; padding: 15px; background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 4px;'
        });

        // Use the existing renderPanelElementsList helper
        this.renderPanelElementsList(elementsListContainer, panel.elements || []);

        elementsSection.appendChild(elementsListContainer);
        body.appendChild(elementsSection);

        // Create modal footer
        const footer = HtmlEscape.createElement('div', {
            className: 'modal-footer',
            style: 'padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; flex-shrink: 0;'
        });

        const cancelBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onclick: 'window.formBuilder.closePanelEditModal()'
        });
        HtmlEscape.setTextContent(cancelBtn, 'Cancel');
        footer.appendChild(cancelBtn);

        const saveBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn btn-primary',
            onclick: `window.formBuilder.savePanelChanges(${panelIndex})`
        });
        HtmlEscape.setTextContent(saveBtn, 'Save Changes');
        footer.appendChild(saveBtn);

        // Assemble modal
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        backdrop.appendChild(dialog);

        // Add event handlers
        backdrop.addEventListener('pointerdown', (e) => {
            if (e.target === backdrop) {
                window.formBuilder.closePanelEditModal();
            }
        });

        dialog.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        return backdrop;
    }

    // Helper function to create element edit modal using DOM manipulation
    createElementEditModalDOM(element, type, callback) {
        // Create modal backdrop
        const backdrop = HtmlEscape.createElement('div', {
            style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 2001; display: flex; align-items: center; justify-content: center;'
        });

        // Create modal dialog
        const dialog = HtmlEscape.createElement('div', {
            className: 'element-edit-dialog',
            style: 'background: white; border-radius: 0.5rem; box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); max-width: 600px; width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;'
        });

        // Create modal header
        const header = HtmlEscape.createElement('div', {
            className: 'modal-header',
            style: 'padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; flex-shrink: 0;'
        });

        const title = HtmlEscape.createElement('h5', {
            className: 'modal-title',
            style: 'margin: 0; font-size: 1.25rem; font-weight: 500;'
        });
        HtmlEscape.setTextContent(title, `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Element`);
        header.appendChild(title);

        const closeBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn-close touch-target',
            style: 'background: transparent; border: none; font-size: 1.5rem; cursor: pointer;'
        });
        HtmlEscape.setTextContent(closeBtn, '×');
        header.appendChild(closeBtn);

        // Create modal body
        const body = HtmlEscape.createElement('div', {
            className: 'modal-body',
            style: 'padding: 1.5rem; overflow-y: auto; flex: 1;'
        });

        // Element Name field
        const nameGroup = HtmlEscape.createElement('div', {
            className: 'mb-3'
        });
        const nameLabel = HtmlEscape.createElement('label', {
            className: 'form-label'
        });
        HtmlEscape.setTextContent(nameLabel, 'Element Name (ID):');
        nameGroup.appendChild(nameLabel);

        const nameInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'form-control',
            id: 'elementName',
            value: element.name || '',
            style: 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem;'
        });
        nameGroup.appendChild(nameInput);
        body.appendChild(nameGroup);

        // Element Title field
        const titleGroup = HtmlEscape.createElement('div', {
            className: 'mb-3'
        });
        const titleLabel = HtmlEscape.createElement('label', {
            className: 'form-label'
        });
        HtmlEscape.setTextContent(titleLabel, 'Element Title:');
        titleGroup.appendChild(titleLabel);

        const titleInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'form-control',
            id: 'elementTitle',
            value: element.title || '',
            style: 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem;'
        });
        titleGroup.appendChild(titleInput);
        body.appendChild(titleGroup);

        // Type-specific fields
        if (type === 'radiogroup' || type === 'dropdown' || type === 'checkbox') {
            const choicesGroup = HtmlEscape.createElement('div', {
                className: 'mb-3'
            });
            const choicesLabel = HtmlEscape.createElement('label', {
                className: 'form-label'
            });
            HtmlEscape.setTextContent(choicesLabel, 'Choices:');
            choicesGroup.appendChild(choicesLabel);

            const choicesList = HtmlEscape.createElement('div', {
                id: 'choicesList'
            });

            // Render existing choices
            const choices = element.choices || [];
            choices.forEach((choice, idx) => {
                const choiceItem = this.createChoiceItem(choice);
                choicesList.appendChild(choiceItem);
            });

            choicesGroup.appendChild(choicesList);

            const addChoiceBtn = HtmlEscape.createElement('button', {
                className: 'btn btn-sm btn-success touch-target',
                id: 'addChoice'
            });
            HtmlEscape.setTextContent(addChoiceBtn, 'Add Choice');
            choicesGroup.appendChild(addChoiceBtn);

            body.appendChild(choicesGroup);

            // Add choice handler
            addChoiceBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const newChoice = this.createChoiceItem('');
                choicesList.appendChild(newChoice);
            });
        }

        if (type === 'rating') {
            // Rate Max field
            const rateMaxGroup = HtmlEscape.createElement('div', {
                className: 'mb-3'
            });
            const rateMaxLabel = HtmlEscape.createElement('label', {
                className: 'form-label'
            });
            HtmlEscape.setTextContent(rateMaxLabel, 'Rate Max:');
            rateMaxGroup.appendChild(rateMaxLabel);

            const rateMaxInput = HtmlEscape.createElement('input', {
                type: 'number',
                className: 'form-control',
                id: 'rateMax',
                value: element.rateMax || 5,
                min: 2,
                max: 10,
                style: 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem;'
            });
            rateMaxGroup.appendChild(rateMaxInput);
            body.appendChild(rateMaxGroup);

            // Min Rate Description field
            const minDescGroup = HtmlEscape.createElement('div', {
                className: 'mb-3'
            });
            const minDescLabel = HtmlEscape.createElement('label', {
                className: 'form-label'
            });
            HtmlEscape.setTextContent(minDescLabel, 'Min Rate Description:');
            minDescGroup.appendChild(minDescLabel);

            const minDescInput = HtmlEscape.createElement('input', {
                type: 'text',
                className: 'form-control',
                id: 'minRateDescription',
                value: element.minRateDescription || '',
                style: 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem;'
            });
            minDescGroup.appendChild(minDescInput);
            body.appendChild(minDescGroup);

            // Max Rate Description field
            const maxDescGroup = HtmlEscape.createElement('div', {
                className: 'mb-3'
            });
            const maxDescLabel = HtmlEscape.createElement('label', {
                className: 'form-label'
            });
            HtmlEscape.setTextContent(maxDescLabel, 'Max Rate Description:');
            maxDescGroup.appendChild(maxDescLabel);

            const maxDescInput = HtmlEscape.createElement('input', {
                type: 'text',
                className: 'form-control',
                id: 'maxRateDescription',
                value: element.maxRateDescription || '',
                style: 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem;'
            });
            maxDescGroup.appendChild(maxDescInput);
            body.appendChild(maxDescGroup);
        }

        if (type === 'comment' || type === 'text') {
            const placeholderGroup = HtmlEscape.createElement('div', {
                className: 'mb-3'
            });
            const placeholderLabel = HtmlEscape.createElement('label', {
                className: 'form-label'
            });
            HtmlEscape.setTextContent(placeholderLabel, 'Placeholder:');
            placeholderGroup.appendChild(placeholderLabel);

            const placeholderInput = HtmlEscape.createElement('input', {
                type: 'text',
                className: 'form-control',
                id: 'placeholder',
                value: element.placeholder || '',
                style: 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem;'
            });
            placeholderGroup.appendChild(placeholderInput);
            body.appendChild(placeholderGroup);
        }

        // Required field checkbox
        const requiredGroup = HtmlEscape.createElement('div', {
            className: 'mb-3'
        });
        const requiredLabel = HtmlEscape.createElement('label');
        const requiredCheckbox = HtmlEscape.createElement('input', {
            type: 'checkbox',
            id: 'isRequired',
            checked: element.isRequired || false
        });
        requiredLabel.appendChild(requiredCheckbox);
        const requiredText = HtmlEscape.createTextNode(' Required Field');
        requiredLabel.appendChild(requiredText);
        requiredGroup.appendChild(requiredLabel);
        body.appendChild(requiredGroup);

        // Create modal footer
        const footer = HtmlEscape.createElement('div', {
            className: 'modal-footer',
            style: 'padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;'
        });

        const cancelBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary touch-target',
            id: 'cancelElementEdit'
        });
        HtmlEscape.setTextContent(cancelBtn, 'Cancel');
        footer.appendChild(cancelBtn);

        const saveBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn btn-primary touch-target',
            id: 'saveElementChanges'
        });
        HtmlEscape.setTextContent(saveBtn, 'Save Changes');
        footer.appendChild(saveBtn);

        // Assemble modal
        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        backdrop.appendChild(dialog);

        // Event handlers
        const closeModal = () => {
            backdrop.remove();
        };

        closeBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        cancelBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        saveBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const updatedElement = { ...element };
            
            updatedElement.name = nameInput.value;
            updatedElement.title = titleInput.value;
            updatedElement.isRequired = requiredCheckbox.checked;

            if (type === 'radiogroup' || type === 'dropdown' || type === 'checkbox') {
                const choiceItems = dialog.querySelectorAll('.choice-item');
                updatedElement.choices = Array.from(choiceItems).map(item => {
                    const value = item.querySelector('.choice-value').value;
                    const text = item.querySelector('.choice-text').value;
                    return text && text !== value ? { value, text } : value;
                });
            }

            if (type === 'rating') {
                updatedElement.rateMax = parseInt(rateMaxInput.value);
                updatedElement.minRateDescription = dialog.querySelector('#minRateDescription').value;
                updatedElement.maxRateDescription = dialog.querySelector('#maxRateDescription').value;
            }

            if (type === 'comment' || type === 'text') {
                updatedElement.placeholder = dialog.querySelector('#placeholder').value;
            }

            closeModal();
            if (callback) callback(updatedElement);
        });

        // Prevent event bubbling for dialog clicks
        dialog.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
        });

        // Close on backdrop click
        backdrop.addEventListener('pointerdown', (e) => {
            if (e.target === backdrop) {
                closeModal();
            }
        });

        return backdrop;
    }

    // Helper method to create a choice item element
    createChoiceItem(choice) {
        const choiceItem = HtmlEscape.createElement('div', {
            className: 'choice-item mb-2',
            style: 'display: flex; gap: 0.5rem;'
        });

        const valueInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'form-control choice-value',
            value: typeof choice === 'string' ? choice : choice.value || '',
            placeholder: 'Value',
            style: 'flex: 1;'
        });
        choiceItem.appendChild(valueInput);

        const textInput = HtmlEscape.createElement('input', {
            type: 'text',
            className: 'form-control choice-text',
            value: typeof choice === 'string' ? choice : choice.text || '',
            placeholder: 'Display Text',
            style: 'flex: 1;'
        });
        choiceItem.appendChild(textInput);

        const removeBtn = HtmlEscape.createElement('button', {
            className: 'btn btn-sm btn-danger remove-choice touch-target'
        });
        HtmlEscape.setTextContent(removeBtn, '×');
        removeBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            choiceItem.remove();
        });
        choiceItem.appendChild(removeBtn);

        return choiceItem;
    }

    // Helper function to create preview modal DOM
    createPreviewModalDOM(closeCallback) {
        const modal = HtmlEscape.createElement('div', {
            className: 'preview-modal active'
        });
        
        const content = HtmlEscape.createElement('div', {
            className: 'preview-content'
        });
        
        // Header
        const header = HtmlEscape.createElement('div', {
            className: 'preview-header'
        });
        
        const title = HtmlEscape.createElement('h3');
        HtmlEscape.setTextContent(title, 'Form Preview');
        
        const closeBtn = HtmlEscape.createElement('button', {
            className: 'close-preview touch-target',
            dataset: { action: 'closeModal' }
        });
        HtmlEscape.setTextContent(closeBtn, '×');
        closeBtn.addEventListener('click', closeCallback);
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Body
        const body = HtmlEscape.createElement('div', {
            className: 'preview-body'
        });
        
        const surveyDiv = HtmlEscape.createElement('div', {
            id: 'surveyPreview'
        });
        
        body.appendChild(surveyDiv);
        
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        
        return modal;
    }
    
    // Helper function to create preview error DOM
    createPreviewErrorDOM(error) {
        const container = HtmlEscape.createElement('div', {
            style: 'text-align: center; padding: 2rem; color: #dc3545;'
        });
        
        const message = HtmlEscape.createElement('p');
        HtmlEscape.setTextContent(message, 'Error creating preview. Please check your form configuration.');
        
        const errorDetail = HtmlEscape.createElement('small');
        HtmlEscape.setTextContent(errorDetail, error.message);
        
        container.appendChild(message);
        container.appendChild(errorDetail);
        
        return container;
    }

    updateElementProperty(property, value) {
        if (this.selectedElement === null) return;
        
        this.saveToHistory();
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element[property] = value;
        
        // Update the visual element for styling properties
        const visualElement = document.querySelector(`[data-index="${this.selectedElement}"]`);
        if (visualElement) {
            switch (property) {
                case 'backgroundColor':
                    visualElement.style.backgroundColor = value;
                    break;
                case 'color':
                    visualElement.style.color = value;
                    break;
                case 'fontFamily':
                    visualElement.style.fontFamily = value;
                    break;
                case 'fontSize':
                    visualElement.style.fontSize = value;
                    break;
                case 'backgroundImage':
                    if (value) {
                        visualElement.style.backgroundImage = `url(${value})`;
                        visualElement.style.backgroundSize = 'cover';
                        visualElement.style.backgroundPosition = 'center';
                        visualElement.style.backgroundRepeat = 'no-repeat';
                    } else {
                        visualElement.style.backgroundImage = '';
                        visualElement.style.backgroundSize = '';
                        visualElement.style.backgroundPosition = '';
                        visualElement.style.backgroundRepeat = '';
                    }
                    break;
            }
        }
        
        this.renderFormElements();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    handleBackgroundImageUpload(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            inputElement.value = '';
            return;
        }

        // Validate file size (2MB limit)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            alert('File size must be less than 2MB');
            inputElement.value = '';
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const base64String = e.target.result;
                this.updateElementProperty('backgroundImage', base64String);
                
                // Update preview immediately
                const previewElement = inputElement.parentElement.querySelector('.background-image-preview');
                if (previewElement) {
                    previewElement.style.backgroundImage = `url(${base64String})`;
                    previewElement.style.display = 'block';
                }
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image file');
                inputElement.value = '';
            }
        };

        reader.onerror = () => {
            console.error('Error reading file');
            alert('Error reading image file');
            inputElement.value = '';
        };

        reader.readAsDataURL(file);
    }

    getStylingControlsHTML(element) {
        const webSafeFonts = [
            { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: 'System Default' },
            { value: 'Arial, sans-serif', label: 'Arial' },
            { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
            { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
            { value: 'Georgia, serif', label: 'Georgia' },
            { value: '"Courier New", Courier, monospace', label: 'Courier New' },
            { value: 'Verdana, sans-serif', label: 'Verdana' },
            { value: 'Tahoma, sans-serif', label: 'Tahoma' }
        ];

        const fontSizeOptions = [
            { value: '12px', label: '12px - Small' },
            { value: '14px', label: '14px - Default' },
            { value: '16px', label: '16px - Mobile Optimized' },
            { value: '18px', label: '18px - Large' },
            { value: '20px', label: '20px - Extra Large' },
            { value: '24px', label: '24px - Heading' }
        ];

        // Set defaults with white background and accessible styling
        const currentFontFamily = element.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const currentFontSize = element.fontSize || '16px';
        const currentBackgroundColor = element.backgroundColor || '#ffffff';
        const currentColor = element.color || '#333333';
        const currentBackgroundImage = element.backgroundImage || '';

        return `
            <div class="styling-controls">
                <div class="form-field" style="margin-bottom: 1rem;">
                    <label class="property-label" style="display: block; font-weight: 600; margin-bottom: 0.25rem; color: #2c3e50;">Font Family:</label>
                    <select class="property-input touch-target" style="width: 100%; min-height: 44px; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 4px; font-size: 16px;"
                            onchange="formBuilder.updateElementProperty('fontFamily', this.value)">
                        ${webSafeFonts.map(font =>
                            `<option value="${font.value}" ${currentFontFamily === font.value ? 'selected' : ''}>${font.label}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="form-field" style="margin-bottom: 1rem;">
                    <label class="property-label" style="display: block; font-weight: 600; margin-bottom: 0.25rem; color: #2c3e50;">Font Size:</label>
                    <select class="property-input touch-target" style="width: 100%; min-height: 44px; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 4px; font-size: 16px;"
                            onchange="formBuilder.updateElementProperty('fontSize', this.value)">
                        ${fontSizeOptions.map(size =>
                            `<option value="${size.value}" ${currentFontSize === size.value ? 'selected' : ''}>${size.label}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="form-field" style="margin-bottom: 1rem;">
                    <label class="property-label" style="display: block; font-weight: 600; margin-bottom: 0.25rem; color: #2c3e50;">Text Color:</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="color" class="property-input touch-target"
                               style="width: 60px; min-height: 44px; border: 2px solid #dee2e6; border-radius: 4px; cursor: pointer;"
                               value="${currentColor}"
                               onchange="formBuilder.updateElementProperty('color', this.value)">
                        <input type="text" class="property-input"
                               style="flex: 1; min-height: 44px; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 4px; font-size: 16px;"
                               value="${currentColor}" placeholder="#333333"
                               onchange="formBuilder.updateElementProperty('color', this.value)">
                    </div>
                    <small style="color: #6c757d; font-size: 0.875rem;">Ensure 4.5:1 contrast ratio for accessibility</small>
                </div>

                <div class="form-field" style="margin-bottom: 1rem;">
                    <label class="property-label" style="display: block; font-weight: 600; margin-bottom: 0.25rem; color: #2c3e50;">Background Color:</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="color" class="property-input touch-target"
                               style="width: 60px; min-height: 44px; border: 2px solid #dee2e6; border-radius: 4px; cursor: pointer;"
                               value="${currentBackgroundColor}"
                               onchange="formBuilder.updateElementProperty('backgroundColor', this.value)">
                        <input type="text" class="property-input"
                               style="flex: 1; min-height: 44px; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 4px; font-size: 16px;"
                               value="${currentBackgroundColor}" placeholder="#ffffff"
                               onchange="formBuilder.updateElementProperty('backgroundColor', this.value)">
                    </div>
                    <small style="color: #6c757d; font-size: 0.875rem;">Default: White (#ffffff) for optimal contrast</small>
                </div>

                <div class="form-field" style="margin-bottom: 1rem;">
                    <label class="property-label" style="display: block; font-weight: 600; margin-bottom: 0.25rem; color: #2c3e50;">Background Image:</label>
                    <input type="file" class="property-input touch-target"
                           style="width: 100%; min-height: 44px; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 4px; font-size: 16px;"
                           accept="image/*"
                           onchange="formBuilder.handleBackgroundImageUpload(this, '${element.id}')">
                    ${currentBackgroundImage ? `
                        <div style="margin-top: 0.5rem;">
                            <small style="color: #28a745;">Current: ${currentBackgroundImage.split('/').pop()}</small>
                            <button type="button" class="btn btn-sm btn-outline-danger touch-target"
                                    style="margin-left: 0.5rem; min-height: 44px; padding: 0.5rem 1rem;"
                                    onclick="formBuilder.updateElementProperty('backgroundImage', '')">Remove</button>
                        </div>
                    ` : ''}
                    <small style="color: #6c757d; font-size: 0.875rem;">Recommended: JPG, PNG, WebP formats. Max 2MB.</small>
                </div>
            </div>
        `;
    }

    getValidationRulesHTML(element) {
        let html = '';
        
        if (element.type === 'text' || element.type === 'comment') {
            html += `
                <div class="property-field">
                    <label>Min Length</label>
                    <input type="number" class="property-input" value="${element.minLength || ''}"
                           placeholder="No minimum" onchange="formBuilder.updateElementProperty('minLength', this.value || null)">
                </div>
                <div class="property-field">
                    <label>Max Length</label>
                    <input type="number" class="property-input" value="${element.maxLength || ''}"
                           placeholder="No maximum" onchange="formBuilder.updateElementProperty('maxLength', this.value || null)">
                </div>
            `;
        }
        
        if (element.type === 'text') {
            html += `
                <div class="property-field">
                    <label>Input Type</label>
                    <select class="property-input" onchange="formBuilder.updateElementProperty('inputType', this.value)">
                        <option value="text" ${element.inputType === 'text' ? 'selected' : ''}>Text</option>
                        <option value="email" ${element.inputType === 'email' ? 'selected' : ''}>Email</option>
                        <option value="tel" ${element.inputType === 'tel' ? 'selected' : ''}>Phone</option>
                        <option value="number" ${element.inputType === 'number' ? 'selected' : ''}>Number</option>
                        <option value="date" ${element.inputType === 'date' ? 'selected' : ''}>Date</option>
                        <option value="time" ${element.inputType === 'time' ? 'selected' : ''}>Time</option>
                    </select>
                </div>
            `;
            
            if (element.inputType === 'number') {
                html += `
                    <div class="property-field">
                        <label>Min Value</label>
                        <input type="number" class="property-input" value="${element.min || ''}"
                               onchange="formBuilder.updateElementProperty('min', this.value || null)">
                    </div>
                    <div class="property-field">
                        <label>Max Value</label>
                        <input type="number" class="property-input" value="${element.max || ''}"
                               onchange="formBuilder.updateElementProperty('max', this.value || null)">
                    </div>
                `;
            }
        }
        
        return html;
    }

    showConditionalLogicEditor() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const allElements = this.getAllFormElements();
        
        // Create modal for conditional logic editor
        const modal = document.createElement('div');
        modal.className = 'conditional-logic-modal';
        
        // Create content container
        const content = HtmlEscape.createElement('div', { className: 'conditional-logic-content' });
        
        // Create header
        const header = HtmlEscape.createElement('div', { className: 'conditional-logic-header' });
        const h3 = HtmlEscape.createElement('h3', {}, `Conditional Logic for: ${element.title || element.name}`);
        const closeBtn = HtmlEscape.createElement('button', {
            className: 'close-button touch-target',
            'data-action': 'closeModal'
        }, '×');
        header.appendChild(h3);
        header.appendChild(closeBtn);
        
        // Create body
        const body = HtmlEscape.createElement('div', { className: 'conditional-logic-body' });
        
        // Enable conditional section
        const enableDiv = HtmlEscape.createElement('div', { className: 'enable-conditional' });
        const label = HtmlEscape.createElement('label');
        const checkbox = HtmlEscape.createElement('input', {
            type: 'checkbox',
            id: 'enableConditional'
        });
        if (element.visibleIf) {
            checkbox.checked = true;
        }
        checkbox.addEventListener('change', function() {
            formBuilder.toggleConditionalLogic(this.checked);
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' Enable conditional visibility'));
        enableDiv.appendChild(label);
        
        // Conditional rules section
        const rulesDiv = HtmlEscape.createElement('div', {
            id: 'conditionalRules',
            className: 'conditional-rules'
        });
        rulesDiv.style.display = element.visibleIf ? 'block' : 'none';
        
        const helpText = HtmlEscape.createElement('p', { className: 'help-text' }, 'Show this field when:');
        rulesDiv.appendChild(helpText);
        
        // Condition builder
        const conditionBuilder = HtmlEscape.createElement('div', { className: 'condition-builder' });
        
        // Field select
        const fieldSelect = HtmlEscape.createElement('select', {
            id: 'conditionField',
            className: 'condition-select'
        });
        const defaultOption = HtmlEscape.createElement('option', { value: '' }, 'Select a field...');
        fieldSelect.appendChild(defaultOption);
        
        allElements.filter(el => el.name !== element.name).forEach(el => {
            const option = HtmlEscape.createElement('option', { value: el.name }, el.title || el.name);
            fieldSelect.appendChild(option);
        });
        conditionBuilder.appendChild(fieldSelect);
        
        // Operator select
        const operatorSelect = HtmlEscape.createElement('select', {
            id: 'conditionOperator',
            className: 'condition-select'
        });
        const operators = [
            { value: 'equals', text: 'equals' },
            { value: 'notequals', text: 'does not equal' },
            { value: 'contains', text: 'contains' },
            { value: 'notcontains', text: 'does not contain' },
            { value: 'empty', text: 'is empty' },
            { value: 'notempty', text: 'is not empty' }
        ];
        operators.forEach(op => {
            const option = HtmlEscape.createElement('option', { value: op.value }, op.text);
            operatorSelect.appendChild(option);
        });
        conditionBuilder.appendChild(operatorSelect);
        
        // Value input
        const valueInput = HtmlEscape.createElement('input', {
            type: 'text',
            id: 'conditionValue',
            className: 'condition-value',
            placeholder: 'Value to compare'
        });
        conditionBuilder.appendChild(valueInput);
        
        rulesDiv.appendChild(conditionBuilder);
        
        // Current conditions
        const currentConditions = HtmlEscape.createElement('div', { className: 'current-conditions' });
        const h4 = HtmlEscape.createElement('h4', {}, 'Current Condition:');
        const code = HtmlEscape.createElement('code', { id: 'conditionExpression' }, element.visibleIf || 'None');
        currentConditions.appendChild(h4);
        currentConditions.appendChild(code);
        rulesDiv.appendChild(currentConditions);
        
        body.appendChild(enableDiv);
        body.appendChild(rulesDiv);
        
        // Create footer
        const footer = HtmlEscape.createElement('div', { className: 'conditional-logic-footer' });
        const cancelBtn = HtmlEscape.createElement('button', {
            className: 'btn btn-secondary touch-target',
            'data-action': 'closeModal'
        }, 'Cancel');
        const saveBtn = HtmlEscape.createElement('button', {
            className: 'btn btn-primary touch-target',
            'data-action': 'saveConditionalLogic'
        }, 'Save Condition');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        
        // Assemble modal
        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);
        modal.appendChild(content);
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Load existing condition if present
        if (element.visibleIf) {
            this.parseExistingCondition(element.visibleIf);
        }
        
        // Add event listeners for live preview
        const conditionField = document.getElementById('conditionField');
        const conditionOperator = document.getElementById('conditionOperator');
        const conditionValue = document.getElementById('conditionValue');
        
        const updatePreview = () => {
            this.updateConditionPreview(conditionField.value, conditionOperator.value, conditionValue.value);
        };
        
        conditionField.addEventListener('change', updatePreview);
        conditionOperator.addEventListener('change', updatePreview);
        conditionValue.addEventListener('input', updatePreview);
        
        // Add styles for conditional logic modal
        this.addConditionalLogicStyles();
    }

    // Get all form elements across all pages
    getAllFormElements() {
        const elements = [];
        this.formData.pages.forEach(page => {
            if (page.elements) {
                page.elements.forEach(element => {
                    elements.push({
                        name: element.name,
                        title: element.title || element.name,
                        type: element.type
                    });
                });
            }
        });
        return elements;
    }

    // Toggle conditional logic on/off
    toggleConditionalLogic(enabled) {
        const rulesDiv = document.getElementById('conditionalRules');
        rulesDiv.style.display = enabled ? 'block' : 'none';
        
        if (!enabled) {
            // Clear the condition
            const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
            delete element.visibleIf;
            document.getElementById('conditionExpression').textContent = 'None';
        }
    }

    // Parse existing condition to populate the UI
    parseExistingCondition(condition) {
        // Simple parser for basic conditions like "{fieldName} = 'value'"
        const match = condition.match(/\{([^}]+)\}\s*(=|!=|contains|notcontains|empty|notempty)\s*'?([^']*)'?/);
        if (match) {
            const [, fieldName, operator, value] = match;
            document.getElementById('conditionField').value = fieldName;
            
            const operatorMap = {
                '=': 'equals',
                '!=': 'notequals',
                'contains': 'contains',
                'notcontains': 'notcontains',
                'empty': 'empty',
                'notempty': 'notempty'
            };
            document.getElementById('conditionOperator').value = operatorMap[operator] || 'equals';
            document.getElementById('conditionValue').value = value || '';
        }
    }

    // Update the condition preview
    updateConditionPreview(fieldName, operator, value) {
        if (!fieldName) {
            document.getElementById('conditionExpression').textContent = 'None';
            return;
        }
        
        let expression = '';
        switch (operator) {
            case 'equals':
                expression = `{${fieldName}} = '${value}'`;
                break;
            case 'notequals':
                expression = `{${fieldName}} != '${value}'`;
                break;
            case 'contains':
                expression = `{${fieldName}} contains '${value}'`;
                break;
            case 'notcontains':
                expression = `{${fieldName}} notcontains '${value}'`;
                break;
            case 'empty':
                expression = `{${fieldName}} empty`;
                break;
            case 'notempty':
                expression = `{${fieldName}} notempty`;
                break;
        }
        
        document.getElementById('conditionExpression').textContent = expression;
    }

    // Save conditional logic to the element
    saveConditionalLogic() {
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const isEnabled = document.getElementById('enableConditional').checked;
        
        if (isEnabled) {
            const fieldName = document.getElementById('conditionField').value;
            const operator = document.getElementById('conditionOperator').value;
            const value = document.getElementById('conditionValue').value;
            
            if (!fieldName) {
                this.showNotification('Please select a field for the condition', 'warning');
                return;
            }
            
            let expression = '';
            switch (operator) {
                case 'equals':
                    expression = `{${fieldName}} = '${value}'`;
                    break;
                case 'notequals':
                    expression = `{${fieldName}} != '${value}'`;
                    break;
                case 'contains':
                    expression = `{${fieldName}} contains '${value}'`;
                    break;
                case 'notcontains':
                    expression = `{${fieldName}} notcontains '${value}'`;
                    break;
                case 'empty':
                    expression = `{${fieldName}} empty`;
                    break;
                case 'notempty':
                    expression = `{${fieldName}} notempty`;
                    break;
            }
            
            element.visibleIf = expression;
        } else {
            delete element.visibleIf;
        }
        
        // Close modal
        document.querySelector('.conditional-logic-modal').remove();
        
        // Save to history and show notification
        this.saveToHistory();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
        this.showNotification('Conditional logic saved successfully');
    }

    // Add CSS styles for conditional logic modal
    addConditionalLogicStyles() {
        if (document.getElementById('conditional-logic-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'conditional-logic-styles';
        styles.textContent = `
            .conditional-logic-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1001;
                padding: 2rem;
                overflow: auto;
            }
            
            .conditional-logic-content {
                background: white;
                max-width: 600px;
                margin: 0 auto;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            }
            
            .conditional-logic-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e1e4e8;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .conditional-logic-header h3 {
                margin: 0;
                font-size: 1.25rem;
            }
            
            .close-button {
                background: none;
                border: none;
                font-size: 2rem;
                line-height: 1;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            
            .conditional-logic-body {
                padding: 1.5rem;
            }
            
            .enable-conditional {
                margin-bottom: 1.5rem;
            }
            
            .enable-conditional label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 500;
                cursor: pointer;
            }
            
            .conditional-rules {
                background: #f6f8fa;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                padding: 1.5rem;
            }
            
            .help-text {
                margin: 0 0 1rem 0;
                color: #586069;
            }
            
            .condition-builder {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            }
            
            .condition-select {
                flex: 1;
                min-width: 150px;
                padding: 0.5rem;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                background: white;
            }
            
            .condition-value {
                flex: 2;
                min-width: 200px;
                padding: 0.5rem;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
            }
            
            .current-conditions h4 {
                margin: 0 0 0.5rem 0;
                font-size: 0.9rem;
                color: #586069;
            }
            
            .current-conditions code {
                display: block;
                background: white;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                padding: 0.75rem;
                font-family: 'Consolas', 'Monaco', monospace;
                color: #0366d6;
            }
            
            .conditional-logic-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid #e1e4e8;
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
            }
        `;
        document.head.appendChild(styles);
    }

    updateChoice(index, value) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.choices) element.choices = [];
        element.choices[index] = value;
    }

    addChoice() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.choices) element.choices = [];
        element.choices.push(`Option ${element.choices.length + 1}`);
        this.showElementProperties();
    }

    removeChoice(index) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element.choices.splice(index, 1);
        this.showElementProperties();
    }

    // Panel element manipulation methods
    movePanelElement(index, direction) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const newIndex = index + direction;
        
        if (newIndex < 0 || newIndex >= element.elements.length) return;
        
        [element.elements[index], element.elements[newIndex]] =
            [element.elements[newIndex], element.elements[index]];
        
        this.showElementProperties();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    removePanelElement(index) {
        if (this.selectedElement === null) return;
        
        if (confirm('Are you sure you want to remove this element from the panel?')) {
            const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
            element.elements.splice(index, 1);
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        }
    }

    addPanelElement() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.elements) element.elements = [];
        
        // Show element type selector dialog
        this.createElementTypeDialog((type) => {
            const newElement = this.createDefaultElement(type);
            element.elements.push(newElement);
            
            // Re-render the form elements to show the new element
            this.renderFormElements();
            
            // Re-select the panel to refresh properties
            this.selectElement(this.selectedElement);
            
            this.hasUnsavedChanges = true;
            this.debouncedSave();
            
            // Show success notification
            this.showNotification(`Added ${type} element to panel`);
        });
    }

    // Matrix manipulation methods
    addMatrixColumn() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.columns) element.columns = [];
        
        const newColumn = prompt('Enter column name:');
        if (newColumn) {
            element.columns.push(newColumn);
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        }
    }

    removeMatrixColumn(index) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element.columns.splice(index, 1);
        this.showElementProperties();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    updateMatrixColumn(index, value) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element.columns[index] = value;
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    addMatrixRow() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.rows) element.rows = [];
        
        const newRow = prompt('Enter row name:');
        if (newRow) {
            element.rows.push(newRow);
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        }
    }

    removeMatrixRow(index) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element.rows.splice(index, 1);
        this.showElementProperties();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    updateMatrixRow(index, value) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element.rows[index] = value;
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    // Dynamic matrix column methods
    addMatrixDynamicColumn() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.columns) element.columns = [];
        
        const newColumn = {
            name: `col_${Date.now()}`,
            title: 'New Column',
            cellType: 'text'
        };
        
        element.columns.push(newColumn);
        this.showElementProperties();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    removeMatrixDynamicColumn(index) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element.columns.splice(index, 1);
        this.showElementProperties();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    updateMatrixDynamicColumn(index, property, value) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.columns[index]) return;
        
        element.columns[index][property] = value;
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    // Dynamic panel template methods
    editPanelDynamicElement(index) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const templateElement = element.templateElements[index];
        
        // Create edit dialog
        const dialog = this.createElementEditDialog(templateElement, (updatedElement) => {
            element.templateElements[index] = updatedElement;
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        });
        
        document.body.appendChild(dialog);
    }

    movePanelDynamicElement(index, direction) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const newIndex = index + direction;
        
        if (newIndex < 0 || newIndex >= element.templateElements.length) return;
        
        [element.templateElements[index], element.templateElements[newIndex]] =
            [element.templateElements[newIndex], element.templateElements[index]];
        
        this.showElementProperties();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    removePanelDynamicElement(index) {
        if (this.selectedElement === null) return;
        
        if (confirm('Are you sure you want to remove this element from the template?')) {
            const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
            element.templateElements.splice(index, 1);
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        }
    }

    addPanelDynamicElement() {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.templateElements) element.templateElements = [];
        
        // Show element type selector dialog
        const dialog = this.createElementTypeDialog((type) => {
            const newElement = this.createDefaultElement(type);
            element.templateElements.push(newElement);
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        });
        
        document.body.appendChild(dialog);
    }

    moveElement(index, direction) {
        const elements = this.formData.pages[this.currentPageIndex].elements;
        const newIndex = index + direction;
        
        if (newIndex < 0 || newIndex >= elements.length) return;
        
        [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
        this.selectedElement = newIndex;
        this.renderFormElements();
    }

    // Special method for editing panel elements with sub-elements
    editPanelElement(panelIndex) {
        const panel = this.formData.pages[this.currentPageIndex].elements[panelIndex];
        
        // Create a special dialog for panel editing
        const backdrop = document.createElement('div');
        backdrop.className = 'custom-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1040;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'custom-modal-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            max-width: 900px;
            width: 90%;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        // Use the secure DOM manipulation helper function
        const modalContent = this.createPanelEditModal(panel, panelIndex);
        
        // Clear the dialog and append the secure content
        while (dialog.firstChild) {
            dialog.removeChild(dialog.firstChild);
        }
        dialog.appendChild(modalContent);

        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Function to close modal
        const closeModal = () => {
            backdrop.remove();
        };

        // Event handlers - Using Pointer Events API for unified touch/mouse/pen input
        dialog.querySelector('.btn-close').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });
        dialog.querySelector('#cancelPanelEdit').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Save changes handler
        dialog.querySelector('#savePanelChanges').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            // Save to history
            this.saveToHistory();
            
            // Update panel properties
            panel.name = dialog.querySelector('#panelName').value;
            panel.title = dialog.querySelector('#panelTitle').value;
            
            // Update the form data
            this.formData.pages[this.currentPageIndex].elements[panelIndex] = panel;
            
            // Re-render and mark as changed
            this.renderFormElements();
            this.selectElement(panelIndex);
            this.hasUnsavedChanges = true;
            this.debouncedSave();
            
            this.showNotification('Panel updated successfully');
            closeModal();
        });

        // Edit sub-element handlers - Using Pointer Events API
        dialog.querySelectorAll('.edit-sub-element').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const subIndex = parseInt(e.target.dataset.index);
                const subElement = panel.elements[subIndex];
                
                // Create edit dialog for sub-element
                const subDialog = this.createElementEditDialog(subElement, subElement.type, (updatedElement) => {
                    panel.elements[subIndex] = updatedElement;
                    
                    // Refresh the panel elements list
                    const listContainer = dialog.querySelector('#panelElementsList');
                    this.renderPanelElementsList(listContainer, panel.elements);
                    
                    // Re-attach event handlers
                    this.attachPanelElementHandlers(dialog, panel);
                });
                
                document.body.appendChild(subDialog);
            });
        });

        // Remove sub-element handlers - Using Pointer Events API
        dialog.querySelectorAll('.remove-sub-element').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const subIndex = parseInt(e.target.dataset.index);
                if (confirm('Are you sure you want to remove this element?')) {
                    panel.elements.splice(subIndex, 1);
                    
                    // Refresh the panel elements list
                    const listContainer = dialog.querySelector('#panelElementsList');
                    this.renderPanelElementsList(listContainer, elements);
                    
                    // Re-attach event handlers
                    this.attachPanelElementHandlers(dialog, panel);
                }
            });
        });

        // Add new element handler - Using Pointer Events API
        dialog.querySelector('#addSubElement').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.createElementTypeDialog((type) => {
                const newElement = this.createDefaultElement(type);
                panel.elements.push(newElement);
                
                // Refresh the panel elements list
                const listContainer = dialog.querySelector('#panelElementsList');
                this.renderPanelElementsList(listContainer, panel.elements);
                
                // Re-attach event handlers
                this.attachPanelElementHandlers(dialog, panel);
            });
        });
    }

    // Helper method to create element type selection dialog
    createElementTypeDialog(callback) {
        const backdrop = document.createElement('div');
        backdrop.className = 'custom-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1050;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'custom-modal-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            max-width: 500px;
            width: 90%;
        `;

        const elementTypes = [
            { value: 'text', label: 'Single Line Text', icon: '📝' },
            { value: 'comment', label: 'Multi-line Text', icon: '📄' },
            { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
            { value: 'radiogroup', label: 'Radio Group', icon: '🔘' },
            { value: 'dropdown', label: 'Dropdown', icon: '📋' },
            { value: 'rating', label: 'Rating Scale', icon: '⭐' },
            { value: 'boolean', label: 'Yes/No', icon: '✅' },
            { value: 'matrix', label: 'Matrix', icon: '📊' },
            { value: 'panel', label: 'Panel/Section', icon: '📦' }
        ];

        // Create modal header
        const modalHeader = HtmlEscape.createElement('div', {
            className: 'modal-header',
            style: 'padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6;'
        });

        const modalTitle = HtmlEscape.createElement('h5', {
            className: 'modal-title',
            style: 'margin: 0; font-size: 1.25rem; font-weight: 500;'
        });
        HtmlEscape.setTextContent(modalTitle, 'Select Element Type');
        modalHeader.appendChild(modalTitle);

        const closeBtn = HtmlEscape.createElement('button', {
            type: 'button',
            className: 'btn-close touch-target'
        });
        HtmlEscape.setTextContent(closeBtn, '×');
        modalHeader.appendChild(closeBtn);

        // Create modal body
        const modalBody = HtmlEscape.createElement('div', {
            className: 'modal-body',
            style: 'padding: 1.5rem;'
        });

        const grid = HtmlEscape.createElement('div', {
            className: 'element-type-grid',
            style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem;'
        });

        // Create element type buttons
        elementTypes.forEach(type => {
            const btn = HtmlEscape.createElement('button', {
                className: 'element-type-btn btn touch-target',
                'data-type': type.value
            });

            const iconDiv = HtmlEscape.createElement('div', {
                style: 'font-size: 1.5rem; margin-bottom: 0.25rem;'
            });
            HtmlEscape.setTextContent(iconDiv, type.icon);
            btn.appendChild(iconDiv);

            const labelDiv = HtmlEscape.createElement('div', {
                style: 'font-size: 0.875rem;'
            });
            HtmlEscape.setTextContent(labelDiv, type.label);
            btn.appendChild(labelDiv);

            grid.appendChild(btn);
        });

        modalBody.appendChild(grid);

        // Assemble dialog
        dialog.appendChild(modalHeader);
        dialog.appendChild(modalBody);

        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        const closeModal = () => {
            backdrop.remove();
        };

        dialog.querySelector('.btn-close').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });
        backdrop.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.target === backdrop) closeModal();
        });

        dialog.querySelectorAll('.element-type-btn').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const type = btn.dataset.type;
                closeModal();
                if (callback) callback(type);
            });
        });
    }

    // Helper method to create element edit dialog
    createElementEditDialog(element, type, callback) {
        const backdrop = document.createElement('div');
        backdrop.className = 'custom-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1060;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const dialog = this.createElementEditModalDOM(element, type);
        backdrop.appendChild(dialog);

        const closeModal = () => {
            backdrop.remove();
        };

        dialog.querySelector('.btn-close').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });
        dialog.querySelector('#cancelElementEdit').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Add choice management handlers if applicable - Using Pointer Events API
        if (type === 'radiogroup' || type === 'dropdown' || type === 'checkbox') {
            dialog.querySelector('#addChoice')?.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const choicesList = dialog.querySelector('#choicesList');
                const newChoice = this.createChoiceItem();
                choicesList.appendChild(newChoice);
                
                newChoice.querySelector('.remove-choice').addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    newChoice.remove();
                });
            });

            dialog.querySelectorAll('.remove-choice').forEach(btn => {
                btn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    btn.parentElement.remove();
                });
            });
        }

        dialog.querySelector('#saveElementChanges').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const updatedElement = { ...element };
            
            updatedElement.name = dialog.querySelector('#elementName').value;
            updatedElement.title = dialog.querySelector('#elementTitle').value;
            updatedElement.isRequired = dialog.querySelector('#isRequired').checked;

            if (type === 'radiogroup' || type === 'dropdown' || type === 'checkbox') {
                const choiceItems = dialog.querySelectorAll('.choice-item');
                updatedElement.choices = Array.from(choiceItems).map(item => {
                    const value = item.querySelector('.choice-value').value;
                    const text = item.querySelector('.choice-text').value;
                    return text && text !== value ? { value, text } : value;
                });
            }

            if (type === 'rating') {
                updatedElement.rateMax = parseInt(dialog.querySelector('#rateMax').value);
                updatedElement.minRateDescription = dialog.querySelector('#minRateDescription').value;
                updatedElement.maxRateDescription = dialog.querySelector('#maxRateDescription').value;
            }

            if (type === 'comment' || type === 'text') {
                updatedElement.placeholder = dialog.querySelector('#placeholder').value;
            }

            closeModal();
            if (callback) callback(updatedElement);
        });

        return backdrop;
    }

    // Helper method to re-attach event handlers for panel elements
    attachPanelElementHandlers(dialog, panel) {
        // Edit sub-element handlers
        dialog.querySelectorAll('.edit-sub-element').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const subIndex = parseInt(e.target.dataset.index);
                const subElement = panel.elements[subIndex];
                
                // Create edit dialog for sub-element
                const subDialog = this.createElementEditDialog(subElement, subElement.type, (updatedElement) => {
                    panel.elements[subIndex] = updatedElement;
                    
                    // Refresh the panel elements list
                    const listContainer = dialog.querySelector('#panelElementsList');
                    this.renderPanelElementsList(listContainer, panel.elements);
                    
                    // Re-attach event handlers
                    this.attachPanelElementHandlers(dialog, panel);
                });
                
                document.body.appendChild(subDialog);
            });
        });

        // Remove sub-element handlers
        dialog.querySelectorAll('.remove-sub-element').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const subIndex = parseInt(e.target.dataset.index);
                if (confirm('Are you sure you want to remove this element?')) {
                    panel.elements.splice(subIndex, 1);
                    
                    // Refresh the panel elements list
                    const listContainer = dialog.querySelector('#panelElementsList');
                    this.renderPanelElementsList(listContainer, panel.elements);
                    
                    // Re-attach event handlers
                    this.attachPanelElementHandlers(dialog, panel);
                }
            });
        });
    }

    deleteElement(index) {
        // Check if form is locked
        if (this.checkFormLocked()) {
            return;
        }
        
        this.saveToHistory();
        this.formData.pages[this.currentPageIndex].elements.splice(index, 1);
        this.selectedElement = null;
        this.renderFormElements();
        const propertiesPanel = document.getElementById('propertiesPanel');
        // Clear properties panel safely
        while (propertiesPanel.firstChild) {
            propertiesPanel.removeChild(propertiesPanel.firstChild);
        }
        // Create empty state
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-properties';
        emptyDiv.textContent = 'Select an element to edit its properties';
        propertiesPanel.appendChild(emptyDiv);
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    duplicateElement(index) {
        // Check if form is locked
        if (this.checkFormLocked()) {
            return;
        }
        
        const element = this.formData.pages[this.currentPageIndex].elements[index];
        const duplicate = JSON.parse(JSON.stringify(element));
        duplicate.name = `${duplicate.name}_copy_${Date.now()}`;
        duplicate.title = `${duplicate.title} (Copy)`;
        
        this.formData.pages[this.currentPageIndex].elements.splice(index + 1, 0, duplicate);
        this.renderFormElements();
    }

    // Edit element - called on double-click or edit button click
    editElement(index) {
        // Check if form is locked
        if (this.checkFormLocked()) {
            return;
        }

        const element = this.formData.pages[this.currentPageIndex].elements[index];
        
        // Check if this is a panel with sub-elements that needs special handling
        if (element.type === 'panel' && element.elements && element.elements.length > 0) {
            // Use special panel editing method
            this.editPanelElement(index);
            return;
        }
        
        // Create edit dialog based on element type
        const dialog = this.createElementEditDialog(element, element.type, (updatedElement) => {
            // Save to history before making changes
            this.saveToHistory();
            
            // Update the element
            this.formData.pages[this.currentPageIndex].elements[index] = updatedElement;
            
            // Re-render elements
            this.renderFormElements();
            
            // Keep the element selected
            this.selectElement(index);
            
            // Mark as unsaved
            this.hasUnsavedChanges = true;
            this.debouncedSave();
            
            // Show success notification
            this.showNotification('Element updated successfully');
        });
        
        document.body.appendChild(dialog);
    }

    switchPage(index) {
        this.currentPageIndex = index;
        this.selectedElement = null;
        this.renderPageTabs();
        this.renderFormElements();
        document.getElementById('pageTitle').value = this.formData.pages[index].title || '';
        const propertiesPanel = document.getElementById('propertiesPanel');
        // Clear properties panel safely
        while (propertiesPanel.firstChild) {
            propertiesPanel.removeChild(propertiesPanel.firstChild);
        }
        // Create empty state
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-properties';
        emptyDiv.textContent = 'Select an element to edit its properties';
        propertiesPanel.appendChild(emptyDiv);
    }

    addPage() {
        const pageNum = this.formData.pages.length + 1;
        this.formData.pages.push({
            name: `page${pageNum}`,
            title: `Page ${pageNum}`,
            elements: []
        });
        this.currentPageIndex = this.formData.pages.length - 1;
        this.renderPageTabs();
        this.renderFormElements();
    }

    // Task A: Inject builder CSS styles into preview for visual consistency
    injectBuilderCSSIntoPreview() {
        // Check if preview styles already exist to prevent duplicates
        if (document.getElementById('preview-builder-styles')) {
            return;
        }

        const previewStyles = document.createElement('style');
        previewStyles.id = 'preview-builder-styles';
        previewStyles.textContent = `
            /* Task A & B: Inject divider & label styles into preview iframe for visual consistency */
            
            /* Task F: Centralized section dividers in preview - IPLC branding */
            .preview-modal .section-divider,
            #surveyPreview .section-divider {
                border: none;
                height: 4px;
                background: #0B60D1;
                margin: 1.5rem 0;
                width: 100%;
                border-radius: 2px;
                box-shadow: 0 2px 4px rgba(11, 96, 209, 0.3);
                opacity: 0.8;
                transition: opacity 0.3s ease;
                role: presentation;
                aria-hidden: true;
            }
            
            .preview-modal .section-divider:hover,
            #surveyPreview .section-divider:hover {
                opacity: 1;
                box-shadow: 0 2px 6px rgba(11, 96, 209, 0.4);
            }
            
            /* Gradient variant for special preview sections */
            .preview-modal .section-divider.gradient,
            #surveyPreview .section-divider.gradient {
                background: linear-gradient(90deg, #0B60D1 0%, #0952a5 50%, #0B60D1 100%);
            }
            
            /* Panel separator styling in preview */
            .preview-modal .section-divider.panel-separator,
            #surveyPreview .section-divider.panel-separator {
                height: 6px;
                margin: 2rem 0;
                background: linear-gradient(90deg, #0B60D1 0%, #0952a5 25%, #0B60D1 50%, #0952a5 75%, #0B60D1 100%);
                box-shadow: 0 3px 8px rgba(11, 96, 209, 0.4);
            }
            
            /* Enhanced label styling in preview */
            .preview-modal .sv-string-viewer,
            .preview-modal .sv-question__title,
            .preview-modal .sv-panel__title,
            #surveyPreview .sv-string-viewer,
            #surveyPreview .sv-question__title,
            #surveyPreview .sv-panel__title {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 0.75rem;
                line-height: 1.4;
            }
            
            /* Panel styling consistency with IPLC branding */
            .preview-modal .sv-panel,
            #surveyPreview .sv-panel {
                background: linear-gradient(to right, #f8f9fa 0%, white 10%);
                border-left: 4px solid #0B60D1;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            /* Form element spacing consistency */
            .preview-modal .sv-question,
            #surveyPreview .sv-question {
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: white;
                border-radius: 6px;
                border: 1px solid #e1e4e8;
            }
            
            /* Input field consistency with touch-friendly sizing */
            .preview-modal input[type="text"],
            .preview-modal input[type="email"],
            .preview-modal input[type="tel"],
            .preview-modal input[type="number"],
            .preview-modal input[type="date"],
            .preview-modal textarea,
            .preview-modal select,
            #surveyPreview input[type="text"],
            #surveyPreview input[type="email"],
            #surveyPreview input[type="tel"],
            #surveyPreview input[type="number"],
            #surveyPreview input[type="date"],
            #surveyPreview textarea,
            #surveyPreview select {
                min-height: 44px;
                padding: 0.75rem;
                border: 2px solid #dee2e6;
                border-radius: 4px;
                font-size: 16px; /* Prevent iOS zoom on focus */
                background-color: #ffffff;
                color: #212529;
                transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
            }
            
            /* Focus states for accessibility */
            .preview-modal input:focus,
            .preview-modal textarea:focus,
            .preview-modal select:focus,
            #surveyPreview input:focus,
            #surveyPreview textarea:focus,
            #surveyPreview select:focus {
                border-color: #0B60D1;
                outline: 0;
                box-shadow: 0 0 0 0.2rem rgba(11, 96, 209, 0.25);
            }
            
            /* Button styling with IPLC branding */
            .preview-modal .sv-btn,
            .preview-modal button,
            #surveyPreview .sv-btn,
            #surveyPreview button {
                min-width: 44px;
                min-height: 44px;
                padding: 0.75rem 1.5rem;
                background-color: #0B60D1;
                color: white;
                border: 2px solid #0B60D1;
                border-radius: 4px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease-in-out;
            }
            
            .preview-modal .sv-btn:hover,
            .preview-modal button:hover,
            #surveyPreview .sv-btn:hover,
            #surveyPreview button:hover {
                background-color: #0952a5;
                border-color: #0952a5;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(11, 96, 209, 0.3);
            }
            
            /* Progress bar styling */
            .preview-modal .sv-progress,
            #surveyPreview .sv-progress {
                background-color: #e9ecef;
                border-radius: 0.25rem;
                overflow: hidden;
            }
            
            .preview-modal .sv-progress__bar,
            #surveyPreview .sv-progress__bar {
                background-color: #0B60D1;
                transition: width 0.3s ease;
            }
            
            /* Radio button and checkbox styling */
            .preview-modal input[type="radio"],
            .preview-modal input[type="checkbox"],
            #surveyPreview input[type="radio"],
            #surveyPreview input[type="checkbox"] {
                min-width: 20px;
                min-height: 20px;
                margin: 12px;
            }
            
            /* Label touch targets for small inputs */
            .preview-modal label:has(input[type="checkbox"]),
            .preview-modal label:has(input[type="radio"]),
            #surveyPreview label:has(input[type="checkbox"]),
            #surveyPreview label:has(input[type="radio"]) {
                min-height: 44px;
                display: flex;
                align-items: center;
                padding: 8px;
                margin: 4px 0;
                cursor: pointer;
            }
            
            /* Rating scale styling */
            .preview-modal .sv-rating,
            #surveyPreview .sv-rating {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .preview-modal .sv-rating__item,
            #surveyPreview .sv-rating__item {
                min-width: 44px;
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #dee2e6;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease-in-out;
            }
            
            .preview-modal .sv-rating__item:hover,
            .preview-modal .sv-rating__item.sv-rating__item--selected,
            #surveyPreview .sv-rating__item:hover,
            #surveyPreview .sv-rating__item.sv-rating__item--selected {
                background-color: #0B60D1;
                border-color: #0B60D1;
                color: white;
            }
            
            /* Error message styling */
            .preview-modal .sv-question__errs,
            #surveyPreview .sv-question__errs {
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            
            /* Responsive design for mobile/tablet */
            @media (max-width: 768px) {
                .preview-modal input,
                .preview-modal textarea,
                .preview-modal select,
                .preview-modal button,
                #surveyPreview input,
                #surveyPreview textarea,
                #surveyPreview select,
                #surveyPreview button {
                    min-height: 48px;
                    font-size: 18px;
                }
                
                .preview-modal .sv-question,
                #surveyPreview .sv-question {
                    padding: 0.75rem;
                }
                
                .preview-modal .sv-panel,
                #surveyPreview .sv-panel {
                    padding: 1rem;
                }
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .preview-modal input,
                .preview-modal textarea,
                .preview-modal select,
                .preview-modal button,
                #surveyPreview input,
                #surveyPreview textarea,
                #surveyPreview select,
                #surveyPreview button {
                    border-width: 3px;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .preview-modal *,
                #surveyPreview * {
                    animation-duration: 0.01ms !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(previewStyles);
    }

    preview() {
        // Data-preview-bound guard to prevent duplicate listeners and multiple instances
        if (document.body.hasAttribute('data-preview-bound') || document.querySelector('.preview-modal')) {
            
            return;
        }
        
        // Set guard flag
        document.body.setAttribute('data-preview-bound', 'true');
        
        try {
            // Inject builder CSS styles into preview to ensure visual consistency
            this.injectBuilderCSSIntoPreview();
            
            const modal = this.createPreviewModalDOM();
            document.body.appendChild(modal);
            modal.style.display = 'block';

            // Initialize SurveyJS with the form data
            try {
                // Ensure the preview container is in the DOM before rendering
                const previewElement = document.getElementById("surveyPreview");
                if (!previewElement) {
                    throw new Error("Preview container not found in DOM");
                }
                
                // Create survey with auto-loading IPLC logo
                const surveyData = this.getFormDataWithLogo();
                const survey = new Survey.Model(surveyData);
                
                // CRITICAL: Set the survey to read-only to hide all editing controls
                survey.readOnly = false; // Keep interactive for preview
                
                // Ensure no design-time features are enabled
                survey.showNavigationButtons = true;
                survey.showProgressBar = "top";
                survey.showCompletedPage = false;
                
                // Disable any editing capabilities
                if (survey.onAfterRenderPage) {
                    survey.onAfterRenderPage.add((sender, options) => {
                        // Remove any design-time elements that might have been rendered
                        const designElements = options.htmlElement.querySelectorAll(
                            '.sv-action-bar, .sv-designer-button, .sd-element__add-button, ' +
                            '.sd-page__add-button, .sv-action-bar-item, .sv-add-new-page-btn, ' +
                            '[class*="designer"], [class*="add-new"], [class*="add-button"]'
                        );
                        designElements.forEach(el => el.remove());
                    });
                }
                
                // Pass the DOM element, not just the ID string
                survey.render(previewElement);
                
                // Additional cleanup after render
                setTimeout(() => {
                    // Remove any remaining design/edit elements
                    const container = document.getElementById('surveyPreview');
                    if (container) {
                        // Remove any "Add Page" buttons or similar editing controls
                        const editControls = container.querySelectorAll(
                            'button:contains("Add"), button:contains("add"), ' +
                            '[title*="Add"], [title*="add"], .add-page-btn, ' +
                            '.sv-action-bar, .sd-action-bar'
                        );
                        editControls.forEach(el => {
                            if (el.textContent && (el.textContent.includes('Add') || el.textContent.includes('add'))) {
                                el.remove();
                            }
                        });
                    }
                }, 100);
                
            } catch (error) {
                console.error('Error creating preview:', error);
                const surveyPreview = document.getElementById('surveyPreview');
                if (surveyPreview) {
                    // Clear existing content
                    while (surveyPreview.firstChild) {
                        surveyPreview.removeChild(surveyPreview.firstChild);
                    }
                    // Add error content
                    const errorContent = this.createPreviewErrorDOM(error.message);
                    surveyPreview.appendChild(errorContent);
                }
            }
            
            // Add event listener for close button using Pointer Events API for unified touch/mouse/pen input
            const closeButton = modal.querySelector('.close-preview');
            if (closeButton) {
                closeButton.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    this.closePreview();
                });
            }
            
            // Add event listener for clicking outside the modal
            modal.addEventListener('pointerdown', (e) => {
                if (e.target === modal) {
                    e.preventDefault();
                    this.closePreview();
                }
            });
            
        } catch (error) {
            console.error('FormBuilder: Preview initialization error:', error);
            // Remove guard flag on error
            document.body.removeAttribute('data-preview-bound');
        }
    }
    
    // Close preview and reinitialize builder to prevent read-only state
    closePreview() {
        
        
        // Remove the preview modal
        const modal = document.querySelector('.preview-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clean up guard flags to prevent duplicate listeners
        document.body.removeAttribute('data-preview-bound');
        
        // Clean up injected preview styles
        const injectedStyles = document.getElementById('preview-builder-styles');
        if (injectedStyles) {
            injectedStyles.remove();
        }
        
        // Clean up any remaining event listeners on preview elements
        const previewElements = document.querySelectorAll('[data-action="closeModal"]');
        previewElements.forEach(element => {
            // Clone and replace to remove all event listeners
            const newElement = element.cloneNode(true);
            if (element.parentNode) {
                element.parentNode.replaceChild(newElement, element);
            }
        });
        
        // Reinitialize the builder to ensure it's not in read-only state
        setTimeout(() => {
            this.initializeBuilder();
            this.showNotification('Preview closed - builder ready for editing');
        }, 100);
    }

    getFormData() {
        // Get creator name from input field (will be added to UI later)
        const creatorInput = document.getElementById('creatorName');
        const createdBy = creatorInput ? creatorInput.value : '';
        
        return {
            title: this.formData.title,
            description: this.formData.description,
            pages: this.formData.pages,
            createdBy: createdBy
        };
    }

    // Get form data with auto-loading IPLC logo configuration
    getFormDataWithLogo() {
        const formData = { ...this.formData };
        
        // Check if logo is disabled in form settings
        if (formData.showLogo !== false) {
            // Apply default logo configuration
            formData.logo = "/assets/images/iplc-logo.png";
            formData.logoWidth = "auto";  // Let Survey.js calculate based on height
            formData.logoHeight = "60px";  // Reasonable height for form header
            formData.logoPosition = "left";
            formData.logoFit = "contain";  // Ensure logo maintains aspect ratio
        }
        
        return formData;
    }

    async save() {
        try {
            if (!this.formData.title) {
                alert('Please enter a form title');
                return;
            }

            const formData = this.getFormDataWithLogo();
            const templateData = {
                name: formData.title,
                description: formData.description || '',
                sections: formData.pages,
                createdBy: formData.createdBy || 'Unknown',
                // Include showLogo setting if it exists
                ...(formData.showLogo !== undefined && { showLogo: formData.showLogo }),
                // Include lock state
                isLocked: formData.isFormLocked || false,
                passcode: formData.formPasscode || ''
            };

            const method = this.options.templateId ? 'PUT' : 'POST';
            const url = this.options.templateId
                ? `/api/forms/templates/${this.options.templateId}`
                : '/api/forms/templates';

            // Add AbortController with 8 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            let response;
            try {
                response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(templateData),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                // Handle specific fetch errors
                if (fetchError.name === 'AbortError') {
                    throw new Error('Save request timed out. Please check your connection and try again.');
                } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
                    throw new Error('Network error while saving. Please check your internet connection.');
                } else {
                    throw new Error(`Failed to save form: ${fetchError.message}`);
                }
            }

            if (!response.ok) {
                throw new Error('Failed to save template');
            }

            const result = await response.json();
            
            // Clear auto-save data after successful save
            this.clearAutoSave();
            this.hasUnsavedChanges = false;
            
            alert('Form saved successfully!');
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Error saving form: ' + error.message);
        }
    }

    // Auto-save functionality
    setupAutoSave() {
        // Check for saved draft on load
        this.checkForSavedDraft();
        
        // Save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.saveToLocalStorage();
            }
        }, 30000);
        
        // Save on input with debounce
        this.debouncedSave = this.debounce(() => {
            this.saveToLocalStorage();
        }, 2000);
        
        // Save before page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                this.saveToLocalStorage();
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }
    
    saveToLocalStorage() {
        const saveData = {
            formData: this.formData,
            timestamp: new Date().toISOString(),
            templateId: this.options.templateId || null
        };
        
        localStorage.setItem('iplc_form_draft', JSON.stringify(saveData));
        this.showAutoSaveIndicator();
    }
    
    showAutoSaveIndicator() {
        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            // Show saving state with spinning icon
            // Clear indicator safely
            while (indicator.firstChild) {
                indicator.removeChild(indicator.firstChild);
            }
            
            // Create SVG element
            const savingSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            savingSvg.setAttribute('class', 'save-icon saving');
            savingSvg.setAttribute('width', '16');
            savingSvg.setAttribute('height', '16');
            savingSvg.setAttribute('viewBox', '0 0 16 16');
            
            // Create circle element
            const savingCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            savingCircle.setAttribute('cx', '8');
            savingCircle.setAttribute('cy', '8');
            savingCircle.setAttribute('r', '6');
            savingCircle.setAttribute('fill', 'none');
            savingCircle.setAttribute('stroke', 'currentColor');
            savingCircle.setAttribute('stroke-width', '2');
            savingCircle.setAttribute('stroke-dasharray', '38');
            savingCircle.setAttribute('stroke-dashoffset', '10');
            
            savingSvg.appendChild(savingCircle);
            
            // Create span element
            const savingSpan = document.createElement('span');
            savingSpan.textContent = 'Saving...';
            
            // Append elements
            indicator.appendChild(savingSvg);
            indicator.appendChild(savingSpan);
            indicator.className = 'auto-save-indicator saving';
            indicator.style.display = 'flex';
            
            // After a short delay, show saved state with checkmark
            setTimeout(() => {
                // Clear the indicator element safely
                while (indicator.firstChild) {
                    indicator.removeChild(indicator.firstChild);
                }
                
                // Create saved SVG element with checkmark and circle
                const savedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                savedSvg.setAttribute('class', 'save-icon saved');
                savedSvg.setAttribute('width', '16');
                savedSvg.setAttribute('height', '16');
                savedSvg.setAttribute('viewBox', '0 0 16 16');
                
                // Create path element for checkmark
                const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                checkPath.setAttribute('d', 'M5 8l2 2 4-4');
                checkPath.setAttribute('fill', 'none');
                checkPath.setAttribute('stroke', 'currentColor');
                checkPath.setAttribute('stroke-width', '2');
                
                // Create circle element
                const checkCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                checkCircle.setAttribute('cx', '8');
                checkCircle.setAttribute('cy', '8');
                checkCircle.setAttribute('r', '7');
                checkCircle.setAttribute('fill', 'none');
                checkCircle.setAttribute('stroke', 'currentColor');
                checkCircle.setAttribute('stroke-width', '1.5');
                
                // Create span for saved text
                const savedSpan = document.createElement('span');
                savedSpan.textContent = 'Draft saved';
                
                // Append SVG elements
                savedSvg.appendChild(checkPath);
                savedSvg.appendChild(checkCircle);
                
                // Append to indicator
                indicator.appendChild(savedSvg);
                indicator.appendChild(savedSpan);
                indicator.className = 'auto-save-indicator saved';
                
                // Fade out after showing saved state
                setTimeout(() => {
                    indicator.classList.add('fade-out');
                    setTimeout(() => {
                        indicator.style.display = 'none';
                        indicator.classList.remove('fade-out', 'saved');
                    }, 500);
                }, 2000);
            }, 500);
        }
    }
    
    checkForSavedDraft() {
        const savedDraft = localStorage.getItem('iplc_form_draft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                const draftDate = new Date(draft.timestamp);
                const now = new Date();
                const hoursSinceSave = (now - draftDate) / (1000 * 60 * 60);
                
                // Only offer to restore if draft is less than 24 hours old
                if (hoursSinceSave < 24) {
                    const restore = confirm(
                        `A draft was found from ${draftDate.toLocaleString()}. Would you like to restore it?`
                    );
                    
                    if (restore) {
                        this.formData = draft.formData;
                        this.render();
                        this.hasUnsavedChanges = true;
                    } else {
                        this.clearAutoSave();
                    }
                } else {
                    // Clear old drafts
                    this.clearAutoSave();
                }
            } catch (error) {
                console.error('Error restoring draft:', error);
                this.clearAutoSave();
            }
        }
    }
    
    clearAutoSave() {
        localStorage.removeItem('iplc_form_draft');
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async checkForEditMode() {
        // Check if we're in edit mode by looking for template ID in URL
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get('id');
        
        if (templateId) {
            this.templateId = templateId;
            this.options.mode = 'edit';
            this.options.templateId = templateId;
            
            // Load the template data
            await this.loadTemplate(templateId);
        }
    }

    async loadTemplate(templateId) {
        try {
            // Fetch with timeout and specific error handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            let response;
            try {
                response = await fetch(`/api/forms/templates/${templateId}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out while loading the template.');
                }
                throw new Error(`Network error: ${fetchError.message}`);
            }

            if (!response.ok) {
                throw new Error(`Failed to load template (HTTP ${response.status})`);
            }
            
            const template = await response.json();
            
            // Check if template uses legacy format
            if (template.sections && Array.isArray(template.sections) &&
                !template.pages && template.sections[0]?.fields) {
                // Convert legacy format to SurveyJS format
                this.formData = this.convertLegacyFormat(template);
            } else {
                // Use SurveyJS format directly
                this.formData = {
                    title: template.name || '',
                    description: template.description || '',
                    pages: template.sections || [{
                        name: 'page1',
                        title: 'Page 1',
                        elements: []
                    }],
                    // Preserve showLogo setting if it exists
                    ...(template.showLogo !== undefined && { showLogo: template.showLogo }),
                    // Restore lock state if it exists
                    isFormLocked: template.isLocked || false,
                    formPasscode: template.passcode || ''
                };
            }
            
            // Set creator name if available
            if (template.created_by) {
                const creatorInput = document.getElementById('creatorName');
                if (creatorInput) {
                    creatorInput.value = template.created_by;
                }
            }
            
            // Re-initialize drag and drop after template is loaded
            // Use setTimeout to ensure DOM is fully updated
            setTimeout(() => {
                this.setupDragAndDrop();
            }, 100);
            
            // Update lock UI if form is locked
            if (this.formData.isFormLocked) {
                this.updateLockUI();
            }
        } catch (error) {
            console.error('Error loading template:', error);
            alert('Error loading template: ' + error.message);
        }
    }

    convertLegacyFormat(template) {
        // Convert legacy format { sections: [{ fields }] } to SurveyJS format { pages: [{ elements }] }
        const formData = {
            title: template.name || '',
            description: template.description || '',
            pages: []
        };
        
        // Convert each section to a page
        if (template.sections && Array.isArray(template.sections)) {
            template.sections.forEach((section, index) => {
                const page = {
                    name: section.id || `page${index + 1}`,
                    title: section.title || `Page ${index + 1}`,
                    elements: []
                };
                
                // Convert fields to elements
                if (section.fields && Array.isArray(section.fields)) {
                    section.fields.forEach(field => {
                        const element = {
                            type: this.mapLegacyFieldType(field.type),
                            name: field.name || field.id,
                            title: field.label || field.title || field.name
                        };
                        
                        // Add field-specific properties
                        if (field.required) {
                            element.isRequired = true;
                        }
                        
                        if (field.options) {
                            element.choices = field.options;
                        }
                        
                        if (field.placeholder) {
                            element.placeHolder = field.placeholder;
                        }
                        
                        page.elements.push(element);
                    });
                }
                
                formData.pages.push(page);
            });
        }
        
        // If no sections, create a default page
        if (formData.pages.length === 0) {
            formData.pages.push({
                name: 'page1',
                title: 'Page 1',
                elements: []
            });
        }
        
        return formData;
    }

    mapLegacyFieldType(legacyType) {
        // Map legacy field types to SurveyJS types
        const typeMap = {
            'text': 'text',
            'textarea': 'comment',
            'number': 'text',
            'email': 'text',
            'tel': 'text',
            'date': 'text',
            'select': 'dropdown',
            'radio': 'radiogroup',
            'checkbox': 'checkbox',
            'file': 'file',
            'html': 'html',
            'section': 'panel',
            'rating': 'rating',
            'boolean': 'boolean'
        };
        
        return typeMap[legacyType] || 'text';
    }

    // Initialize field templates for quick insertion
    initFieldTemplates() {
        return {
            'contact-info': {
                name: 'Contact Information',
                elements: [
                    { type: 'text', name: 'full_name', title: 'Full Name', isRequired: true },
                    { type: 'text', name: 'email', title: 'Email Address', inputType: 'email', isRequired: true },
                    { type: 'text', name: 'phone', title: 'Phone Number', inputType: 'tel' },
                    { type: 'text', name: 'address', title: 'Street Address' },
                    { type: 'text', name: 'city', title: 'City' },
                    { type: 'dropdown', name: 'state', title: 'State', choices: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] },
                    { type: 'text', name: 'zip', title: 'ZIP Code' }
                ]
            },
            'likert-scale': {
                name: 'Likert Scale Question',
                elements: [
                    {
                        type: 'matrix',
                        name: 'satisfaction_rating',
                        title: 'Please rate your satisfaction with the following:',
                        columns: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
                        rows: ['Quality of Service', 'Timeliness', 'Communication', 'Overall Experience']
                    }
                ]
            },
            'medical-history': {
                name: 'Medical History',
                elements: [
                    { type: 'checkbox', name: 'conditions', title: 'Please check any conditions that apply:', choices: ['Diabetes', 'Heart Disease', 'High Blood Pressure', 'Asthma', 'Allergies', 'Other'] },
                    { type: 'comment', name: 'medications', title: 'Current Medications', rows: 3 },
                    { type: 'comment', name: 'allergies', title: 'Known Allergies', rows: 2 },
                    { type: 'text', name: 'emergency_contact', title: 'Emergency Contact Name' },
                    { type: 'text', name: 'emergency_phone', title: 'Emergency Contact Phone', inputType: 'tel' }
                ]
            },
            'feedback-form': {
                name: 'Feedback Form',
                elements: [
                    { type: 'rating', name: 'overall_rating', title: 'Overall Rating', isRequired: true },
                    { type: 'radiogroup', name: 'recommend', title: 'Would you recommend us?', choices: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not'] },
                    { type: 'comment', name: 'improvements', title: 'What could we improve?', rows: 4 },
                    { type: 'comment', name: 'additional_comments', title: 'Additional Comments', rows: 3 }
                ]
            }
        };
    }

    // Insert a field template into the current form
    insertFieldTemplate(templateKey) {
        if (!templateKey || !this.fieldTemplates[templateKey]) {
            return;
        }

        const template = this.fieldTemplates[templateKey];
        const currentPage = this.formData.pages[this.currentPageIndex];
        
        // Generate unique names for the template fields to avoid conflicts
        const timestamp = Date.now();
        const elementsWithUniqueNames = template.elements.map(element => ({
            ...element,
            name: `${element.name}_${timestamp}`
        }));
        
        // Add the template elements to the current page
        currentPage.elements = currentPage.elements.concat(elementsWithUniqueNames);
        
        // Update the form designer display
        this.renderFormElements();
        
        // Reset the dropdown
        const select = document.getElementById('fieldTemplateSelect');
        if (select) {
            select.value = '';
        }
        
        // Show notification
        this.showNotification(`Added ${template.name} template to the form`);
        
        // Save to history
        this.saveToHistory();
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
            
            // Delete key to remove selected element
            if (e.key === 'Delete' && this.selectedElement !== null) {
                e.preventDefault();
                this.deleteElement(this.selectedElement);
            }
            
            // Ctrl/Cmd + C to copy element
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this.selectedElement !== null) {
                e.preventDefault();
                this.copyElement();
            }
            
            // Ctrl/Cmd + V to paste element
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && this.copiedElement) {
                e.preventDefault();
                this.pasteElement();
            }
            
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }
            
            // Ctrl/Cmd + P to preview
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.preview();
            }
            
            // F1 for help
            if (e.key === 'F1') {
                e.preventDefault();
                this.tour.showHelp();
            }
            
            // ? key for tour (when not in an input field)
            if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.tour.startTour();
            }
        });
    }

    // Save current state to history
    saveToHistory() {
        // Remove any states after current position (when we're in the middle of history)
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        const state = JSON.parse(JSON.stringify(this.formData));
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }

    // Undo last action
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.formData = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.render();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        }
    }

    // Redo action
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.formData = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.render();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        }
    }

    // Update undo/redo button states
    updateUndoRedoButtons() {
        const undoBtn = document.querySelector('[data-action="undo"]');
        const redoBtn = document.querySelector('[data-action="redo"]');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
            undoBtn.style.opacity = this.historyIndex <= 0 ? '0.5' : '1';
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
            redoBtn.style.opacity = this.historyIndex >= this.history.length - 1 ? '0.5' : '1';
        }
    }

    // Copy selected element
    copyElement() {
        if (this.selectedElement !== null) {
            const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
            this.copiedElement = JSON.parse(JSON.stringify(element));
            this.showNotification('Element copied to clipboard');
        }
    }

    // Paste copied element
    pasteElement() {
        if (this.copiedElement) {
            this.saveToHistory();
            const newElement = JSON.parse(JSON.stringify(this.copiedElement));
            newElement.name = `${newElement.name}_paste_${Date.now()}`;
            newElement.title = `${newElement.title} (Pasted)`;
            
            const currentPage = this.formData.pages[this.currentPageIndex];
            const insertIndex = this.selectedElement !== null ? this.selectedElement + 1 : currentPage.elements.length;
            currentPage.elements.splice(insertIndex, 0, newElement);
            
            this.renderFormElements();
            this.selectElement(insertIndex);
            this.hasUnsavedChanges = true;
            this.debouncedSave();
            this.showNotification('Element pasted');
        }
    }

    // Helper method to escape HTML for security
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Show notification message with enhanced UI feedback for Task B
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        
        // Define colors and icons for different notification types
        const typeConfig = {
            'info': { bg: '#17a2b8', icon: 'ℹ️' },
            'success': { bg: '#28a745', icon: '✅' },
            'error': { bg: '#dc3545', icon: '❌' },
            'warning': { bg: '#ffc107', icon: '⚠️' }
        };
        
        const config = typeConfig[type] || typeConfig.info;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${config.bg};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        // Add icon and message
        const iconSpan = document.createElement('span');
        iconSpan.style.fontSize = '1.2em';
        iconSpan.textContent = config.icon;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        notification.appendChild(iconSpan);
        notification.appendChild(messageSpan);
        
        // Add animation styles if not already present
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Different display durations based on type
        const duration = type === 'error' ? 4000 : 3000;
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    // Update form-level settings
    updateFormSetting(setting, value) {
        this.saveToHistory();
        this.formData[setting] = value;
        this.hasUnsavedChanges = true;
        this.debouncedSave();
        
        // Show notification
        this.showNotification(`Form setting updated: ${setting}`);
    }

    // Get AI Summary properties HTML
    getAISummaryPropertiesHTML(element) {
        const allFields = this.getAllFormElements();
        const selectedFields = element.selectedFields || [];
        
        return `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">AI Summary Settings</h4>
                
                <div class="property-field">
                    <label class="property-label">Summary Type</label>
                    <select class="property-input" onchange="formBuilder.updateElementProperty('summaryType', this.value)">
                        <option value="comprehensive" ${element.summaryType === 'comprehensive' ? 'selected' : ''}>Comprehensive</option>
                        <option value="brief" ${element.summaryType === 'brief' ? 'selected' : ''}>Brief</option>
                    </select>
                </div>
                
                <div class="property-field">
                    <label class="property-label">Display Mode</label>
                    <select class="property-input" onchange="formBuilder.updateElementProperty('displayMode', this.value)">
                        <option value="seamless" ${element.displayMode === 'seamless' ? 'selected' : ''}>Seamless</option>
                        <option value="highlighted" ${element.displayMode === 'highlighted' ? 'selected' : ''}>Highlighted</option>
                        <option value="expandable" ${element.displayMode === 'expandable' ? 'selected' : ''}>Expandable</option>
                    </select>
                </div>
                
                <div class="property-field">
                    <label class="property-label">
                        <input type="checkbox" ${element.allowRuntimeSelection ? 'checked' : ''}
                               onchange="formBuilder.updateElementProperty('allowRuntimeSelection', this.checked)">
                        Allow runtime field selection
                    </label>
                </div>
                
                <div class="ai-summary-field-selector">
                    <h5>Select fields to include in summary:</h5>
                    ${allFields.map(field => `
                        <label class="field-checkbox">
                            <input type="checkbox"
                                   value="${field.name}"
                                   ${selectedFields.includes(field.name) ? 'checked' : ''}
                                   onchange="formBuilder.updateAISummaryFields('${field.name}', this.checked)">
                            ${field.title || field.name}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Update AI Summary selected fields
    updateAISummaryFields(fieldName, checked) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        if (!element.selectedFields) {
            element.selectedFields = [];
        }
        
        if (checked) {
            if (!element.selectedFields.includes(fieldName)) {
                element.selectedFields.push(fieldName);
            }
        } else {
            const index = element.selectedFields.indexOf(fieldName);
            if (index > -1) {
                element.selectedFields.splice(index, 1);
            }
        }
        
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    // Toggle form lock/unlock
    toggleFormLock() {
        if (this.formData.isFormLocked) {
            // Unlock the form
            const passcode = prompt('Enter passcode to unlock form:');
            if (passcode === this.formData.formPasscode) {
                this.formData.isFormLocked = false;
                this.updateLockUI();
                this.showNotification('Form unlocked successfully', 'success');
                this.hasUnsavedChanges = true;
                this.debouncedSave();
            } else if (passcode !== null) { // User didn't cancel
                this.showNotification('Incorrect passcode', 'error');
            }
        } else {
            // Lock the form
            const passcode = prompt('Enter a passcode to lock this form:');
            if (passcode && passcode.trim() !== '') {
                const confirmPasscode = prompt('Confirm passcode:');
                if (passcode === confirmPasscode) {
                    this.formData.isFormLocked = true;
                    this.formData.formPasscode = passcode;
                    this.updateLockUI();
                    this.showNotification('Form locked successfully', 'success');
                    this.hasUnsavedChanges = true;
                    this.debouncedSave();
                } else if (confirmPasscode !== null) { // User didn't cancel
                    this.showNotification('Passcodes do not match', 'error');
                }
            }
        }
    }

    // Update lock UI
    updateLockUI() {
        const lockIcon = document.getElementById('lockIcon');
        const lockText = document.getElementById('lockText');
        const lockButton = document.querySelector('[onclick="formBuilder.toggleFormLock()"]');
        
        if (this.formData.isFormLocked) {
            if (lockIcon) lockIcon.textContent = '🔒';
            if (lockText) lockText.textContent = 'Unlock Form';
            if (lockButton) lockButton.classList.add('locked');
            
            // Disable editing controls
            const draggables = document.querySelectorAll('.draggable-element');
            draggables.forEach(el => {
                el.setAttribute('draggable', 'false');
                el.style.opacity = '0.6';
                el.style.cursor = 'not-allowed';
            });
            
            // Show lock indicator on form elements
            const formElements = document.querySelectorAll('.form-element');
            formElements.forEach(el => {
                el.style.opacity = '0.8';
                el.style.pointerEvents = 'none';
            });
        } else {
            if (lockIcon) lockIcon.textContent = '🔓';
            if (lockText) lockText.textContent = 'Lock Form';
            if (lockButton) lockButton.classList.remove('locked');
            
            // Enable editing controls
            const draggables = document.querySelectorAll('.draggable-element');
            draggables.forEach(el => {
                el.setAttribute('draggable', 'true');
                el.style.opacity = '1';
                el.style.cursor = 'move';
            });
            
            // Enable form elements
            const formElements = document.querySelectorAll('.form-element');
            formElements.forEach(el => {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            });
        }
    }

    // Check if form is locked before allowing edits
    checkFormLocked() {
        if (this.formData.isFormLocked) {
            this.showNotification('Form is locked. Unlock it to make changes.', 'warning');
            return true;
        }
        return false;
    }

    // Helper method to create element type selection dialog
    createElementTypeDialog(callback) {
        const types = [
            { value: 'text', label: 'Text Field' },
            { value: 'dropdown', label: 'Dropdown' },
            { value: 'radiogroup', label: 'Radio Buttons' },
            { value: 'checkbox', label: 'Checkboxes' },
            { value: 'comment', label: 'Text Area' },
            { value: 'boolean', label: 'Yes/No' },
            { value: 'rating', label: 'Rating Scale' },
            { value: 'html', label: 'HTML Content' },
            { value: 'signaturepad', label: 'Signature Pad' },
            { value: 'panel', label: 'Panel' },
            { value: 'paneldynamic', label: 'Dynamic Panel' },
            { value: 'matrix', label: 'Matrix' },
            { value: 'matrixdynamic', label: 'Dynamic Matrix' }
        ];

        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'custom-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1040;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const dialog = document.createElement('div');
        dialog.className = 'custom-modal-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow: hidden;
            animation: modalFadeIn 0.3s ease-out;
        `;

        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.cssText = 'padding: 1rem; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;';
        
        const modalTitle = document.createElement('h5');
        modalTitle.className = 'modal-title';
        modalTitle.style.cssText = 'margin: 0; font-size: 1.25rem;';
        modalTitle.textContent = 'Select Element Type';
        
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close touch-target';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.textContent = '×';
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.padding = '1rem';
        
        const select = document.createElement('select');
        select.className = 'form-select';
        select.id = 'elementTypeSelect';
        select.style.cssText = 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem; font-size: 1rem;';
        
        // Add options
        types.forEach(t => {
            const option = document.createElement('option');
            option.value = t.value;
            option.textContent = t.label;
            select.appendChild(option);
        });
        
        modalBody.appendChild(select);
        
        // Create modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.style.cssText = 'padding: 1rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.5rem;';
        
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary touch-target';
        cancelButton.setAttribute('data-dismiss', 'modal');
        cancelButton.textContent = 'Cancel';
        
        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'btn btn-primary touch-target';
        confirmButton.id = 'confirmElementType';
        confirmButton.textContent = 'Add Element';
        
        modalFooter.appendChild(cancelButton);
        modalFooter.appendChild(confirmButton);
        
        // Append all to dialog
        dialog.appendChild(modalHeader);
        dialog.appendChild(modalBody);
        dialog.appendChild(modalFooter);

        // Add animation styles if not already present
        if (!document.getElementById('modal-animation-styles')) {
            const animationStyles = document.createElement('style');
            animationStyles.id = 'modal-animation-styles';
            animationStyles.textContent = `
                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes modalFadeOut {
                    from {
                        opacity: 1;
                        transform: scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                }
            `;
            document.head.appendChild(animationStyles);
        }

        // Append modal to backdrop and backdrop to body
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Function to close modal
        const closeModal = () => {
            dialog.style.animation = 'modalFadeOut 0.3s ease-out';
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        };

        // Handle close button click - Using Pointer Events API
        dialog.querySelector('.btn-close').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Handle cancel button click
        dialog.querySelector('.btn-secondary').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Handle backdrop click
        backdrop.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.target === backdrop) {
                closeModal();
            }
        });

        // Handle confirm button click
        dialog.querySelector('#confirmElementType').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const type = dialog.querySelector('#elementTypeSelect').value;
            closeModal();
            // Call the callback after modal is closed
            setTimeout(() => {
                callback(type);
            }, 300);
        });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus on select element
        setTimeout(() => {
            dialog.querySelector('#elementTypeSelect').focus();
        }, 100);

        return dialog;
    }

    // Helper method to create element edit dialog
    createElementEditDialog(element, type, callback) {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'custom-modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1040;
            opacity: 0;
            transition: opacity 0.15s ease-in-out;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Create modal dialog
        const dialog = document.createElement('div');
        dialog.className = 'custom-modal-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transform: scale(0.9);
            opacity: 0;
            transition: all 0.3s ease-out;
        `;

        // Create modal content
        // Clear dialog content
        while (dialog.firstChild) {
            dialog.removeChild(dialog.firstChild);
        }
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.cssText = 'padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; flex-shrink: 0;';
        
        const modalTitle = document.createElement('h5');
        modalTitle.className = 'modal-title';
        modalTitle.style.cssText = 'margin: 0; font-size: 1.25rem; font-weight: 500;';
        modalTitle.textContent = `Edit ${type ? type.charAt(0).toUpperCase() + type.slice(1) : ''} Element`;
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close touch-target';
        closeBtn.textContent = '×';
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.cssText = 'padding: 1.5rem; overflow-y: auto; flex: 1;';
        
        const form = document.createElement('form');
        form.id = 'elementEditForm';
        
        // Create name field
        const nameDiv = document.createElement('div');
        nameDiv.className = 'mb-3';
        nameDiv.style.marginBottom = '1rem';
        
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = 'elementName';
        nameLabel.className = 'form-label';
        nameLabel.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: 500;';
        nameLabel.textContent = 'Name (ID):';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-control';
        nameInput.id = 'elementName';
        nameInput.value = element.name || '';
        nameInput.style.cssText = 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem; font-size: 1rem;';
        
        nameDiv.appendChild(nameLabel);
        nameDiv.appendChild(nameInput);
        
        // Create title field
        const titleDiv = document.createElement('div');
        titleDiv.className = 'mb-3';
        titleDiv.style.marginBottom = '1rem';
        
        const titleLabel = document.createElement('label');
        titleLabel.htmlFor = 'elementTitle';
        titleLabel.className = 'form-label';
        titleLabel.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: 500;';
        titleLabel.textContent = 'Title:';
        
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'form-control';
        titleInput.id = 'elementTitle';
        titleInput.value = element.title || '';
        titleInput.style.cssText = 'width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem; font-size: 1rem;';
        
        titleDiv.appendChild(titleLabel);
        titleDiv.appendChild(titleInput);
        
        // Create placeholder for type-specific properties
        const specificPropsDiv = document.createElement('div');
        specificPropsDiv.id = 'elementSpecificProperties';
        
        form.appendChild(nameDiv);
        form.appendChild(titleDiv);
        form.appendChild(specificPropsDiv);
        modalBody.appendChild(form);
        
        // Create modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.style.cssText = 'padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary touch-target';
        cancelBtn.textContent = 'Cancel';
        
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary touch-target';
        saveBtn.id = 'saveElementChanges';
        saveBtn.textContent = 'Save Changes';
        
        modalFooter.appendChild(cancelBtn);
        modalFooter.appendChild(saveBtn);
        
        // Append all sections to dialog
        dialog.appendChild(modalHeader);
        dialog.appendChild(modalBody);
        dialog.appendChild(modalFooter);

        // Append modal to backdrop and backdrop to body
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Add type-specific properties
        const specificProps = dialog.querySelector('#elementSpecificProperties');
        const elementType = type || element.type || 'text';
        const typeSpecificFields = this.getTypeSpecificFormFields(element, elementType);
        specificProps.appendChild(typeSpecificFields);

        // Trigger reflow and add show classes for animation
        setTimeout(() => {
            backdrop.style.opacity = '1';
            dialog.style.transform = 'scale(1)';
            dialog.style.opacity = '1';
        }, 10);

        // Function to close modal
        const closeModal = () => {
            dialog.style.transform = 'scale(0.9)';
            dialog.style.opacity = '0';
            backdrop.style.opacity = '0';
            
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        };

        // Handle close button click - Using Pointer Events API
        dialog.querySelector('.btn-close').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Handle cancel button click
        dialog.querySelector('.btn-secondary').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Handle backdrop click
        backdrop.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (e.target === backdrop) {
                closeModal();
            }
        });

        // Handle save button click
        dialog.querySelector('#saveElementChanges').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const updatedElement = {
                ...element,
                name: dialog.querySelector('#elementName').value,
                title: dialog.querySelector('#elementTitle').value
            };

            // Gather type-specific properties
            this.gatherTypeSpecificProperties(updatedElement, elementType, dialog);

            closeModal();
            // Call the callback after modal is closed
            setTimeout(() => {
                callback(updatedElement);
            }, 300);
        });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus on first input
        setTimeout(() => {
            dialog.querySelector('#elementName').focus();
        }, 350);

        return dialog;
    }

    // Get type-specific form fields for the edit dialog
    getTypeSpecificFormFields(element, type) {
        const container = document.createElement('div');
        
        switch (type) {
            case 'text':
            case 'comment':
                // Placeholder field
                const placeholderDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const placeholderLabel = HtmlEscape.createElement('label', {
                    className: 'form-label',
                    htmlFor: 'elementPlaceholder'
                });
                HtmlEscape.setTextContent(placeholderLabel, 'Placeholder:');
                placeholderDiv.appendChild(placeholderLabel);
                
                const placeholderInput = HtmlEscape.createElement('input', {
                    type: 'text',
                    className: 'form-control',
                    id: 'elementPlaceholder'
                });
                placeholderInput.value = element.placeholder || '';
                placeholderDiv.appendChild(placeholderInput);
                container.appendChild(placeholderDiv);
                
                // Required checkbox
                const requiredDiv = HtmlEscape.createElement('div', { className: 'form-check mb-3' });
                const requiredInput = HtmlEscape.createElement('input', {
                    type: 'checkbox',
                    className: 'form-check-input',
                    id: 'elementRequired'
                });
                if (element.isRequired) {
                    requiredInput.checked = true;
                }
                requiredDiv.appendChild(requiredInput);
                
                const requiredLabel = HtmlEscape.createElement('label', {
                    className: 'form-check-label',
                    htmlFor: 'elementRequired'
                });
                HtmlEscape.setTextContent(requiredLabel, 'Required');
                requiredDiv.appendChild(requiredLabel);
                container.appendChild(requiredDiv);
                break;

            case 'dropdown':
            case 'radiogroup':
            case 'checkbox':
                // Choices field
                const choicesDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const choicesLabel = HtmlEscape.createElement('label', { className: 'form-label' });
                HtmlEscape.setTextContent(choicesLabel, 'Choices (one per line):');
                choicesDiv.appendChild(choicesLabel);
                
                const choicesTextarea = HtmlEscape.createElement('textarea', {
                    className: 'form-control',
                    id: 'elementChoices',
                    rows: '5'
                });
                choicesTextarea.value = element.choices ?
                    element.choices.map(c => c.text || c).join('\n') : '';
                choicesDiv.appendChild(choicesTextarea);
                container.appendChild(choicesDiv);
                
                // Required checkbox
                const reqDiv = HtmlEscape.createElement('div', { className: 'form-check mb-3' });
                const reqInput = HtmlEscape.createElement('input', {
                    type: 'checkbox',
                    className: 'form-check-input',
                    id: 'elementRequired'
                });
                if (element.isRequired) {
                    reqInput.checked = true;
                }
                reqDiv.appendChild(reqInput);
                
                const reqLabel = HtmlEscape.createElement('label', {
                    className: 'form-check-label',
                    htmlFor: 'elementRequired'
                });
                HtmlEscape.setTextContent(reqLabel, 'Required');
                reqDiv.appendChild(reqLabel);
                container.appendChild(reqDiv);
                break;

            case 'rating':
                // Minimum Rating
                const minDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const minLabel = HtmlEscape.createElement('label', {
                    className: 'form-label',
                    htmlFor: 'elementRateMin'
                });
                HtmlEscape.setTextContent(minLabel, 'Minimum Rating:');
                minDiv.appendChild(minLabel);
                
                const minInput = HtmlEscape.createElement('input', {
                    type: 'number',
                    className: 'form-control',
                    id: 'elementRateMin'
                });
                minInput.value = element.rateMin || 1;
                minDiv.appendChild(minInput);
                container.appendChild(minDiv);
                
                // Maximum Rating
                const maxDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const maxLabel = HtmlEscape.createElement('label', {
                    className: 'form-label',
                    htmlFor: 'elementRateMax'
                });
                HtmlEscape.setTextContent(maxLabel, 'Maximum Rating:');
                maxDiv.appendChild(maxLabel);
                
                const maxInput = HtmlEscape.createElement('input', {
                    type: 'number',
                    className: 'form-control',
                    id: 'elementRateMax'
                });
                maxInput.value = element.rateMax || 5;
                maxDiv.appendChild(maxInput);
                container.appendChild(maxDiv);
                
                // Min Description
                const minDescDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const minDescLabel = HtmlEscape.createElement('label', {
                    className: 'form-label',
                    htmlFor: 'elementMinRateDescription'
                });
                HtmlEscape.setTextContent(minDescLabel, 'Min Description:');
                minDescDiv.appendChild(minDescLabel);
                
                const minDescInput = HtmlEscape.createElement('input', {
                    type: 'text',
                    className: 'form-control',
                    id: 'elementMinRateDescription'
                });
                minDescInput.value = element.minRateDescription || '';
                minDescDiv.appendChild(minDescInput);
                container.appendChild(minDescDiv);
                
                // Max Description
                const maxDescDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const maxDescLabel = HtmlEscape.createElement('label', {
                    className: 'form-label',
                    htmlFor: 'elementMaxRateDescription'
                });
                HtmlEscape.setTextContent(maxDescLabel, 'Max Description:');
                maxDescDiv.appendChild(maxDescLabel);
                
                const maxDescInput = HtmlEscape.createElement('input', {
                    type: 'text',
                    className: 'form-control',
                    id: 'elementMaxRateDescription'
                });
                maxDescInput.value = element.maxRateDescription || '';
                maxDescDiv.appendChild(maxDescInput);
                container.appendChild(maxDescDiv);
                break;

            case 'html':
                // HTML Content field
                const htmlDiv = HtmlEscape.createElement('div', { className: 'mb-3' });
                const htmlLabel = HtmlEscape.createElement('label', {
                    className: 'form-label',
                    htmlFor: 'elementHtml'
                });
                HtmlEscape.setTextContent(htmlLabel, 'HTML Content:');
                htmlDiv.appendChild(htmlLabel);
                
                const htmlTextarea = HtmlEscape.createElement('textarea', {
                    className: 'form-control',
                    id: 'elementHtml',
                    rows: '5'
                });
                htmlTextarea.value = element.html || '';
                htmlDiv.appendChild(htmlTextarea);
                container.appendChild(htmlDiv);
                break;

            default:
                // Return empty container for unknown types
                break;
        }
        
        return container;
    }

    // Gather type-specific properties from the edit dialog
    gatherTypeSpecificProperties(element, type, dialog) {
        switch (type) {
            case 'text':
            case 'comment':
                element.placeholder = dialog.querySelector('#elementPlaceholder')?.value || '';
                element.isRequired = dialog.querySelector('#elementRequired')?.checked || false;
                break;

            case 'dropdown':
            case 'radiogroup':
            case 'checkbox':
                const choicesText = dialog.querySelector('#elementChoices')?.value || '';
                element.choices = choicesText.split('\n').filter(c => c.trim()).map(c => ({ text: c.trim(), value: c.trim() }));
                element.isRequired = dialog.querySelector('#elementRequired')?.checked || false;
                break;

            case 'rating':
                element.rateMin = parseInt(dialog.querySelector('#elementRateMin')?.value) || 1;
                element.rateMax = parseInt(dialog.querySelector('#elementRateMax')?.value) || 5;
                element.minRateDescription = dialog.querySelector('#elementMinRateDescription')?.value || '';
                element.maxRateDescription = dialog.querySelector('#elementMaxRateDescription')?.value || '';
                break;

            case 'html':
                element.html = dialog.querySelector('#elementHtml')?.value || '';
                break;
        }
    }

    // Add complex editor styles
    addComplexEditorStyles() {
        if (document.getElementById('complex-editor-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'complex-editor-styles';
        styles.textContent = `
            .element-properties-panel {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 0.375rem;
                padding: 1rem;
                margin-top: 1rem;
            }

            .property-section {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 0.25rem;
                padding: 0.75rem;
                margin-bottom: 0.75rem;
            }

            .property-section h6 {
                color: #495057;
                font-size: 0.875rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .nested-element-item {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 0.25rem;
                padding: 0.5rem;
                margin-bottom: 0.5rem;
                position: relative;
            }

            .nested-element-item:hover {
                background: #e9ecef;
            }

            .element-action-buttons {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                display: flex;
                gap: 0.25rem;
            }

            .element-action-buttons button {
                padding: 0.125rem 0.375rem;
                font-size: 0.75rem;
            }

            .matrix-editor table {
                width: 100%;
                border-collapse: collapse;
            }

            .matrix-editor th,
            .matrix-editor td {
                border: 1px solid #dee2e6;
                padding: 0.5rem;
            }

            .matrix-editor th {
                background: #f8f9fa;
                font-weight: 600;
            }

            .matrix-editor input {
                width: 100%;
                border: none;
                background: transparent;
                padding: 0.25rem;
            }

            .matrix-editor input:focus {
                outline: 2px solid #0d6efd;
                outline-offset: -2px;
            }

            .add-element-dropdown {
                position: relative;
                display: inline-block;
            }

            .add-element-dropdown-content {
                display: none;
                position: absolute;
                background-color: white;
                min-width: 200px;
                box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
                border: 1px solid #dee2e6;
                border-radius: 0.25rem;
                z-index: 1000;
            }

            .add-element-dropdown-content.show {
                display: block;
            }

            .add-element-dropdown-content a {
                color: #212529;
                padding: 0.5rem 1rem;
                text-decoration: none;
                display: block;
            }

            .add-element-dropdown-content a:hover {
                background-color: #f8f9fa;
            }

            .dynamic-panel-template {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 0.25rem;
                padding: 1rem;
                margin-bottom: 0.5rem;
            }

            .dynamic-panel-template h6 {
                color: #856404;
                margin-bottom: 0.5rem;
            }
        `;

        document.head.appendChild(styles);
    }

    // Initialize auto-pagination feature using Intersection Observer API
    initializeAutoPagination() {
        
        
        // Configuration for auto-pagination
        this.paginationConfig = {
            pageHeight: 11 * 96, // 11 inches at 96 DPI (standard letter size)
            marginTop: 96, // 1 inch top margin
            marginBottom: 96, // 1 inch bottom margin
            elementSpacing: 24, // Space between elements
            pageBreakThreshold: 0.8, // Break page when 80% full
            enableSmartBreaks: true // Avoid breaking within sections
        };
        
        // Initialize pagination state
        this.paginationState = {
            currentPageHeight: 0,
            elementsPerPage: {},
            pageBreakPoints: [],
            isProcessing: false
        };
        
        // Setup Intersection Observer for viewport-based pagination
        this.setupViewportPagination();
        
        // Setup resize observer for dynamic content changes
        this.setupResizeObserver();
        
        // Setup mutation observer for DOM changes
        this.setupMutationObserver();
    }
    
    // Setup viewport-based pagination using Intersection Observer
    setupViewportPagination() {
        // Create intersection observer options
        const observerOptions = {
            root: document.querySelector('.builder-canvas'),
            rootMargin: '0px',
            threshold: [0, 0.25, 0.5, 0.75, 1.0]
        };
        
        // Create intersection observer
        this.viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && entry.intersectionRatio === 0) {
                    // Element is completely out of viewport
                    this.checkForPageBreak(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe form elements
        this.observeFormElements();
    }
    
    // Setup resize observer for dynamic content
    setupResizeObserver() {
        if (!window.ResizeObserver) {
            console.warn('ResizeObserver not supported, auto-pagination may be limited');
            return;
        }
        
        this.resizeObserver = new ResizeObserver(entries => {
            if (this.paginationState.isProcessing) return;
            
            // Debounce resize handling
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.recalculatePagination();
            }, 300);
        });
        
        // Observe the drop zone
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            this.resizeObserver.observe(dropZone);
        }
    }
    
    // Setup mutation observer for DOM changes
    setupMutationObserver() {
        const targetNode = document.getElementById('dropZone');
        if (!targetNode) return;
        
        const config = {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        };
        
        this.mutationObserver = new MutationObserver((mutationsList) => {
            // Check if elements were added or removed
            const hasStructuralChanges = mutationsList.some(mutation =>
                mutation.type === 'childList' &&
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
            );
            
            if (hasStructuralChanges && !this.paginationState.isProcessing) {
                // Debounce pagination recalculation
                clearTimeout(this.mutationTimeout);
                this.mutationTimeout = setTimeout(() => {
                    this.recalculatePagination();
                }, 500);
            }
        });
        
        this.mutationObserver.observe(targetNode, config);
    }
    
    // Observe form elements for pagination
    observeFormElements() {
        const formElements = document.querySelectorAll('.form-element');
        formElements.forEach(element => {
            if (this.viewportObserver) {
                this.viewportObserver.observe(element);
            }
        });
    }
    
    // Check if page break is needed
    checkForPageBreak(element) {
        const rect = element.getBoundingClientRect();
        const dropZone = document.getElementById('dropZone');
        const dropZoneRect = dropZone.getBoundingClientRect();
        
        // Calculate element's position relative to page
        const elementTop = rect.top - dropZoneRect.top;
        const elementBottom = rect.bottom - dropZoneRect.top;
        const pageHeight = this.paginationConfig.pageHeight -
                          this.paginationConfig.marginTop -
                          this.paginationConfig.marginBottom;
        
        // Determine current page number
        const currentPage = Math.floor(elementTop / pageHeight) + 1;
        const elementPageEnd = Math.floor(elementBottom / pageHeight) + 1;
        
        // Check if element spans multiple pages
        if (elementPageEnd > currentPage) {
            this.handlePageBreak(element, currentPage);
        }
    }
    
    // Handle page break logic
    handlePageBreak(element, currentPage) {
        const elementIndex = parseInt(element.dataset.index);
        const currentPageData = this.formData.pages[this.currentPageIndex];
        
        // Smart break detection for panels and sections
        if (this.paginationConfig.enableSmartBreaks) {
            const elementData = currentPageData.elements[elementIndex];
            
            // Don't break panels or sections with sub-elements
            if (elementData.type === 'panel' && elementData.elements && elementData.elements.length > 0) {
                // Move entire panel to next page if it doesn't fit
                this.moveElementToNewPage(elementIndex);
                return;
            }
        }
        
        // For regular elements, check if we need a new page
        if (this.shouldCreateNewPage(element)) {
            this.createAutoPaginationPage(elementIndex);
        }
    }
    
    // Check if new page should be created
    shouldCreateNewPage(element) {
        const rect = element.getBoundingClientRect();
        const dropZone = document.getElementById('dropZone');
        const dropZoneRect = dropZone.getBoundingClientRect();
        
        const elementBottom = rect.bottom - dropZoneRect.top;
        const pageHeight = this.paginationConfig.pageHeight -
                          this.paginationConfig.marginTop -
                          this.paginationConfig.marginBottom;
        
        const currentPageUsage = (elementBottom % pageHeight) / pageHeight;
        
        return currentPageUsage > this.paginationConfig.pageBreakThreshold;
    }
    
    // Create new page for auto-pagination
    createAutoPaginationPage(fromElementIndex) {
        this.paginationState.isProcessing = true;
        
        try {
            // Save current state
            this.saveToHistory();
            
            const currentPageData = this.formData.pages[this.currentPageIndex];
            const elementsToMove = currentPageData.elements.slice(fromElementIndex);
            
            // Create new page
            const newPageIndex = this.currentPageIndex + 1;
            const newPage = {
                name: `page${newPageIndex + 1}_auto`,
                title: `Page ${newPageIndex + 1} (Auto)`,
                elements: elementsToMove,
                isAutoPaginated: true
            };
            
            // Insert new page after current page
            this.formData.pages.splice(newPageIndex, 0, newPage);
            
            // Remove moved elements from current page
            currentPageData.elements = currentPageData.elements.slice(0, fromElementIndex);
            
            // Update UI
            this.renderPageTabs();
            this.renderFormElements();
            
            // Show notification
            this.showNotification(`Auto-pagination: Created new page with ${elementsToMove.length} elements`);
            
            // Mark as changed
            this.hasUnsavedChanges = true;
            this.debouncedSave();
            
        } finally {
            this.paginationState.isProcessing = false;
        }
    }
    
    // Move element to new page
    moveElementToNewPage(elementIndex) {
        const currentPageData = this.formData.pages[this.currentPageIndex];
        const element = currentPageData.elements[elementIndex];
        
        // Check if next page exists and is auto-paginated
        const nextPageIndex = this.currentPageIndex + 1;
        if (nextPageIndex < this.formData.pages.length &&
            this.formData.pages[nextPageIndex].isAutoPaginated) {
            // Move to existing auto-paginated page
            this.formData.pages[nextPageIndex].elements.unshift(element);
            currentPageData.elements.splice(elementIndex, 1);
        } else {
            // Create new auto-paginated page
            this.createAutoPaginationPage(elementIndex);
        }
    }
    
    // Recalculate pagination for all elements
    recalculatePagination() {
        
        
        // Re-observe all elements
        this.observeFormElements();
        
        // Check each element for pagination needs
        const formElements = document.querySelectorAll('.form-element');
        formElements.forEach(element => {
            this.checkForPageBreak(element);
        });
    }
    
    // Calculate content height for print preview
    calculatePrintHeight() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return 0;
        
        let totalHeight = 0;
        const elements = dropZone.querySelectorAll('.form-element');
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            const marginTop = parseFloat(styles.marginTop);
            const marginBottom = parseFloat(styles.marginBottom);
            
            totalHeight += rect.height + marginTop + marginBottom;
        });
        
        return totalHeight;
    }
    
    // Get pagination metrics for analytics
    getPaginationMetrics() {
        return {
            totalPages: this.formData.pages.length,
            autoPaginatedPages: this.formData.pages.filter(p => p.isAutoPaginated).length,
            elementsPerPage: this.formData.pages.map(p => ({
                pageTitle: p.title,
                elementCount: p.elements ? p.elements.length : 0,
                isAutoPaginated: p.isAutoPaginated || false
            })),
            estimatedPrintPages: Math.ceil(this.calculatePrintHeight() / this.paginationConfig.pageHeight)
        };
    }
    
    // Clean up observers
    cleanupPaginationObservers() {
        if (this.viewportObserver) {
            this.viewportObserver.disconnect();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        // Task E: Clean up property grid observer to prevent memory leaks
        if (this.propertyGridObserver) {
            this.propertyGridObserver.disconnect();
        }
        
        clearTimeout(this.resizeTimeout);
        clearTimeout(this.mutationTimeout);
    }

    // Register custom question types with Survey.js
    registerCustomQuestionTypes() {
        
        
        // Only register if Survey is available
        if (typeof Survey === 'undefined') {
            console.warn('FormBuilder: Survey.js not loaded, skipping custom question registration');
            return;
        }
        
        // Task C: Register calculateAge() function via Survey.FunctionFactory
        try {
            Survey.FunctionFactory.Instance.register("calculateAge", function(dateOfBirth) {
                // Handle different date input formats
                if (!dateOfBirth) {
                    return "";
                }
                
                let birthDate;
                
                // Convert string dates to Date object
                if (typeof dateOfBirth === "string") {
                    // Handle various date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
                    birthDate = new Date(dateOfBirth);
                    
                    // If invalid date, try alternative parsing
                    if (isNaN(birthDate.getTime())) {
                        // Try MM/DD/YYYY format
                        const parts = dateOfBirth.split(/[-\/]/);
                        if (parts.length === 3) {
                            // Assume YYYY-MM-DD or MM/DD/YYYY based on first part length
                            if (parts[0].length === 4) {
                                // YYYY-MM-DD format
                                birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                            } else {
                                // MM/DD/YYYY format
                                birthDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                            }
                        }
                    }
                } else if (dateOfBirth instanceof Date) {
                    birthDate = dateOfBirth;
                } else {
                    return "Invalid date format";
                }
                
                // Validate date
                if (isNaN(birthDate.getTime())) {
                    return "Invalid date";
                }
                
                // Calculate age
                const today = new Date();
                const birthYear = birthDate.getFullYear();
                const birthMonth = birthDate.getMonth();
                const birthDay = birthDate.getDate();
                
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth();
                const currentDay = today.getDate();
                
                let age = currentYear - birthYear;
                
                // Adjust age if birthday hasn't occurred this year
                if (currentMonth < birthMonth ||
                    (currentMonth === birthMonth && currentDay < birthDay)) {
                    age--;
                }
                
                // Handle edge cases
                if (age < 0) {
                    return "Future date";
                }
                
                if (age > 150) {
                    return "Please verify date";
                }
                
                // Return age with appropriate formatting
                if (age === 0) {
                    // For infants, calculate months
                    let months = currentMonth - birthMonth;
                    if (currentDay < birthDay) {
                        months--;
                    }
                    if (months < 0) {
                        months += 12;
                    }
                    
                    if (months === 0) {
                        // Calculate days for newborns
                        const timeDiff = today.getTime() - birthDate.getTime();
                        const days = Math.floor(timeDiff / (1000 * 3600 * 24));
                        return days <= 1 ? `${days} day` : `${days} days`;
                    } else {
                        return months === 1 ? `${months} month` : `${months} months`;
                    }
                } else if (age === 1) {
                    return `${age} year`;
                } else {
                    return `${age} years`;
                }
            });
            
            
        } catch (error) {
            console.error('FormBuilder: Error registering calculateAge() function:', error);
        }
        
        // Register AI Summary custom question type
        const AISummaryQuestion = function(name) {
            Survey.Question.call(this, name);
        };
        
        Survey.Serializer.addClass(
            "ai-summary",
            [{
                name: "selectedFields:string[]",
                default: []
            }, {
                name: "summaryType",
                default: "comprehensive",
                choices: ["comprehensive", "brief"]
            }, {
                name: "displayMode",
                default: "seamless",
                choices: ["seamless", "highlighted", "expandable"]
            }, {
                name: "allowRuntimeSelection:boolean",
                default: true
            }, {
                name: "placeholder",
                default: "AI summary will appear here after you complete the selected fields..."
            }, {
                name: "loadingText",
                default: "Generating summary..."
            }, {
                name: "errorText",
                default: "Unable to generate summary. Please try again."
            }, {
                name: "minHeight:number",
                default: 200
            }],
            function() {
                return new AISummaryQuestion("");
            },
            "question"
        );
        
        AISummaryQuestion.prototype = Object.create(Survey.Question.prototype);
        AISummaryQuestion.prototype.constructor = AISummaryQuestion;
        AISummaryQuestion.prototype.getType = function() {
            return "ai-summary";
        };
        
        // Add the question type to the toolbox if needed
        Survey.QuestionFactory.Instance.registerQuestion("ai-summary", (name) => {
            return new AISummaryQuestion(name);
        });
        
        
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
module.exports = IPLCFormBuilder;
}