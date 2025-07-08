/**
 * Form Builder Tour and Help System
 * Provides interactive guided tours and help documentation
 */

class FormBuilderTour {
    constructor(formBuilder) {
        this.formBuilder = formBuilder;
        this.currentStep = 0;
        this.tourSteps = [];
        this.overlay = null;
        this.tooltip = null;
        this.helpPanel = null;
        
        this.initializeTourSteps();
        this.createOverlay();
        this.createTooltip();
        this.createHelpPanel();
        this.addStyles();
    }
    
    initializeTourSteps() {
        this.tourSteps = [
            {
                element: '.creator-field:first-child input',
                title: 'Name Your Form',
                content: 'Start by giving your form a descriptive name. This helps you organize your clinical evaluations.',
                position: 'right'
            },
            {
                element: '.field-templates-section',
                title: 'Quick Templates',
                content: 'Use pre-built templates for common clinical forms. Select from the dropdown to instantly add complete form sections.',
                position: 'right'
            },
            {
                element: '.element-category:first-child',
                title: 'Add Form Elements',
                content: 'Drag and drop elements from here to build your form. We have text fields, multiple choice, ratings, and clinical-specific widgets.',
                position: 'right'
            },
            {
                element: '.form-canvas',
                title: 'Form Design Area',
                content: 'This is where you build your form. Drag elements here and arrange them in the order you want.',
                position: 'left'
            },
            {
                element: '.properties-panel',
                title: 'Element Properties',
                content: 'Click on any form element to edit its properties here. You can change labels, add validation, and set up conditional logic.',
                position: 'left'
            },
            {
                element: '#autoSaveIndicator',
                title: 'Auto-Save Feature',
                content: 'Your work is automatically saved as you make changes. Look for the blue saving indicator and green checkmark.',
                position: 'bottom'
            },
            {
                element: '.header-actions',
                title: 'Preview and Save',
                content: 'Use Preview to test your form before saving. When ready, click Save Template to make it available for patient evaluations.',
                position: 'bottom'
            }
        ];
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.endTour();
        });
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tour-tooltip';
        this.tooltip.innerHTML = `
            <div class="tour-tooltip-header">
                <h3 class="tour-tooltip-title"></h3>
                <button class="tour-close-btn" aria-label="Close tour">&times;</button>
            </div>
            <div class="tour-tooltip-content"></div>
            <div class="tour-tooltip-footer">
                <div class="tour-progress">
                    <span class="tour-step-current">1</span> of <span class="tour-step-total">7</span>
                </div>
                <div class="tour-actions">
                    <button class="tour-btn tour-btn-secondary tour-skip-btn">Skip Tour</button>
                    <button class="tour-btn tour-btn-primary tour-prev-btn">Previous</button>
                    <button class="tour-btn tour-btn-primary tour-next-btn">Next</button>
                    <button class="tour-btn tour-btn-primary tour-finish-btn" style="display: none;">Finish</button>
                </div>
            </div>
        `;
        
        // Add event listeners using pointer events for unified touch/mouse/pen support
        this.tooltip.querySelector('.tour-close-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.endTour();
        });
        this.tooltip.querySelector('.tour-skip-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.endTour();
        });
        this.tooltip.querySelector('.tour-prev-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.previousStep();
        });
        this.tooltip.querySelector('.tour-next-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.nextStep();
        });
        this.tooltip.querySelector('.tour-finish-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.endTour();
        });
    }
    
    createHelpPanel() {
        this.helpPanel = document.createElement('div');
        this.helpPanel.className = 'help-panel';
        this.helpPanel.innerHTML = `
            <div class="help-panel-header">
                <h2>Form Builder Help</h2>
                <button class="help-close-btn" aria-label="Close help">&times;</button>
            </div>
            <div class="help-panel-content">
                <section class="help-section">
                    <h3>Keyboard Shortcuts</h3>
                    <ul class="shortcuts-list">
                        <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> - Undo last action</li>
                        <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> - Redo action</li>
                        <li><kbd>Delete</kbd> - Remove selected element</li>
                        <li><kbd>Ctrl</kbd> + <kbd>C</kbd> - Copy selected element</li>
                        <li><kbd>Ctrl</kbd> + <kbd>V</kbd> - Paste copied element</li>
                        <li><kbd>Ctrl</kbd> + <kbd>S</kbd> - Save form template</li>
                        <li><kbd>Ctrl</kbd> + <kbd>P</kbd> - Preview form</li>
                        <li><kbd>F1</kbd> - Open this help panel</li>
                        <li><kbd>?</kbd> - Start guided tour</li>
                    </ul>
                </section>
                
                <section class="help-section">
                    <h3>Building Your Form</h3>
                    <ol>
                        <li><strong>Name your form:</strong> Give it a clear, descriptive title</li>
                        <li><strong>Add elements:</strong> Drag from the left panel or use templates</li>
                        <li><strong>Configure properties:</strong> Click elements to edit on the right</li>
                        <li><strong>Set up logic:</strong> Add conditional rules for dynamic forms</li>
                        <li><strong>Preview:</strong> Test your form before saving</li>
                        <li><strong>Save template:</strong> Make it available for evaluations</li>
                    </ol>
                </section>
                
                <section class="help-section">
                    <h3>Clinical Features</h3>
                    <ul>
                        <li><strong>IPLC Logo:</strong> Add your practice branding</li>
                        <li><strong>Signature Fields:</strong> Capture patient and clinician signatures</li>
                        <li><strong>Patient Demographics:</strong> Pre-built demographic fields</li>
                        <li><strong>Rating Scales:</strong> Likert scales and clinical assessments</li>
                        <li><strong>Conditional Logic:</strong> Show/hide fields based on responses</li>
                        <li><strong>Templates:</strong> Quick-start with common evaluation forms</li>
                    </ul>
                </section>
                
                <section class="help-section">
                    <h3>Tips & Best Practices</h3>
                    <ul>
                        <li>Use clear, concise labels for all form fields</li>
                        <li>Group related questions together</li>
                        <li>Add help text for complex questions</li>
                        <li>Use required fields sparingly</li>
                        <li>Test your form thoroughly before using with patients</li>
                        <li>Take advantage of templates for common sections</li>
                        <li>Use conditional logic to create adaptive forms</li>
                    </ul>
                </section>
            </div>
        `;
        
        this.helpPanel.querySelector('.help-close-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.hideHelp();
        });
        document.body.appendChild(this.helpPanel);
    }
    
    startTour() {
        // Save tour completion status
        this.currentStep = 0;
        
        // Add overlay and tooltip to DOM
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.tooltip);
        
        // Show first step
        this.showStep(0);
        
        // Track tour start
        console.log('Form builder tour started');
    }
    
    showStep(stepIndex) {
        const step = this.tourSteps[stepIndex];
        if (!step) return;
        
        // Find target element
        const targetElement = document.querySelector(step.element);
        if (!targetElement) {
            console.warn(`Tour element not found: ${step.element}`);
            this.nextStep();
            return;
        }
        
        // Update tooltip content
        this.tooltip.querySelector('.tour-tooltip-title').textContent = step.title;
        this.tooltip.querySelector('.tour-tooltip-content').textContent = step.content;
        this.tooltip.querySelector('.tour-step-current').textContent = stepIndex + 1;
        this.tooltip.querySelector('.tour-step-total').textContent = this.tourSteps.length;
        
        // Update buttons
        const prevBtn = this.tooltip.querySelector('.tour-prev-btn');
        const nextBtn = this.tooltip.querySelector('.tour-next-btn');
        const finishBtn = this.tooltip.querySelector('.tour-finish-btn');
        
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'inline-block';
        nextBtn.style.display = stepIndex === this.tourSteps.length - 1 ? 'none' : 'inline-block';
        finishBtn.style.display = stepIndex === this.tourSteps.length - 1 ? 'inline-block' : 'none';
        
        // Position tooltip
        this.positionTooltip(targetElement, step.position);
        
        // Highlight target element
        this.highlightElement(targetElement);
    }
    
    positionTooltip(targetElement, position) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const padding = 20;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - padding;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - padding;
                break;
            case 'right':
            default:
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + padding;
                break;
        }
        
        // Ensure tooltip stays within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }
    
    highlightElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('tour-highlight');
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    nextStep() {
        if (this.currentStep < this.tourSteps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    endTour() {
        // Remove overlay and tooltip
        if (this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
        }
        if (this.tooltip.parentElement) {
            this.tooltip.parentElement.removeChild(this.tooltip);
        }
        
        // Remove highlights
        document.querySelectorAll('.tour-highlight').forEach(el => {
            el.classList.remove('tour-highlight');
        });
        
        // Save completion status
        localStorage.setItem('formBuilderTourCompleted', 'true');
        
        console.log('Form builder tour ended');
    }
    
    showHelp() {
        this.helpPanel.classList.add('show');
    }
    
    hideHelp() {
        this.helpPanel.classList.remove('show');
    }
    
    toggleHelp() {
        this.helpPanel.classList.toggle('show');
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Tour Overlay */
            .tour-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9998;
            }
            
            /* Tour Tooltip */
            .tour-tooltip {
                position: fixed;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
                padding: 0;
                max-width: 400px;
                z-index: 9999;
                animation: tourFadeIn 0.3s ease-out;
            }
            
            @keyframes tourFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .tour-tooltip-header {
                background-color: #0047AB;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tour-tooltip-title {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 600;
            }
            
            .tour-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .tour-close-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            .tour-tooltip-content {
                padding: 1.5rem;
                font-size: 0.9375rem;
                line-height: 1.6;
                color: #333;
            }
            
            .tour-tooltip-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tour-progress {
                font-size: 0.875rem;
                color: #666;
            }
            
            .tour-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .tour-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .tour-btn-primary {
                background-color: #0047AB;
                color: white;
            }
            
            .tour-btn-primary:hover {
                background-color: #003580;
            }
            
            .tour-btn-secondary {
                background-color: transparent;
                color: #666;
            }
            
            .tour-btn-secondary:hover {
                color: #333;
                background-color: #f0f0f0;
            }
            
            /* Highlighted Elements */
            .tour-highlight {
                position: relative;
                z-index: 9997;
                box-shadow: 0 0 0 4px rgba(0, 71, 171, 0.3);
                animation: tourPulse 2s infinite;
            }
            
            @keyframes tourPulse {
                0% {
                    box-shadow: 0 0 0 4px rgba(0, 71, 171, 0.3);
                }
                50% {
                    box-shadow: 0 0 0 8px rgba(0, 71, 171, 0.1);
                }
                100% {
                    box-shadow: 0 0 0 4px rgba(0, 71, 171, 0.3);
                }
            }
            
            /* Help Panel */
            .help-panel {
                position: fixed;
                right: -400px;
                top: 0;
                bottom: 0;
                width: 400px;
                background-color: #fff;
                box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                transition: right 0.3s ease-out;
                overflow-y: auto;
            }
            
            .help-panel.show {
                right: 0;
            }
            
            .help-panel-header {
                background-color: #0047AB;
                color: white;
                padding: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            
            .help-panel-header h2 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .help-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .help-close-btn:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
            
            .help-panel-content {
                padding: 1.5rem;
            }
            
            .help-section {
                margin-bottom: 2rem;
            }
            
            .help-section h3 {
                font-size: 1.125rem;
                font-weight: 600;
                color: #333;
                margin-bottom: 1rem;
            }
            
            .help-section ul,
            .help-section ol {
                margin-left: 1.5rem;
                line-height: 1.8;
            }
            
            .help-section li {
                margin-bottom: 0.5rem;
            }
            
            .shortcuts-list {
                list-style: none;
                margin-left: 0;
            }
            
            .shortcuts-list li {
                display: flex;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            
            kbd {
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 3px;
                padding: 0.2rem 0.4rem;
                font-family: monospace;
                font-size: 0.875rem;
                margin: 0 0.2rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for use in form builder
window.FormBuilderTour = FormBuilderTour;