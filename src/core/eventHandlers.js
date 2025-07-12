// Event handlers for form builder
import notifications from '../utils/notifications.js';
import { debounce } from '../utils/debounce.js';
import store from '../state/store.js';
import formService from '../services/formService.js';

// Dialog references
let elementTypeDialog = null;
let editDialog = null;
let previewModal = null;

export function initializeEventHandlers(survey) {
  // Store dialog references
  elementTypeDialog = window.elementTypeDialog;
  editDialog = window.editDialog;
  previewModal = window.previewModal;

  // Set up UI button handlers
  setupUIButtonHandlers(survey);

  // Set up form change handlers
  setupFormChangeHandlers(survey);

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(survey);

  // Set up responsive handlers
  setupResponsiveHandlers();

  // Set up property panel handlers
  setupPropertyPanelHandlers(survey);

  // Set up page navigation
  setupPageNavigation(survey);
}

function setupUIButtonHandlers(survey) {
  // Add Element button
  const addElementBtn = document.getElementById('addElementBtn');
  if (addElementBtn) {
    addElementBtn.addEventListener('click', () => {
      elementTypeDialog?.show();
    });
  }

  // Preview button
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      handlePreview(survey);
    });
  }

  // Save button
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      handleSave(survey);
    });
  }

  // Undo button
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      handleUndo(survey);
    });
  }

  // Redo button
  const redoBtn = document.getElementById('redoBtn');
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      handleRedo(survey);
    });
  }

  // JSON Editor toggle
  const jsonEditorBtn = document.getElementById('jsonEditorBtn');
  if (jsonEditorBtn) {
    jsonEditorBtn.addEventListener('click', () => {
      handleJSONEditor(survey);
    });
  }

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      handleSettings(survey);
    });
  }

  // Clear form button
  const clearFormBtn = document.getElementById('clearFormBtn');
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', () => {
      handleClearForm(survey);
    });
  }
}

function setupFormChangeHandlers(survey) {
  // Debounced auto-save
  const autoSave = debounce(() => {
    handleAutoSave(survey);
  }, 30000); // 30 seconds

  // Track changes for auto-save
  survey.onValueChanged.add(() => {
    store.set('hasUnsavedChanges', true);
    autoSave();
  });

  // Track structure changes
  survey.onQuestionAdded.add((sender, options) => {
    store.set('hasUnsavedChanges', true);
    store.addToHistory(survey.toJSON());
    updateUndoRedoButtons();
    autoSave();

    // Select the new question
    selectQuestion(options.question);
  });

  survey.onQuestionRemoved.add(() => {
    store.set('hasUnsavedChanges', true);
    store.addToHistory(survey.toJSON());
    updateUndoRedoButtons();
    autoSave();
  });

  // Track property changes
  survey.onPropertyChanged.add(() => {
    store.set('hasUnsavedChanges', true);
    autoSave();
  });

  // Track page changes
  survey.onCurrentPageChanged.add((sender, options) => {
    updatePageIndicator(survey);
    updateNavigationButtons(survey);
  });
}

function setupKeyboardShortcuts(survey) {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave(survey);
    }

    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo(survey);
    }

    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo(survey);
    }

    // Ctrl/Cmd + P: Preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      handlePreview(survey);
    }

    // Delete: Remove selected element
    if (e.key === 'Delete' && !isInputFocused()) {
      const selectedQuestion = store.get('selectedQuestion');
      if (selectedQuestion) {
        handleDeleteQuestion(survey, selectedQuestion);
      }
    }

    // Escape: Clear selection
    if (e.key === 'Escape') {
      clearSelection();
    }
  });
}

function setupResponsiveHandlers() {
  // Handle window resize
  const handleResize = debounce(() => {
    updateLayoutForScreenSize();
  }, 250);

  window.addEventListener('resize', handleResize);

  // Handle orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(updateLayoutForScreenSize, 100);
  });

  // Initial layout update
  updateLayoutForScreenSize();
}

