import '../styles/main.scss';

export default {
  title: 'Components/Preview',
  parameters: {
    docs: {
      description: {
        component:
          'Preview component for displaying form preview with injected CSS styling. Shows how the form will appear to end users.'
      }
    }
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['default', 'modern', 'bootstrap', 'minimal'],
      description: 'Visual theme for the preview',
      defaultValue: 'default'
    },
    formData: {
      control: 'object',
      description: 'Form data to preview',
      defaultValue: {
        title: 'Customer Satisfaction Survey',
        pages: [
          {
            elements: [
              { type: 'text', name: 'name', title: 'Your Name' },
              { type: 'rating', name: 'satisfaction', title: 'How satisfied are you?' }
            ]
          }
        ]
      }
    },
    showModal: {
      control: 'boolean',
      description: 'Show preview in modal',
      defaultValue: true
    }
  }
};

const Template = (args) => {
  const container = document.createElement('div');
  container.className = 'preview-demo';
  container.innerHTML = `
    <style>
      .preview-demo {
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .demo-header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .demo-header h2 {
        margin: 0 0 10px 0;
        font-size: 24px;
        color: #212529;
      }
      
      .demo-header p {
        margin: 0;
        color: #6c757d;
        font-size: 14px;
      }
      
      .preview-button {
        display: block;
        margin: 0 auto 30px;
        padding: 12px 24px;
        background: #339af0;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .preview-button:hover {
        background: #228be6;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(51, 154, 240, 0.3);
      }
      
      .preview-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      }
      
      .preview-modal.show {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .preview-content {
        background: white;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .preview-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #212529;
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        color: #868e96;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .close-button:hover {
        background: #f8f9fa;
        color: #212529;
      }
      
      .preview-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }
      
      .preview-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
      
      .inline-preview {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      .inline-preview-header {
        background: #f8f9fa;
        padding: 16px 20px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .inline-preview-body {
        padding: 20px;
      }
      
      /* Theme-specific styles */
      .theme-default {
        --primary-color: #339af0;
        --text-color: #212529;
        --border-color: #dee2e6;
      }
      
      .theme-modern {
        --primary-color: #6366f1;
        --text-color: #1f2937;
        --border-color: #e5e7eb;
      }
      
      .theme-bootstrap {
        --primary-color: #0d6efd;
        --text-color: #212529;
        --border-color: #dee2e6;
      }
      
      .theme-minimal {
        --primary-color: #000;
        --text-color: #000;
        --border-color: #ccc;
      }
      
      /* Simulated form preview */
      .form-preview {
        color: var(--text-color);
      }
      
      .form-title {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 24px 0;
        color: var(--text-color);
      }
      
      .form-element {
        margin-bottom: 24px;
      }
      
      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--text-color);
      }
      
      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 14px;
      }
      
      .form-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.1);
      }
      
      .rating-container {
        display: flex;
        gap: 8px;
      }
      
      .rating-star {
        font-size: 24px;
        color: #ddd;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      
      .rating-star:hover,
      .rating-star.active {
        color: #ffd43b;
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--border-color);
      }
      
      .form-button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .form-button-primary {
        background: var(--primary-color);
        color: white;
      }
      
      .form-button-primary:hover {
        opacity: 0.9;
      }
      
      .form-button-secondary {
        background: #f8f9fa;
        color: var(--text-color);
        border: 1px solid var(--border-color);
      }
      
      .form-button-secondary:hover {
        background: #e9ecef;
      }
      
      .css-injection-note {
        background: #e7f5ff;
        border: 1px solid #339af0;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 20px;
        font-size: 14px;
        color: #0c5460;
      }
      
      .css-injection-note strong {
        display: block;
        margin-bottom: 4px;
      }
    </style>
    
    <div class="demo-header">
      <h2>Form Preview Component</h2>
      <p>Click the button below to preview the form with the selected theme</p>
    </div>
    
    <button class="preview-button" id="showPreviewBtn">
      <span>👁️ Show Preview</span>
    </button>
    
    ${
  args.showModal
    ? `
      <div class="preview-modal" id="previewModal">
        <div class="preview-content">
          <div class="preview-header">
            <h3 class="preview-title">Form Preview</h3>
            <button class="close-button" id="closePreviewBtn">×</button>
          </div>
          <div class="preview-body">
            ${renderPreviewContent(args)}
          </div>
        </div>
      </div>
    `
    : `
      <div class="inline-preview">
        <div class="inline-preview-header">
          <h3 class="preview-title">Form Preview</h3>
        </div>
        <div class="inline-preview-body">
          ${renderPreviewContent(args)}
        </div>
      </div>
    `
}
  `;

  // Add interactivity
  setTimeout(() => {
    const showBtn = container.querySelector('#showPreviewBtn');
    const modal = container.querySelector('#previewModal');
    const closeBtn = container.querySelector('#closePreviewBtn');

    if (showBtn && modal) {
      showBtn.addEventListener('click', () => {
        modal.classList.add('show');
        // Simulate CSS injection
        console.log('Preview.injectBuilderCSS() called');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        console.log('Preview.close() called');
      });

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
    }

    // Add rating interactivity
    const stars = container.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        stars.forEach((s, i) => {
          s.classList.toggle('active', i <= index);
        });
      });
    });
  }, 100);

  return container;
};

