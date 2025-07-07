/**
 * AI Summary Renderer for Survey.js
 * Handles the display and functionality of AI-generated summaries in forms
 */

(function() {
    'use strict';
    
    // Check if Survey.js is loaded
    if (typeof Survey === 'undefined') {
        console.error('AI Summary Renderer: Survey.js is required but not loaded');
        return;
    }
    
    // Create the AI Summary widget
    const widget = {
        name: "ai-summary",
        title: "AI Summary",
        iconName: "icon-ai",
        widgetIsLoaded: function() {
            return true;
        },
        isFit: function(question) {
            return question.getType() === 'ai-summary';
        },
        htmlTemplate: `<div class="ai-summary-widget"></div>`,
        afterRender: function(question, el) {
            // Create state variables without Knockout dependency
            let summaryText = '';
            let isGenerating = false;
            let error = '';
            let isCollapsed = false;
            let selectedFields = question.selectedFields || [];
            let generateTimeout = null;
            
            // Update UI function
            function updateUI() {
                // Update controls visibility
                const controls = el.querySelector('.ai-summary-controls');
                if (controls) {
                    controls.style.display = question.allowRuntimeSelection ? 'flex' : 'none';
                }
                
                // Update generate button state
                const generateBtn = el.querySelector('button[data-action="generate"]');
                if (generateBtn) {
                    generateBtn.disabled = isGenerating;
                    generateBtn.querySelector('span:last-child').textContent =
                        isGenerating ? question.loadingText : 'Generate Summary';
                }
                
                // Update content classes
                const content = el.querySelector('.ai-summary-content');
                if (content) {
                    content.className = 'ai-summary-content';
                    if (question.displayMode === 'seamless') content.classList.add('seamless');
                    if (question.displayMode === 'highlighted') content.classList.add('highlighted');
                    if (question.displayMode === 'expandable') {
                        content.classList.add('expandable');
                        if (isCollapsed) content.classList.add('collapsed');
                    }
                }
                
                // Update header visibility
                const header = el.querySelector('.ai-summary-header');
                if (header) {
                    header.style.display = question.displayMode === 'expandable' ? 'flex' : 'none';
                    const icon = header.querySelector('.icon');
                    if (icon) icon.textContent = isCollapsed ? '▶' : '▼';
                }
                
                // Update body content
                const placeholder = el.querySelector('.ai-summary-placeholder');
                const loading = el.querySelector('.ai-summary-loading');
                const errorDiv = el.querySelector('.ai-summary-error');
                const textDiv = el.querySelector('.ai-summary-text');
                
                if (placeholder) placeholder.style.display = (!summaryText && !error && !isGenerating) ? 'block' : 'none';
                if (loading) loading.style.display = isGenerating ? 'flex' : 'none';
                if (errorDiv) {
                    errorDiv.style.display = error ? 'flex' : 'none';
                    if (error) errorDiv.querySelector('span:nth-child(2)').textContent = error || question.errorText;
                }
                if (textDiv) {
                    textDiv.style.display = (summaryText && !isGenerating) ? 'block' : 'none';
                    textDiv.innerHTML = summaryText;
                }
                
                // Update hidden input
                const hiddenInput = el.querySelector('input[type="hidden"]');
                if (hiddenInput) {
                    hiddenInput.value = question.value || summaryText;
                }
            }
            
            // Generate summary function
            async function generateSummary() {
                isGenerating = true;
                error = '';
                updateUI();
                
                try {
                    const survey = question.survey;
                    const formData = {};
                    
                    // Collect data from selected fields
                    selectedFields.forEach(fieldName => {
                        const value = survey.getValue(fieldName);
                        if (value !== undefined && value !== null && value !== '') {
                            formData[fieldName] = value;
                        }
                    });
                    
                    // Check if we have any data to summarize
                    if (Object.keys(formData).length === 0) {
                        throw new Error('Please complete the selected fields before generating a summary');
                    }
                    
                    // Call the AI summary API
                    const response = await fetch('/api/ai/summary', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            formData: formData,
                            templateId: survey.templateId || 'default',
                            summaryType: question.summaryType || 'comprehensive'
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to generate summary');
                    }
                    
                    const data = await response.json();
                    summaryText = data.summary;
                    question.value = data.summary;
                    
                } catch (err) {
                    console.error('Error generating summary:', err);
                    error = err.message;
                } finally {
                    isGenerating = false;
                    updateUI();
                }
            }
            
            // Toggle collapse function
            function toggleCollapse() {
                isCollapsed = !isCollapsed;
                updateUI();
            }
            
            // Show field selection modal
            function showFieldSelectionModal() {
                const modal = document.createElement('div');
                modal.className = 'ai-summary-field-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Select Fields for AI Summary</h3>
                            <button class="close-button" onclick="this.closest('.ai-summary-field-modal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="field-selection-list">
                                ${getAllAvailableFields().map(field => `
                                    <label class="field-checkbox">
                                        <input type="checkbox"
                                               value="${field.name}"
                                               ${selectedFields.includes(field.name) ? 'checked' : ''}>
                                        ${field.title || field.name}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closest('.ai-summary-field-modal').remove()">
                                Cancel
                            </button>
                            <button class="btn btn-primary" data-action="save-fields">
                                Save Selection
                            </button>
                        </div>
                    </div>
                `;
                
                // Add save handler
                modal.querySelector('[data-action="save-fields"]').onclick = function() {
                    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
                    selectedFields = Array.from(checkboxes).map(cb => cb.value);
                    question.selectedFields = selectedFields;
                    modal.remove();
                };
                
                document.body.appendChild(modal);
                modal.style.display = 'block';
            }
            
            // Helper function to get all available fields
            function getAllAvailableFields() {
                const fields = [];
                const survey = question.survey;
                
                survey.pages.forEach(page => {
                    page.questions.forEach(q => {
                        if (q !== question && q.name && q.title) {
                            fields.push({
                                name: q.name,
                                title: q.title
                            });
                        }
                    });
                });
                
                return fields;
            }
            
            // Replace Knockout template with plain HTML
            el.innerHTML = `
                <div class="ai-summary-widget">
                    <div class="ai-summary-controls">
                        <button class="btn btn-sm btn-secondary" data-action="select-fields">
                            <span class="icon">📋</span> Select Fields
                        </button>
                        <button class="btn btn-sm btn-primary" data-action="generate">
                            <span class="icon">🤖</span>
                            <span>Generate Summary</span>
                        </button>
                    </div>
                    <div class="ai-summary-content">
                        <div class="ai-summary-header">
                            <span class="icon">▼</span>
                            <span>AI Summary</span>
                        </div>
                        <div class="ai-summary-body" style="min-height: ${question.minHeight || 100}px">
                            <div class="ai-summary-placeholder">
                                <span>${question.placeholder || 'Click "Generate Summary" to create an AI summary'}</span>
                            </div>
                            <div class="ai-summary-loading" style="display: none;">
                                <div class="spinner"></div>
                                <span>${question.loadingText || 'Generating summary...'}</span>
                            </div>
                            <div class="ai-summary-error" style="display: none;">
                                <span class="icon">⚠️</span>
                                <span></span>
                                <button class="btn btn-sm btn-link" data-action="retry">Retry</button>
                            </div>
                            <div class="ai-summary-text" style="display: none;"></div>
                        </div>
                    </div>
                    <input type="hidden" value="${question.value || ''}" />
                </div>
            `;
            
            // Attach event listeners
            el.querySelector('[data-action="select-fields"]')?.addEventListener('click', showFieldSelectionModal);
            el.querySelector('[data-action="generate"]')?.addEventListener('click', generateSummary);
            el.querySelector('[data-action="retry"]')?.addEventListener('click', generateSummary);
            el.querySelector('.ai-summary-header')?.addEventListener('click', toggleCollapse);
            
            // Initial UI update
            updateUI();
            
            // Auto-generate summary if configured
            if (!question.allowRuntimeSelection && question.selectedFields && question.selectedFields.length > 0) {
                // Listen for changes to selected fields
                question.selectedFields.forEach(fieldName => {
                    const fieldQuestion = question.survey.getQuestionByName(fieldName);
                    if (fieldQuestion) {
                        fieldQuestion.valueChangedCallback = function() {
                            // Debounce the summary generation
                            clearTimeout(generateTimeout);
                            generateTimeout = setTimeout(() => {
                                generateSummary();
                            }, 3000); // 3 second delay as per requirements
                        };
                    }
                });
            }
        }
    };
    
    // Register the widget
    Survey.CustomWidgetCollection.Instance.addCustomWidget(widget, "customtype");
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .ai-summary-widget {
            padding: 1rem;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
            margin: 1rem 0;
        }
        
        .ai-summary-controls {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .ai-summary-content {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 0.25rem;
            overflow: hidden;
        }
        
        .ai-summary-content.highlighted {
            border-color: #0066cc;
            box-shadow: 0 0 0 0.2rem rgba(0, 102, 204, 0.25);
        }
        
        .ai-summary-header {
            padding: 0.75rem 1rem;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .ai-summary-body {
            padding: 1rem;
            position: relative;
        }
        
        .ai-summary-content.expandable.collapsed .ai-summary-body {
            display: none;
        }
        
        .ai-summary-placeholder {
            color: #6c757d;
            font-style: italic;
            text-align: center;
            padding: 2rem;
        }
        
        .ai-summary-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            gap: 1rem;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0066cc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .ai-summary-error {
            color: #dc3545;
            padding: 1rem;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .ai-summary-text {
            line-height: 1.6;
        }
        
        .ai-summary-field-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            padding: 2rem;
            overflow: auto;
        }
        
        .ai-summary-field-modal .modal-content {
            background: white;
            max-width: 500px;
            margin: 0 auto;
            border-radius: 0.5rem;
            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
        }
        
        .ai-summary-field-modal .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ai-summary-field-modal .modal-body {
            padding: 1.5rem;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .ai-summary-field-modal .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }
        
        .field-selection-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .field-checkbox {
            display: flex;
            align-items: center;
            padding: 0.5rem;
            background: #f8f9fa;
            border-radius: 0.25rem;
            cursor: pointer;
        }
        
        .field-checkbox:hover {
            background: #e9ecef;
        }
        
        .field-checkbox input {
            margin-right: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
})();