function setupPropertyPanelHandlers(survey) {
  // Handle property panel toggle on mobile
  const propertyToggle = document.getElementById('propertyPanelToggle');
  if (propertyToggle) {
    propertyToggle.addEventListener('click', () => {
      document.querySelector('.property-panel')?.classList.toggle('property-panel--open');
    });
  }

  // Handle question selection
  survey.onAfterRenderQuestion.add((sender, options) => {
    const element = options.htmlElement;
    if (!element) {
      return;
    }

    element.addEventListener('click', (e) => {
      if (!e.target.closest('.sv_q_title_actions')) {
        selectQuestion(options.question);
      }
    });

    // Add edit button to question
    addQuestionActions(element, options.question);
  });
}

function setupPageNavigation(survey) {
  // Previous page button
  const prevPageBtn = document.getElementById('prevPageBtn');
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (survey.currentPageNo > 0) {
        survey.currentPageNo--;
      }
    });
  }

  // Next page button
  const nextPageBtn = document.getElementById('nextPageBtn');
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (survey.currentPageNo < survey.pageCount - 1) {
        survey.currentPageNo++;
      }
    });
  }

  // Add page button
  const addPageBtn = document.getElementById('addPageBtn');
  if (addPageBtn) {
    addPageBtn.addEventListener('click', () => {
      handleAddPage(survey);
    });
  }

  // Page dropdown
  const pageDropdown = document.getElementById('pageDropdown');
  if (pageDropdown) {
    updatePageDropdown(survey);
    pageDropdown.addEventListener('change', (e) => {
      survey.currentPageNo = parseInt(e.target.value);
    });
  }
}

// Handler functions
function handlePreview(survey) {
  if (previewModal) {
    previewModal.show(survey.toJSON());
  } else {
    // Fallback to new window
    const previewWindow = window.open('/template-preview.html', '_blank');
    if (previewWindow) {
      previewWindow.addEventListener('load', () => {
        previewWindow.postMessage(
          {
            type: 'loadSurvey',
            data: survey.toJSON()
          },
          '*'
        );
      });
    }
  }
}

async function handleSave(survey) {
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const formData = {
      ...store.get('formMetadata', {}),
      definition: survey.toJSON()
    };

    await formService.save(formData);

    store.set('hasUnsavedChanges', false);
    notifications.success('Form saved successfully');
  } catch (error) {
    console.error('Save failed:', error);
    notifications.error('Failed to save form');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  }
}

async function handleAutoSave(survey) {
  if (!store.get('hasUnsavedChanges')) {
    return;
  }

  try {
    const formData = {
      ...store.get('formMetadata', {}),
      definition: survey.toJSON()
    };

    await formService.save(formData);
    store.set('hasUnsavedChanges', false);

    // Show subtle notification
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
      indicator.textContent = 'Saved';
      indicator.classList.add('visible');
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    }
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
}

function handleUndo(survey) {
  const previousState = store.undo();
  if (previousState) {
    survey.fromJSON(previousState);
    updateUndoRedoButtons();
    notifications.info('Change undone');
  }
}

function handleRedo(survey) {
  const nextState = store.redo();
  if (nextState) {
    survey.fromJSON(nextState);
    updateUndoRedoButtons();
    notifications.info('Change redone');
  }
}

function handleJSONEditor(survey) {
  const dialog = document.getElementById('jsonEditorDialog');
  if (!dialog) {
    createJSONEditorDialog(survey);
  } else {
    dialog.querySelector('textarea').value = JSON.stringify(survey.toJSON(), null, 2);
    dialog.classList.add('dialog--open');
  }
}

function handleSettings(survey) {
  const dialog = document.getElementById('settingsDialog');
  if (!dialog) {
    createSettingsDialog(survey);
  } else {
    dialog.classList.add('dialog--open');
  }
}

function handleClearForm(survey) {
  if (confirm('Are you sure you want to clear the entire form? This cannot be undone.')) {
    survey.clear();
    survey.pages.forEach((page) => survey.removePage(page));
    survey.addNewPage('page1');

    store.addToHistory(survey.toJSON());
    updateUndoRedoButtons();
    notifications.info('Form cleared');
  }
}

