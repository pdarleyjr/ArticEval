// ESM facade for form-builder
// This provides an ESM-compatible entry point for the form builder modules

// Re-export all state management modules
export * from './state/StateManager.js';
export * from './state/FormDataStore.js';
export * from './state/HistoryManager.js';

// Re-export UI components
export * from './ui/Canvas.js';
export * from './ui/Toolbox.js';
export * from './ui/HeaderActions.js';

// Main initialization function
export async function initFormBuilder(config = {}) {
  const { StateManager } = await import('./state/StateManager.js');
  const { Canvas } = await import('./ui/Canvas.js');
  const { Toolbox } = await import('./ui/Toolbox.js');
  const { HeaderActions } = await import('./ui/HeaderActions.js');
  
  // Initialize state
  const stateManager = new StateManager();
  
  // Initialize UI components
  const canvas = new Canvas(stateManager, config.canvasElement);
  const toolbox = new Toolbox(stateManager, config.toolboxElement);
  const headerActions = new HeaderActions(stateManager, config.headerElement);
  
  // Set up event listeners
  stateManager.on('stateChange', () => {
    canvas.render();
    toolbox.updateState();
    headerActions.updateState();
  });
  
  // Return API for external control
  return {
    stateManager,
    canvas,
    toolbox,
    headerActions,
    
    // Convenience methods
    loadForm: (formData) => stateManager.loadForm(formData),
    getFormData: () => stateManager.getFormData(),
    reset: () => stateManager.reset(),
    undo: () => stateManager.undo(),
    redo: () => stateManager.redo()
  };
}

// Default export for convenience
export default { initFormBuilder };