function renderPreviewContent(args) {
  return `
    <div class="css-injection-note">
      <strong>CSS Injection Active</strong>
      The Preview component's injectBuilderCSS() method isolates form styles to prevent conflicts with the page.
    </div>
    
    <div class="form-preview theme-${args.theme}">
      <h1 class="form-title">${args.formData.title}</h1>
      
      ${args.formData.pages[0].elements
    .map((element) => {
      if (element.type === 'text') {
        return `
            <div class="form-element">
              <label class="form-label">${element.title}</label>
              <input type="text" class="form-input" placeholder="Enter your answer here..." />
            </div>
          `;
      } else if (element.type === 'rating') {
        return `
            <div class="form-element">
              <label class="form-label">${element.title}</label>
              <div class="rating-container">
                ${[1, 2, 3, 4, 5].map((i) => '<span class="rating-star">★</span>').join('')}
              </div>
            </div>
          `;
      }
      return '';
    })
    .join('')}
      
      <div class="form-actions">
        <button class="form-button form-button-primary">Submit</button>
        <button class="form-button form-button-secondary">Save Draft</button>
      </div>
    </div>
  `;
}

export const Default = Template.bind({});
Default.args = {
  theme: 'default',
  formData: {
    title: 'Customer Satisfaction Survey',
    pages: [
      {
        elements: [
          { type: 'text', name: 'name', title: 'Your Name' },
          { type: 'rating', name: 'satisfaction', title: 'How satisfied are you with our service?' }
        ]
      }
    ]
  },
  showModal: true
};

export const InlinePreview = Template.bind({});
InlinePreview.args = {
  theme: 'modern',
  formData: {
    title: 'Product Feedback Form',
    pages: [
      {
        elements: [
          { type: 'text', name: 'product', title: 'Which product are you reviewing?' },
          { type: 'rating', name: 'quality', title: 'Rate the product quality' }
        ]
      }
    ]
  },
  showModal: false
};

export const BootstrapTheme = Template.bind({});
BootstrapTheme.args = {
  theme: 'bootstrap',
  formData: {
    title: 'Event Registration',
    pages: [
      {
        elements: [
          { type: 'text', name: 'attendee', title: 'Attendee Name' },
          { type: 'rating', name: 'interest', title: 'How interested are you in this event?' }
        ]
      }
    ]
  },
  showModal: true
};

export const MinimalTheme = Template.bind({});
MinimalTheme.args = {
  theme: 'minimal',
  formData: {
    title: 'Quick Poll',
    pages: [
      {
        elements: [
          { type: 'text', name: 'opinion', title: 'What is your opinion?' },
          { type: 'rating', name: 'agreement', title: 'Rate your agreement' }
        ]
      }
    ]
  },
  showModal: true
};
