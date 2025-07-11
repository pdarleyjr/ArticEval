// AI Helper component for generating and improving form questions
import notifications from '../utils/notifications.js';
import { debounce } from '../utils/debounce.js';

// AI Helper class
export class AIHelper {
  constructor(survey, apiConfig = {}) {
    this.survey = survey;
    this.apiConfig = {
      endpoint: '/api/ai/chat',
      summaryEndpoint: '/api/ai/summary',
      maxRetries: 3,
      timeout: 30000,
      ...apiConfig
    };
    
    this.isProcessing = false;
    this.currentRequest = null;
    this.suggestions = new Map();
    
    // Initialize UI
    this.initializeUI();
    
    // Bind methods
    this.generateQuestion = this.generateQuestion.bind(this);
    this.improveQuestion = this.improveQuestion.bind(this);
    this.suggestOptions = this.suggestOptions.bind(this);
    this.analyzeSurvey = this.analyzeSurvey.bind(this);
  }
  
  initializeUI() {
    // Create AI helper panel
    this.panel = document.createElement('div');
    this.panel.className = 'ai-helper-panel';
    this.panel.innerHTML = `
      <div class="ai-helper-header">
        <h3><i class="fas fa-robot"></i> AI Assistant</h3>
        <button class="ai-helper-close" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ai-helper-content">
        <div class="ai-helper-prompt">
          <textarea 
            id="ai-prompt" 
            placeholder="Describe what kind of question you want to create..."
            rows="3"
          ></textarea>
          <div class="ai-helper-actions">
            <button class="ai-action-btn primary" data-action="generate">
              <i class="fas fa-magic"></i> Generate Question
            </button>
            <button class="ai-action-btn" data-action="improve">
              <i class="fas fa-sparkles"></i> Improve Current
            </button>
            <button class="ai-action-btn" data-action="suggest">
              <i class="fas fa-lightbulb"></i> Suggest Options
            </button>
          </div>
        </div>
        <div class="ai-helper-suggestions" style="display: none;">
          <h4>Suggestions</h4>
          <div class="suggestions-list"></div>
        </div>
        <div class="ai-helper-loading" style="display: none;">
          <div class="spinner"></div>
          <p>AI is thinking...</p>
        </div>
        <div class="ai-helper-error" style="display: none;">
          <i class="fas fa-exclamation-triangle"></i>
          <p class="error-message"></p>
          <button class="retry-btn">Retry</button>
        </div>
      </div>
      <div class="ai-helper-footer">
        <button class="ai-analyze-btn" data-action="analyze">
          <i class="fas fa-chart-line"></i> Analyze Survey
        </button>
        <div class="ai-helper-tips">
          <i class="fas fa-info-circle"></i>
          <span>Tip: Be specific about your requirements for better results</span>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.setupEventListeners();
    
    // Create floating button
    this.createFloatingButton();
  }
  
  setupEventListeners() {
    // Close button
    this.panel.querySelector('.ai-helper-close').addEventListener('click', () => {
      this.hide();
    });
    
    // Action buttons
    this.panel.querySelectorAll('.ai-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleAction(action);
      });
    });
    
    // Analyze button
    this.panel.querySelector('.ai-analyze-btn').addEventListener('click', () => {
      this.handleAction('analyze');
    });
    
    // Retry button
    this.panel.querySelector('.retry-btn').addEventListener('click', () => {
      this.retry();
    });
    
    // Prompt textarea - auto-resize
    const promptTextarea = this.panel.querySelector('#ai-prompt');
    promptTextarea.addEventListener('input', () => {
      promptTextarea.style.height = 'auto';
      promptTextarea.style.height = promptTextarea.scrollHeight + 'px';
    });
    
    // Debounced suggestion updates
    this.updateSuggestions = debounce(() => {
      if (this.getCurrentQuestion()) {
        this.getSuggestions();
      }
    }, 1000);
  }
  
  createFloatingButton() {
    this.floatingBtn = document.createElement('button');
    this.floatingBtn.className = 'ai-helper-floating-btn';
    this.floatingBtn.innerHTML = '<i class="fas fa-robot"></i>';
    this.floatingBtn.title = 'Open AI Assistant';
    
    this.floatingBtn.addEventListener('click', () => {
      this.show();
    });
    
    document.body.appendChild(this.floatingBtn);
  }
  
  show() {
    if (!document.body.contains(this.panel)) {
      document.body.appendChild(this.panel);
    }
    
    this.panel.classList.add('show');
    this.floatingBtn.classList.add('hidden');
    
    // Focus on prompt
    setTimeout(() => {
      this.panel.querySelector('#ai-prompt').focus();
    }, 300);
    
    // Update context
    this.updateContext();
  }
  
  hide() {
    this.panel.classList.remove('show');
    this.floatingBtn.classList.remove('hidden');
    
    // Clear any ongoing requests
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }
    
    // Reset UI
    this.resetUI();
  }
  
  updateContext() {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion) {
      // Update UI based on current question
      const prompt = this.panel.querySelector('#ai-prompt');
      prompt.placeholder = `Improve "${currentQuestion.title}" or describe a new question...`;
      
      // Enable/disable buttons
      this.panel.querySelector('[data-action="improve"]').disabled = false;
      this.panel.querySelector('[data-action="suggest"]').disabled = 
        !['dropdown', 'radiogroup', 'checkbox'].includes(currentQuestion.getType());
    } else {
      // Reset to default state
      this.panel.querySelector('[data-action="improve"]').disabled = true;
      this.panel.querySelector('[data-action="suggest"]').disabled = true;
    }
  }
  
  getCurrentQuestion() {
    // Get currently selected question in the designer
    return this.survey.currentQuestion || this.survey.selectedElement;
  }
  
  handleAction(action) {
    const prompt = this.panel.querySelector('#ai-prompt').value.trim();
    
    switch (action) {
      case 'generate':
        if (!prompt) {
          notifications.warning('Please describe the question you want to create');
          return;
        }
        this.generateQuestion(prompt);
        break;
        
      case 'improve':
        this.improveQuestion(prompt);
        break;
        
      case 'suggest':
        this.suggestOptions(prompt);
        break;
        
      case 'analyze':
        this.analyzeSurvey();
        break;
    }
  }
  
  async generateQuestion(prompt) {
    if (this.isProcessing) return;
    
    this.showLoading();
    
    try {
      const context = this.getContextData();
      const response = await this.callAI({
        action: 'generate_question',
        prompt: prompt,
        context: context,
        surveyTitle: this.survey.title,
        existingQuestions: this.getExistingQuestions()
      });
      
      if (response.success && response.question) {
        // Add the generated question to the survey
        this.addQuestionToSurvey(response.question);
        
        notifications.success('Question generated successfully!');
        
        // Show suggestions if any
        if (response.suggestions) {
          this.showSuggestions(response.suggestions);
        }
        
        // Clear prompt
        this.panel.querySelector('#ai-prompt').value = '';
      } else {
        throw new Error(response.error || 'Failed to generate question');
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }
  
  async improveQuestion(additionalPrompt = '') {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      notifications.warning('Please select a question to improve');
      return;
    }
    
    if (this.isProcessing) return;
    
    this.showLoading();
    
    try {
      const response = await this.callAI({
        action: 'improve_question',
        question: this.serializeQuestion(currentQuestion),
        additionalPrompt: additionalPrompt,
        context: this.getContextData(),
        surveyTitle: this.survey.title
      });
      
      if (response.success && response.improvements) {
        // Apply improvements
        this.applyImprovements(currentQuestion, response.improvements);
        
        notifications.success('Question improved successfully!');
        
        // Show suggestions
        if (response.suggestions) {
          this.showSuggestions(response.suggestions);
        }
      } else {
        throw new Error(response.error || 'Failed to improve question');
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }
  
  async suggestOptions(additionalPrompt = '') {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      notifications.warning('Please select a question to get suggestions');
      return;
    }
    
    const questionType = currentQuestion.getType();
    if (!['dropdown', 'radiogroup', 'checkbox'].includes(questionType)) {
      notifications.info('Option suggestions are only available for choice questions');
      return;
    }
    
    if (this.isProcessing) return;
    
    this.showLoading();
    
    try {
      const response = await this.callAI({
        action: 'suggest_options',
        question: this.serializeQuestion(currentQuestion),
        additionalPrompt: additionalPrompt,
        context: this.getContextData(),
        surveyTitle: this.survey.title
      });
      
      if (response.success && response.options) {
        // Show options for user to select
        this.showOptionSuggestions(currentQuestion, response.options);
      } else {
        throw new Error(response.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }
  
  async analyzeSurvey() {
    if (this.isProcessing) return;
    
    this.showLoading('Analyzing survey structure...');
    
    try {
      const response = await this.callAI({
        action: 'analyze_survey',
        survey: this.serializeSurvey(),
        requestAnalysis: {
          structure: true,
          completeness: true,
          accessibility: true,
          suggestions: true
        }
      }, this.apiConfig.summaryEndpoint);
      
      if (response.success && response.analysis) {
        // Show analysis results
        this.showAnalysisResults(response.analysis);
      } else {
        throw new Error(response.error || 'Failed to analyze survey');
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }
  
  async callAI(data, endpoint = null) {
    const controller = new AbortController();
    this.currentRequest = controller;
    
    try {
      const response = await fetch(endpoint || this.apiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        timeout: this.apiConfig.timeout
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    } finally {
      this.currentRequest = null;
    }
  }
  
  addQuestionToSurvey(questionData) {
    // Create new question
    const question = this.survey.currentPage.addNewQuestion(
      questionData.type || 'text',
      questionData.name || this.generateQuestionName()
    );
    
    // Apply properties
    Object.keys(questionData).forEach(key => {
      if (key !== 'type' && key !== 'name') {
        question[key] = questionData[key];
      }
    });
    
    // Mark as AI generated
    question.aiGenerated = true;
    
    // Select the new question
    this.survey.selectedElement = question;
    
    // Trigger update
    this.survey.onPropertyValueChangedCallback(
      questionData.name,
      questionData,
      null,
      null
    );
  }
  
  applyImprovements(question, improvements) {
    // Apply each improvement
    Object.keys(improvements).forEach(key => {
      if (question[key] !== undefined) {
        const oldValue = question[key];
        question[key] = improvements[key];
        
        // Trigger property change
        this.survey.onPropertyValueChangedCallback(
          key,
          improvements[key],
          oldValue,
          question
        );
      }
    });
    
    // Mark as AI improved
    question.aiGenerated = true;
  }
  
  showSuggestions(suggestions) {
    const suggestionsDiv = this.panel.querySelector('.ai-helper-suggestions');
    const suggestionsList = suggestionsDiv.querySelector('.suggestions-list');
    
    // Clear previous suggestions
    suggestionsList.innerHTML = '';
    
    // Add new suggestions
    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <div class="suggestion-content">
          <h5>${suggestion.title}</h5>
          <p>${suggestion.description}</p>
        </div>
        <button class="apply-suggestion-btn" title="Apply">
          <i class="fas fa-check"></i>
        </button>
      `;
      
      // Apply suggestion on click
      item.querySelector('.apply-suggestion-btn').addEventListener('click', () => {
        this.applySuggestion(suggestion);
      });
      
      suggestionsList.appendChild(item);
    });
    
    // Show suggestions panel
    suggestionsDiv.style.display = 'block';
  }
  
  showOptionSuggestions(question, options) {
    const suggestionsDiv = this.panel.querySelector('.ai-helper-suggestions');
    const suggestionsList = suggestionsDiv.querySelector('.suggestions-list');
    
    // Clear previous suggestions
    suggestionsList.innerHTML = '';
    
    // Create options selector
    const selector = document.createElement('div');
    selector.className = 'options-selector';
    selector.innerHTML = `
      <h4>Select options to add:</h4>
      <div class="options-list">
        ${options.map((option, index) => `
          <label class="option-item">
            <input type="checkbox" value="${index}" checked>
            <span>${option.text}</span>
          </label>
        `).join('')}
      </div>
      <div class="options-actions">
        <button class="btn primary apply-options">Apply Selected</button>
        <button class="btn cancel-options">Cancel</button>
      </div>
    `;
    
    // Handle apply
    selector.querySelector('.apply-options').addEventListener('click', () => {
      const selected = Array.from(selector.querySelectorAll('input:checked'))
        .map(input => options[parseInt(input.value)]);
      
      if (selected.length > 0) {
        // Apply selected options
        question.choices = [...(question.choices || []), ...selected];
        notifications.success(`Added ${selected.length} options`);
        
        // Hide suggestions
        suggestionsDiv.style.display = 'none';
      }
    });
    
    // Handle cancel
    selector.querySelector('.cancel-options').addEventListener('click', () => {
      suggestionsDiv.style.display = 'none';
    });
    
    suggestionsList.appendChild(selector);
    suggestionsDiv.style.display = 'block';
  }
  
  showAnalysisResults(analysis) {
    // Create analysis modal
    const modal = document.createElement('div');
    modal.className = 'ai-analysis-modal';
    modal.innerHTML = `
      <div class="ai-analysis-content">
        <div class="ai-analysis-header">
          <h2>Survey Analysis Results</h2>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="ai-analysis-body">
          ${this.renderAnalysisContent(analysis)}
        </div>
        <div class="ai-analysis-footer">
          <button class="btn primary">Close</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('.btn.primary').addEventListener('click', () => {
      modal.remove();
    });
    
    // Add to body
    document.body.appendChild(modal);
    
    // Show with animation
    setTimeout(() => modal.classList.add('show'), 10);
  }
  
  renderAnalysisContent(analysis) {
    let html = '<div class="analysis-sections">';
    
    // Structure analysis
    if (analysis.structure) {
      html += `
        <div class="analysis-section">
          <h3><i class="fas fa-sitemap"></i> Structure</h3>
          <div class="analysis-metrics">
            <div class="metric">
              <span class="label">Total Questions:</span>
              <span class="value">${analysis.structure.totalQuestions}</span>
            </div>
            <div class="metric">
              <span class="label">Pages:</span>
              <span class="value">${analysis.structure.pageCount}</span>
            </div>
            <div class="metric">
              <span class="label">Question Types:</span>
              <span class="value">${analysis.structure.questionTypes.join(', ')}</span>
            </div>
          </div>
        </div>
      `;
    }
    
    // Completeness analysis
    if (analysis.completeness) {
      const score = analysis.completeness.score;
      const scoreClass = score >= 80 ? 'good' : score >= 60 ? 'fair' : 'poor';
      
      html += `
        <div class="analysis-section">
          <h3><i class="fas fa-check-circle"></i> Completeness</h3>
          <div class="completeness-score ${scoreClass}">
            <div class="score-value">${score}%</div>
            <div class="score-label">Complete</div>
          </div>
          <ul class="completeness-issues">
            ${analysis.completeness.issues.map(issue => 
              `<li><i class="fas fa-exclamation-triangle"></i> ${issue}</li>`
            ).join('')}
          </ul>
        </div>
      `;
    }
    
    // Accessibility analysis
    if (analysis.accessibility) {
      html += `
        <div class="analysis-section">
          <h3><i class="fas fa-universal-access"></i> Accessibility</h3>
          <ul class="accessibility-checks">
            ${analysis.accessibility.checks.map(check => `
              <li class="${check.passed ? 'passed' : 'failed'}">
                <i class="fas fa-${check.passed ? 'check' : 'times'}"></i>
                ${check.description}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
    
    // Suggestions
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      html += `
        <div class="analysis-section">
          <h3><i class="fas fa-lightbulb"></i> Suggestions</h3>
          <div class="suggestions-list">
            ${analysis.suggestions.map(suggestion => `
              <div class="suggestion-card">
                <h4>${suggestion.title}</h4>
                <p>${suggestion.description}</p>
                ${suggestion.action ? `
                  <button class="apply-suggestion-btn" onclick="aiHelper.applySuggestion(${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
                    Apply Suggestion
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
  
  applySuggestion(suggestion) {
    if (suggestion.action) {
      try {
        // Execute the suggestion action
        if (typeof suggestion.action === 'function') {
          suggestion.action(this.survey);
        } else if (suggestion.action.type === 'addQuestion') {
          this.addQuestionToSurvey(suggestion.action.question);
        } else if (suggestion.action.type === 'modifyQuestion') {
          const question = this.survey.getQuestionByName(suggestion.action.questionName);
          if (question) {
            this.applyImprovements(question, suggestion.action.changes);
          }
        }
        
        notifications.success('Suggestion applied successfully!');
      } catch (error) {
        notifications.error('Failed to apply suggestion: ' + error.message);
      }
    }
  }
  
  showLoading(message = 'Processing...') {
    this.isProcessing = true;
    const loadingDiv = this.panel.querySelector('.ai-helper-loading');
    loadingDiv.querySelector('p').textContent = message;
    loadingDiv.style.display = 'block';
    
    // Hide other panels
    this.panel.querySelector('.ai-helper-suggestions').style.display = 'none';
    this.panel.querySelector('.ai-helper-error').style.display = 'none';
    
    // Disable buttons
    this.panel.querySelectorAll('button').forEach(btn => {
      if (!btn.classList.contains('ai-helper-close')) {
        btn.disabled = true;
      }
    });
  }
  
  hideLoading() {
    this.isProcessing = false;
    this.panel.querySelector('.ai-helper-loading').style.display = 'none';
    
    // Enable buttons
    this.panel.querySelectorAll('button').forEach(btn => {
      btn.disabled = false;
    });
    
    // Update context
    this.updateContext();
  }
  
  showError(message) {
    const errorDiv = this.panel.querySelector('.ai-helper-error');
    errorDiv.querySelector('.error-message').textContent = message;
    errorDiv.style.display = 'block';
    
    // Store last action for retry
    this.lastAction = this.currentAction;
  }
  
  retry() {
    if (this.lastAction) {
      this.handleAction(this.lastAction);
    }
  }
  
  resetUI() {
    this.panel.querySelector('#ai-prompt').value = '';
    this.panel.querySelector('.ai-helper-suggestions').style.display = 'none';
    this.panel.querySelector('.ai-helper-loading').style.display = 'none';
    this.panel.querySelector('.ai-helper-error').style.display = 'none';
  }
  
  // Helper methods
  getContextData() {
    return {
      surveyType: this.survey.surveyType || 'general',
      currentPage: this.survey.currentPage?.name,
      questionCount: this.survey.getAllQuestions().length,
      pageCount: this.survey.pages.length,
      hasConditionalLogic: this.hasConditionalLogic(),
      theme: this.survey.theme || 'default'
    };
  }
  
  getExistingQuestions() {
    return this.survey.getAllQuestions().map(q => ({
      name: q.name,
      type: q.getType(),
      title: q.title
    }));
  }
  
  serializeQuestion(question) {
    return {
      name: question.name,
      type: question.getType(),
      title: question.title,
      description: question.description,
      isRequired: question.isRequired,
      choices: question.choices,
      hasOther: question.hasOther,
      validators: question.validators,
      visibleIf: question.visibleIf,
      enableIf: question.enableIf
    };
  }
  
  serializeSurvey() {
    return {
      title: this.survey.title,
      description: this.survey.description,
      pages: this.survey.pages.map(page => ({
        name: page.name,
        title: page.title,
        questions: page.questions.map(q => this.serializeQuestion(q))
      })),
      calculatedValues: this.survey.calculatedValues,
      triggers: this.survey.triggers
    };
  }
  
  hasConditionalLogic() {
    return this.survey.getAllQuestions().some(q => 
      q.visibleIf || q.enableIf || q.validators?.length > 0
    );
  }
  
  generateQuestionName() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `question_${timestamp}_${random}`;
  }
  
  // Public API
  destroy() {
    // Remove UI elements
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    
    if (this.floatingBtn.parentNode) {
      this.floatingBtn.parentNode.removeChild(this.floatingBtn);
    }
    
    // Clear references
    this.survey = null;
    this.currentRequest = null;
    this.suggestions.clear();
  }
}

// Export singleton instance creator
export function createAIHelper(survey, config) {
  return new AIHelper(survey, config);
}

// Export default configuration
export const AI_HELPER_CONFIG = {
  endpoint: '/api/ai/chat',
  summaryEndpoint: '/api/ai/summary',
  maxRetries: 3,
  timeout: 30000,
  features: {
    generateQuestion: true,
    improveQuestion: true,
    suggestOptions: true,
    analyzeSurvey: true
  },
  prompts: {
    generateQuestion: 'Generate a survey question based on: ',
    improveQuestion: 'Improve this question: ',
    suggestOptions: 'Suggest answer options for: ',
    analyzeSurvey: 'Analyze this survey for improvements'
  }
};