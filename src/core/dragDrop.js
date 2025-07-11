// Drag and drop functionality for form builder
import notifications from '../utils/notifications.js';
import store from '../state/store.js';

let draggedElement = null;
let draggedData = null;
let dropIndicator = null;
let touchIdentifier = null;

export function initializeDragDrop(survey) {
  // Create drop indicator element
  createDropIndicator();
  
  // Set up toolbox drag sources
  setupToolboxDragSources();
  
  // Set up design surface drop zones
  setupDesignSurfaceDropZones(survey);
  
  // Set up element reordering
  setupElementReordering(survey);
  
  // Set up touch support
  setupTouchSupport();
}

function createDropIndicator() {
  dropIndicator = document.createElement('div');
  dropIndicator.className = 'drop-indicator';
  dropIndicator.style.display = 'none';
  document.body.appendChild(dropIndicator);
}

function setupToolboxDragSources() {
  const toolboxItems = document.querySelectorAll('.toolbox-item');
  
  toolboxItems.forEach(item => {
    // Mouse events
    item.addEventListener('dragstart', handleToolboxDragStart);
    item.addEventListener('dragend', handleToolboxDragEnd);
    item.draggable = true;
    
    // Touch events
    item.addEventListener('touchstart', handleToolboxTouchStart, { passive: false });
    item.addEventListener('touchmove', handleToolboxTouchMove, { passive: false });
    item.addEventListener('touchend', handleToolboxTouchEnd);
  });
}

function setupDesignSurfaceDropZones(survey) {
  const designSurface = document.querySelector('.design-surface');
  if (!designSurface) return;
  
  designSurface.addEventListener('dragover', handleDragOver);
  designSurface.addEventListener('drop', (e) => handleDrop(e, survey));
  designSurface.addEventListener('dragleave', handleDragLeave);
  
  // Touch events
  designSurface.addEventListener('touchmove', handleSurfaceTouchMove, { passive: false });
  designSurface.addEventListener('touchend', (e) => handleSurfaceTouchEnd(e, survey));
}

function setupElementReordering(survey) {
  // This will be called when elements are rendered
  survey.onAfterRenderQuestion.add((sender, options) => {
    const element = options.htmlElement;
    if (!element) return;
    
    // Make elements draggable
    element.draggable = true;
    element.addEventListener('dragstart', (e) => handleElementDragStart(e, options.question));
    element.addEventListener('dragend', handleElementDragEnd);
    
    // Touch support for elements
    element.addEventListener('touchstart', (e) => handleElementTouchStart(e, options.question), { passive: false });
    element.addEventListener('touchmove', handleElementTouchMove, { passive: false });
    element.addEventListener('touchend', handleElementTouchEnd);
  });
}

// Toolbox drag handlers
function handleToolboxDragStart(e) {
  draggedElement = e.target;
  draggedData = {
    type: 'toolbox',
    questionType: e.target.dataset.type,
    category: e.target.dataset.category
  };
  
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', JSON.stringify(draggedData));
  
  // Add dragging class
  e.target.classList.add('toolbox-item--dragging');
  document.body.classList.add('is-dragging');
}

function handleToolboxDragEnd(e) {
  e.target.classList.remove('toolbox-item--dragging');
  document.body.classList.remove('is-dragging');
  hideDropIndicator();
  draggedElement = null;
  draggedData = null;
}

// Element reordering handlers
function handleElementDragStart(e, question) {
  draggedElement = e.currentTarget;
  draggedData = {
    type: 'reorder',
    questionId: question.id || question.name,
    question: question
  };
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify(draggedData));
  
  // Add dragging class
  e.currentTarget.classList.add('form-element--dragging');
  document.body.classList.add('is-dragging');
}

function handleElementDragEnd(e) {
  e.currentTarget.classList.remove('form-element--dragging');
  document.body.classList.remove('is-dragging');
  hideDropIndicator();
  draggedElement = null;
  draggedData = null;
}

// Drop zone handlers
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = draggedData?.type === 'toolbox' ? 'copy' : 'move';
  
  const dropTarget = findDropTarget(e.target);
  if (dropTarget) {
    showDropIndicator(e, dropTarget);
  }
}

function handleDrop(e, survey) {
  e.preventDefault();
  hideDropIndicator();
  
  const dropTarget = findDropTarget(e.target);
  if (!dropTarget || !draggedData) return;
  
  try {
    if (draggedData.type === 'toolbox') {
      // Create new element
      const newQuestion = createQuestionFromType(draggedData.questionType);
      insertQuestion(survey, newQuestion, dropTarget, e);
      
      // Show edit dialog for new element
      setTimeout(() => {
        window.editDialog?.show(newQuestion);
      }, 100);
      
    } else if (draggedData.type === 'reorder') {
      // Reorder existing element
      reorderQuestion(survey, draggedData.question, dropTarget, e);
    }
    
    // Update store
    store.set('formData', survey.toJSON());
    
  } catch (error) {
    console.error('Drop failed:', error);
    notifications.error('Failed to add element');
  }
}

