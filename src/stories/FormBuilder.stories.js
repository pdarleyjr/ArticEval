import { FormBuilder } from '../index.js';
import './stories.css';

// Mock data
const mockSurveyData = {
  logoPosition: 'right',
  pages: [
    {
      name: 'page1',
      elements: [
        {
          type: 'text',
          name: 'name',
          title: 'What is your name?',
          isRequired: true
        },
        {
          type: 'radiogroup',
          name: 'experience',
          title: 'How would you rate your experience?',
          choices: ['Excellent', 'Good', 'Fair', 'Poor']
        }
      ]
    }
  ]
};

export default {
  title: 'Form Builder/FormBuilder',
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['defaultV2', 'modern', 'bootstrap'],
      description: 'SurveyJS theme'
    },
    showToolbox: {
      control: 'boolean',
      description: 'Show the element toolbox'
    },
    showPropertyGrid: {
      control: 'boolean',
      description: 'Show the property grid'
    },
    enableAutoSave: {
      control: 'boolean',
      description: 'Enable auto-save functionality'
    },
    autoSaveInterval: {
      control: 'number',
      description: 'Auto-save interval in seconds',
      if: { arg: 'enableAutoSave', truthy: true }
    }
  }
};

// Helper to create FormBuilder container
const createFormBuilderContainer = () => {
  const container = document.createElement('div');
  container.className = 'form-builder-container';
  container.innerHTML = `
    <style>
      .form-builder-container {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
      }
      
      .form-builder-header {
        background: white;
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .form-builder-main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .form-builder-sidebar {
        width: 300px;
        background: white;
        border-right: 1px solid #e0e0e0;
        overflow-y: auto;
      }
      
      .form-builder-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .form-builder-canvas {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
      }
      
      .form-builder-properties {
        width: 350px;
        background: white;
        border-left: 1px solid #e0e0e0;
        overflow-y: auto;
      }
      
      #surveyCreator {
        height: 100%;
      }
      
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
    
    <div class="form-builder-header">
      <h2>Form Builder</h2>
      <div class="header-actions">
        <button class="btn-save">Save Form</button>
        <button class="btn-preview">Preview</button>
        <button class="btn-ai">AI Assistant</button>
      </div>
    </div>
    
    <div class="form-builder-main">
      <div class="form-builder-sidebar" id="toolbox-container"></div>
      <div class="form-builder-content">
        <div class="form-builder-canvas">
          <div id="surveyCreator"></div>
        </div>
      </div>
      <div class="form-builder-properties" id="property-grid-container"></div>
    </div>
    
    <div class="loading-overlay" id="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  `;

  return container;
};