function handleDeleteQuestion(survey, question) {
  if (confirm(`Delete "${question.title || question.name}"?`)) {
    const page = survey.getPageByQuestion(question);
    if (page) {
      page.removeQuestion(question);
      clearSelection();
      notifications.info('Question deleted');
    }
  }
}

function handleAddPage(survey) {
  const pageCount = survey.pageCount;
  const newPage = survey.addNewPage(`page${pageCount + 1}`);
  newPage.title = `Page ${pageCount + 1}`;

  survey.currentPage = newPage;
  updatePageDropdown(survey);
  notifications.success('New page added');
}

// UI update functions
function selectQuestion(question) {
  // Clear previous selection
  document.querySelectorAll('.form-element--selected').forEach((el) => {
    el.classList.remove('form-element--selected');
  });

  // Add selection to new element
  const element = document.querySelector(`[data-question-name="${question.name}"]`);
  if (element) {
    element.classList.add('form-element--selected');
  }

  // Store selected question
  store.set('selectedQuestion', question);

  // Show properties in property panel
  showQuestionProperties(question);
}

function clearSelection() {
  document.querySelectorAll('.form-element--selected').forEach((el) => {
    el.classList.remove('form-element--selected');
  });

  store.set('selectedQuestion', null);
  clearPropertyPanel();
}

function showQuestionProperties(question) {
  const propertyPanel = document.querySelector('.property-panel__content');
  if (!propertyPanel) {
    return;
  }

  // This would be handled by a more sophisticated property editor
  // For now, just show basic info
  propertyPanel.innerHTML = `
    <h3>Properties</h3>
    <div class="property-group">
      <label>Name</label>
      <input type="text" value="${question.name}" data-property="name">
    </div>
    <div class="property-group">
      <label>Title</label>
      <input type="text" value="${question.title || ''}" data-property="title">
    </div>
    <div class="property-group">
      <label>Type</label>
      <input type="text" value="${question.getType()}" readonly>
    </div>
  `;

  // Add change handlers
  propertyPanel.querySelectorAll('input[data-property]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const property = e.target.dataset.property;
      question[property] = e.target.value;
    });
  });
}

function clearPropertyPanel() {
  const propertyPanel = document.querySelector('.property-panel__content');
  if (propertyPanel) {
    propertyPanel.innerHTML =
      '<p class="property-panel__empty">Select an element to view its properties</p>';
  }
}

function addQuestionActions(element, question) {
  const titleElement = element.querySelector('.sv_q_title');
  if (!titleElement) {
    return;
  }

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'sv_q_title_actions';

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'sv_q_action_btn';
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.title = 'Edit question';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    editDialog?.show(question);
  });

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'sv_q_action_btn sv_q_action_btn--danger';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.title = 'Delete question';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleDeleteQuestion(question.survey, question);
  });

  actionsContainer.appendChild(editBtn);
  actionsContainer.appendChild(deleteBtn);
  titleElement.appendChild(actionsContainer);
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  if (undoBtn) {
    undoBtn.disabled = !store.canUndo();
  }

  if (redoBtn) {
    redoBtn.disabled = !store.canRedo();
  }
}

function updatePageIndicator(survey) {
  const indicator = document.getElementById('pageIndicator');
  if (indicator) {
    indicator.textContent = `Page ${survey.currentPageNo + 1} of ${survey.pageCount}`;
  }
}

function updateNavigationButtons(survey) {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (prevBtn) {
    prevBtn.disabled = survey.currentPageNo === 0;
  }

  if (nextBtn) {
    nextBtn.disabled = survey.currentPageNo === survey.pageCount - 1;
  }
}

function updatePageDropdown(survey) {
  const dropdown = document.getElementById('pageDropdown');
  if (!dropdown) {
    return;
  }

  dropdown.innerHTML = '';
  survey.pages.forEach((page, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = page.title || `Page ${index + 1}`;
    dropdown.appendChild(option);
  });

  dropdown.value = survey.currentPageNo;
}

