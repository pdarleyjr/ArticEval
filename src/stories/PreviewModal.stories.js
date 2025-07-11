import { PreviewModal } from '../components/PreviewModal.js';

// Mock survey data for stories
const mockSurvey = {
  getJSON: () => ({
    title: "Sample Survey",
    pages: [{
      name: "page1",
      elements: [{
        type: "text",
        name: "question1",
        title: "What is your name?"
      }, {
        type: "radiogroup",
        name: "question2",
        title: "How satisfied are you?",
        choices: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"]
      }]
    }]
  })
};

export default {
  title: 'FormBuilder/PreviewModal',
  tags: ['autodocs'],
  render: (args) => {
    // Create container
    const container = document.createElement('div');
    container.style.height = '600px';
    container.style.position = 'relative';
    
    // Create button to open modal
    const button = document.createElement('button');
    button.textContent = 'Open Preview';
    button.className = 'btn btn-primary';
    
    // Initialize PreviewModal
    const previewModal = new PreviewModal(mockSurvey, args);
    
    button.addEventListener('click', () => {
      previewModal.open();
    });
    
    container.appendChild(button);
    
    return container;
  },
  argTypes: {
    theme: {
      control: { type: 'select' },
      options: ['modern', 'classic', 'minimal'],
      description: 'Visual theme for the preview'
    },
    showCompleteButton: {
      control: 'boolean',
      description: 'Show complete button in preview'
    },
    showProgressBar: {
      control: 'boolean',
      description: 'Show progress bar in preview'
    },
    fullscreen: {
      control: 'boolean',
      description: 'Open preview in fullscreen mode'
    },
    allowEdit: {
      control: 'boolean',
      description: 'Allow editing in preview mode'
    }
  },
  args: {
    theme: 'modern',
    showCompleteButton: true,
    showProgressBar: true,
    fullscreen: true,
    allowEdit: false
  }
};

// Default preview
export const Default = {
  args: {}
};

// Preview with editing enabled
export const EditablePreview = {
  args: {
    allowEdit: true
  }
};

// Minimal theme preview
export const MinimalTheme = {
  args: {
    theme: 'minimal',
    showProgressBar: false
  }
};

// Non-fullscreen preview
export const WindowedPreview = {
  args: {
    fullscreen: false
  }
};

// Preview without complete button
export const NoCompleteButton = {
  args: {
    showCompleteButton: false
  }
};