function handleDragLeave(e) {
  // Only hide indicator if leaving the design surface
  if (e.target === document.querySelector('.design-surface')) {
    hideDropIndicator();
  }
}

// Touch support handlers
function handleToolboxTouchStart(e) {
  const touch = e.touches[0];
  touchIdentifier = touch.identifier;
  
  draggedElement = e.currentTarget;
  draggedData = {
    type: 'toolbox',
    questionType: e.currentTarget.dataset.type,
    category: e.currentTarget.dataset.category
  };
  
  // Create drag preview
  createTouchDragPreview(e.currentTarget, touch);
  
  e.currentTarget.classList.add('toolbox-item--dragging');
  document.body.classList.add('is-dragging');
}

function handleToolboxTouchMove(e) {
  e.preventDefault();
  
  const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifier);
  if (!touch) return;
  
  updateTouchDragPreview(touch);
  
  // Find element under touch point
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const dropTarget = findDropTarget(elementBelow);
  
  if (dropTarget) {
    showDropIndicator({ clientX: touch.clientX, clientY: touch.clientY }, dropTarget);
  } else {
    hideDropIndicator();
  }
}

function handleToolboxTouchEnd(e) {
  e.preventDefault();
  
  const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdentifier);
  if (!touch) return;
  
  removeTouchDragPreview();
  hideDropIndicator();
  
  // Find element under touch point
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const dropTarget = findDropTarget(elementBelow);
  
  if (dropTarget && draggedData) {
    const survey = window.formBuilder?.survey;
    if (survey) {
      handleDrop({ 
        preventDefault: () => {},
        target: elementBelow,
        clientX: touch.clientX,
        clientY: touch.clientY
      }, survey);
    }
  }
  
  draggedElement?.classList.remove('toolbox-item--dragging');
  document.body.classList.remove('is-dragging');
  draggedElement = null;
  draggedData = null;
  touchIdentifier = null;
}

// Similar touch handlers for elements
function handleElementTouchStart(e, question) {
  const touch = e.touches[0];
  touchIdentifier = touch.identifier;
  
  draggedElement = e.currentTarget;
  draggedData = {
    type: 'reorder',
    questionId: question.id || question.name,
    question: question
  };
  
  createTouchDragPreview(e.currentTarget, touch);
  e.currentTarget.classList.add('form-element--dragging');
  document.body.classList.add('is-dragging');
}

function handleElementTouchMove(e) {
  handleToolboxTouchMove(e);
}

function handleElementTouchEnd(e) {
  handleToolboxTouchEnd(e);
  e.currentTarget?.classList.remove('form-element--dragging');
}

function handleSurfaceTouchMove(e) {
  // Handled by individual touch move handlers
}

function handleSurfaceTouchEnd(e, survey) {
  // Handled by individual touch end handlers
}

// Helper functions
function findDropTarget(element) {
  // Find the nearest valid drop target
  return element?.closest('.design-surface, .form-element, .page-content');
}

function showDropIndicator(e, dropTarget) {
  if (!dropIndicator) return;
  
  const rect = dropTarget.getBoundingClientRect();
  const mouseY = e.clientY;
  
  // Determine if dropping above or below
  const isAbove = mouseY < rect.top + rect.height / 2;
  
  dropIndicator.style.display = 'block';
  dropIndicator.style.left = rect.left + 'px';
  dropIndicator.style.width = rect.width + 'px';
  
  if (isAbove) {
    dropIndicator.style.top = rect.top - 2 + 'px';
  } else {
    dropIndicator.style.top = rect.bottom - 2 + 'px';
  }
  
  dropIndicator.dataset.position = isAbove ? 'before' : 'after';
  dropIndicator.dataset.target = dropTarget.id || '';
}

function hideDropIndicator() {
  if (dropIndicator) {
    dropIndicator.style.display = 'none';
  }
}

