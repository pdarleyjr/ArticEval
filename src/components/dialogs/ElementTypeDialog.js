// Element Type Dialog Component

export class ElementTypeDialog {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.modal = null;
    this.elementTypes = this.getElementTypes();
  }

  getElementTypes() {
    return [
      { type: 'text', label: 'Single Line Text', icon: '📝', category: 'basic' },
      { type: 'comment', label: 'Multi-line Text', icon: '📄', category: 'basic' },
      { type: 'radiogroup', label: 'Multiple Choice', icon: '🔘', category: 'basic' },
      { type: 'checkbox', label: 'Checkboxes', icon: '☑️', category: 'basic' },
      { type: 'dropdown', label: 'Dropdown', icon: '▼', category: 'basic' },
      { type: 'boolean', label: 'Yes/No', icon: '✓', category: 'basic' },
      { type: 'rating', label: 'Rating', icon: '⭐', category: 'basic' },
      { type: 'ranking', label: 'Ranking', icon: '📊', category: 'advanced' },
      { type: 'matrix', label: 'Matrix', icon: '⊞', category: 'advanced' },
      { type: 'matrixdropdown', label: 'Matrix Dropdown', icon: '⊟', category: 'advanced' },
      { type: 'matrixdynamic', label: 'Dynamic Matrix', icon: '⊡', category: 'advanced' },
      { type: 'multipletext', label: 'Multiple Text', icon: '📋', category: 'advanced' },
      { type: 'html', label: 'HTML', icon: '🌐', category: 'display' },
      { type: 'image', label: 'Image', icon: '🖼️', category: 'display' },
      { type: 'file', label: 'File Upload', icon: '📎', category: 'advanced' },
      { type: 'signaturepad', label: 'Signature', icon: '✍️', category: 'advanced' },
      { type: 'expression', label: 'Expression', icon: '🧮', category: 'advanced' },
      { type: 'panel', label: 'Panel', icon: '📦', category: 'containers' },
      { type: 'paneldynamic', label: 'Dynamic Panel', icon: '📦', category: 'containers' }
    ];
  }

  show() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'element-type-modal';
    modal.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

    // Create modal header
    const header = document.createElement('div');
    header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
    header.innerHTML = `
            <h2 style="margin: 0; font-size: 24px;">Choose Element Type</h2>
            <button class="close-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666;">&times;</button>
        `;

    // Create modal body
    const body = document.createElement('div');
    body.style.cssText = `
            padding: 20px;
            max-height: calc(80vh - 140px);
            overflow-y: auto;
        `;

    // Group elements by category
    const categories = {
      basic: { label: 'Basic Elements', elements: [] },
      advanced: { label: 'Advanced Elements', elements: [] },
      display: { label: 'Display Elements', elements: [] },
      containers: { label: 'Container Elements', elements: [] }
    };

    this.elementTypes.forEach((element) => {
      if (categories[element.category]) {
        categories[element.category].elements.push(element);
      }
    });

    // Render categories
    Object.entries(categories).forEach(([key, category]) => {
      if (category.elements.length === 0) {
        return;
      }

      const section = document.createElement('div');
      section.style.marginBottom = '30px';

      const title = document.createElement('h3');
      title.textContent = category.label;
      title.style.cssText = 'margin-bottom: 15px; color: #333;';
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 10px;
            `;

      category.elements.forEach((element) => {
        const button = document.createElement('button');
        button.className = 'element-type-button';
        button.dataset.type = element.type;
        button.style.cssText = `
                    padding: 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                `;
        button.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 8px;">${element.icon}</div>
                    <div style="font-size: 14px; font-weight: 500;">${element.label}</div>
                `;

        button.addEventListener('mouseenter', () => {
          button.style.borderColor = '#007bff';
          button.style.background = '#f0f8ff';
        });

        button.addEventListener('mouseleave', () => {
          button.style.borderColor = '#e0e0e0';
          button.style.background = 'white';
        });

        button.addEventListener('click', () => {
          this.handleSelect(element.type);
        });

        grid.appendChild(button);
      });

      section.appendChild(grid);
      body.appendChild(section);
    });

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.modal = overlay;

    // Close handlers
    const closeBtn = header.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.close());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // ESC key handler
    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  handleSelect(type) {
    if (this.onSelect) {
      this.onSelect(type);
    }
    this.close();
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
  }
}

export default ElementTypeDialog;
