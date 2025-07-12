export class EditDialog {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    this.onSave = options.onSave || (() => {});
    this.onCancel = options.onCancel || (() => {});
    this.dialog = null;
    this.form = null;
  }

  show() {
    this.createDialog();
    this.populateForm();
    document.body.appendChild(this.dialog);
    this.dialog.classList.add('active');
  }

  hide() {
    if (this.dialog) {
      this.dialog.classList.remove('active');
      setTimeout(() => {
        this.dialog.remove();
        this.dialog = null;
      }, 300);
    }
  }

  createDialog() {
    this.dialog = document.createElement('div');
    this.dialog.className = 'edit-dialog-overlay';
    this.dialog.innerHTML = `
            <div class="edit-dialog">
                <div class="edit-dialog-header">
                    <h3>Edit ${this.element.type} Question</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <form class="edit-dialog-form">
                    <div class="form-section">
                        <h4>Basic Properties</h4>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Field Name</label>
                            <input type="text" name="name" required class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                            <small style="color: #6c757d;">Used for data storage (no spaces)</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Display Title</label>
                            <input type="text" name="title" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Description</label>
                            <textarea name="description" rows="2" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" name="isRequired" style="margin-right: 8px;">
                                Required field
                            </label>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" name="startWithNewLine" style="margin-right: 8px;">
                                Start on new line
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Type-Specific Properties</h4>
                        ${this.getTypeSpecificFields()}
                    </div>
                    
                    <div class="form-section">
                        <h4>Advanced Properties</h4>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Visible If</label>
                            <input type="text" name="visibleIf" class="form-control" placeholder="e.g., {question1} = 'yes'" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                            <small style="color: #6c757d;">Condition for showing this question</small>
                        </div>
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Enable If</label>
                            <input type="text" name="enableIf" class="form-control" placeholder="e.g., {question2} > 5" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                            <small style="color: #6c757d;">Condition for enabling this question</small>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="save-btn">Save Changes</button>
                        <button type="button" class="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        `;

    this.form = this.dialog.querySelector('.edit-dialog-form');
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.dialog.querySelector('.close-btn');
    const cancelBtn = this.dialog.querySelector('.cancel-btn');
    const overlay = this.dialog;

    closeBtn.addEventListener('click', () => {
      this.onCancel();
      this.hide();
    });

    cancelBtn.addEventListener('click', () => {
      this.onCancel();
      this.hide();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.onCancel();
        this.hide();
      }
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });
  }

  handleSave() {
    const formData = new FormData(this.form);
    const updates = {};

    // Get all form values
    for (const [key, value] of formData.entries()) {
      if (key === 'choices') {
        // Parse choices
        const choices = value.split('\n').filter(line => line.trim()).map(line => {
          const parts = line.split('|');
          if (parts.length === 2) {
            return { value: parts[0].trim(), text: parts[1].trim() };
          }
          return { value: line.trim(), text: line.trim() };
        });
        if (choices.length > 0) {
          updates.choices = choices;
        }
      } else if (key === 'rateMax') {
        updates[key] = parseInt(value, 10);
      } else if (value.trim()) {
        updates[key] = value.trim();
      }
    }

    // Handle checkboxes
    ['isRequired', 'startWithNewLine', 'hasOther'].forEach(field => {
      const checkbox = this.form.querySelector(`[name="${field}"]`);
      if (checkbox) {
        updates[field] = checkbox.checked;
      }
    });

    this.onSave(updates);
    this.hide();
  }

  getTypeSpecificFields() {
    if (!this.element) {return '';}

    switch (this.element.type) {
      case 'text':
      case 'comment':
        return `
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Placeholder</label>
                        <input type="text" name="placeholder" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    </div>
                `;

      case 'radiogroup':
      case 'checkbox':
      case 'dropdown':
        return `
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Choices (one per line)</label>
                        <textarea name="choices" class="form-control" rows="5" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;"></textarea>
                        <small style="color: #6c757d;">Format: value|display text (or just value)</small>
                    </div>
                    ${
                      this.element.type === 'radiogroup' || this.element.type === 'checkbox'
                        ? `
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" name="hasOther" style="margin-right: 8px;">
                                Include "Other" option
                            </label>
                        </div>
                    `
                        : ''
                    }`;

      case 'rating':
        return `
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Rate Max</label>
                        <input type="number" name="rateMax" class="form-control" min="1" max="10" value="5" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Min Rate Description</label>
                        <input type="text" name="minRateDescription" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Max Rate Description</label>
                        <input type="text" name="maxRateDescription" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    </div>
                `;

      case 'boolean':
        return `
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Label True</label>
                        <input type="text" name="labelTrue" class="form-control" placeholder="Yes" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Label False</label>
                        <input type="text" name="labelFalse" class="form-control" placeholder="No" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                    </div>
                `;

      default:
        return '';
    }
  }

  populateForm() {
    if (!this.element || !this.form) {return;}

    // Populate basic fields
    const fields = ['name', 'title', 'description', 'placeholder', 'visibleIf', 'enableIf'];
    fields.forEach(field => {
      const input = this.form.querySelector(`[name="${field}"]`);
      if (input && this.element[field]) {
        input.value = this.element[field];
      }
    });

    // Populate checkboxes
    const checkboxes = ['isRequired', 'startWithNewLine', 'hasOther'];
    checkboxes.forEach(field => {
      const checkbox = this.form.querySelector(`[name="${field}"]`);
      if (checkbox && this.element[field]) {
        checkbox.checked = true;
      }
    });

    // Populate type-specific fields
    if (this.element.choices) {
      const choicesTextarea = this.form.querySelector('[name="choices"]');
      if (choicesTextarea) {
        const choicesText = this.element.choices.map(choice => {
          if (typeof choice === 'string') {return choice;}
          return choice.value === choice.text ? choice.value : `${choice.value}|${choice.text}`;
        }).join('\n');
        choicesTextarea.value = choicesText;
      }
    }

    if (this.element.rateMax) {
      const rateMaxInput = this.form.querySelector('[name="rateMax"]');
      if (rateMaxInput) {
        rateMaxInput.value = this.element.rateMax;
      }
    }

    ['minRateDescription', 'maxRateDescription', 'labelTrue', 'labelFalse'].forEach(field => {
      const input = this.form.querySelector(`[name="${field}"]`);
      if (input && this.element[field]) {
        input.value = this.element[field];
      }
    });
  }
}
