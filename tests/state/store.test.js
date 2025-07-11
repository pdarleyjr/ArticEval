import store, { ActionTypes, STORE_CONFIG, loggerMiddleware, validationMiddleware, activityMiddleware, batchActions, batchMiddleware } from '../../src/state/store.js';
import notifications from '../../src/utils/notifications.js';

// Mock dependencies
jest.mock('../../src/utils/notifications.js');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock Redux DevTools
const devToolsMock = {
  init: jest.fn(),
  send: jest.fn(),
  subscribe: jest.fn()
};
global.__REDUX_DEVTOOLS_EXTENSION__ = {
  connect: jest.fn(() => devToolsMock)
};

// Helper to get fresh store instance
function createStore() {
  // Clear singleton state
  store.state = store.deepClone(initialState);
  store.history = [];
  store.historyPointer = -1;
  store.subscribers.clear();
  store.middleware = [];
  store.isDispatching = false;
  
  // Re-initialize
  store.loadPersistedState();
  if (STORE_CONFIG.enableDevTools && window.__REDUX_DEVTOOLS_EXTENSION__) {
    store.devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name: 'Form Builder Store' });
    store.devTools.init(store.state);
  }
  
  return store;
}

// Initial state for reference
const initialState = {
  currentForm: null,
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
  editor: {
    isDirty: false,
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    autoSave: true,
    readOnly: false
  },
  dragDrop: {
    isDragging: false,
    draggedElement: null,
    dropTarget: null,
    dragOffset: { x: 0, y: 0 }
  },
  ai: {
    isOpen: false,
    isProcessing: false,
    conversation: [],
    suggestions: []
  },
  preview: {
    isOpen: false,
    device: 'desktop',
    theme: 'default',
    orientation: 'portrait'
  },
  validation: {
    errors: [],
    warnings: [],
    isValidating: false,
    lastValidated: null
  },
  preferences: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    confirmDelete: true,
    enableShortcuts: true,
    enableAnimations: true
  },
  session: {
    user: null,
    permissions: [],
    lastActivity: Date.now()
  }
};

