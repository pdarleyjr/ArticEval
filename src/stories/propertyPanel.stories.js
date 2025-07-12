import '../styles/main.scss';

export default {
  title: 'Components/PropertyPanel',
  parameters: {
    docs: {
      description: {
        component:
          'Property panel for editing form element properties. Displays different property controls based on the selected element type.'
      }
    }
  },
  argTypes: {
    elementType: {
      control: 'select',
      options: ['text', 'radiogroup', 'checkbox', 'dropdown', 'rating', 'comment'],
      description: 'Type of the selected element',
      defaultValue: 'text'
    },
    isCollapsed: {
      control: 'boolean',
      description: 'Whether the panel starts collapsed',
      defaultValue: false
    }
  }
};

const Template = (args) => {
  const container = document.createElement('div');
  container.className = 'property-panel-demo';
  container.innerHTML = `
    <style>
      .property-panel-demo {
        display: flex;
        gap: 20px;
        padding: 20px;
        background: #f5f5f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        height: 600px;
      }
      
      .canvas-area {
        flex: 1;
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .selected-element {
        background: #e7f5ff;
        border: 2px solid #339af0;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .element-icon {
        font-size: 24px;
      }
      
      .element-info h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        color: #212529;
      }
      
      .element-info p {
        margin: 0;
        font-size: 14px;
        color: #6c757d;
      }
      
      #propertiesPanel {
        width: 320px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        overflow: hidden;
      }
      
      #propertiesPanel.collapsed {
        width: 48px;
      }
      
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      
      .toggle-btn {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #6c757d;
        transition: transform 0.3s ease;
      }
      
      .collapsed .toggle-btn {
        transform: rotate(180deg);
      }
      
      .collapsed .panel-title {
        display: none;
      }
      
      .properties-content {
        padding: 16px;
        max-height: 520px;
        overflow-y: auto;
      }
      
      .collapsed .properties-content {
        display: none;
      }
      
      .property-group {
        margin-bottom: 20px;
      }
      
      .property-group h4 {
        font-size: 13px;
        font-weight: 600;
        color: #495057;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .property-field {
        margin-bottom: 16px;
      }
      
      .property-label {
        display: block;
        font-size: 13px;
        color: #495057;
        margin-bottom: 6px;
        font-weight: 500;
      }
      
      .property-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.15s ease;
      }
      
      .property-control:focus {
        outline: none;
        border-color: #339af0;
        box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.1);
      }
      
      .property-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .property-checkbox input {
        width: auto;
        margin: 0;
      }
      
      .property-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23495057' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 32px;
      }
      
      .property-textarea {
        resize: vertical;
        min-height: 80px;
      }
      
      .no-selection {
        text-align: center;
        color: #868e96;
        padding: 40px 20px;
        font-size: 14px;
      }
      
      .no-selection svg {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.3;
      }
    </style>
    
    <div class="canvas-area">
      <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 18px;">Form Canvas</h2>
      <div class="selected-element">
        <span class="element-icon">${getElementIcon(args.elementType)}</span>
        <div class="element-info">
          <h3>${getElementName(args.elementType)}</h3>
          <p>Click to select and edit properties</p>
        </div>
      </div>
      <p style="color: #6c757d; font-size: 14px;">
        The selected element's properties will appear in the panel on the right.
      </p>
    </div>
    
    <div id="propertiesPanel" class="${args.isCollapsed ? 'collapsed' : ''}">
      <div class="panel-header">
        <span class="panel-title">Properties</span>
        <button class="toggle-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12.707 10l-4.354 4.354a.5.5 0 01-.707-.707L11.293 10 7.646 5.646a.5.5 0 01.707-.707L12.707 10z"/>
          </svg>
        </button>
      </div>
      <div class="properties-content">
        ${renderProperties(args.elementType)}
      </div>
    </div>
  `;

  // Add toggle functionality
  setTimeout(() => {
    const panel = container.querySelector('#propertiesPanel');
    const toggleBtn = container.querySelector('.toggle-btn');

    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
    });

    // Add input change listeners
    const inputs = container.querySelectorAll('.property-control');
    inputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        console.log(`Property changed: ${input.name} = ${input.value}`);
      });
    });
  }, 100);

  return container;
};

function getElementIcon(type) {
  const icons = {
    text: '📝',
    radiogroup: '🔘',
    checkbox: '☑️',
    dropdown: '📋',
    rating: '⭐',
    comment: '💬'
  };
  return icons[type] || '📄';
}

function getElementName(type) {
  const names = {
    text: 'Text Input',
    radiogroup: 'Radio Group',
    checkbox: 'Checkbox',
    dropdown: 'Dropdown',
    rating: 'Rating Scale',
    comment: 'Comment Box'
  };
  return names[type] || 'Form Element';
}