function updateLayoutForScreenSize() {
  const width = window.innerWidth;
  const body = document.body;

  // Remove all size classes
  body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');

  // Add appropriate class
  if (width < 768) {
    body.classList.add('is-mobile');
  } else if (width < 1024) {
    body.classList.add('is-tablet');
  } else {
    body.classList.add('is-desktop');
  }

  // Handle panel visibility
  if (width < 768) {
    // On mobile, hide panels by default
    document.querySelector('.toolbox')?.classList.remove('toolbox--open');
    document.querySelector('.property-panel')?.classList.remove('property-panel--open');
  }
}

function isInputFocused() {
  const activeElement = document.activeElement;
  return (
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.contentEditable === 'true')
  );
}

// Dialog creation functions
function createJSONEditorDialog(survey) {
  const dialog = document.createElement('div');
  dialog.id = 'jsonEditorDialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog__overlay"></div>
    <div class="dialog__content">
      <div class="dialog__header">
        <h2 class="dialog__title">JSON Editor</h2>
        <button class="dialog__close">&times;</button>
      </div>
      <div class="dialog__body">
        <textarea class="json-editor" rows="20">${JSON.stringify(survey.toJSON(), null, 2)}</textarea>
      </div>
      <div class="dialog__footer">
        <button class="button button--secondary" data-action="cancel">Cancel</button>
        <button class="button button--primary" data-action="apply">Apply</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Add event handlers
  dialog.querySelector('.dialog__close').addEventListener('click', () => {
    dialog.classList.remove('dialog--open');
  });

  dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    dialog.classList.remove('dialog--open');
  });

  dialog.querySelector('[data-action="apply"]').addEventListener('click', () => {
    try {
      const json = JSON.parse(dialog.querySelector('textarea').value);
      survey.fromJSON(json);
      dialog.classList.remove('dialog--open');
      notifications.success('JSON applied successfully');
    } catch (error) {
      notifications.error('Invalid JSON');
    }
  });

  dialog.classList.add('dialog--open');
}

function createSettingsDialog(survey) {
  const dialog = document.createElement('div');
  dialog.id = 'settingsDialog';
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog__overlay"></div>
    <div class="dialog__content">
      <div class="dialog__header">
        <h2 class="dialog__title">Form Settings</h2>
        <button class="dialog__close">&times;</button>
      </div>
      <div class="dialog__body">
        <div class="form-group">
          <label>Form Title</label>
          <input type="text" id="formTitle" value="${survey.title || ''}">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="formDescription" rows="3">${survey.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Show Progress Bar</label>
          <select id="showProgressBar">
            <option value="off" ${survey.showProgressBar === 'off' ? 'selected' : ''}>Off</option>
            <option value="top" ${survey.showProgressBar === 'top' ? 'selected' : ''}>Top</option>
            <option value="bottom" ${survey.showProgressBar === 'bottom' ? 'selected' : ''}>Bottom</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="showQuestionNumbers" ${survey.showQuestionNumbers !== 'off' ? 'checked' : ''}>
            Show Question Numbers
          </label>
        </div>
      </div>
      <div class="dialog__footer">
        <button class="button button--secondary" data-action="cancel">Cancel</button>
        <button class="button button--primary" data-action="save">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  // Add event handlers
  dialog.querySelector('.dialog__close').addEventListener('click', () => {
    dialog.classList.remove('dialog--open');
  });

  dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    dialog.classList.remove('dialog--open');
  });

  dialog.querySelector('[data-action="save"]').addEventListener('click', () => {
    survey.title = dialog.querySelector('#formTitle').value;
    survey.description = dialog.querySelector('#formDescription').value;
    survey.showProgressBar = dialog.querySelector('#showProgressBar').value;
    survey.showQuestionNumbers = dialog.querySelector('#showQuestionNumbers').checked
      ? 'on'
      : 'off';

    dialog.classList.remove('dialog--open');
    notifications.success('Settings saved');
  });

  dialog.classList.add('dialog--open');
}
