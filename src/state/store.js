// Centralized State Store with undo/redo support
import notifications from '../utils/notifications.js';

// Store configuration
const STORE_CONFIG = {
  maxHistory: 50,
  persistKey: 'formBuilder_state',
  persistDebounce: 1000,
  enableDevTools: true
};

// State shape definition
const initialState = {
  // Current form data
  currentForm: null,
  
  // UI state
  ui: {
    selectedElement: null,
    expandedSections: new Set(),
    activeTab: 'design',
    sidebarCollapsed: false,
    theme: 'light',
    zoom: 100,
    showGrid: false,
    showRulers: false
  },
  
  // Editor state
  editor: {
    isDirty: false,
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    autoSave: true,
    readOnly: false
  },
  
  // Drag and drop state
  dragDrop: {
    isDragging: false,
    draggedElement: null,
    dropTarget: null,
    dragOffset: { x: 0, y: 0 }
  },
  
  // AI Helper state
  ai: {
    isOpen: false,
    isProcessing: false,
    conversation: [],
    suggestions: []
  },
  
  // Preview state
  preview: {
    isOpen: false,
    device: 'desktop',
    theme: 'default',
    orientation: 'portrait'
  },
  
  // Validation state
  validation: {
    errors: [],
    warnings: [],
    isValidating: false,
    lastValidated: null
  },
  
  // User preferences
  preferences: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    confirmDelete: true,
    enableShortcuts: true,
    enableAnimations: true
  },
  
  // Session data
  session: {
    user: null,
    permissions: [],
    lastActivity: Date.now()
  }
};

// Action types
export const ActionTypes = {
  // Form actions
  SET_CURRENT_FORM: 'SET_CURRENT_FORM',
  UPDATE_FORM_PROPERTY: 'UPDATE_FORM_PROPERTY',
  ADD_FORM_ELEMENT: 'ADD_FORM_ELEMENT',
  REMOVE_FORM_ELEMENT: 'REMOVE_FORM_ELEMENT',
  MOVE_FORM_ELEMENT: 'MOVE_FORM_ELEMENT',
  
  // UI actions
  SELECT_ELEMENT: 'SELECT_ELEMENT',
  TOGGLE_SECTION: 'TOGGLE_SECTION',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_THEME: 'SET_THEME',
  SET_ZOOM: 'SET_ZOOM',
  
  // Editor actions
  SET_DIRTY: 'SET_DIRTY',
  SET_SAVING: 'SET_SAVING',
  SET_LOADING: 'SET_LOADING',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  TOGGLE_AUTO_SAVE: 'TOGGLE_AUTO_SAVE',
  
  // Drag and drop actions
  START_DRAG: 'START_DRAG',
  UPDATE_DRAG: 'UPDATE_DRAG',
  END_DRAG: 'END_DRAG',
  SET_DROP_TARGET: 'SET_DROP_TARGET',
  
  // AI actions
  TOGGLE_AI: 'TOGGLE_AI',
  SET_AI_PROCESSING: 'SET_AI_PROCESSING',
  ADD_AI_MESSAGE: 'ADD_AI_MESSAGE',
  SET_AI_SUGGESTIONS: 'SET_AI_SUGGESTIONS',
  
  // Preview actions
  TOGGLE_PREVIEW: 'TOGGLE_PREVIEW',
  SET_PREVIEW_DEVICE: 'SET_PREVIEW_DEVICE',
  SET_PREVIEW_THEME: 'SET_PREVIEW_THEME',
  
  // Validation actions
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  ADD_VALIDATION_ERROR: 'ADD_VALIDATION_ERROR',
  CLEAR_VALIDATION: 'CLEAR_VALIDATION',
  
  // Preference actions
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  
  // Session actions
  SET_USER: 'SET_USER',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY',
  
  // Global actions
  RESET_STATE: 'RESET_STATE',
  LOAD_STATE: 'LOAD_STATE',
  UNDO: 'UNDO',
  REDO: 'REDO'
};

