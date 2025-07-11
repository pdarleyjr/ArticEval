import { AIHelper } from '../components/aiHelper.js';

// Mock survey for stories
const mockSurvey = {
  getAllQuestions: () => [
    { name: 'q1', title: 'Sample question 1' },
    { name: 'q2', title: 'Sample question 2' }
  ],
  currentPage: {
    addNewQuestion: () => ({ name: 'newQuestion', title: '' })
  }
};

// Mock API config
const mockApiConfig = {
  endpoint: '/api/ai/chat',
  summaryEndpoint: '/api/ai/summary',
  maxRetries: 3,
  timeout: 30000
};

export default {
  title: 'FormBuilder/AIHelper',
  tags: ['autodocs'],
  render: (args) => {
    // Create container
    const container = document.createElement('div');
    container.style.height = '600px';
    container.style.position = 'relative';
    container.innerHTML = `
      <div style="padding: 20px; background: #f5f5f5; border-radius: 8px;">
        <h3>AI Assistant Demo</h3>
        <p>Click the button below to open the AI Helper panel</p>
        <button id="open-ai-helper" class="btn btn-primary">
          <i class="fas fa-robot"></i> Open AI Assistant
        </button>
      </div>
      <div id="ai-helper-container"></div>
    `;
    
    // Initialize AIHelper
    const aiHelper = new AIHelper(mockSurvey, {
      ...mockApiConfig,
      ...args.apiConfig
    });
    
    // Add event listener to open button
    const openButton = container.querySelector('#open-ai-helper');
    openButton.addEventListener('click', () => {
      const panel = container.querySelector('.ai-helper-panel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });
    
    // Append AI helper panel to container
    const helperContainer = container.querySelector('#ai-helper-container');
    if (aiHelper.panel) {
      helperContainer.appendChild(aiHelper.panel);
    }
    
    return container;
  },
  argTypes: {
    apiConfig: {
      control: 'object',
      description: 'API configuration for AI endpoints'
    }
  },
  args: {
    apiConfig: mockApiConfig
  },
  parameters: {
    docs: {
      description: {
        component: `
The AI Helper component provides intelligent assistance for form creation:
- Generate questions based on natural language prompts
- Improve existing questions for clarity and effectiveness
- Suggest answer options for multiple choice questions
- Analyze entire surveys for coherence and completeness

The component integrates with AI APIs to provide real-time suggestions and improvements.
        `
      }
    }
  }
};

// Default AI Helper
export const Default = {
  args: {}
};

// AI Helper with custom endpoints
export const CustomEndpoints = {
  args: {
    apiConfig: {
      endpoint: '/custom/ai/chat',
      summaryEndpoint: '/custom/ai/summary',
      maxRetries: 5,
      timeout: 60000
    }
  }
};

// AI Helper in loading state
export const LoadingState = {
  render: (args) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="ai-helper-panel" style="display: block;">
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
            >Create a satisfaction rating question</textarea>
            <div class="ai-helper-actions">
              <button class="ai-action-btn primary" disabled>
                <i class="fas fa-spinner fa-spin"></i> Generating...
              </button>
            </div>
          </div>
          <div class="ai-helper-suggestions">
            <div class="ai-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>AI is thinking...</span>
            </div>
          </div>
        </div>
      </div>
    `;
    return container;
  }
};

// AI Helper with suggestions
export const WithSuggestions = {
  render: (args) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="ai-helper-panel" style="display: block;">
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
            >Create a satisfaction rating question</textarea>
            <div class="ai-helper-actions">
              <button class="ai-action-btn primary">
                <i class="fas fa-magic"></i> Generate Question
              </button>
            </div>
          </div>
          <div class="ai-helper-suggestions">
            <h4>Suggested Questions:</h4>
            <div class="suggestion-card">
              <p><strong>How satisfied are you with our service?</strong></p>
              <div class="suggestion-options">
                <span class="option-tag">Very Satisfied</span>
                <span class="option-tag">Satisfied</span>
                <span class="option-tag">Neutral</span>
                <span class="option-tag">Dissatisfied</span>
                <span class="option-tag">Very Dissatisfied</span>
              </div>
              <button class="btn btn-sm btn-primary">Use This Question</button>
            </div>
            <div class="suggestion-card">
              <p><strong>Rate your overall experience</strong></p>
              <div class="suggestion-options">
                <span class="option-tag">1 - Poor</span>
                <span class="option-tag">2 - Fair</span>
                <span class="option-tag">3 - Good</span>
                <span class="option-tag">4 - Very Good</span>
                <span class="option-tag">5 - Excellent</span>
              </div>
              <button class="btn btn-sm btn-primary">Use This Question</button>
            </div>
          </div>
        </div>
      </div>
    `;
    return container;
  }
};

// AI Helper error state
export const ErrorState = {
  render: (args) => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="ai-helper-panel" style="display: block;">
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
            >Create a satisfaction rating question</textarea>
            <div class="ai-helper-actions">
              <button class="ai-action-btn primary">
                <i class="fas fa-magic"></i> Generate Question
              </button>
            </div>
          </div>
          <div class="ai-helper-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Unable to connect to AI service. Please try again later.</p>
            <button class="btn btn-sm btn-secondary">Retry</button>
          </div>
        </div>
      </div>
    `;
    return container;
  }
};