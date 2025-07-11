// Edit Dialog Component for question editing

export class EditDialog {
    constructor(options = {}) {
        this.onSave = options.onSave;
        this.onDelete = options.onDelete;
        this.modal = null;
        this.element = null;
    }

    show(element) {
        this.element = element;
        
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
        modal.className = 'edit-dialog-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
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
            <h2 style="margin: 0; font-size: 20px;">Edit Question</h2>
            <button class="close-btn" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666;">&times;</button>
        `;

        // Create modal body
        const body = document.createElement('div');
        body.style.cssText = `
            padding: 20px;
            max-height: calc(80vh - 180px);
            overflow-y: auto;
        `;

        // Create form
        const form = document.createElement('form');
        form.innerHTML = this.createFormContent();
        body.appendChild(form);

        // Create modal footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        footer.innerHTML = `
            <button type="button" class="delete-btn" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Delete</button>
            <div>
                <button type="button" class="cancel-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Cancel</button>
                <button type="button" class="save-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Save</button>
            </div>
        `;

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        this.modal = overlay;
        this.form = form;

        // Bind events
        this.bindEvents(header, footer, overlay);
        this.populateForm();
    }

    createFormContent() {
        const typeSpecificFields = this.getTypeSpecificFields();
        
        return `
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Question Name (ID)</label>
                <input type="text" name="name" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                <small style="color: #6c757d;">Used for referencing in expressions and conditions</small>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Question Title</label>
                <input type="text" name="title" class="form-control" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Description</label>
                <textarea name="description" class="form-control" rows="3" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;"></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: flex; align-items: center;">
                    <input type="checkbox" name="isRequired" style="margin-right: 8px;">
                    Required
                </label>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: flex; align-items: center;">
                    <input type="checkbox" name="startWithNewLine" style="margin-right: 8px;">
                    Start with new line
                </label>
            </div>

            ${typeSpecificFields}

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Visible If (Expression)</label>
                <input type="text" name="visibleIf" class="form-control" placeholder="{question1} = 'yes'" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                <small style="color: #6c757d;">Show this question only when condition is met</small>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Enable If (Expression)</label>
                <input type="text" name="enableIf" class="form-control" placeholder="{age} >= 18" style="width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                <small style="color: #6c757d;">Enable this question only when condition is met</small>
            </div>
        `;
    }

    getTypeSpecificFields() {
        if (!this.element) return '';

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
                    ${this.element.type === 'radiogroup' || this.element.type === 'checkbox' ? `
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: flex; align-items: center;">
                                <input type="checkbox" name="hasOther" style="margin-right: 8px;">
                                Include "Other" option
                            </label>
                        </div>
                    ` : ''}
                `;

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
        if (!this.element || !this.form) return;

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
                    if (typeof choice === 'string') return choice;
                    return choice.value === choice.text ? choice.value : `${choice.value}|${choice.text}`;
                }).join('\n');
                choicesTextarea.value = choicesText;
            }
        }

        // Rating fields
        if (this.element.type === 'rating') {
            const rateMaxInput = this.form.querySelector('[name="rateMax"]');
            if (rateMaxInput && this.element.rateMax) {
                rateMaxInput.value = this.element.rateMax;
            }
            const minDesc = this.form.querySelector('[name="minRateDescription"]');
            if (minDesc && this.element.minRateDescription) {
                minDesc.value = this.element.minRateDescription;
            }
            const maxDesc = this.form.querySelector('[name="maxRateDescription"]');
            if (maxDesc && this.element.maxRateDescription) {
                maxDesc.value = this.element.maxRateDescription;
            }
        }

        // Boolean fields
        if (this.element.type === 'boolean') {
            const labelTrue = this.form.querySelector('[name="labelTrue"]');
            if (labelTrue && this.element.labelTrue) {
                labelTrue.value = this.element.labelTrue;
            }
            const labelFalse = this.form.querySelector('[name="labelFalse"]');
            if (labelFalse && this.element.labelFalse) {
                labelFalse.value = this.element.labelFalse;
            }
        }
    }

    bindEvents(header, footer, overlay) {
        // Close button
        const closeBtn = header.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.close());

        // Cancel button
        const cancelBtn = footer.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.close());

        // Save button
        const saveBtn = footer.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => this.handleSave());

        // Delete button
        const deleteBtn = footer.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.handleDelete());

        // Overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // ESC key
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    handleSave() {
        const formData = new FormData(this.form);
        const updatedElement = { ...this.element };

        // Update basic fields
        ['name', 'title', 'description', 'placeholder', 'visibleIf', 'enableIf'].forEach(field => {
            const value = formData.get(field);
            if (value !== null) {
                updatedElement[field] = value || undefined;
            }
        });

        // Update checkboxes
        updatedElement.isRequired = formData.get('isRequired') === 'on';
        updatedElement.startWithNewLine = formData.get('startWithNewLine') !== 'on';
        
        if (formData.has('hasOther')) {
            updatedElement.hasOther = formData.get('hasOther') === 'on';
        }

        // Update choices
        const choicesText = formData.get('choices');
        if (choicesText !== null) {
            updatedElement.choices = choicesText.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [value, text] = line.split('|').map(s => s.trim());
                    return text ? { value, text } : value;
                });
        }

        // Update rating fields
        if (this.element.type === 'rating') {
            const rateMax = formData.get('rateMax');
            if (rateMax) updatedElement.rateMax = parseInt(rateMax);
            
            const minDesc = formData.get('minRateDescription');
            if (minDesc) updatedElement.minRateDescription = minDesc;
            
            const maxDesc = formData.get('maxRateDescription');
            if (maxDesc) updatedElement.maxRateDescription = maxDesc;
        }

        // Update boolean fields
        if (this.element.type === 'boolean') {
            const labelTrue = formData.get('labelTrue');
            if (labelTrue) updatedElement.labelTrue = labelTrue;
            
            const labelFalse = formData.get('labelFalse');
            if (labelFalse) updatedElement.labelFalse = labelFalse;
        }

        if (this.onSave) {
            this.onSave(updatedElement);
        }
        this.close();
    }

    handleDelete() {
        if (confirm('Are you sure you want to delete this question?')) {
            if (this.onDelete) {
                this.onDelete(this.element);
            }
            this.close();
        }
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

export default EditDialog;