describe('Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.getItem.mockReturnValue(null);
    createStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(store.getState().ui.theme).toBe('light');
      expect(store.getState().editor.autoSave).toBe(true);
      expect(store.getState().preferences.language).toBe('en');
    });

    it('should be a singleton', () => {
      const store1 = store;
      const store2 = store;
      expect(store1).toBe(store2);
    });

    it('should load persisted state from localStorage', () => {
      const persistedState = {
        ui: { theme: 'dark' },
        preferences: { language: 'es' },
        ai: { conversation: [{ role: 'user', content: 'test' }] }
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedState));
      createStore();
      
      expect(store.getState().ui.theme).toBe('dark');
      expect(store.getState().preferences.language).toBe('es');
      expect(store.getState().ai.conversation).toEqual([{ role: 'user', content: 'test' }]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('corrupted data');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      createStore();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load persisted state:', expect.any(Error));
      expect(store.getState().ui.theme).toBe('light'); // Default value
      
      consoleSpy.mockRestore();
    });

    it('should initialize Redux DevTools if available', () => {
      createStore();
      
      expect(global.__REDUX_DEVTOOLS_EXTENSION__.connect).toHaveBeenCalledWith({
        name: 'Form Builder Store'
      });
      expect(devToolsMock.init).toHaveBeenCalledWith(store.getState());
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = store.getState();
      expect(state).toHaveProperty('currentForm');
      expect(state).toHaveProperty('ui');
      expect(state).toHaveProperty('editor');
    });
  });

  describe('dispatch', () => {
    it('should update state based on action', () => {
      store.dispatch({
        type: ActionTypes.SET_THEME,
        payload: 'dark'
      });
      
      expect(store.getState().ui.theme).toBe('dark');
    });

    it('should run middleware in order', () => {
      const middleware1 = jest.fn((store, action) => action);
      const middleware2 = jest.fn((store, action) => action);
      
      store.use(middleware1);
      store.use(middleware2);
      
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      
      expect(middleware1).toHaveBeenCalledBefore(middleware2);
    });

    it('should stop processing if middleware returns false', () => {
      const middleware1 = jest.fn(() => false);
      const middleware2 = jest.fn((store, action) => action);
      
      store.use(middleware1);
      store.use(middleware2);
      
      const initialTheme = store.getState().ui.theme;
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      
      expect(middleware2).not.toHaveBeenCalled();
      expect(store.getState().ui.theme).toBe(initialTheme);
    });

    it('should prevent recursive dispatching', () => {
      const recursiveMiddleware = (store, action) => {
        if (action.type === 'RECURSIVE') {
          store.dispatch({ type: 'RECURSIVE' });
        }
        return action;
      };
      
      store.use(recursiveMiddleware);
      
      expect(() => {
        store.dispatch({ type: 'RECURSIVE' });
      }).toThrow('Cannot dispatch while dispatching');
    });

    it('should add to history for non-skip actions', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      
      expect(store.history.length).toBe(1);
      expect(store.historyPointer).toBe(0);
    });

    it('should not add to history for skip actions', () => {
      store.dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      expect(store.history.length).toBe(0);
      expect(store.historyPointer).toBe(-1);
    });

    it('should notify subscribers', () => {
      const callback = jest.fn();
      store.subscribe(callback);
      
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ ui: expect.objectContaining({ theme: 'dark' }) }),
        expect.objectContaining({ ui: expect.objectContaining({ theme: 'light' }) })
      );
    });

    it('should persist state with debouncing', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(STORE_CONFIG.persistDebounce);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORE_CONFIG.persistKey,
        expect.stringContaining('"theme":"dark"')
      );
    });

    it('should send action to Redux DevTools', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      
      expect(devToolsMock.send).toHaveBeenCalledWith(
        { type: ActionTypes.SET_THEME, payload: 'dark' },
        store.getState()
      );
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should add subscriber and return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = store.subscribe(callback);
      
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'light' });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should support selectors', () => {
      const callback = jest.fn();
      const selector = state => state.ui.theme;
      
      store.subscribe(callback, selector);
      
      // Should trigger - theme changes
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Should not trigger - theme doesn't change
      store.dispatch({ type: ActionTypes.SET_ZOOM, payload: 150 });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('middleware', () => {
    it('should add and remove middleware', () => {
      const middleware = jest.fn((store, action) => action);
      
      store.use(middleware);
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      expect(middleware).toHaveBeenCalled();
      
      store.removeMiddleware(middleware);
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'light' });
      expect(middleware).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reducer - Form actions', () => {
    it('should handle SET_CURRENT_FORM', () => {
      const form = { id: 1, title: 'Test Form', surveyJSON: { pages: [] } };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      
      expect(store.getState().currentForm).toEqual(form);
      expect(store.getState().editor.isDirty).toBe(false);
    });

    it('should handle UPDATE_FORM_PROPERTY', () => {
      const form = { id: 1, title: 'Test', surveyJSON: { pages: [] } };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      store.dispatch({
        type: ActionTypes.UPDATE_FORM_PROPERTY,
        payload: { path: 'title', value: 'Updated Title' }
      });
      
      expect(store.getState().currentForm.title).toBe('Updated Title');
      expect(store.getState().editor.isDirty).toBe(true);
    });

    it('should handle nested property updates', () => {
      const form = { id: 1, surveyJSON: { theme: { primaryColor: 'blue' } } };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      store.dispatch({
        type: ActionTypes.UPDATE_FORM_PROPERTY,
        payload: { path: 'surveyJSON.theme.primaryColor', value: 'red' }
      });
      
      expect(store.getState().currentForm.surveyJSON.theme.primaryColor).toBe('red');
    });

    it('should handle ADD_FORM_ELEMENT', () => {
      const form = { surveyJSON: { pages: [{ elements: [] }] } };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      
      const element = { type: 'text', name: 'q1' };
      store.dispatch({
        type: ActionTypes.ADD_FORM_ELEMENT,
        payload: { pageIndex: 0, element }
      });
      
      expect(store.getState().currentForm.surveyJSON.pages[0].elements).toHaveLength(1);
      expect(store.getState().currentForm.surveyJSON.pages[0].elements[0]).toEqual(element);
    });

    it('should handle ADD_FORM_ELEMENT with position', () => {
      const form = {
        surveyJSON: {
          pages: [{
            elements: [
              { type: 'text', name: 'q1' },
              { type: 'text', name: 'q3' }
            ]
          }]
        }
      };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      
      const element = { type: 'text', name: 'q2' };
      store.dispatch({
        type: ActionTypes.ADD_FORM_ELEMENT,
        payload: { pageIndex: 0, element, position: 1 }
      });
      
      const elements = store.getState().currentForm.surveyJSON.pages[0].elements;
      expect(elements).toHaveLength(3);
      expect(elements[1].name).toBe('q2');
    });

    it('should handle REMOVE_FORM_ELEMENT', () => {
      const form = {
        surveyJSON: {
          pages: [{
            elements: [
              { type: 'text', name: 'q1' },
              { type: 'text', name: 'q2' }
            ]
          }]
        }
      };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      store.dispatch({ type: ActionTypes.SELECT_ELEMENT, payload: { pageIndex: 0, elementIndex: 0 } });
      
      store.dispatch({
        type: ActionTypes.REMOVE_FORM_ELEMENT,
        payload: { pageIndex: 0, elementIndex: 0 }
      });
      
      expect(store.getState().currentForm.surveyJSON.pages[0].elements).toHaveLength(1);
      expect(store.getState().currentForm.surveyJSON.pages[0].elements[0].name).toBe('q2');
      expect(store.getState().ui.selectedElement).toBeNull();
    });

    it('should handle MOVE_FORM_ELEMENT', () => {
      const form = {
        surveyJSON: {
          pages: [
            { elements: [{ type: 'text', name: 'q1' }, { type: 'text', name: 'q2' }] },
            { elements: [{ type: 'text', name: 'q3' }] }
          ]
        }
      };
      store.dispatch({ type: ActionTypes.SET_CURRENT_FORM, payload: form });
      
      store.dispatch({
        type: ActionTypes.MOVE_FORM_ELEMENT,
        payload: { fromPage: 0, fromIndex: 1, toPage: 1, toIndex: 0 }
      });
      
      const state = store.getState();
      expect(state.currentForm.surveyJSON.pages[0].elements).toHaveLength(1);
      expect(state.currentForm.surveyJSON.pages[0].elements[0].name).toBe('q1');
      expect(state.currentForm.surveyJSON.pages[1].elements).toHaveLength(2);
      expect(state.currentForm.surveyJSON.pages[1].elements[0].name).toBe('q2');
    });
  });

  describe('Reducer - UI actions', () => {
    it('should handle SELECT_ELEMENT', () => {
      const element = { pageIndex: 0, elementIndex: 1 };
      store.dispatch({ type: ActionTypes.SELECT_ELEMENT, payload: element });
      
      expect(store.getState().ui.selectedElement).toEqual(element);
    });

    it('should handle TOGGLE_SECTION', () => {
      // Set serializes as empty object in JSON, need to check differently
      const initialSections = store.getState().ui.expandedSections;
      expect(initialSections.has('properties')).toBe(false);
      
      store.dispatch({ type: ActionTypes.TOGGLE_SECTION, payload: 'properties' });
      expect(store.getState().ui.expandedSections.has('properties')).toBe(true);
      
      store.dispatch({ type: ActionTypes.TOGGLE_SECTION, payload: 'properties' });
      expect(store.getState().ui.expandedSections.has('properties')).toBe(false);
    });

    it('should handle SET_ACTIVE_TAB', () => {
      store.dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: 'logic' });
      expect(store.getState().ui.activeTab).toBe('logic');
    });

    it('should handle TOGGLE_SIDEBAR', () => {
      const initial = store.getState().ui.sidebarCollapsed;
      store.dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
      expect(store.getState().ui.sidebarCollapsed).toBe(!initial);
    });

    it('should handle SET_THEME', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      expect(store.getState().ui.theme).toBe('dark');
    });

    it('should handle SET_ZOOM', () => {
      store.dispatch({ type: ActionTypes.SET_ZOOM, payload: 150 });
      expect(store.getState().ui.zoom).toBe(150);
    });
  });

  describe('Reducer - Editor actions', () => {
    it('should handle SET_DIRTY', () => {
      store.dispatch({ type: ActionTypes.SET_DIRTY, payload: true });
      expect(store.getState().editor.isDirty).toBe(true);
    });

    it('should handle SET_SAVING', () => {
      store.dispatch({ type: ActionTypes.SET_SAVING, payload: true });
      expect(store.getState().editor.isSaving).toBe(true);
    });

    it('should handle SET_LOADING', () => {
      store.dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      expect(store.getState().editor.isLoading).toBe(true);
    });

    it('should handle SET_LAST_SAVED', () => {
      const timestamp = Date.now();
      store.dispatch({ type: ActionTypes.SET_LAST_SAVED, payload: timestamp });
      expect(store.getState().editor.lastSaved).toBe(timestamp);
    });

    it('should handle TOGGLE_AUTO_SAVE', () => {
      const initial = store.getState().editor.autoSave;
      store.dispatch({ type: ActionTypes.TOGGLE_AUTO_SAVE });
      expect(store.getState().editor.autoSave).toBe(!initial);
    });
  });

  describe('Reducer - Drag and Drop actions', () => {
    it('should handle START_DRAG', () => {
      const element = { type: 'text', name: 'q1' };
      const offset = { x: 10, y: 20 };
      
      store.dispatch({
        type: ActionTypes.START_DRAG,
        payload: { element, offset }
      });
      
      const dragDrop = store.getState().dragDrop;
      expect(dragDrop.isDragging).toBe(true);
      expect(dragDrop.draggedElement).toEqual(element);
      expect(dragDrop.dragOffset).toEqual(offset);
    });

    it('should handle UPDATE_DRAG', () => {
      store.dispatch({
        type: ActionTypes.UPDATE_DRAG,
        payload: { dropTarget: 'page-1' }
      });
      
      expect(store.getState().dragDrop.dropTarget).toBe('page-1');
    });

    it('should handle END_DRAG', () => {
      // Start drag first
      store.dispatch({
        type: ActionTypes.START_DRAG,
        payload: { element: { type: 'text' } }
      });
      
      store.dispatch({ type: ActionTypes.END_DRAG });
      
      const dragDrop = store.getState().dragDrop;
      expect(dragDrop.isDragging).toBe(false);
      expect(dragDrop.draggedElement).toBeNull();
      expect(dragDrop.dropTarget).toBeNull();
    });

    it('should handle SET_DROP_TARGET', () => {
      store.dispatch({
        type: ActionTypes.SET_DROP_TARGET,
        payload: 'element-5'
      });
      
      expect(store.getState().dragDrop.dropTarget).toBe('element-5');
    });
  });

  describe('Reducer - AI actions', () => {
    it('should handle TOGGLE_AI', () => {
      const initial = store.getState().ai.isOpen;
      store.dispatch({ type: ActionTypes.TOGGLE_AI });
      expect(store.getState().ai.isOpen).toBe(!initial);
    });

    it('should handle SET_AI_PROCESSING', () => {
      store.dispatch({ type: ActionTypes.SET_AI_PROCESSING, payload: true });
      expect(store.getState().ai.isProcessing).toBe(true);
    });

    it('should handle ADD_AI_MESSAGE', () => {
      const message = { role: 'user', content: 'Help me create a survey' };
      store.dispatch({ type: ActionTypes.ADD_AI_MESSAGE, payload: message });
      
      expect(store.getState().ai.conversation).toHaveLength(1);
      expect(store.getState().ai.conversation[0]).toEqual(message);
    });

    it('should handle SET_AI_SUGGESTIONS', () => {
      const suggestions = ['Add rating scale', 'Include demographics'];
      store.dispatch({ type: ActionTypes.SET_AI_SUGGESTIONS, payload: suggestions });
      
      expect(store.getState().ai.suggestions).toEqual(suggestions);
    });
  });

  describe('Reducer - Preview actions', () => {
    it('should handle TOGGLE_PREVIEW', () => {
      const initial = store.getState().preview.isOpen;
      store.dispatch({ type: ActionTypes.TOGGLE_PREVIEW });
      expect(store.getState().preview.isOpen).toBe(!initial);
    });

    it('should handle SET_PREVIEW_DEVICE', () => {
      store.dispatch({ type: ActionTypes.SET_PREVIEW_DEVICE, payload: 'mobile' });
      expect(store.getState().preview.device).toBe('mobile');
    });

    it('should handle SET_PREVIEW_THEME', () => {
      store.dispatch({ type: ActionTypes.SET_PREVIEW_THEME, payload: 'modern' });
      expect(store.getState().preview.theme).toBe('modern');
    });
  });

  describe('Reducer - Validation actions', () => {
    it('should handle SET_VALIDATION_ERRORS', () => {
      const errors = [{ field: 'title', message: 'Required' }];
      const warnings = [{ field: 'description', message: 'Too short' }];
      
      store.dispatch({
        type: ActionTypes.SET_VALIDATION_ERRORS,
        payload: { errors, warnings }
      });
      
      const validation = store.getState().validation;
      expect(validation.errors).toEqual(errors);
      expect(validation.warnings).toEqual(warnings);
      expect(validation.isValidating).toBe(false);
      expect(validation.lastValidated).toBeGreaterThan(0);
    });

    it('should handle ADD_VALIDATION_ERROR', () => {
      const error = { field: 'name', message: 'Invalid characters' };
      store.dispatch({ type: ActionTypes.ADD_VALIDATION_ERROR, payload: error });
      
      expect(store.getState().validation.errors).toContainEqual(error);
    });

    it('should handle CLEAR_VALIDATION', () => {
      // Add some errors first
      store.dispatch({
        type: ActionTypes.SET_VALIDATION_ERRORS,
        payload: { errors: [{ field: 'test', message: 'error' }] }
      });
      
      store.dispatch({ type: ActionTypes.CLEAR_VALIDATION });
      
      const validation = store.getState().validation;
      expect(validation.errors).toEqual([]);
      expect(validation.warnings).toEqual([]);
      expect(validation.isValidating).toBe(false);
    });
  });

  describe('Reducer - Preference actions', () => {
    it('should handle UPDATE_PREFERENCES', () => {
      store.dispatch({
        type: ActionTypes.UPDATE_PREFERENCES,
        payload: { language: 'es', dateFormat: 'DD/MM/YYYY' }
      });
      
      const preferences = store.getState().preferences;
      expect(preferences.language).toBe('es');
      expect(preferences.dateFormat).toBe('DD/MM/YYYY');
      expect(preferences.confirmDelete).toBe(true); // Unchanged
    });
  });

  describe('Reducer - Session actions', () => {
    it('should handle SET_USER', () => {
      const user = { id: 1, name: 'John Doe' };
      const permissions = ['edit', 'delete'];
      
      store.dispatch({
        type: ActionTypes.SET_USER,
        payload: { user, permissions }
      });
      
      const session = store.getState().session;
      expect(session.user).toEqual(user);
      expect(session.permissions).toEqual(permissions);
    });

    it('should handle UPDATE_ACTIVITY', () => {
      const before = Date.now();
      store.dispatch({ type: ActionTypes.UPDATE_ACTIVITY });
      const after = Date.now();
      
      const activity = store.getState().session.lastActivity;
      expect(activity).toBeGreaterThanOrEqual(before);
      expect(activity).toBeLessThanOrEqual(after);
    });
  });

  describe('Reducer - Global actions', () => {
    it('should handle RESET_STATE', () => {
      // Modify state
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      store.dispatch({ type: ActionTypes.SET_USER, payload: { user: { id: 1 } } });
      
      // Reset
      store.dispatch({ type: ActionTypes.RESET_STATE });
      
      expect(store.getState().ui.theme).toBe('light');
      expect(store.getState().session.user).toBeNull();
    });

    it('should handle LOAD_STATE', () => {
      const newState = {
        ...store.deepClone(initialState),
        ui: { ...initialState.ui, theme: 'dark' },
        preferences: { ...initialState.preferences, language: 'fr' }
      };
      
      // Set session first
      store.dispatch({
        type: ActionTypes.SET_USER,
        payload: { user: { id: 1 }, permissions: ['admin'] }
      });
      
      store.dispatch({ type: ActionTypes.LOAD_STATE, payload: newState });
      
      const state = store.getState();
      expect(state.ui.theme).toBe('dark');
      expect(state.preferences.language).toBe('fr');
      expect(state.session.user).toEqual({ id: 1 }); // Preserved
    });
  });

  describe('History Management', () => {
    it('should support undo', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'blue' });
      
      expect(store.getState().ui.theme).toBe('blue');
      
      store.dispatch({ type: ActionTypes.UNDO });
      expect(store.getState().ui.theme).toBe('dark');
      
      store.dispatch({ type: ActionTypes.UNDO });
      expect(store.getState().ui.theme).toBe('light');
    });

    it('should support redo', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'blue' });
      store.dispatch({ type: ActionTypes.UNDO });
      store.dispatch({ type: ActionTypes.UNDO });
      
      expect(store.getState().ui.theme).toBe('light');
      
      store.dispatch({ type: ActionTypes.REDO });
      expect(store.getState().ui.theme).toBe('dark');
      
      store.dispatch({ type: ActionTypes.REDO });
      expect(store.getState().ui.theme).toBe('blue');
    });

    it('should limit history size', () => {
      // Override max history for testing
      const originalMax = STORE_CONFIG.maxHistory;
      STORE_CONFIG.maxHistory = 3;
      
      for (let i = 0; i < 5; i++) {
        store.dispatch({ type: ActionTypes.SET_THEME, payload: `theme-${i}` });
      }
      
      expect(store.history.length).toBe(3);
      
      STORE_CONFIG.maxHistory = originalMax;
    });

    it('should clear future history on new action after undo', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'blue' });
      store.dispatch({ type: ActionTypes.UNDO });
      
      expect(store.canRedo()).toBe(true);
      
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'green' });
      
      expect(store.canRedo()).toBe(false);
    });

    it('should check canUndo and canRedo correctly', () => {
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);
      
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      expect(store.canUndo()).toBe(true);
      expect(store.canRedo()).toBe(false);
      
      store.dispatch({ type: ActionTypes.UNDO });
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(true);
    });
  });

  describe('State Persistence', () => {
    it('should persist specific state slices', () => {
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      store.dispatch({
        type: ActionTypes.UPDATE_PREFERENCES,
        payload: { language: 'es' }
      });
      store.dispatch({
        type: ActionTypes.ADD_AI_MESSAGE,
        payload: { role: 'user', content: 'test' }
      });
      
      jest.advanceTimersByTime(STORE_CONFIG.persistDebounce);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORE_CONFIG.persistKey,
        expect.stringContaining('"theme":"dark"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORE_CONFIG.persistKey,
        expect.stringContaining('"language":"es"')
      );
    });

    it('should only keep last 10 AI messages', () => {
      for (let i = 0; i < 15; i++) {
        store.dispatch({
          type: ActionTypes.ADD_AI_MESSAGE,
          payload: { role: 'user', content: `message ${i}` }
        });
      }
      
      jest.advanceTimersByTime(STORE_CONFIG.persistDebounce);
      
      const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      const persisted = JSON.parse(lastCall[1]);
      
      expect(persisted.ai.conversation).toHaveLength(10);
      expect(persisted.ai.conversation[0].content).toBe('message 5');
      expect(persisted.ai.conversation[9].content).toBe('message 14');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
      jest.advanceTimersByTime(STORE_CONFIG.persistDebounce);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to persist state:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Action Creators', () => {
    it('should create form actions', () => {
      const form = { id: 1, title: 'Test' };
      expect(store.actions.setCurrentForm(form)).toEqual({
        type: ActionTypes.SET_CURRENT_FORM,
        payload: form
      });
      
      expect(store.actions.updateFormProperty('title', 'New Title')).toEqual({
        type: ActionTypes.UPDATE_FORM_PROPERTY,
        payload: { path: 'title', value: 'New Title' }
      });
      
      expect(store.actions.addFormElement(0, { type: 'text' }, 1)).toEqual({
        type: ActionTypes.ADD_FORM_ELEMENT,
        payload: { pageIndex: 0, element: { type: 'text' }, position: 1 }
      });
    });

    it('should create UI actions', () => {
      expect(store.actions.selectElement({ pageIndex: 0, elementIndex: 1 })).toEqual({
        type: ActionTypes.SELECT_ELEMENT,
        payload: { pageIndex: 0, elementIndex: 1 }
      });
      
      expect(store.actions.toggleSection('properties')).toEqual({
        type: ActionTypes.TOGGLE_SECTION,
        payload: 'properties'
      });
      
      expect(store.actions.toggleSidebar()).toEqual({
        type: ActionTypes.TOGGLE_SIDEBAR
      });
    });

    it('should create editor actions', () => {
      expect(store.actions.setDirty(true)).toEqual({
        type: ActionTypes.SET_DIRTY,
        payload: true
      });
      
      expect(store.actions.toggleAutoSave()).toEqual({
        type: ActionTypes.TOGGLE_AUTO_SAVE
      });
    });

    it('should create drag and drop actions', () => {
      const element = { type: 'text' };
      const offset = { x: 10, y: 20 };
      
      expect(store.actions.startDrag(element, offset)).toEqual({
        type: ActionTypes.START_DRAG,
        payload: { element, offset }
      });
      
      expect(store.actions.endDrag()).toEqual({
        type: ActionTypes.END_DRAG
      });
    });

    it('should create AI actions', () => {
      expect(store.actions.toggleAI()).toEqual({
        type: ActionTypes.TOGGLE_AI
      });
      
      const message = { role: 'user', content: 'Help' };
      expect(store.actions.addAIMessage(message)).toEqual({
        type: ActionTypes.ADD_AI_MESSAGE,
        payload: message
      });
    });

    it('should create global actions', () => {
      expect(store.actions.undo()).toEqual({
        type: ActionTypes.UNDO
      });
      
      expect(store.actions.redo()).toEqual({
        type: ActionTypes.REDO
      });
      
      expect(store.actions.resetState()).toEqual({
        type: ActionTypes.RESET_STATE
      });
    });
  });

  describe('Selectors', () => {
    it('should get current form', () => {
      const form = { id: 1, title: 'Test' };
      store.dispatch(store.actions.setCurrentForm(form));
      
      expect(store.selectors.getCurrentForm(store.getState())).toEqual(form);
    });

    it('should get selected element', () => {
      const form = {
        surveyJSON: {
          pages: [{
            elements: [
              { type: 'text', name: 'q1' },
              { type: 'checkbox', name: 'q2' }
            ]
          }]
        }
      };
      
      store.dispatch(store.actions.setCurrentForm(form));
      store.dispatch(store.actions.selectElement({ pageIndex: 0, elementIndex: 1 }));
      
      expect(store.selectors.getSelectedElement(store.getState())).toEqual({
        type: 'checkbox',
        name: 'q2'
      });
    });

    it('should return null for invalid selected element', () => {
      store.dispatch(store.actions.selectElement({ pageIndex: 5, elementIndex: 10 }));
      expect(store.selectors.getSelectedElement(store.getState())).toBeNull();
    });

    it('should get UI state', () => {
      expect(store.selectors.getUIState(store.getState())).toEqual(
        expect.objectContaining({
          theme: 'light',
          activeTab: 'design'
        })
      );
    });

    it('should get validation errors', () => {
      const errors = [{ field: 'title', message: 'Required' }];
      store.dispatch(store.actions.setValidationErrors(errors, []));
      
      expect(store.selectors.getValidationErrors(store.getState())).toEqual(errors);
    });

    it('should check permissions', () => {
      store.dispatch(store.actions.setUser({ id: 1 }, ['edit', 'view']));
      
      expect(store.selectors.hasPermission(store.getState(), 'edit')).toBe(true);
      expect(store.selectors.hasPermission(store.getState(), 'delete')).toBe(false);
    });

    it('should check if form is dirty', () => {
      expect(store.selectors.isFormDirty(store.getState())).toBe(false);
      
      store.dispatch(store.actions.setDirty(true));
      expect(store.selectors.isFormDirty(store.getState())).toBe(true);
    });
  });

  describe('Middleware Implementations', () => {
    describe('loggerMiddleware', () => {
      it('should log action details', () => {
        const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();
        
        store.use(loggerMiddleware);
        store.dispatch({ type: ActionTypes.SET_THEME, payload: 'dark' });
        
        expect(consoleSpy).toHaveBeenCalledWith('Action: SET_THEME');
        expect(logSpy).toHaveBeenCalledWith('Payload:', 'dark');
        expect(logSpy).toHaveBeenCalledWith('Previous State:', expect.any(Object));
        expect(groupEndSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        logSpy.mockRestore();
        groupEndSpy.mockRestore();
      });
    });

    describe('validationMiddleware', () => {
      it('should validate form property updates', () => {
        store.use(validationMiddleware);
        
        const form = { title: 'Test' };
        store.dispatch(store.actions.setCurrentForm(form));
        
        // Invalid title (empty)
        store.dispatch(store.actions.updateFormProperty('title', ''));
        expect(showNotification).toHaveBeenCalledWith(
          'Title must be between 1 and 255 characters',
          'error'
        );
        expect(store.getState().currentForm.title).toBe('Test'); // Unchanged
        
        // Invalid title (too long)
        const longTitle = 'a'.repeat(256);
        store.dispatch(store.actions.updateFormProperty('title', longTitle));
        expect(showNotification).toHaveBeenCalledWith(
          'Title must be between 1 and 255 characters',
          'error'
        );
      });

      it('should pass through valid updates', () => {
        store.use(validationMiddleware);
        
        const form = { title: 'Test' };
        store.dispatch(store.actions.setCurrentForm(form));
        store.dispatch(store.actions.updateFormProperty('title', 'Valid Title'));
        
        expect(store.getState().currentForm.title).toBe('Valid Title');
      });
    });

    describe('activityMiddleware', () => {
      it('should update activity for user actions', async () => {
        store.use(activityMiddleware);
        
        const initialActivity = store.getState().session.lastActivity;
        
        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));
        
        store.dispatch(store.actions.updateFormProperty('title', 'New Title'));
        
        // Activity update is dispatched asynchronously
        jest.runAllTimers();
        
        expect(store.getState().session.lastActivity).toBeGreaterThan(initialActivity);
      });

      it('should not update activity for non-user actions', () => {
        store.use(activityMiddleware);
        
        const initialActivity = store.getState().session.lastActivity;
        
        store.dispatch(store.actions.setLoading(true));
        jest.runAllTimers();
        
        expect(store.getState().session.lastActivity).toBe(initialActivity);
      });
    });

    describe('batchMiddleware', () => {
      it('should process batch actions', () => {
        store.use(batchMiddleware);
        
        const actions = [
          store.actions.setTheme('dark'),
          store.actions.setZoom(150),
          store.actions.toggleSidebar()
        ];
        
        store.dispatch(batchActions(actions));
        
        expect(store.getState().ui.theme).toBe('dark');
        expect(store.getState().ui.zoom).toBe(150);
        expect(store.getState().ui.sidebarCollapsed).toBe(true);
      });

      it('should not process batch action itself', () => {
        store.use(batchMiddleware);
        
        const initialState = store.getState();
        const batchAction = batchActions([]);
        
        store.dispatch(batchAction);
        
        // State should not change from the batch action itself
        expect(store.getState()).toEqual(initialState);
      });
    });
  });

  describe('Helper Methods', () => {
    describe('updateNestedProperty', () => {
      it('should update deeply nested properties', () => {
        const obj = { a: { b: { c: 1 } } };
        const result = store.updateNestedProperty(obj, 'a.b.c', 2);
        
        expect(result.a.b.c).toBe(2);
        expect(obj.a.b.c).toBe(1); // Original unchanged
      });

      it('should create missing nested objects', () => {
        const obj = { a: {} };
        const result = store.updateNestedProperty(obj, 'a.b.c', 'value');
        
        expect(result.a.b.c).toBe('value');
      });

      it('should handle null objects', () => {
        const result = store.updateNestedProperty(null, 'a.b', 'value');
        expect(result).toBeNull();
      });
    });

    describe('deepClone', () => {
      it('should create deep copy of objects', () => {
        const obj = {
          a: 1,
          b: { c: 2, d: [3, 4] },
          e: new Date()
        };
        
        const clone = store.deepClone(obj);
        
        expect(clone).toEqual(obj);
        expect(clone).not.toBe(obj);
        expect(clone.b).not.toBe(obj.b);
        expect(clone.b.d).not.toBe(obj.b.d);
      });

      it('should handle Sets by converting to empty objects', () => {
        const obj = { sections: new Set(['a', 'b']) };
        const clone = store.deepClone(obj);
        
        // Set serializes as empty object
        expect(clone.sections).toEqual({});
      });
    });

    describe('debounce', () => {
      it('should debounce function calls', () => {
        const fn = jest.fn();
        const debounced = store.debounce(fn, 100);
        
        debounced('a');
        debounced('b');
        debounced('c');
        
        expect(fn).not.toHaveBeenCalled();
        
        jest.advanceTimersByTime(100);
        
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('c');
      });
    });
  });
});