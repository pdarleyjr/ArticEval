// Custom Form Builder for IPLC ArticEval
// Creates JSON definitions compatible with SurveyJS Form Library
// Enhanced with comprehensive SLP/OT evaluation sections

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
            }]
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
        this.checkForEditMode();
        this.render();
        this.attachEventListeners();
        this.setupAutoSave();
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
                    <div class="builder-properties">
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
                name: 'Clinical Header/Info',
                elements: [
                    { type: 'iplc-logo', icon: '🏥', label: 'IPLC Logo', custom: true },
                    { type: 'iplc-header', icon: '🏥', label: 'IPLC Header', custom: true },
                    { type: 'patient-info', icon: '👤', label: 'Patient Demographics', custom: true },
                    { type: 'referral-info', icon: '📋', label: 'Referral Information', custom: true }
                ]
            },
            {
                name: 'SLP Components',
                elements: [
                    { type: 'oral-mechanism', icon: '👄', label: 'Oral Mechanism Exam', custom: true },
                    { type: 'language-assessment', icon: '💬', label: 'Language Assessment', custom: true },
                    { type: 'articulation-assessment', icon: '🗣️', label: 'Articulation Assessment', custom: true },
                    { type: 'fluency-voice', icon: '🎵', label: 'Fluency & Voice', custom: true },
                    { type: 'test-scores', icon: '📊', label: 'Test Scores Section', custom: true }
                ]
            },
            {
                name: 'OT Components',
                elements: [
                    { type: 'adl-skills', icon: '🚿', label: 'ADL Skills', custom: true },
                    { type: 'sensory-processing', icon: '✋', label: 'Sensory Processing', custom: true },
                    { type: 'motor-skills', icon: '🏃', label: 'Motor Skills', custom: true },
                    { type: 'visual-perceptual', icon: '👁️', label: 'Visual Perceptual', custom: true }
                ]
            },
            {
                name: 'Clinical Documentation',
                elements: [
                    { type: 'background-history', icon: '📚', label: 'Background History', custom: true },
                    { type: 'behavioral-observations', icon: '👀', label: 'Behavioral Observations', custom: true },
                    { type: 'clinical-impressions', icon: '🔍', label: 'Clinical Impressions', custom: true },
                    { type: 'goals-objectives', icon: '🎯', label: 'Goals & Objectives', custom: true },
                    { type: 'recommendations', icon: '💡', label: 'Recommendations', custom: true },
                    { type: 'signature-section', icon: '✍️', label: 'Signatures & Consent', custom: true }
                ]
            }
        ];

        return categories.map(category => `
            <div class="category">
                <h4>${category.name}</h4>
                ${category.elements.map(el => `
                    <div class="draggable-element" data-type="${el.type}" 
                         ${el.custom ? 'data-custom="true"' : ''} draggable="true">
                        <span class="icon">${el.icon}</span> ${el.label}
                    </div>
                `).join('')}
            </div>
        `).join('');
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
            }

            .draggable-element:hover {
                background: #e9ecef;
                border-color: #3498db;
                transform: translateX(2px);
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
            }

            .form-element.selected {
                border-color: #3498db;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
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
            }

            .builder-properties {
                width: 300px;
                background: white;
                border-left: 1px solid #e1e4e8;
                padding: 1rem;
                overflow-y: auto;
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
                 data-index="${index}" onclick="formBuilder.selectElement(${index})">
                <div class="element-header">
                    <span class="element-type">${element.title || element.name || 'Untitled'}</span>
                    <div class="element-actions">
                        <button onclick="formBuilder.moveElement(${index}, -1); event.stopPropagation();">↑</button>
                        <button onclick="formBuilder.moveElement(${index}, 1); event.stopPropagation();">↓</button>
                        <button onclick="formBuilder.duplicateElement(${index}); event.stopPropagation();">📋</button>
                        <button onclick="formBuilder.deleteElement(${index}); event.stopPropagation();">🗑️</button>
                    </div>
                </div>
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
    }

    setupDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable-element');
        const dropZone = document.getElementById('dropZone');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('elementType', draggable.dataset.type);
                e.dataTransfer.setData('isCustom', draggable.dataset.custom || 'false');
                draggable.classList.add('dragging');
            });

            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const elementType = e.dataTransfer.getData('elementType');
            const isCustom = e.dataTransfer.getData('isCustom') === 'true';
            
            if (elementType) {
                this.addElement(elementType, isCustom);
            }
        });
    }

    addElement(type, isCustom = false) {
        this.saveToHistory();
        const element = isCustom ? this.createCustomElement(type) : this.createDefaultElement(type);
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

    createDefaultElement(type) {
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

        return baseElement;
    }

    createCustomElement(type) {
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
                    { type: 'text', name: 'patient_name', title: 'Patient Name', isRequired: true },
                    { type: 'text', name: 'date_of_birth', title: 'Date of Birth', inputType: 'date', isRequired: true },
                    { type: 'expression', name: 'age', title: 'Age', expression: 'calculateAge({date_of_birth})' },
                    { type: 'dropdown', name: 'gender', title: 'Gender', choices: ['Male', 'Female', 'Other'] },
                    { type: 'text', name: 'diagnosis', title: 'Primary Diagnosis' },
                    { type: 'text', name: 'insurance', title: 'Insurance Provider' }
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
                        columns: ['Normal', 'Abnormal', 'Not Assessed'],
                        rows: ['Lips', 'Tongue', 'Teeth', 'Hard Palate', 'Soft Palate', 'Uvula', 'Tonsils']
                    },
                    {
                        type: 'comment',
                        name: 'oral_notes',
                        title: 'Additional Observations',
                        rows: 3
                    }
                ]
            },
            'language-assessment': {
                type: 'panel',
                name: 'language_skills',
                title: 'Language Skills Assessment',
                elements: [
                    {
                        type: 'matrix',
                        name: 'receptive_language',
                        title: 'Receptive Language',
                        columns: ['WNL', 'Mild', 'Moderate', 'Severe'],
                        rows: ['Following Directions', 'Understanding Questions', 'Vocabulary', 'Concepts']
                    },
                    {
                        type: 'matrix',
                        name: 'expressive_language',
                        title: 'Expressive Language',
                        columns: ['WNL', 'Mild', 'Moderate', 'Severe'],
                        rows: ['Vocabulary', 'Sentence Structure', 'Grammar', 'Narrative Skills']
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
                title: 'Activities of Daily Living',
                elements: [
                    {
                        type: 'matrix',
                        name: 'self_care',
                        title: 'Self-Care Skills',
                        columns: ['Independent', 'Min Assist', 'Mod Assist', 'Max Assist', 'Dependent'],
                        rows: ['Feeding', 'Dressing', 'Bathing', 'Grooming', 'Toileting']
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
            propertiesHTML += `
                <div class="property-group">
                    <label class="property-label">Choices</label>
                    <div class="choices-editor">
                        ${(element.choices || []).map((choice, i) => `
                            <div class="choice-item">
                                <input type="text" class="property-input" value="${choice}"
                                       onchange="formBuilder.updateChoice(${i}, this.value)">
                                <button onclick="formBuilder.removeChoice(${i})">×</button>
                            </div>
                        `).join('')}
                        <button class="btn btn-sm add-choice" onclick="formBuilder.addChoice()">Add Choice</button>
                    </div>
                </div>
            `;
        }

        // Add signature-specific properties
        if (element.type === 'signaturepad') {
            propertiesHTML += `
                <div class="property-group">
                    <label class="property-label">Width</label>
                    <input type="number" class="property-input" value="${element.width || '300'}"
                           onchange="formBuilder.updateElementProperty('width', this.value)">
                </div>
                <div class="property-group">
                    <label class="property-label">Height</label>
                    <input type="number" class="property-input" value="${element.height || '150'}"
                           onchange="formBuilder.updateElementProperty('height', this.value)">
                </div>
                <div class="property-group">
                    <label class="property-label">Pen Color</label>
                    <input type="color" class="property-input" value="${element.penColor || '#000080'}"
                           onchange="formBuilder.updateElementProperty('penColor', this.value)">
                </div>
            `;
        }

        // Add validation rules section
        propertiesHTML += `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Validation Rules</h4>
                ${this.getValidationRulesHTML(element)}
            </div>
        `;

        // Add conditional logic section
        propertiesHTML += `
            <div class="property-group">
                <h4 style="margin-bottom: 0.5rem;">Conditional Logic</h4>
                <button class="btn btn-sm btn-secondary" onclick="formBuilder.showConditionalLogicEditor()">
                    Configure Conditions
                </button>
            </div>
        `;

        propertiesPanel.innerHTML = propertiesHTML;
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

    moveElement(index, direction) {
        const elements = this.formData.pages[this.currentPageIndex].elements;
        const newIndex = index + direction;
        
        if (newIndex < 0 || newIndex >= elements.length) return;
        
        [elements[index], elements[newIndex]] = [elements[newIndex], elements[index]];
        this.selectedElement = newIndex;
        this.renderFormElements();
    }

    deleteElement(index) {
        this.saveToHistory();
        this.formData.pages[this.currentPageIndex].elements.splice(index, 1);
        this.selectedElement = null;
        this.renderFormElements();
        document.getElementById('propertiesPanel').innerHTML = '<div class="empty-properties">Select an element to edit its properties</div>';
        this.hasUnsavedChanges = true;
        this.debouncedSave();
    }

    duplicateElement(index) {
        const element = this.formData.pages[this.currentPageIndex].elements[index];
        const duplicate = JSON.parse(JSON.stringify(element));
        duplicate.name = `${duplicate.name}_copy_${Date.now()}`;
        duplicate.title = `${duplicate.title} (Copy)`;
        
        this.formData.pages[this.currentPageIndex].elements.splice(index + 1, 0, duplicate);
        this.renderFormElements();
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
                ...(formData.showLogo !== undefined && { showLogo: formData.showLogo })
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
                    ...(template.showLogo !== undefined && { showLogo: template.showLogo })
                };
            }
            
            // Set creator name if available
            if (template.created_by) {
                const creatorInput = document.getElementById('creatorName');
                if (creatorInput) {
                    creatorInput.value = template.created_by;
                }
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
        this.updateFormDesigner();
        
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
module.exports = IPLCFormBuilder;
}