function renderProperties(elementType) {
  const commonProperties = `
    <div class="property-group">
      <h4>General</h4>
      <div class="property-field">
        <label class="property-label">Name</label>
        <input type="text" class="property-control" name="name" value="question1" />
      </div>
      <div class="property-field">
        <label class="property-label">Title</label>
        <input type="text" class="property-control" name="title" value="Enter your question text here" />
      </div>
      <div class="property-field">
        <label class="property-label">Description</label>
        <textarea class="property-control property-textarea" name="description" placeholder="Optional description or help text"></textarea>
      </div>
      <div class="property-field property-checkbox">
        <input type="checkbox" id="isRequired" name="isRequired" />
        <label for="isRequired" class="property-label" style="margin-bottom: 0;">Required</label>
      </div>
    </div>
  `;

  const typeSpecificProperties = {
    text: `
      <div class="property-group">
        <h4>Text Input Settings</h4>
        <div class="property-field">
          <label class="property-label">Placeholder</label>
          <input type="text" class="property-control" name="placeholder" placeholder="Enter placeholder text" />
        </div>
        <div class="property-field">
          <label class="property-label">Input Type</label>
          <select class="property-control property-select" name="inputType">
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="tel">Phone</option>
            <option value="number">Number</option>
            <option value="url">URL</option>
          </select>
        </div>
        <div class="property-field">
          <label class="property-label">Max Length</label>
          <input type="number" class="property-control" name="maxLength" placeholder="No limit" />
        </div>
      </div>
    `,
    radiogroup: `
      <div class="property-group">
        <h4>Radio Options</h4>
        <div class="property-field">
          <label class="property-label">Choices (one per line)</label>
          <textarea class="property-control property-textarea" name="choices" rows="5">Option 1
Option 2
Option 3
Other (please specify)</textarea>
        </div>
        <div class="property-field">
          <label class="property-label">Layout</label>
          <select class="property-control property-select" name="layout">
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
        <div class="property-field property-checkbox">
          <input type="checkbox" id="hasOther" name="hasOther" />
          <label for="hasOther" class="property-label" style="margin-bottom: 0;">Include "Other" option</label>
        </div>
      </div>
    `,
    checkbox: `
      <div class="property-group">
        <h4>Checkbox Settings</h4>
        <div class="property-field">
          <label class="property-label">Label</label>
          <input type="text" class="property-control" name="label" value="Check this box to agree" />
        </div>
        <div class="property-field">
          <label class="property-label">Value when checked</label>
          <input type="text" class="property-control" name="valueTrue" value="true" />
        </div>
        <div class="property-field">
          <label class="property-label">Value when unchecked</label>
          <input type="text" class="property-control" name="valueFalse" value="false" />
        </div>
      </div>
    `,
    dropdown: `
      <div class="property-group">
        <h4>Dropdown Options</h4>
        <div class="property-field">
          <label class="property-label">Choices (one per line)</label>
          <textarea class="property-control property-textarea" name="choices" rows="5">Select an option
Choice 1
Choice 2
Choice 3</textarea>
        </div>
        <div class="property-field property-checkbox">
          <input type="checkbox" id="allowClear" name="allowClear" />
          <label for="allowClear" class="property-label" style="margin-bottom: 0;">Allow clearing selection</label>
        </div>
        <div class="property-field property-checkbox">
          <input type="checkbox" id="searchEnabled" name="searchEnabled" />
          <label for="searchEnabled" class="property-label" style="margin-bottom: 0;">Enable search</label>
        </div>
      </div>
    `,
    rating: `
      <div class="property-group">
        <h4>Rating Settings</h4>
        <div class="property-field">
          <label class="property-label">Maximum Rating</label>
          <input type="number" class="property-control" name="rateMax" value="5" min="3" max="10" />
        </div>
        <div class="property-field">
          <label class="property-label">Rate Type</label>
          <select class="property-control property-select" name="rateType">
            <option value="stars">Stars</option>
            <option value="smileys">Smileys</option>
            <option value="numbers">Numbers</option>
          </select>
        </div>
        <div class="property-field">
          <label class="property-label">Min Description</label>
          <input type="text" class="property-control" name="minRateDescription" placeholder="e.g., Poor" />
        </div>
        <div class="property-field">
          <label class="property-label">Max Description</label>
          <input type="text" class="property-control" name="maxRateDescription" placeholder="e.g., Excellent" />
        </div>
      </div>
    `,
    comment: `
      <div class="property-group">
        <h4>Comment Box Settings</h4>
        <div class="property-field">
          <label class="property-label">Placeholder</label>
          <input type="text" class="property-control" name="placeholder" placeholder="Enter your comments here..." />
        </div>
        <div class="property-field">
          <label class="property-label">Rows</label>
          <input type="number" class="property-control" name="rows" value="4" min="2" max="20" />
        </div>
        <div class="property-field">
          <label class="property-label">Max Length</label>
          <input type="number" class="property-control" name="maxLength" placeholder="No limit" />
        </div>
        <div class="property-field property-checkbox">
          <input type="checkbox" id="autoGrow" name="autoGrow" checked />
          <label for="autoGrow" class="property-label" style="margin-bottom: 0;">Auto-grow with content</label>
        </div>
      </div>
    `
  };

  return commonProperties + (typeSpecificProperties[elementType] || '');
}

export const Default = Template.bind({});
Default.args = {
  elementType: 'text',
  isCollapsed: false
};

export const RadioGroupProperties = Template.bind({});
RadioGroupProperties.args = {
  elementType: 'radiogroup',
  isCollapsed: false
};

export const CollapsedPanel = Template.bind({});
CollapsedPanel.args = {
  elementType: 'dropdown',
  isCollapsed: true
};

export const RatingProperties = Template.bind({});
RatingProperties.args = {
  elementType: 'rating',
  isCollapsed: false
};

export const CommentBoxProperties = Template.bind({});
CommentBoxProperties.args = {
  elementType: 'comment',
  isCollapsed: false
};

export const CheckboxProperties = Template.bind({});
CheckboxProperties.args = {
  elementType: 'checkbox',
  isCollapsed: false
};
