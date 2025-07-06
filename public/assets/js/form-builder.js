// Custom Form Builder for IPLC ArticEval
// Creates JSON definitions compatible with SurveyJS Form Library
// Enhanced with comprehensive SLP/OT evaluation sections

class IPLCFormBuilder {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
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
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="form-builder-container">
                <div class="builder-header">
                    <h2>${this.options.mode === 'edit' ? 'Edit Form' : 'Create New Form'}</h2>
                    <div class="builder-actions">
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
                    { type: 'boolean', icon: '✅', label: 'Yes/No' }
                ]
            },
            {
                name: 'Clinical Header/Info',
                elements: [
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
        document.getElementById('formTitle').addEventListener('input', (e) => {
            this.formData.title = e.target.value;
        });

        document.getElementById('formDescription').addEventListener('input', (e) => {
            this.formData.description = e.target.value;
        });

        document.getElementById('pageTitle').addEventListener('input', (e) => {
            this.formData.pages[this.currentPageIndex].title = e.target.value;
            this.renderPageTabs();
        });

        this.setupDragAndDrop();
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
        const element = isCustom ? this.createCustomElement(type) : this.createDefaultElement(type);
        const currentPage = this.formData.pages[this.currentPageIndex];
        
        if (!currentPage.elements) {
            currentPage.elements = [];
        }
        
        currentPage.elements.push(element);
        this.renderFormElements();
        this.selectElement(currentPage.elements.length - 1);
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
        }

        return baseElement;
    }

    createCustomElement(type) {
        const customElements = {
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
                    { type: 'signaturepad', name: 'therapist_signature', title: 'Therapist Signature' },
                    { type: 'text', name: 'therapist_name', title: 'Therapist Name (Print)' },
                    { type: 'text', name: 'license_number', title: 'License Number' },
                    { type: 'text', name: 'signature_date', title: 'Date', inputType: 'date' }
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

        propertiesPanel.innerHTML = propertiesHTML;
    }

    updateElementProperty(property, value) {
        if (this.selectedElement === null) return;
        
        const element = this.formData.pages[this.currentPageIndex].elements[this.selectedElement];
        element[property] = value;
        this.renderFormElements();
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
        this.formData.pages[this.currentPageIndex].elements.splice(index, 1);
        this.selectedElement = null;
        this.renderFormElements();
        document.getElementById('propertiesPanel').innerHTML = '<div class="empty-properties">Select an element to edit its properties</div>';
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
        const survey = new Survey.Model(this.formData);
        survey.render("surveyPreview");
    }

    async save() {
        try {
            if (!this.formData.title) {
                alert('Please enter a form title');
                return;
            }

            const templateData = {
                name: this.formData.title,
                description: this.formData.description || '',
                sections: this.formData.pages
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
            alert('Form saved successfully!');
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            console.error('Error saving form:', error);
            alert('Error saving form: ' + error.message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IPLCFormBuilder;
}