function createQuestionFromType(type) {
  const questionTypes = {
    text: { type: 'text', name: generateQuestionName('text'), title: 'Text Question' },
    dropdown: { type: 'dropdown', name: generateQuestionName('dropdown'), title: 'Dropdown Question', choices: ['Option 1', 'Option 2', 'Option 3'] },
    radiogroup: { type: 'radiogroup', name: generateQuestionName('radio'), title: 'Radio Group Question', choices: ['Option 1', 'Option 2', 'Option 3'] },
    checkbox: { type: 'checkbox', name: generateQuestionName('checkbox'), title: 'Checkbox Question', choices: ['Option 1', 'Option 2', 'Option 3'] },
    rating: { type: 'rating', name: generateQuestionName('rating'), title: 'Rating Question' },
    boolean: { type: 'boolean', name: generateQuestionName('boolean'), title: 'Yes/No Question' },
    comment: { type: 'comment', name: generateQuestionName('comment'), title: 'Comment Question' },
    matrix: { type: 'matrix', name: generateQuestionName('matrix'), title: 'Matrix Question', columns: ['Column 1', 'Column 2'], rows: ['Row 1', 'Row 2'] },
    matrixdropdown: { type: 'matrixdropdown', name: generateQuestionName('matrixdd'), title: 'Matrix Dropdown Question', columns: [{ name: 'col1', title: 'Column 1' }], rows: ['Row 1', 'Row 2'] },
    matrixdynamic: { type: 'matrixdynamic', name: generateQuestionName('matrixdyn'), title: 'Dynamic Matrix Question', columns: [{ name: 'col1', title: 'Column 1' }] },
    multipletext: { type: 'multipletext', name: generateQuestionName('multitext'), title: 'Multiple Text Question', items: [{ name: 'text1', title: 'Text 1' }] },
    panel: { type: 'panel', name: generateQuestionName('panel'), title: 'Panel', elements: [] },
    paneldynamic: { type: 'paneldynamic', name: generateQuestionName('paneldyn'), title: 'Dynamic Panel', templateElements: [] },
    html: { type: 'html', name: generateQuestionName('html'), html: '<p>HTML content</p>' },
    image: { type: 'image', name: generateQuestionName('image'), imageLink: 'https://via.placeholder.com/300x200' },
    file: { type: 'file', name: generateQuestionName('file'), title: 'File Upload' },
    signature: { type: 'signaturepad', name: generateQuestionName('signature'), title: 'Signature' }
  };
  
  return questionTypes[type] || questionTypes.text;
}

function generateQuestionName(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

function insertQuestion(survey, question, dropTarget, e) {
  const currentPage = survey.currentPage;
  if (!currentPage) return;
  
  // Determine insert position
  const position = dropIndicator?.dataset.position || 'after';
  const targetId = dropIndicator?.dataset.target;
  
  if (targetId) {
    const targetQuestion = currentPage.getQuestionByName(targetId);
    if (targetQuestion) {
      const index = currentPage.elements.indexOf(targetQuestion);
      const insertIndex = position === 'before' ? index : index + 1;
      currentPage.addQuestion(question, insertIndex);
    } else {
      currentPage.addQuestion(question);
    }
  } else {
    currentPage.addQuestion(question);
  }
}

function reorderQuestion(survey, question, dropTarget, e) {
  const currentPage = survey.currentPage;
  if (!currentPage) return;
  
  // Remove from current position
  const currentIndex = currentPage.elements.indexOf(question);
  if (currentIndex === -1) return;
  
  currentPage.removeElement(question);
  
  // Insert at new position
  insertQuestion(survey, question, dropTarget, e);
}

// Touch drag preview
let touchDragPreview = null;

function createTouchDragPreview(element, touch) {
  touchDragPreview = element.cloneNode(true);
  touchDragPreview.className = 'touch-drag-preview';
  touchDragPreview.style.position = 'fixed';
  touchDragPreview.style.pointerEvents = 'none';
  touchDragPreview.style.zIndex = '9999';
  touchDragPreview.style.opacity = '0.8';
  touchDragPreview.style.transform = 'scale(1.05)';
  
  updateTouchDragPreview(touch);
  document.body.appendChild(touchDragPreview);
}

function updateTouchDragPreview(touch) {
  if (!touchDragPreview) return;
  
  touchDragPreview.style.left = touch.clientX - touchDragPreview.offsetWidth / 2 + 'px';
  touchDragPreview.style.top = touch.clientY - touchDragPreview.offsetHeight / 2 + 'px';
}

function removeTouchDragPreview() {
  if (touchDragPreview) {
    touchDragPreview.remove();
    touchDragPreview = null;
  }
}

// iPad-specific touch support fixes
function setupTouchSupport() {
  // Prevent default touch behavior on drag sources
  const dragSources = document.querySelectorAll('.toolbox-item, .form-element');
  dragSources.forEach(element => {
    element.addEventListener('touchstart', (e) => {
      // Allow scrolling but prevent other defaults
      if (e.touches.length === 1) {
        e.stopPropagation();
      }
    }, { passive: true });
  });
  
  // Fix for iPad drag and drop
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.addEventListener('touchmove', (e) => {
      if (draggedElement) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}