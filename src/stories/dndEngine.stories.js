import '../styles/main.scss';

export default {
  title: 'Components/DndEngine',
  parameters: {
    docs: {
      description: {
        component: 'Drag and Drop Engine for adding form elements to the builder canvas.'
      }
    }
  },
  argTypes: {
    elementTypes: {
      control: 'object',
      description: 'Available element types for dragging',
      defaultValue: [
        { type: 'text', label: 'Text Input', icon: '📝' },
        { type: 'radiogroup', label: 'Radio Group', icon: '🔘' },
        { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
        { type: 'dropdown', label: 'Dropdown', icon: '📋' }
      ]
    }
  }
};

const Template = (args) => {
  const container = document.createElement('div');
  container.className = 'dnd-demo-container';
  container.innerHTML = `
    <style>
      .dnd-demo-container {
        display: flex;
        gap: 20px;
        padding: 20px;
        height: 500px;
        background: #f5f5f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .element-toolbox {
        width: 250px;
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .toolbox-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .draggable-element {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        margin-bottom: 8px;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        cursor: move;
        transition: all 0.2s ease;
      }
      
      .draggable-element:hover {
        background: #e9ecef;
        border-color: #dee2e6;
        transform: translateX(2px);
      }
      
      .draggable-element.dragging {
        opacity: 0.5;
        transform: scale(0.95);
      }
      
      .element-icon {
        font-size: 18px;
      }
      
      .element-label {
        font-size: 14px;
        color: #495057;
      }
      
      .drop-zone-container {
        flex: 1;
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow-y: auto;
      }
      
      #dropZone {
        min-height: 400px;
        border: 2px dashed #dee2e6;
        border-radius: 6px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
      }
      
      #dropZone.drag-over {
        background: #e7f5ff;
        border-color: #339af0;
        border-style: solid;
      }
      
      #dropZone.drag-over::before {
        content: 'Drop here to add element';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 16px;
        color: #339af0;
        font-weight: 500;
      }
      
      .empty-state {
        color: #868e96;
        font-size: 14px;
        margin-top: 150px;
      }
      
      .dropped-element {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 12px;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .element-count {
        margin-top: 16px;
        font-size: 12px;
        color: #6c757d;
        text-align: center;
      }
    </style>
    
    <div class="element-toolbox">
      <div class="toolbox-title">Form Elements</div>
      ${args.elementTypes
    .map(
      (element) => `
        <div class="draggable-element" draggable="true" data-element-type="${element.type}">
          <span class="element-icon">${element.icon}</span>
          <span class="element-label">${element.label}</span>
        </div>
      `
    )
    .join('')}
    </div>
    
    <div class="drop-zone-container">
      <div id="dropZone">
        <div class="empty-state">
          Drag elements here to build your form
        </div>
      </div>
      <div class="element-count">0 elements added</div>
    </div>
  `;

  // Simulate DndEngine functionality
  setTimeout(() => {
    const draggables = container.querySelectorAll('.draggable-element');
    const dropZone = container.getElementById('dropZone');
    const elementCount = container.querySelector('.element-count');
    let droppedCount = 0;

    draggables.forEach((draggable) => {
      draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('elementType', draggable.dataset.elementType);
        draggable.classList.add('dragging');
      });

      draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
      });
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      const elementType = e.dataTransfer.getData('elementType');
      const elementConfig = args.elementTypes.find((el) => el.type === elementType);

      if (elementConfig) {
        // Remove empty state if it exists
        const emptyState = dropZone.querySelector('.empty-state');
        if (emptyState) {
          emptyState.remove();
        }

        // Create dropped element
        const droppedElement = document.createElement('div');
        droppedElement.className = 'dropped-element';
        droppedElement.innerHTML = `
          <span class="element-icon">${elementConfig.icon}</span>
          <span>${elementConfig.label} ${droppedCount + 1}</span>
        `;

        dropZone.appendChild(droppedElement);
        droppedCount++;
        elementCount.textContent = `${droppedCount} element${droppedCount !== 1 ? 's' : ''} added`;
      }
    });
  }, 100);

  return container;
};

export const Default = Template.bind({});
Default.args = {
  elementTypes: [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'radiogroup', label: 'Radio Group', icon: '🔘' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'dropdown', label: 'Dropdown', icon: '📋' },
    { type: 'rating', label: 'Rating', icon: '⭐' },
    { type: 'comment', label: 'Comment Box', icon: '💬' }
  ]
};

export const MinimalElements = Template.bind({});
MinimalElements.args = {
  elementTypes: [
    { type: 'text', label: 'Text', icon: '📝' },
    { type: 'checkbox', label: 'Yes/No', icon: '☑️' }
  ]
};

export const SurveyElements = Template.bind({});
SurveyElements.args = {
  elementTypes: [
    { type: 'text', label: 'Short Answer', icon: '✏️' },
    { type: 'comment', label: 'Long Answer', icon: '📄' },
    { type: 'radiogroup', label: 'Multiple Choice', icon: '🔘' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑️' },
    { type: 'dropdown', label: 'Dropdown', icon: '🔽' },
    { type: 'rating', label: 'Star Rating', icon: '⭐' },
    { type: 'boolean', label: 'Yes/No', icon: '👍' },
    { type: 'matrix', label: 'Matrix', icon: '⚏' }
  ]
};

export const AdvancedElements = Template.bind({});
AdvancedElements.args = {
  elementTypes: [
    { type: 'panel', label: 'Panel/Section', icon: '📦' },
    { type: 'html', label: 'HTML Block', icon: '🌐' },
    { type: 'expression', label: 'Expression', icon: '🧮' },
    { type: 'file', label: 'File Upload', icon: '📎' },
    { type: 'signaturepad', label: 'Signature', icon: '✍️' },
    { type: 'imagepicker', label: 'Image Picker', icon: '🖼️' }
  ]
};
