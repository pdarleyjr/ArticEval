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
        console.log('IPLCFormBuilder constructor called with:', containerId);
        this.container = document.getElementById(containerId);
        console.log('Container element found:', this.container);
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
        console.log('FormBuilder: init() called');
        this.checkForEditMode();
        this.render();
        this.attachEventListeners();
        this.setupAutoSave();
        this.registerCustomQuestionTypes();
        this.addComplexEditorStyles();
        this.restorePanelState();
    }
    
    // Restore properties panel state from localStorage
    restorePanelState() {
        const isCollapsed = localStorage.getItem('propertiesPanel_collapsed') === 'true';
        const propertiesPanel = document.getElementById('builderProperties');
        const toggleIcon = document.getElementById('toggleIcon');
        
        if (isCollapsed && propertiesPanel) {
            propertiesPanel.classList.add('collapsed');
            if (toggleIcon) {
                toggleIcon.textContent = '▶';
            }
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="form-builder-container">
                <div class="builder-header">
                    <h2>${this.options.mode === 'edit' ? 'Edit Form' : 'Create New Form'}</h2>
                    <div class="builder-actions">
                        <button class="btn btn-secondary btn-sm" onclick="formBuilder.undo()" title="Undo (Ctrl+Z)">
                            <span class="icon">↶</span>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="formBuilder.redo()" title="Redo (Ctrl+Y)">
                            <span class="icon">↷</span>
                        </button>
                        <span style="width: 1px; height: 24px; background: #ddd; margin: 0 0.5rem;"></span>
                        <button class="btn btn-secondary" onclick="formBuilder.tour.startTour()" title="Start Tour (?)">
                            <span class="icon">🎓</span> Tour
                        </button>
                        <button class="btn btn-secondary" onclick="formBuilder.tour.showHelp()" title="Help (F1)">
                            <span class="icon">❓</span> Help
                        </button>
                        <span style="width: 1px; height: 24px; background: #ddd; margin: 0 0.5rem;"></span>
                        <button class="btn btn-secondary" onclick="formBuilder.preview()">
                            <span class="icon">👁️</span> Preview
                        </button>
                        <button class="btn btn-warning" onclick="formBuilder.toggleFormLock()" title="Lock/Unlock Form">
                            <span class="icon" id="lockIcon">🔓</span> <span id="lockText">Lock Form</span>
                        </button>
                        <button class="btn btn-primary" onclick="formBuilder.save()">
                            <span class="icon">💾</span> Save Form
                        </button>
                    </div>
                </div>

                <div class="builder-main">
                    <!-- Left Panel: Toolbox -->
                    <div class="builder-toolbox">
                        <div class="creator-field">
                            <label for="creatorName">Created by</label>
                            <input type="text" id="creatorName" placeholder="Your name" />
                        </div>
                        
                        <!-- Field Templates -->
                        <div class="field-templates-section">
                            <h3>Quick Templates</h3>
                            <select id="fieldTemplateSelect" class="template-select" onchange="formBuilder.insertFieldTemplate(this.value)">
                                <option value="">Select a template...</option>
                                ${Object.entries(this.fieldTemplates).map(([key, template]) =>
                                    `<option value="${key}">${template.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <h3>Form Elements</h3>
                        <div class="element-categories">
                            ${this.renderToolboxCategories()}
                        </div>
                    </div>

                    <!-- Center Panel: Form Design Area -->
                    <div class="builder-canvas">
                        <div class="form-metadata">
                            <input type="text" id="formTitle" placeholder="Form Title" 
                                   value="${this.formData.title}" class="form-title-input">
                            <textarea id="formDescription" placeholder="Form Description" 
                                      class="form-description-input">${this.formData.description || ''}</textarea>
                        </div>

                        <div class="page-navigation">
                            <div class="page-tabs" id="pageTabs"></div>
                            <button class="btn btn-sm btn-secondary" onclick="formBuilder.addPage()">
                                <span class="icon">➕</span> Add Page
                            </button>
                        </div>

                        <div class="form-page" id="formPage">
                            <div class="page-title-container">
                                <input type="text" id="pageTitle" placeholder="Page Title" 
                                       class="page-title-input">
                            </div>
                            <div class="drop-zone" id="dropZone">
                                <div class="empty-state">
                                    Drag elements here to build your form
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Properties -->
                    <div class="builder-properties" id="builderProperties">
                        <button class="properties-toggle" onclick="formBuilder.togglePropertiesPanel()" title="Toggle Properties Panel">
                            <span id="toggleIcon">◀</span>
                        </button>
                        <h3>Element Properties</h3>
                        <div id="propertiesPanel" class="properties-content">
                            <div class="empty-properties">
                                Select an element to edit its properties
                            </div>
                        </div>
                        
                        <!-- Form Settings Section -->
                        <div class="form-settings-section" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e1e4e8;">
                            <h3>Form Settings</h3>
                            <div class="property-group">
                                <label class="property-label">
                                    <input type="checkbox" id="showLogoCheckbox"
                                           ${this.formData.showLogo !== false ? 'checked' : ''}
                                           onchange="formBuilder.updateFormSetting('showLogo', this.checked)">
                                    Show IPLC Logo
                                </label>
                                <small style="display: block; color: #666; margin-top: 0.25rem;">
                                    Displays the IPLC logo at the top of the form
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderPageTabs();
        this.renderFormElements();
        this.addStyles();
    }

    renderToolboxCategories() {
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
                name: 'Patient Info',
                elements: [
                    { type: 'patient-info', icon: '👤', label: 'Patient Demographics', custom: true, category: 'patient-info' },
                    { type: 'referral-info', icon: '📋', label: 'Referral Information', custom: true, category: 'patient-info' },
                    { type: 'insurance-info', icon: '🏥', label: 'Insurance Information', custom: true, category: 'patient-info' },
                    { type: 'parent-caregiver', icon: '👥', label: 'Parent/Caregiver Info', custom: true, category: 'patient-info' },
                    { type: 'medical-history', icon: '📑', label: 'Medical History', custom: true, category: 'patient-info' }
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

        return categories.map(category => `
            <div class="category">
                <h4>${category.name}</h4>
                ${category.elements.map(el => `
                    <div class="draggable-element" data-type="${el.type}"
                         ${el.custom ? 'data-custom="true"' : ''}
                         ${el.category ? `data-category="${el.category}"` : ''}
                         draggable="true">
                        <span class="icon">${el.icon}</span> ${el.label}
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    // Toggle properties panel visibility
    togglePropertiesPanel() {
        const propertiesPanel = document.getElementById('builderProperties');
        const toggleIcon = document.getElementById('toggleIcon');
        const isCollapsed = propertiesPanel.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand panel
            propertiesPanel.classList.remove('collapsed');
            toggleIcon.textContent = '◀';
            localStorage.setItem('propertiesPanel_collapsed', 'false');
            
            // Show notification
            this.showNotification('Properties panel expanded');
        } else {
            // Collapse panel
            propertiesPanel.classList.add('collapsed');
            toggleIcon.textContent = '▶';
            localStorage.setItem('propertiesPanel_collapsed', 'true');
            
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
            .form-builder-container {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #f5f7fa;
            }

            .builder-header {
                background: white;
                padding: 1rem 2rem;
                border-bottom: 1px solid #e1e4e8;
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

            .builder-toolbox {
                width: 280px;
                background: white;
                border-right: 1px solid #e1e4e8;
                padding: 1rem;
                overflow-y: auto;
            }

            .category {
                margin-bottom: 1.5rem;
            }

            .category h4 {
                margin: 0 0 0.5rem 0;
                color: #586069;
                font-size: 0.9rem;
                text-transform: uppercase;
            }

            .draggable-element {
                background: #f6f8fa;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                padding: 0.75rem;
                margin-bottom: 0.5rem;
                cursor: move;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                user-select: none;
            }

            .draggable-element:hover {
                background: #e9ecef;
                border-color: #3498db;
                transform: translateX(2px);
            }
            
            .draggable-element.dragging {
                opacity: 0.5;
                cursor: grabbing;
            }

            .builder-canvas {
                flex: 1;
                padding: 2rem;
                overflow-y: auto;
                background: #f5f7fa;
                min-width: 0;
            }

            .form-metadata {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .form-title-input, .page-title-input {
                width: 100%;
                font-size: 1.5rem;
                font-weight: 600;
                border: none;
                border-bottom: 2px solid #e1e4e8;
                padding: 0.5rem 0;
                margin-bottom: 1rem;
            }

            .form-description-input {
                width: 100%;
                min-height: 60px;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                padding: 0.75rem;
                resize: vertical;
            }

            .page-navigation {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .page-tabs {
                display: flex;
                gap: 0.5rem;
                flex: 1;
            }

            .page-tab {
                background: white;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                padding: 0.5rem 1rem;
                cursor: pointer;
            }

            .page-tab.active {
                background: #3498db;
                color: white;
            }

            .form-page {
                background: white;
                border-radius: 8px;
                padding: 2rem;
                min-height: 400px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .drop-zone {
                min-height: 300px;
                border: 2px dashed #e1e4e8;
                border-radius: 4px;
                padding: 1rem;
            }

            .drop-zone.drag-over {
                border-color: #3498db;
                background: #f0f8ff;
            }

            .empty-state {
                text-align: center;
                color: #959da5;
                padding: 3rem;
            }

            .form-element {
                background: white;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
                padding: 1rem;
                margin-bottom: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }

            .form-element:hover {
                border-color: #3498db;
                background-color: #f8f9fa;
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .form-element.selected {
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
            }

            /* Visual indicator for editable elements */
            .form-element::after {
                content: 'Double-click to edit';
                position: absolute;
                top: -8px;
                right: 10px;
                background: #3498db;
                color: white;
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 10px;
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
            }

            .form-element:hover::after {
                opacity: 1;
            }

            .form-element.selected::after {
                opacity: 0;
            }

            .element-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .element-actions button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.25rem;
                margin-left: 0.25rem;
                opacity: 0.7;
                transition: all 0.2s ease;
            }

            .element-actions button:hover {
                opacity: 1;
                transform: scale(1.1);
            }

            .element-actions button:first-child {
                color: #3498db;
                font-weight: bold;
            }

            .builder-properties {
                width: 300px;
                background: white;
                border-left: 1px solid #e1e4e8;
                padding: 1rem;
                overflow-y: auto;
                transition: width 0.3s ease, margin-right 0.3s ease;
                position: relative;
            }
            
            .builder-properties.collapsed {
                width: 40px;
                padding: 0;
                overflow: hidden;
            }
            
            .builder-properties.collapsed .properties-content,
            .builder-properties.collapsed h3,
            .builder-properties.collapsed .form-settings-section {
                display: none;
            }
            
            .properties-toggle {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                background: #3498db;
                color: white;
                border: none;
                border-radius: 0 4px 4px 0;
                padding: 1rem 0.25rem;
                cursor: pointer;
                font-size: 1.2rem;
                z-index: 10;
                transition: all 0.2s ease;
            }
            
            .properties-toggle:hover {
                background: #2980b9;
                padding-left: 0.5rem;
            }
            
            .builder-properties.collapsed .properties-toggle {
                left: 40px;
                border-radius: 4px 0 0 4px;
            }
            
            /* Responsive adjustments */
            @media (max-width: 1200px) {
                .builder-properties {
                    width: 250px;
                }
            }
            
            @media (max-width: 992px) {
                .builder-toolbox {
                    width: 200px;
                }
                .builder-properties {
                    width: 200px;
                }
            }
            
            @media (max-width: 768px) {
                .builder-main {
                    flex-direction: column;
                }
                .builder-toolbox,
                .builder-properties {
                    width: 100%;
                    max-height: 200px;
                }
                .builder-canvas {
                    min-height: 400px;
                }
            }

            .property-group {
                margin-bottom: 1.5rem;
            }

            .property-label {
                display: block;
                margin-bottom: 0.25rem;
                font-weight: 500;
            }

            .property-input {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
            }

            .preview-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                padding: 2rem;
                overflow: auto;
            }

            .preview-content {
                background: white;
                max-width: 800px;
                margin: 0 auto;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            }

            .preview-header {
                padding: 1rem 2rem;
                border-bottom: 1px solid #e1e4e8;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .preview-body {
                padding: 2rem;
                max-height: calc(100vh - 200px);
                overflow-y: auto;
            }
            
            .conditional-logic-btn {
                background: #f6f8fa;
                border: 1px solid #e1e4e8;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
                text-align: center;
            }
            
            .conditional-logic-btn:hover {
                background: #e9ecef;
                border-color: #3498db;
            }
            
            .current-condition-preview {
                margin-top: 0.5rem;
                font-size: 0.85rem;
                color: #586069;
            }
            
            .current-condition-preview code {
                background: #f6f8fa;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-family: monospace;
            }
            
            .ai-summary-field-selector {
                margin-top: 1rem;
                padding: 1rem;
                background: #f6f8fa;
                border: 1px solid #e1e4e8;
                border-radius: 4px;
            }
            
            .ai-summary-field-selector h5 {
                margin: 0 0 0.5rem 0;
                font-size: 0.9rem;
            }
            
            .field-checkbox {
                display: block;
                margin-bottom: 0.5rem;
                cursor: pointer;
            }
            
            .field-checkbox input {
                margin-right: 0.5rem;
            }
            
            /* Auto-save indicator styles */
            .auto-save-indicator {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #333;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                display: none;
                align-items: center;
                gap: 8px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            
            .auto-save-indicator.saving {
                background: #f39c12;
            }
            
            .auto-save-indicator.saved {
                background: #27ae60;
            }
            
            .auto-save-indicator.fade-out {
                animation: fadeOut 0.5s ease-out forwards;
            }
            
            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translateY(10px);
                }
            }
            
            .save-icon {
                width: 16px;
                height: 16px;
            }
            
            .save-icon.saving {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    renderPageTabs() {
        const tabsContainer = document.getElementById('pageTabs');
        tabsContainer.innerHTML = this.formData.pages.map((page, index) => `
            <div class="page-tab ${index === this.currentPageIndex ? 'active' : ''}" 
                 onclick="formBuilder.switchPage(${index})">
                ${page.title || `Page ${index + 1}`}
            </div>
        `).join('');
    }

    renderFormElements() {
        const dropZone = document.getElementById('dropZone');
        const currentPage = this.formData.pages[this.currentPageIndex];
        
        if (!currentPage.elements || currentPage.elements.length === 0) {
            dropZone.innerHTML = '<div class="empty-state">Drag elements here to build your form</div>';
            return;
        }

        dropZone.innerHTML = currentPage.elements.map((element, index) => 
            this.renderFormElement(element, index)
        ).join('');
    }

    renderFormElement(element, index) {
        return `
            <div class="form-element ${this.selectedElement === index ? 'selected' : ''}"
                 data-index="${index}"
                 onclick="formBuilder.selectElement(${index})"
                 ondblclick="formBuilder.editElement(${index}); event.stopPropagation();"
                 title="Double-click to edit">
                <div class="element-header">
                    <span class="element-type">${element.title || element.name || 'Untitled'}</span>
                    <div class="element-actions">
                        <button onclick="formBuilder.editElement(${index}); event.stopPropagation();" title="Edit">✏️</button>
                        <button onclick="formBuilder.moveElement(${index}, -1); event.stopPropagation();" title="Move Up">↑</button>
                        <button onclick="formBuilder.moveElement(${index}, 1); event.stopPropagation();" title="Move Down">↓</button>
                        <button onclick="formBuilder.duplicateElement(${index}); event.stopPropagation();" title="Duplicate">📋</button>
                        <button onclick="formBuilder.deleteElement(${index}); event.stopPropagation();" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        console.log('attachEventListeners() called');
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

        console.log('About to call setupDragAndDrop()');
        this.setupDragAndDrop();
        console.log('setupDragAndDrop() completed');
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
    }
    // Setup touch gestures for mobile devices
    setupTouchGestures() {
        const propertiesPanel = document.getElementById('builderProperties');
        if (!propertiesPanel) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        // Touch start
        propertiesPanel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });
        
        // Touch move
        propertiesPanel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            // If swiped right more than 50px, collapse panel
            if (deltaX > 50 && !propertiesPanel.classList.contains('collapsed')) {
                this.togglePropertiesPanel();
                isDragging = false;
            }
        }, { passive: true });
        
        // Touch end
        propertiesPanel.addEventListener('touchend', () => {
            isDragging = false;
        }, { passive: true });
    }
    
    setupDragAndDrop() {
        console.log('FormBuilder: setupDragAndDrop() called');
        const draggables = document.querySelectorAll('.draggable-element');
        const dropZone = document.getElementById('dropZone');
        
        console.log('FormBuilder: Found', draggables.length, 'draggable elements');
        console.log('FormBuilder: Drop zone found:', !!dropZone);

        // Clear any existing drag event listeners to prevent duplicates
        draggables.forEach((draggable, index) => {
            console.log(`FormBuilder: Setting up draggable element ${index}:`, draggable.dataset.type);
            
            // Clone and replace to remove all existing event listeners
            const newDraggable = draggable.cloneNode(true);
            draggable.parentNode.replaceChild(newDraggable, draggable);
            
            newDraggable.addEventListener('dragstart', (e) => {
                console.log('FormBuilder: Drag started for:', newDraggable.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('elementType', newDraggable.dataset.type);
                e.dataTransfer.setData('isCustom', newDraggable.dataset.custom || 'false');
                e.dataTransfer.setData('category', newDraggable.dataset.category || '');
                newDraggable.classList.add('dragging');
            });

            newDraggable.addEventListener('dragend', (e) => {
                console.log('FormBuilder: Drag ended');
                newDraggable.classList.remove('dragging');
            });
        });

        if (dropZone) {
            console.log('FormBuilder: Setting up drop zone event listeners');
            
            // Clone and replace drop zone to remove existing listeners
            const newDropZone = dropZone.cloneNode(true);
            dropZone.parentNode.replaceChild(newDropZone, dropZone);
            
            newDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                newDropZone.classList.add('drag-over');
            });

            newDropZone.addEventListener('dragleave', (e) => {
                // Only remove the class if we're leaving the drop zone entirely
                if (e.target === newDropZone) {
                    newDropZone.classList.remove('drag-over');
                }
            });

            newDropZone.addEventListener('drop', (e) => {
                console.log('FormBuilder: Drop event triggered');
                e.preventDefault();
                e.stopPropagation();
                newDropZone.classList.remove('drag-over');
                
                const elementType = e.dataTransfer.getData('elementType');
                const isCustom = e.dataTransfer.getData('isCustom') === 'true';
                const category = e.dataTransfer.getData('category');
                
                console.log('FormBuilder: Dropped element type:', elementType, 'isCustom:', isCustom, 'category:', category);
                
                if (elementType) {
                    this.addElement(elementType, isCustom, category);
                }
            });
        } else {
            console.error('FormBuilder: Drop zone element not found!');
        }
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
            case 'patient-info':
                switch (type) {
                    case 'text':
                        // Auto-seed text fields based on common patient info patterns
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
            'patient-info': {
                type: 'panel',
                name: 'patient_demographics',
                title: 'Patient Information',
                elements: [
                    { type: 'text', name: 'patient_name', title: 'Patient Name', isRequired: true, placeholder: 'Enter full name' },
                    { type: 'text', name: 'date_of_birth', title: 'Date of Birth', inputType: 'date', isRequired: true },
                    { type: 'expression', name: 'age', title: 'Age', expression: 'calculateAge({date_of_birth})' },
                    { type: 'dropdown', name: 'gender', title: 'Gender', choices: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], isRequired: true },
                    { type: 'text', name: 'diagnosis', title: 'Primary Diagnosis', placeholder: 'ICD-10 code or description' },
                    { type: 'text', name: 'mrn', title: 'Medical Record Number', placeholder: 'MRN#' }
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
                    { type: 'dropdown', name: 'relationship_to_patient', title: 'Relationship to Patient', choices: ['Self', 'Parent', 'Spouse', 'Child', 'Other'] },
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
                        html: '<div style="text-align: center; margin: 20px 0;"><button type="button" class="btn btn-primary" onclick="generateAIGoals()">🎯 Generate Goals</button></div>'
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
                        html: '<div style="text-align: center; margin: 20px 0;"><button type="button" class="btn btn-primary" onclick="generateAIRecommendations()">💡 Generate Recommendations</button></div>'
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

        let propertiesHTML = `
            <div class="property-group">
                <label class="property-label">Name (ID)</label>
                <input type="text" class="property-input" value="${element.name || ''}"
                       onchange="formBuilder.updateElementProperty('name', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Title</label>
                <input type="text" class="property-input" value="${element.title || ''}"
                       onchange="formBuilder.updateElementProperty('title', this.value)">
            </div>
            <div class="property-group">
                <label class="property-label">Description</label>
                <textarea class="property-input" rows="2"
                       onchange="formBuilder.updateElementProperty('description', this.value)">${element.description || ''}</textarea>
            </div>
            <div class="property-group">
                <label class="property-label">
                    <input type="checkbox" class="property-checkbox"
                           ${element.isRequired ? 'checked' : ''}
                           onchange="formBuilder.updateElementProperty('isRequired', this.checked)">
                    Required
                </label>
            </div>
        `;

        // Add type-specific properties
        if (element.type === 'dropdown' || element.type === 'radiogroup' || element.type === 'checkbox') {
            propertiesHTML += this.getChoicesEditorHTML(element);
        }

        // Add panel-specific properties
        if (element.type === 'panel') {
            propertiesHTML += this.getPanelPropertiesHTML(element);
        }

        // Add matrix-specific properties
        if (element.type === 'matrix') {
            propertiesHTML += this.getMatrixPropertiesHTML(element);
        }

        // Add dynamic matrix properties
        if (element.type === 'matrixdynamic') {
            propertiesHTML += this.getMatrixDynamicPropertiesHTML(element);
        }

        // Add dynamic panel properties
        if (element.type === 'paneldynamic') {
            propertiesHTML += this.getPanelDynamicPropertiesHTML(element);
        }

        // Add text-specific properties
        if (element.type === 'text') {
            propertiesHTML += this.getTextPropertiesHTML(element);
        }

        // Add comment-specific properties
        if (element.type === 'comment') {
            propertiesHTML += this.getCommentPropertiesHTML(element);
        }

        // Add rating-specific properties
        if (element.type === 'rating') {
            propertiesHTML += this.getRatingPropertiesHTML(element);
        }

        // Add boolean-specific properties
        if (element.type === 'boolean') {
            propertiesHTML += this.getBooleanPropertiesHTML(element);
        }

        // Add signature-specific properties
        if (element.type === 'signaturepad') {
            propertiesHTML += this.getSignaturePropertiesHTML(element);
        }

        // Add HTML element properties
        if (element.type === 'html') {
            propertiesHTML += this.getHtmlPropertiesHTML(element);
        }

        // Add validation rules section
        propertiesHTML += `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Validation Rules</h4>
                ${this.getValidationRulesHTML(element)}
            </div>
        `;

        // Add AI Summary specific properties
        if (element.type === 'ai-summary' || element.customType === 'ai-summary') {
            propertiesHTML += this.getAISummaryPropertiesHTML(element);
        }

        // Add conditional logic section
        propertiesHTML += `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Conditional Logic</h4>
                <button class="btn btn-sm btn-secondary conditional-logic-btn" onclick="formBuilder.showConditionalLogicEditor()">
                    <span class="icon">⚙️</span> Configure Conditions
                </button>
                ${element.visibleIf ? `<div class="current-condition-preview">Current: <code>${element.visibleIf}</code></div>` : ''}
            </div>
        `;
        propertiesPanel.innerHTML = propertiesHTML;
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
                            <button onclick="formBuilder.removeChoice(${i})" class="remove-btn">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm add-choice" onclick="formBuilder.addChoice()">
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
                                    <button onclick="formBuilder.editPanelElement(${i})" class="edit-btn" title="Edit">✏️</button>
                                    <button onclick="formBuilder.movePanelElement(${i}, -1)" class="move-btn" title="Move Up">↑</button>
                                    <button onclick="formBuilder.movePanelElement(${i}, 1)" class="move-btn" title="Move Down">↓</button>
                                    <button onclick="formBuilder.removePanelElement(${i})" class="remove-btn" title="Remove">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm add-panel-element" onclick="formBuilder.addPanelElement()">
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
                            <button onclick="formBuilder.removeMatrixColumn(${i})" class="remove-btn">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm" onclick="formBuilder.addMatrixColumn()">
                        <span class="icon">➕</span> Add Column
                    </button>
                </div>
                
                <div class="matrix-rows-editor" style="margin-top: 1rem;">
                    <label class="property-label">Rows</label>
                    ${(element.rows || []).map((row, i) => `
                        <div class="matrix-item">
                            <input type="text" class="property-input" value="${this.escapeHtml(row)}"
                                   onchange="formBuilder.updateMatrixRow(${i}, this.value)">
                            <button onclick="formBuilder.removeMatrixRow(${i})" class="remove-btn">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm" onclick="formBuilder.addMatrixRow()">
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
                            <button onclick="formBuilder.removeMatrixDynamicColumn(${i})" class="remove-btn">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm" onclick="formBuilder.addMatrixDynamicColumn()">
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
                                    <button onclick="formBuilder.editPanelDynamicElement(${i})" class="edit-btn" title="Edit">✏️</button>
                                    <button onclick="formBuilder.movePanelDynamicElement(${i}, -1)" class="move-btn" title="Move Up">↑</button>
                                    <button onclick="formBuilder.movePanelDynamicElement(${i}, 1)" class="move-btn" title="Move Down">↓</button>
                                    <button onclick="formBuilder.removePanelDynamicElement(${i})" class="remove-btn" title="Remove">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <button class="btn btn-sm" onclick="formBuilder.addPanelDynamicElement()">
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

    updateElementProperty(property, value) {
        if (this.selectedElement === null) return;
        
        this.saveToHistory();
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element[property] = value;
        this.renderFormElements();
        this.hasUnsavedChanges = true;
        this.debouncedSave();
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
        modal.innerHTML = `
            <div class="conditional-logic-content">
                <div class="conditional-logic-header">
                    <h3>Conditional Logic for: ${element.title || element.name}</h3>
                    <button class="close-button" onclick="this.closest('.conditional-logic-modal').remove()">×</button>
                </div>
                <div class="conditional-logic-body">
                    <div class="enable-conditional">
                        <label>
                            <input type="checkbox" id="enableConditional"
                                   ${element.visibleIf ? 'checked' : ''}
                                   onchange="formBuilder.toggleConditionalLogic(this.checked)">
                            Enable conditional visibility
                        </label>
                    </div>
                    
                    <div id="conditionalRules" class="conditional-rules"
                         style="${element.visibleIf ? 'display: block;' : 'display: none;'}">
                        <p class="help-text">Show this field when:</p>
                        
                        <div class="condition-builder">
                            <select id="conditionField" class="condition-select">
                                <option value="">Select a field...</option>
                                ${allElements.filter(el => el.name !== element.name).map(el => `
                                    <option value="${el.name}">${el.title || el.name}</option>
                                `).join('')}
                            </select>
                            
                            <select id="conditionOperator" class="condition-select">
                                <option value="equals">equals</option>
                                <option value="notequals">does not equal</option>
                                <option value="contains">contains</option>
                                <option value="notcontains">does not contain</option>
                                <option value="empty">is empty</option>
                                <option value="notempty">is not empty</option>
                            </select>
                            
                            <input type="text" id="conditionValue" class="condition-value"
                                   placeholder="Value to compare">
                        </div>
                        
                        <div class="current-conditions">
                            <h4>Current Condition:</h4>
                            <code id="conditionExpression">${element.visibleIf || 'None'}</code>
                        </div>
                    </div>
                </div>
                <div class="conditional-logic-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.conditional-logic-modal').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="formBuilder.saveConditionalLogic()">
                        Save Condition
                    </button>
                </div>
            </div>
        `;
        
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
    editPanelElement(index) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        const panelElement = element.elements[index];
        
        // Create edit dialog
        const dialog = this.createElementEditDialog(panelElement, (updatedElement) => {
            element.elements[index] = updatedElement;
            this.showElementProperties();
            this.hasUnsavedChanges = true;
            this.debouncedSave();
        });
        
        document.body.appendChild(dialog);
    }

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

    deleteElement(index) {
        // Check if form is locked
        if (this.checkFormLocked()) {
            return;
        }
        
        this.saveToHistory();
        this.formData.pages[this.currentPageIndex].elements.splice(index, 1);
        this.selectedElement = null;
        this.renderFormElements();
        document.getElementById('propertiesPanel').innerHTML = '<div class="empty-properties">Select an element to edit its properties</div>';
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
        document.getElementById('propertiesPanel').innerHTML = '<div class="empty-properties">Select an element to edit its properties</div>';
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

    preview() {
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h3>Form Preview</h3>
                    <button class="close-preview" onclick="this.closest('.preview-modal').remove()">×</button>
                </div>
                <div class="preview-body">
                    <div id="surveyPreview"></div>
                </div>
            </div>
        `;
        
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
            
            // Pass the DOM element, not just the ID string
            survey.render(previewElement);
        } catch (error) {
            console.error('Error creating preview:', error);
            document.getElementById('surveyPreview').innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc3545;">
                    <p>Error creating preview. Please check your form configuration.</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
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

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData)
            });

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
            indicator.innerHTML = `
                <svg class="save-icon saving" width="16" height="16" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-dasharray="38" stroke-dashoffset="10" />
                </svg>
                <span>Saving...</span>
            `;
            indicator.className = 'auto-save-indicator saving';
            indicator.style.display = 'flex';
            
            // After a short delay, show saved state with checkmark
            setTimeout(() => {
                indicator.innerHTML = `
                    <svg class="save-icon saved" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M5 8l2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" />
                        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                    <span>Draft saved</span>
                `;
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
            const response = await fetch(`/api/forms/templates/${templateId}`);
            if (!response.ok) {
                throw new Error('Failed to load template');
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
        const undoBtn = document.querySelector('[onclick="formBuilder.undo()"]');
        const redoBtn = document.querySelector('[onclick="formBuilder.redo()"]');
        
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

    // Show notification message
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 2000);
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

        dialog.innerHTML = `
            <div class="modal-header" style="padding: 1rem; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                <h5 class="modal-title" style="margin: 0; font-size: 1.25rem;">Select Element Type</h5>
                <button type="button" class="btn-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.5;" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1rem;">
                <select class="form-select" id="elementTypeSelect" style="width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem; font-size: 1rem;">
                    ${types.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                </select>
            </div>
            <div class="modal-footer" style="padding: 1rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button type="button" class="btn btn-secondary" style="padding: 0.375rem 0.75rem; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 0.25rem; cursor: pointer;">Cancel</button>
                <button type="button" class="btn btn-primary" id="confirmElementType" style="padding: 0.375rem 0.75rem; border: 1px solid #0d6efd; background: #0d6efd; color: white; border-radius: 0.25rem; cursor: pointer;">Add Element</button>
            </div>
        `;

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

        // Handle close button click
        dialog.querySelector('.btn-close').addEventListener('click', closeModal);

        // Handle cancel button click
        dialog.querySelector('.btn-secondary').addEventListener('click', closeModal);

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal();
            }
        });

        // Handle confirm button click
        dialog.querySelector('#confirmElementType').addEventListener('click', () => {
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
        dialog.innerHTML = `
            <div class="modal-header" style="padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; flex-shrink: 0;">
                <h5 class="modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 500;">
                    Edit ${type ? type.charAt(0).toUpperCase() + type.slice(1) : ''} Element
                </h5>
                <button type="button" class="btn-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.5; padding: 0; width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; flex: 1;">
                <form id="elementEditForm">
                    <div class="mb-3" style="margin-bottom: 1rem;">
                        <label for="elementName" class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Name (ID):</label>
                        <input type="text" class="form-control" id="elementName" value="${element.name || ''}"
                               style="width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem; font-size: 1rem;">
                    </div>
                    <div class="mb-3" style="margin-bottom: 1rem;">
                        <label for="elementTitle" class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Title:</label>
                        <input type="text" class="form-control" id="elementTitle" value="${element.title || ''}"
                               style="width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.25rem; font-size: 1rem;">
                    </div>
                    <div id="elementSpecificProperties"></div>
                </form>
            </div>
            <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;">
                <button type="button" class="btn btn-secondary" style="padding: 0.375rem 0.75rem; border: 1px solid #6c757d; background: #6c757d; color: white; border-radius: 0.25rem; cursor: pointer;">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveElementChanges" style="padding: 0.375rem 0.75rem; border: 1px solid #0d6efd; background: #0d6efd; color: white; border-radius: 0.25rem; cursor: pointer;">Save Changes</button>
            </div>
        `;

        // Append modal to backdrop and backdrop to body
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Add type-specific properties
        const specificProps = dialog.querySelector('#elementSpecificProperties');
        const elementType = type || element.type || 'text';
        specificProps.innerHTML = this.getTypeSpecificFormFields(element, elementType);

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

        // Handle close button click
        dialog.querySelector('.btn-close').addEventListener('click', closeModal);

        // Handle cancel button click
        dialog.querySelector('.btn-secondary').addEventListener('click', closeModal);

        // Handle backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal();
            }
        });

        // Handle save button click
        dialog.querySelector('#saveElementChanges').addEventListener('click', () => {
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
        switch (type) {
            case 'text':
            case 'comment':
                return `
                    <div class="mb-3">
                        <label for="elementPlaceholder" class="form-label">Placeholder:</label>
                        <input type="text" class="form-control" id="elementPlaceholder" value="${element.placeholder || ''}">
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="elementRequired" ${element.isRequired ? 'checked' : ''}>
                        <label class="form-check-label" for="elementRequired">Required</label>
                    </div>
                `;

            case 'dropdown':
            case 'radiogroup':
            case 'checkbox':
                return `
                    <div class="mb-3">
                        <label class="form-label">Choices (one per line):</label>
                        <textarea class="form-control" id="elementChoices" rows="5">${
                            element.choices ? element.choices.map(c => c.text || c).join('\n') : ''
                        }</textarea>
                    </div>
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="elementRequired" ${element.isRequired ? 'checked' : ''}>
                        <label class="form-check-label" for="elementRequired">Required</label>
                    </div>
                `;

            case 'rating':
                return `
                    <div class="mb-3">
                        <label for="elementRateMin" class="form-label">Minimum Rating:</label>
                        <input type="number" class="form-control" id="elementRateMin" value="${element.rateMin || 1}">
                    </div>
                    <div class="mb-3">
                        <label for="elementRateMax" class="form-label">Maximum Rating:</label>
                        <input type="number" class="form-control" id="elementRateMax" value="${element.rateMax || 5}">
                    </div>
                    <div class="mb-3">
                        <label for="elementMinRateDescription" class="form-label">Min Description:</label>
                        <input type="text" class="form-control" id="elementMinRateDescription" value="${element.minRateDescription || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="elementMaxRateDescription" class="form-label">Max Description:</label>
                        <input type="text" class="form-control" id="elementMaxRateDescription" value="${element.maxRateDescription || ''}">
                    </div>
                `;

            case 'html':
                return `
                    <div class="mb-3">
                        <label for="elementHtml" class="form-label">HTML Content:</label>
                        <textarea class="form-control" id="elementHtml" rows="5">${element.html || ''}</textarea>
                    </div>
                `;

            default:
                return '';
        }
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
        styles.innerHTML = `
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

    // Register custom question types with Survey.js
    registerCustomQuestionTypes() {
        console.log('FormBuilder: Registering custom question types');
        
        // Only register if Survey is available
        if (typeof Survey === 'undefined') {
            console.warn('FormBuilder: Survey.js not loaded, skipping custom question registration');
            return;
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
        
        console.log('FormBuilder: AI Summary question type registered');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
module.exports = IPLCFormBuilder;
}