class Store {
  constructor() {
    this.state = this.deepClone(initialState);
    this.history = [];
    this.historyPointer = -1;
    this.subscribers = new Map();
    this.middleware = [];
    this.isDispatching = false;
    
    // Load persisted state
    this.loadPersistedState();
    
    // Setup auto-persist
    this.persistDebounced = this.debounce(
      this.persistState.bind(this),
      STORE_CONFIG.persistDebounce
    );
    
    // Setup dev tools
    if (STORE_CONFIG.enableDevTools && window.__REDUX_DEVTOOLS_EXTENSION__) {
      this.devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'Form Builder Store'
      });
      this.devTools.init(this.state);
    }
  }
  
  // Get current state
  getState() {
    return this.state;
  }
  
  // Subscribe to state changes
  subscribe(callback, selector = null) {
    const id = Math.random().toString(36).substr(2, 9);
    
    this.subscribers.set(id, {
      callback,
      selector
    });
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }
  
  // Add middleware
  use(middleware) {
    this.middleware.push(middleware);
  }
  
  // Dispatch action
  dispatch(action) {
    if (this.isDispatching) {
      throw new Error('Cannot dispatch while dispatching');
    }
    
    try {
      this.isDispatching = true;
      
      // Run middleware
      let finalAction = action;
      for (const middleware of this.middleware) {
        const result = middleware(this, finalAction);
        if (result === false) {
          return; // Middleware cancelled action
        }
        if (result && typeof result === 'object') {
          finalAction = result; // Middleware modified action
        }
      }
      
      // Store previous state for history
      const previousState = this.deepClone(this.state);
      
      // Apply action
      this.state = this.reducer(this.state, finalAction);
      
      // Add to history (skip for certain actions)
      if (!this.isHistoryAction(finalAction.type)) {
        this.addToHistory(previousState, finalAction);
      }
      
      // Notify subscribers
      this.notifySubscribers(previousState);
      
      // Update dev tools
      if (this.devTools) {
        this.devTools.send(finalAction, this.state);
      }
      
      // Persist state
      this.persistDebounced();
      
    } finally {
      this.isDispatching = false;
    }
  }
  
  // Main reducer
  reducer(state, action) {
    switch (action.type) {
      // Form actions
      case ActionTypes.SET_CURRENT_FORM:
        return {
          ...state,
          currentForm: action.payload,
          editor: {
            ...state.editor,
            isDirty: false
          }
        };
        
      case ActionTypes.UPDATE_FORM_PROPERTY:
        return {
          ...state,
          currentForm: this.updateNestedProperty(
            state.currentForm,
            action.payload.path,
            action.payload.value
          ),
          editor: {
            ...state.editor,
            isDirty: true
          }
        };
        
      case ActionTypes.ADD_FORM_ELEMENT:
        return this.addFormElement(state, action.payload);
        
      case ActionTypes.REMOVE_FORM_ELEMENT:
        return this.removeFormElement(state, action.payload);
        
      case ActionTypes.MOVE_FORM_ELEMENT:
        return this.moveFormElement(state, action.payload);
        
      // UI actions
      case ActionTypes.SELECT_ELEMENT:
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedElement: action.payload
          }
        };
        
      case ActionTypes.TOGGLE_SECTION:
        const expandedSections = new Set(state.ui.expandedSections);
        if (expandedSections.has(action.payload)) {
          expandedSections.delete(action.payload);
        } else {
          expandedSections.add(action.payload);
        }
        return {
          ...state,
          ui: {
            ...state.ui,
            expandedSections
          }
        };
        
      case ActionTypes.SET_ACTIVE_TAB:
        return {
          ...state,
          ui: {
            ...state.ui,
            activeTab: action.payload
          }
        };
        
      case ActionTypes.TOGGLE_SIDEBAR:
        return {
          ...state,
          ui: {
            ...state.ui,
            sidebarCollapsed: !state.ui.sidebarCollapsed
          }
        };
        
      case ActionTypes.SET_THEME:
        return {
          ...state,
          ui: {
            ...state.ui,
            theme: action.payload
          }
        };
        
      case ActionTypes.SET_ZOOM:
        return {
          ...state,
          ui: {
            ...state.ui,
            zoom: action.payload
          }
        };
        
      // Editor actions
      case ActionTypes.SET_DIRTY:
        return {
          ...state,
          editor: {
            ...state.editor,
            isDirty: action.payload
          }
        };
        
      case ActionTypes.SET_SAVING:
        return {
          ...state,
          editor: {
            ...state.editor,
            isSaving: action.payload
          }
        };
        
      case ActionTypes.SET_LOADING:
        return {
          ...state,
          editor: {
            ...state.editor,
            isLoading: action.payload
          }
        };
        
      case ActionTypes.SET_LAST_SAVED:
        return {
          ...state,
          editor: {
            ...state.editor,
            lastSaved: action.payload,
            isDirty: false
          }
        };
        
      case ActionTypes.TOGGLE_AUTO_SAVE:
        return {
          ...state,
          editor: {
            ...state.editor,
            autoSave: !state.editor.autoSave
          }
        };
        
      // Drag and drop actions
      case ActionTypes.START_DRAG:
        return {
          ...state,
          dragDrop: {
            ...state.dragDrop,
            isDragging: true,
            draggedElement: action.payload.element,
            dragOffset: action.payload.offset || { x: 0, y: 0 }
          }
        };
        
      case ActionTypes.UPDATE_DRAG:
        return {
          ...state,
          dragDrop: {
            ...state.dragDrop,
            ...action.payload
          }
        };
        
      case ActionTypes.END_DRAG:
        return {
          ...state,
          dragDrop: {
            ...state.dragDrop,
            isDragging: false,
            draggedElement: null,
            dropTarget: null
          }
        };
        
      case ActionTypes.SET_DROP_TARGET:
        return {
          ...state,
          dragDrop: {
            ...state.dragDrop,
            dropTarget: action.payload
          }
        };
        
      // AI actions
      case ActionTypes.TOGGLE_AI:
        return {
          ...state,
          ai: {
            ...state.ai,
            isOpen: !state.ai.isOpen
          }
        };
        
      case ActionTypes.SET_AI_PROCESSING:
        return {
          ...state,
          ai: {
            ...state.ai,
            isProcessing: action.payload
          }
        };
        
      case ActionTypes.ADD_AI_MESSAGE:
        return {
          ...state,
          ai: {
            ...state.ai,
            conversation: [...state.ai.conversation, action.payload]
          }
        };
        
      case ActionTypes.SET_AI_SUGGESTIONS:
        return {
          ...state,
          ai: {
            ...state.ai,
            suggestions: action.payload
          }
        };
        
      // Preview actions
      case ActionTypes.TOGGLE_PREVIEW:
        return {
          ...state,
          preview: {
            ...state.preview,
            isOpen: !state.preview.isOpen
          }
        };
        
      case ActionTypes.SET_PREVIEW_DEVICE:
        return {
          ...state,
          preview: {
            ...state.preview,
            device: action.payload
          }
        };
        
      case ActionTypes.SET_PREVIEW_THEME:
        return {
          ...state,
          preview: {
            ...state.preview,
            theme: action.payload
          }
        };
        
      // Validation actions
      case ActionTypes.SET_VALIDATION_ERRORS:
        return {
          ...state,
          validation: {
            ...state.validation,
            errors: action.payload.errors || [],
            warnings: action.payload.warnings || [],
            isValidating: false,
            lastValidated: Date.now()
          }
        };
        
      case ActionTypes.ADD_VALIDATION_ERROR:
        return {
          ...state,
          validation: {
            ...state.validation,
            errors: [...state.validation.errors, action.payload]
          }
        };
        
      case ActionTypes.CLEAR_VALIDATION:
        return {
          ...state,
          validation: {
            ...state.validation,
            errors: [],
            warnings: [],
            isValidating: false
          }
        };
        
      // Preference actions
      case ActionTypes.UPDATE_PREFERENCES:
        return {
          ...state,
          preferences: {
            ...state.preferences,
            ...action.payload
          }
        };
        
      // Session actions
      case ActionTypes.SET_USER:
        return {
          ...state,
          session: {
            ...state.session,
            user: action.payload.user,
            permissions: action.payload.permissions || []
          }
        };
        
      case ActionTypes.UPDATE_ACTIVITY:
        return {
          ...state,
          session: {
            ...state.session,
            lastActivity: Date.now()
          }
        };
        
      // Global actions
      case ActionTypes.RESET_STATE:
        return this.deepClone(initialState);
        
      case ActionTypes.LOAD_STATE:
        return {
          ...this.deepClone(action.payload),
          session: state.session // Preserve session
        };
        
      case ActionTypes.UNDO:
        return this.performUndo(state);
        
      case ActionTypes.REDO:
        return this.performRedo(state);
        
      default:
        return state;
    }
  }
  
  // Helper: Update nested property
  updateNestedProperty(obj, path, value) {
    if (!obj) return obj;
    
    const newObj = this.deepClone(obj);
    const parts = path.split('.');
    const lastPart = parts.pop();
    
    let target = newObj;
    for (const part of parts) {
      if (!target[part] || typeof target[part] !== 'object') {
        target[part] = {};
      }
      target = target[part];
    }
    
    target[lastPart] = value;
    return newObj;
  }
  
  // Helper: Add form element
  addFormElement(state, payload) {
    const { pageIndex, element, position } = payload;
    const newForm = this.deepClone(state.currentForm);
    
    if (!newForm.surveyJSON.pages[pageIndex]) {
      newForm.surveyJSON.pages[pageIndex] = { elements: [] };
    }
    
    const page = newForm.surveyJSON.pages[pageIndex];
    if (!page.elements) {
      page.elements = [];
    }
    
    if (position !== undefined) {
      page.elements.splice(position, 0, element);
    } else {
      page.elements.push(element);
    }
    
    return {
      ...state,
      currentForm: newForm,
      editor: {
        ...state.editor,
        isDirty: true
      }
    };
  }
  
  // Helper: Remove form element
  removeFormElement(state, payload) {
    const { pageIndex, elementIndex } = payload;
    const newForm = this.deepClone(state.currentForm);
    
    if (newForm.surveyJSON.pages[pageIndex]?.elements) {
      newForm.surveyJSON.pages[pageIndex].elements.splice(elementIndex, 1);
    }
    
    return {
      ...state,
      currentForm: newForm,
      editor: {
        ...state.editor,
        isDirty: true
      },
      ui: {
        ...state.ui,
        selectedElement: null // Clear selection
      }
    };
  }
  
  // Helper: Move form element
  moveFormElement(state, payload) {
    const { fromPage, fromIndex, toPage, toIndex } = payload;
    const newForm = this.deepClone(state.currentForm);
    
    // Remove from source
    const element = newForm.surveyJSON.pages[fromPage].elements.splice(fromIndex, 1)[0];
    
    // Add to destination
    if (!newForm.surveyJSON.pages[toPage]) {
      newForm.surveyJSON.pages[toPage] = { elements: [] };
    }
    if (!newForm.surveyJSON.pages[toPage].elements) {
      newForm.surveyJSON.pages[toPage].elements = [];
    }
    
    newForm.surveyJSON.pages[toPage].elements.splice(toIndex, 0, element);
    
    return {
      ...state,
      currentForm: newForm,
      editor: {
        ...state.editor,
        isDirty: true
      }
    };
  }
  
  // History management
  addToHistory(previousState, action) {
    // Remove future history if we're not at the end
    this.history = this.history.slice(0, this.historyPointer + 1);
    
    // Add new entry
    this.history.push({
      state: previousState,
      action: action,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.history.length > STORE_CONFIG.maxHistory) {
      this.history.shift();
    } else {
      this.historyPointer++;
    }
  }
  
  // Perform undo
  performUndo(currentState) {
    if (this.canUndo()) {
      const entry = this.history[this.historyPointer];
      this.historyPointer--;
      return this.deepClone(entry.state);
    }
    return currentState;
  }
  
  // Perform redo
  performRedo(currentState) {
    if (this.canRedo()) {
      this.historyPointer++;
      const nextEntry = this.history[this.historyPointer + 1];
      if (nextEntry) {
        // Re-apply the action
        return this.reducer(currentState, nextEntry.action);
      }
    }
    return currentState;
  }
  
  // Check if can undo
  canUndo() {
    return this.historyPointer >= 0;
  }
  
  // Check if can redo
  canRedo() {
    return this.historyPointer < this.history.length - 1;
  }
  
  // Check if action should be added to history
  isHistoryAction(type) {
    const skipTypes = [
      ActionTypes.UNDO,
      ActionTypes.REDO,
      ActionTypes.SET_LOADING,
      ActionTypes.SET_SAVING,
      ActionTypes.UPDATE_ACTIVITY,
      ActionTypes.UPDATE_DRAG
    ];
    
    return skipTypes.includes(type);
  }
  
  // Notify subscribers
  notifySubscribers(previousState) {
    this.subscribers.forEach(({ callback, selector }) => {
      if (selector) {
        const prevValue = selector(previousState);
        const newValue = selector(this.state);
        
        if (prevValue !== newValue) {
          callback(this.state, previousState);
        }
      } else {
        callback(this.state, previousState);
      }
    });
  }
  
  // Persist state to localStorage
  persistState() {
    try {
      const stateToPersist = {
        ui: this.state.ui,
        preferences: this.state.preferences,
        ai: {
          conversation: this.state.ai.conversation.slice(-10) // Keep last 10 messages
        }
      };
      
      localStorage.setItem(
        STORE_CONFIG.persistKey,
        JSON.stringify(stateToPersist)
      );
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }
  
  // Load persisted state
  loadPersistedState() {
    try {
      const persisted = localStorage.getItem(STORE_CONFIG.persistKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        
        // Merge with initial state
        this.state = {
          ...this.state,
          ui: {
            ...this.state.ui,
            ...parsed.ui
          },
          preferences: {
            ...this.state.preferences,
            ...parsed.preferences
          },
          ai: {
            ...this.state.ai,
            ...parsed.ai
          }
        };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }
  
  // Deep clone helper
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // Debounce helper
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Action creators
  actions = {
    // Form actions
    setCurrentForm: (form) => ({
      type: ActionTypes.SET_CURRENT_FORM,
      payload: form
    }),
    
    updateFormProperty: (path, value) => ({
      type: ActionTypes.UPDATE_FORM_PROPERTY,
      payload: { path, value }
    }),
    
    addFormElement: (pageIndex, element, position) => ({
      type: ActionTypes.ADD_FORM_ELEMENT,
      payload: { pageIndex, element, position }
    }),
    
    removeFormElement: (pageIndex, elementIndex) => ({
      type: ActionTypes.REMOVE_FORM_ELEMENT,
      payload: { pageIndex, elementIndex }
    }),
    
    moveFormElement: (fromPage, fromIndex, toPage, toIndex) => ({
      type: ActionTypes.MOVE_FORM_ELEMENT,
      payload: { fromPage, fromIndex, toPage, toIndex }
    }),
    
    // UI actions
    selectElement: (element) => ({
      type: ActionTypes.SELECT_ELEMENT,
      payload: element
    }),
    
    toggleSection: (section) => ({
      type: ActionTypes.TOGGLE_SECTION,
      payload: section
    }),
    
    setActiveTab: (tab) => ({
      type: ActionTypes.SET_ACTIVE_TAB,
      payload: tab
    }),
    
    toggleSidebar: () => ({
      type: ActionTypes.TOGGLE_SIDEBAR
    }),
    
    setTheme: (theme) => ({
      type: ActionTypes.SET_THEME,
      payload: theme
    }),
    
    setZoom: (zoom) => ({
      type: ActionTypes.SET_ZOOM,
      payload: zoom
    }),
    
    // Editor actions
    setDirty: (isDirty) => ({
      type: ActionTypes.SET_DIRTY,
      payload: isDirty
    }),
    
    setSaving: (isSaving) => ({
      type: ActionTypes.SET_SAVING,
      payload: isSaving
    }),
    
    setLoading: (isLoading) => ({
      type: ActionTypes.SET_LOADING,
      payload: isLoading
    }),
    
    setLastSaved: (timestamp) => ({
      type: ActionTypes.SET_LAST_SAVED,
      payload: timestamp
    }),
    
    toggleAutoSave: () => ({
      type: ActionTypes.TOGGLE_AUTO_SAVE
    }),
    
    // Drag and drop actions
    startDrag: (element, offset) => ({
      type: ActionTypes.START_DRAG,
      payload: { element, offset }
    }),
    
    updateDrag: (updates) => ({
      type: ActionTypes.UPDATE_DRAG,
      payload: updates
    }),
    
    endDrag: () => ({
      type: ActionTypes.END_DRAG
    }),
    
    setDropTarget: (target) => ({
      type: ActionTypes.SET_DROP_TARGET,
      payload: target
    }),
    
    // AI actions
    toggleAI: () => ({
      type: ActionTypes.TOGGLE_AI
    }),
    
    setAIProcessing: (isProcessing) => ({
      type: ActionTypes.SET_AI_PROCESSING,
      payload: isProcessing
    }),
    
    addAIMessage: (message) => ({
      type: ActionTypes.ADD_AI_MESSAGE,
      payload: message
    }),
    
    setAISuggestions: (suggestions) => ({
      type: ActionTypes.SET_AI_SUGGESTIONS,
      payload: suggestions
    }),
    
    // Preview actions
    togglePreview: () => ({
      type: ActionTypes.TOGGLE_PREVIEW
    }),
    
    setPreviewDevice: (device) => ({
      type: ActionTypes.SET_PREVIEW_DEVICE,
      payload: device
    }),
    
    setPreviewTheme: (theme) => ({
      type: ActionTypes.SET_PREVIEW_THEME,
      payload: theme
    }),
    
    // Validation actions
    setValidationErrors: (errors, warnings) => ({
      type: ActionTypes.SET_VALIDATION_ERRORS,
      payload: { errors, warnings }
    }),
    
    addValidationError: (error) => ({
      type: ActionTypes.ADD_VALIDATION_ERROR,
      payload: error
    }),
    
    clearValidation: () => ({
      type: ActionTypes.CLEAR_VALIDATION
    }),
    
    // Preference actions
    updatePreferences: (preferences) => ({
      type: ActionTypes.UPDATE_PREFERENCES,
      payload: preferences
    }),
    
    // Session actions
    setUser: (user, permissions) => ({
      type: ActionTypes.SET_USER,
      payload: { user, permissions }
    }),
    
    updateActivity: () => ({
      type: ActionTypes.UPDATE_ACTIVITY
    }),
    
    // Global actions
    resetState: () => ({
      type: ActionTypes.RESET_STATE
    }),
    
    loadState: (state) => ({
      type: ActionTypes.LOAD_STATE,
      payload: state
    }),
    
    undo: () => ({
      type: ActionTypes.UNDO
    }),
    
    redo: () => ({
      type: ActionTypes.REDO
    })
  };
  
  // Selectors
  selectors = {
    // Get current form
    getCurrentForm: (state) => state.currentForm,
    
    // Get selected element
    getSelectedElement: (state) => {
      if (!state.ui.selectedElement || !state.currentForm) {
        return null;
      }
      
      const { pageIndex, elementIndex } = state.ui.selectedElement;
      return state.currentForm.surveyJSON.pages[pageIndex]?.elements[elementIndex];
    },
    
    // Get UI state
    getUIState: (state) => state.ui,
    
    // Get editor state
    getEditorState: (state) => state.editor,
    
    // Get validation errors
    getValidationErrors: (state) => state.validation.errors,
    
    // Get user permissions
    getUserPermissions: (state) => state.session.permissions,
    
    // Check if user has permission
    hasPermission: (state, permission) => {
      return state.session.permissions.includes(permission);
    },
    
    // Get theme
    getTheme: (state) => state.ui.theme,
    
    // Is form dirty
    isFormDirty: (state) => state.editor.isDirty,
    
    // Can undo/redo
    canUndo: () => this.canUndo(),
    canRedo: () => this.canRedo()
  };
}

// Create singleton instance
const store = new Store();

// Export store instance and utilities
export default store;
export { STORE_CONFIG };

// Logger middleware
export const loggerMiddleware = (store, action) => {
  console.group(`Action: ${action.type}`);
  console.log('Payload:', action.payload);
  console.log('Previous State:', store.getState());
  console.groupEnd();
  
  return action;
};

// Validation middleware
export const validationMiddleware = (store, action) => {
  // Validate actions that modify form
  if (action.type === ActionTypes.UPDATE_FORM_PROPERTY) {
    const { path, value } = action.payload;
    
    // Example validation
    if (path === 'title' && (!value || value.length > 255)) {
      notifications.error('Title must be between 1 and 255 characters');
      return false; // Cancel action
    }
  }
  
  return action;
};

// Activity tracking middleware
export const activityMiddleware = (store, action) => {
  // Update activity timestamp for user actions
  const userActions = [
    ActionTypes.UPDATE_FORM_PROPERTY,
    ActionTypes.ADD_FORM_ELEMENT,
    ActionTypes.REMOVE_FORM_ELEMENT,
    ActionTypes.MOVE_FORM_ELEMENT
  ];
  
  if (userActions.includes(action.type)) {
    // Dispatch activity update after current action
    setTimeout(() => {
      store.dispatch(store.actions.updateActivity());
    }, 0);
  }
  
  return action;
};

// Batch actions utility
export function batchActions(actions) {
  return {
    type: 'BATCH_ACTIONS',
    payload: actions
  };
}

// Batch middleware
export const batchMiddleware = (store, action) => {
  if (action.type === 'BATCH_ACTIONS') {
    action.payload.forEach(a => store.dispatch(a));
    return false; // Don't process batch action itself
  }
  
  return action;
};