// Template function
const Template = (args) => {
  const container = createFormBuilderContainer();

  // Mock window.SurveyCreator if not available
  if (!window.Survey || !window.SurveyCreator) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h3>SurveyJS Libraries Not Loaded</h3>
        <p>This story requires SurveyJS Creator libraries to be loaded.</p>
        <p>In a real application, these would be loaded via script tags or imports.</p>
        <button onclick="location.reload()">Reload Page</button>
      </div>
    `;
    return container;
  }

  // Initialize FormBuilder after DOM is ready
  setTimeout(() => {
    try {
      // Hide loading overlay
      const loadingOverlay = container.querySelector('#loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }

      // Create FormBuilder instance
      const formBuilder = new FormBuilder();

      // Mock the initialization since we're in Storybook
      if (args.theme) {
        Survey.StylesManager.applyTheme(args.theme);
      }

      // Configure based on args
      if (!args.showToolbox) {
        const toolbox = container.querySelector('#toolbox-container');
        if (toolbox) {
          toolbox.style.display = 'none';
        }
      }

      if (!args.showPropertyGrid) {
        const propertyGrid = container.querySelector('#property-grid-container');
        if (propertyGrid) {
          propertyGrid.style.display = 'none';
        }
      }

      // Simulate initialization
      const creatorDiv = container.querySelector('#surveyCreator');
      creatorDiv.innerHTML = `
        <div style="padding: 2rem; text-align: center; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3>Form Builder Initialized</h3>
          <p>Theme: ${args.theme || 'defaultV2'}</p>
          <p>Auto-save: ${args.enableAutoSave ? `Enabled (${args.autoSaveInterval}s)` : 'Disabled'}</p>
          <p>Components: ${[args.showToolbox && 'Toolbox', args.showPropertyGrid && 'Properties'].filter(Boolean).join(', ') || 'None'}</p>
          
          <div style="margin-top: 2rem;">
            <h4>Mock Survey Data</h4>
            <pre style="text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(mockSurveyData, null, 2)}
            </pre>
          </div>
        </div>
      `;

      // Add event listeners
      const saveBtn = container.querySelector('.btn-save');
      const previewBtn = container.querySelector('.btn-preview');
      const aiBtn = container.querySelector('.btn-ai');

      saveBtn?.addEventListener('click', () => {
        alert('Save functionality would trigger here');
      });

      previewBtn?.addEventListener('click', () => {
        alert('Preview modal would open here');
      });

      aiBtn?.addEventListener('click', () => {
        alert('AI Assistant would open here');
      });
    } catch (error) {
      console.error('Error initializing FormBuilder:', error);
      const creatorDiv = container.querySelector('#surveyCreator');
      creatorDiv.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: red;">
          <h3>Error Initializing FormBuilder</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }, 100);

  return container;
};

// Stories
export const Default = Template.bind({});
Default.args = {
  theme: 'defaultV2',
  showToolbox: true,
  showPropertyGrid: true,
  enableAutoSave: true,
  autoSaveInterval: 30
};

export const MinimalInterface = Template.bind({});
MinimalInterface.args = {
  theme: 'modern',
  showToolbox: true,
  showPropertyGrid: false,
  enableAutoSave: false
};
MinimalInterface.parameters = {
  docs: {
    description: {
      story: 'Form Builder with minimal interface - toolbox only, no property grid'
    }
  }
};

export const NoAutoSave = Template.bind({});
NoAutoSave.args = {
  theme: 'defaultV2',
  showToolbox: true,
  showPropertyGrid: true,
  enableAutoSave: false
};
NoAutoSave.parameters = {
  docs: {
    description: {
      story: 'Form Builder with auto-save disabled'
    }
  }
};

export const BootstrapTheme = Template.bind({});
BootstrapTheme.args = {
  theme: 'bootstrap',
  showToolbox: true,
  showPropertyGrid: true,
  enableAutoSave: true,
  autoSaveInterval: 60
};
BootstrapTheme.parameters = {
  docs: {
    description: {
      story: 'Form Builder with Bootstrap theme'
    }
  }
};

export const FastAutoSave = Template.bind({});
FastAutoSave.args = {
  theme: 'modern',
  showToolbox: true,
  showPropertyGrid: true,
  enableAutoSave: true,
  autoSaveInterval: 10
};
FastAutoSave.parameters = {
  docs: {
    description: {
      story: 'Form Builder with fast auto-save (10 seconds)'
    }
  }
};

// Integration example
export const WithMockData = () => {
  const container = createFormBuilderContainer();

  setTimeout(() => {
    const loadingOverlay = container.querySelector('#loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }

    // Create a more complex mock visualization
    const creatorDiv = container.querySelector('#surveyCreator');
    creatorDiv.innerHTML = `
      <div style="padding: 2rem;">
        <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 2rem;">
          <h3>Form Builder with Loaded Survey</h3>
          <p>This example shows how the FormBuilder would look with a loaded survey.</p>
          
          <div style="margin-top: 2rem; display: grid; gap: 1rem;">
            <div style="padding: 1rem; background: #f0f0f0; border-radius: 4px;">
              <strong>Page 1</strong>
              <div style="margin-top: 0.5rem;">
                <div style="padding: 0.5rem; background: white; margin-bottom: 0.5rem; border-radius: 4px;">
                  📝 Text Question: "What is your name?" (Required)
                </div>
                <div style="padding: 0.5rem; background: white; border-radius: 4px;">
                  🔘 Radio Group: "How would you rate your experience?"
                </div>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e0e0e0;">
            <h4>Form Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem;">
              <div style="text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #3498db;">1</div>
                <div style="color: #666;">Pages</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #2ecc71;">2</div>
                <div style="color: #666;">Questions</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #e74c3c;">1</div>
                <div style="color: #666;">Required</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #f39c12;">4</div>
                <div style="color: #666;">Choices</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }, 100);

  return container;
};
WithMockData.parameters = {
  docs: {
    description: {
      story: 'Example showing FormBuilder with a loaded survey containing multiple question types'
    }
  }
};
