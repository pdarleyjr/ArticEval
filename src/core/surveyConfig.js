// SurveyJS configuration and customization
import * as Survey from 'survey-core';
// Note: surveyjs-widgets is loaded globally via script tag in HTML

export async function configureSurvey() {
  // Configure SurveyJS settings
  configureSurveySettings();

  // Apply custom theme
  applyCustomTheme();

  // Register custom widgets
  registerCustomWidgets();

  // Configure localization
  configureLocalization();

  // Create and configure survey instance
  const survey = createSurveyInstance();

  // Add custom properties
  addCustomProperties();

  // Configure question types
  configureQuestionTypes();

  return survey;
}

function configureSurveySettings() {
  // Global SurveyJS settings
  Survey.settings.allowCompleteSurveyAutomatic = false;
  Survey.settings.animationEnabled = true;
  Survey.settings.lazyRowsRendering = true;
  Survey.settings.supportCreatorV2 = true;

  // Text size settings
  Survey.settings.fontSize = {
    default: 16,
    large: 18,
    xlarge: 20
  };

  // Configure matrix settings
  Survey.settings.matrix = {
    defaultRowName: 'Row',
    defaultColName: 'Column'
  };

  // Configure ranking settings
  Survey.settings.ranking = {
    selectToRankEnabled: true,
    selectToRankAreasLayout: 'horizontal'
  };
}

function applyCustomTheme() {
  // Define custom theme
  const customTheme = {
    cssVariables: {
      // Colors
      '--primary-color': '#006C97',
      '--secondary-color': '#FF9933',
      '--success-color': '#43A047',
      '--error-color': '#E53935',
      '--warning-color': '#FB8C00',

      // Typography
      '--font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--font-size-base': '16px',
      '--line-height-base': '1.5',

      // Spacing
      '--spacing-unit': '8px',
      '--spacing-xs': '4px',
      '--spacing-sm': '8px',
      '--spacing-md': '16px',
      '--spacing-lg': '24px',
      '--spacing-xl': '32px',

      // Borders
      '--border-radius': '4px',
      '--border-color': '#E0E0E0',

      // Shadows
      '--shadow-sm': '0 1px 3px rgba(0,0,0,0.12)',
      '--shadow-md': '0 4px 6px rgba(0,0,0,0.16)',
      '--shadow-lg': '0 10px 20px rgba(0,0,0,0.19)',

      // Components
      '--input-height': '40px',
      '--button-height': '40px',
      '--header-height': '60px'
    },

    // Component-specific styles
    question: {
      title: {
        fontSize: '16px',
        fontWeight: '500',
        marginBottom: '8px'
      },
      description: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '12px'
      },
      content: {
        padding: '16px',
        borderRadius: '4px',
        backgroundColor: '#fff'
      }
    },

    page: {
      title: {
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '16px'
      },
      description: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '24px'
      }
    },

    error: {
      root: {
        color: '#E53935',
        fontSize: '14px',
        marginTop: '4px'
      }
    }
  };

  // Apply theme
  Survey.StylesManager.applyTheme('modern');

  // Apply custom CSS variables
  Object.entries(customTheme.cssVariables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

function registerCustomWidgets() {
  // Register AutoComplete widget
  if (window.SurveyWidgets?.AutoComplete) {
    window.SurveyWidgets.AutoComplete(Survey);
  }

  // Register BarRating widget
  if (window.SurveyWidgets?.BarRating) {
    window.SurveyWidgets.BarRating(Survey);
  }

  // Register DatePicker widget
  if (window.SurveyWidgets?.DatePicker) {
    window.SurveyWidgets.DatePicker(Survey);
  }

  // Register SignaturePad widget
  if (window.SurveyWidgets?.SignaturePad) {
    window.SurveyWidgets.SignaturePad(Survey);
  }

  // Register other widgets as needed
  const widgets = [
    'InputMask',
    'MultiSelect',
    'Select2',
    'Sortable',
    'Editor',
    'ImagePicker',
    'ProgressBar',
    'NoUISlider',
    'TagBox',
    'EasyAutocomplete',
    'PrettyCheckbox',
    'Bootstrap-Slider',
    'Microphone'
  ];

  widgets.forEach((widgetName) => {
    if (window.SurveyWidgets?.[widgetName]) {
      window.SurveyWidgets[widgetName](Survey);
    }
  });
}

function configureLocalization() {
  // Set default locale
  Survey.surveyLocalization.defaultLocale = 'en';

  // Add custom localization strings
  Survey.surveyLocalization.locales['en'].custom = {
    aiAssistant: 'AI Assistant',
    generateQuestion: 'Generate Question',
    improveQuestion: 'Improve Question',
    suggestOptions: 'Suggest Options',
    analyzing: 'Analyzing...',
    noSuggestions: 'No suggestions available'
  };

  // Configure date format
  Survey.surveyLocalization.locales['en'].dateFormat = 'mm/dd/yyyy';
}

function createSurveyInstance() {
  // Create survey with initial configuration
  const surveyJSON = {
    title: 'New Form',
    description: '',
    pages: [
      {
        name: 'page1',
        title: 'Page 1',
        elements: []
      }
    ],
    showProgressBar: 'top',
    showQuestionNumbers: 'on',
    showNavigationButtons: true,
    showPrevButton: true,
    showCompletedPage: false,
    questionsOnPageMode: 'standard',
    textUpdateMode: 'onTyping',
    requiredText: '*',
    startSurveyText: 'Start',
    pagePrevText: 'Previous',
    pageNextText: 'Next',
    completeText: 'Submit',
    previewText: 'Preview',
    editText: 'Edit',
    showPreviewBeforeComplete: 'showAnsweredQuestions'
  };

  const survey = new Survey.Model(surveyJSON);

  // Configure survey behavior
  survey.showDesignMode = true;
  survey.allowCompleteSurveyAutomatic = false;
  survey.sendResultOnPageNext = false;
  survey.storeOthersAsComment = true;
  survey.showTitle = true;
  survey.showPageTitles = true;
  survey.showPageNumbers = false;
  survey.showTimerPanel = 'none';
  survey.maxTextLength = 0;
  survey.maxOthersLength = 0;
  survey.clearInvisibleValues = 'onHiddenContainer';
  survey.checkErrorsMode = 'onValueChanged';
  survey.textUpdateMode = 'onTyping';

  return survey;
}

function addCustomProperties() {
  // Add custom properties to all questions
  Survey.Serializer.addProperty('question', {
    name: 'aiGenerated:boolean',
    default: false,
    category: 'general',
    visible: false
  });

  Survey.Serializer.addProperty('question', {
    name: 'customId',
    category: 'general',
    visible: true
  });

  Survey.Serializer.addProperty('question', {
    name: 'helpText',
    category: 'general',
    visible: true
  });

  Survey.Serializer.addProperty('question', {
    name: 'validationRules:text',
    category: 'validation',
    visible: true
  });

  // Add properties for specific question types
  Survey.Serializer.addProperty('text', {
    name: 'inputFormat',
    choices: ['text', 'email', 'tel', 'number', 'date', 'time', 'url'],
    default: 'text',
    category: 'general'
  });

  Survey.Serializer.addProperty('dropdown', {
    name: 'searchEnabled:boolean',
    default: false,
    category: 'general'
  });

  Survey.Serializer.addProperty('matrix', {
    name: 'alternateRows:boolean',
    default: true,
    category: 'appearance'
  });

  // Add custom validators
  Survey.Serializer.addProperty('question', {
    name: 'validators:custom',
    category: 'validation',
    className: 'customvalidator'
  });
}

function configureQuestionTypes() {
  // Configure default choices for common question types
  const defaultChoices = [
    { value: '1', text: 'Option 1' },
    { value: '2', text: 'Option 2' },
    { value: '3', text: 'Option 3' }
  ];

  // Configure rating question
  Survey.Serializer.findProperty('rating', 'rateValues').default = [
    { value: 1, text: '1' },
    { value: 2, text: '2' },
    { value: 3, text: '3' },
    { value: 4, text: '4' },
    { value: 5, text: '5' }
  ];

  // Configure matrix question
  Survey.Serializer.findProperty('matrix', 'columns').default = [
    { value: 'col1', text: 'Column 1' },
    { value: 'col2', text: 'Column 2' },
    { value: 'col3', text: 'Column 3' }
  ];

  Survey.Serializer.findProperty('matrix', 'rows').default = [
    { value: 'row1', text: 'Row 1' },
    { value: 'row2', text: 'Row 2' },
    { value: 'row3', text: 'Row 3' }
  ];

  // Configure boolean question
  Survey.Serializer.findProperty('boolean', 'labelTrue').default = 'Yes';
  Survey.Serializer.findProperty('boolean', 'labelFalse').default = 'No';
}

// Export additional utilities
export function getQuestionTypeGroups() {
  return {
    basic: {
      title: 'Basic Questions',
      types: [
        { type: 'text', title: 'Single Input', icon: 'fas fa-font' },
        { type: 'comment', title: 'Long Text', icon: 'fas fa-align-left' },
        { type: 'dropdown', title: 'Dropdown', icon: 'fas fa-caret-down' },
        { type: 'radiogroup', title: 'Radio Group', icon: 'fas fa-dot-circle' },
        { type: 'checkbox', title: 'Checkboxes', icon: 'fas fa-check-square' },
        { type: 'boolean', title: 'Yes/No', icon: 'fas fa-toggle-on' }
      ]
    },
    advanced: {
      title: 'Advanced Questions',
      types: [
        { type: 'rating', title: 'Rating', icon: 'fas fa-star' },
        { type: 'ranking', title: 'Ranking', icon: 'fas fa-sort' },
        { type: 'matrix', title: 'Matrix', icon: 'fas fa-table' },
        { type: 'matrixdropdown', title: 'Matrix Dropdown', icon: 'fas fa-th' },
        { type: 'matrixdynamic', title: 'Dynamic Matrix', icon: 'fas fa-plus-square' },
        { type: 'multipletext', title: 'Multiple Text', icon: 'fas fa-list' }
      ]
    },
    specialty: {
      title: 'Specialty Questions',
      types: [
        { type: 'signaturepad', title: 'Signature', icon: 'fas fa-signature' },
        { type: 'file', title: 'File Upload', icon: 'fas fa-upload' },
        { type: 'image', title: 'Image', icon: 'fas fa-image' },
        { type: 'html', title: 'HTML', icon: 'fas fa-code' },
        { type: 'expression', title: 'Expression', icon: 'fas fa-calculator' }
      ]
    },
    panels: {
      title: 'Panels & Groups',
      types: [
        { type: 'panel', title: 'Panel', icon: 'fas fa-square' },
        { type: 'paneldynamic', title: 'Dynamic Panel', icon: 'fas fa-layer-group' }
      ]
    }
  };
}

export function getQuestionDefaults(type) {
  const defaults = {
    text: {
      inputType: 'text',
      maxLength: 0,
      placeholder: 'Enter your answer here'
    },
    comment: {
      rows: 4,
      maxLength: 0,
      placeholder: 'Enter your comments here'
    },
    dropdown: {
      choices: ['Option 1', 'Option 2', 'Option 3'],
      hasOther: false,
      optionsCaption: 'Choose...'
    },
    radiogroup: {
      choices: ['Option 1', 'Option 2', 'Option 3'],
      hasOther: false,
      colCount: 1
    },
    checkbox: {
      choices: ['Option 1', 'Option 2', 'Option 3'],
      hasOther: false,
      colCount: 1
    },
    boolean: {
      labelTrue: 'Yes',
      labelFalse: 'No',
      showTitle: true
    },
    rating: {
      rateMin: 1,
      rateMax: 5,
      minRateDescription: 'Poor',
      maxRateDescription: 'Excellent'
    },
    matrix: {
      columns: ['Column 1', 'Column 2', 'Column 3'],
      rows: ['Row 1', 'Row 2', 'Row 3'],
      cellType: 'dropdown'
    },
    file: {
      allowMultiple: false,
      acceptedTypes: '.pdf,.doc,.docx,.jpg,.png',
      maxSize: 5242880, // 5MB
      storeDataAsText: false
    },
    signaturepad: {
      width: 300,
      height: 200,
      penColor: '#000000',
      backgroundColor: '#ffffff'
    }
  };

  return defaults[type] || {};
}

// Custom validators
export function registerCustomValidators() {
  // Phone number validator
  Survey.FunctionFactory.Instance.register('phoneValidator', (params) => {
    const value = params[0];
    if (!value) {
      return true;
    }

    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(value);
  });

  // Email validator with stricter rules
  Survey.FunctionFactory.Instance.register('strictEmailValidator', (params) => {
    const value = params[0];
    if (!value) {
      return true;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  });

  // Date range validator
  Survey.FunctionFactory.Instance.register('dateRangeValidator', (params) => {
    const value = params[0];
    const minDate = params[1];
    const maxDate = params[2];

    if (!value) {
      return true;
    }

    const date = new Date(value);
    const min = new Date(minDate);
    const max = new Date(maxDate);

    return date >= min && date <= max;
  });

  // Custom regex validator
  Survey.FunctionFactory.Instance.register('regexValidator', (params) => {
    const value = params[0];
    const pattern = params[1];
    const flags = params[2] || '';

    if (!value) {
      return true;
    }

    try {
      const regex = new RegExp(pattern, flags);
      return regex.test(value);
    } catch (e) {
      console.error('Invalid regex pattern:', pattern);
      return false;
    }
  });
}

// Question event handlers
export function setupQuestionEventHandlers(survey) {
  // Handle question value changes
  survey.onValueChanged.add((sender, options) => {
    const question = options.question;

    // Trigger custom validation
    if (question.validators && question.validators.length > 0) {
      validateQuestion(question);
    }

    // Update dependent questions
    updateDependentQuestions(survey, question);
  });

  // Handle question rendering
  survey.onAfterRenderQuestion.add((sender, options) => {
    const question = options.question;
    const element = options.htmlElement;

    // Add custom classes
    if (question.aiGenerated) {
      element.classList.add('ai-generated');
    }

    // Add help text
    if (question.helpText) {
      addHelpText(element, question.helpText);
    }

    // Initialize custom widgets
    initializeQuestionWidgets(question, element);
  });

  // Handle question visibility
  survey.onQuestionVisibleChanged.add((sender, options) => {
    const question = options.question;

    if (!question.visible) {
      // Clear value when hidden (if configured)
      if (survey.clearInvisibleValues === 'onHidden') {
        question.value = undefined;
      }
    }
  });
}

function validateQuestion(question) {
  // Custom validation logic
  const errors = [];

  question.validators.forEach((validator) => {
    if (validator.type === 'custom' && validator.text) {
      const isValid = Survey.FunctionFactory.Instance.run(validator.text, question.value);
      if (!isValid) {
        errors.push(validator.errorText || 'Invalid value');
      }
    }
  });

  question.errors = errors;
}

function updateDependentQuestions(survey, changedQuestion) {
  // Find and update questions that depend on the changed question
  survey.getAllQuestions().forEach((question) => {
    if (question.visibleIf && question.visibleIf.includes(changedQuestion.name)) {
      survey.runCondition(question.visibleIf);
    }

    if (question.enableIf && question.enableIf.includes(changedQuestion.name)) {
      survey.runCondition(question.enableIf);
    }
  });
}

function addHelpText(element, helpText) {
  const helpElement = document.createElement('div');
  helpElement.className = 'sv_q_help_text';
  helpElement.innerHTML = `<i class="fas fa-info-circle"></i> ${helpText}`;

  const titleElement = element.querySelector('.sv_q_title');
  if (titleElement) {
    titleElement.parentNode.insertBefore(helpElement, titleElement.nextSibling);
  }
}

function initializeQuestionWidgets(question, element) {
  // Initialize any custom widgets or behaviors for specific question types
  switch (question.getType()) {
    case 'text':
      if (question.inputFormat === 'date') {
        initializeDatePicker(question, element);
      }
      break;

    case 'dropdown':
      if (question.searchEnabled) {
        initializeSearchableDropdown(question, element);
      }
      break;

    case 'file':
      initializeFileUpload(question, element);
      break;
  }
}

function initializeDatePicker(question, element) {
  const input = element.querySelector('input[type="text"]');
  if (input && window.flatpickr) {
    window.flatpickr(input, {
      dateFormat: 'm/d/Y',
      allowInput: true
    });
  }
}

function initializeSearchableDropdown(question, element) {
  const select = element.querySelector('select');
  if (select && window.Select2) {
    $(select).select2({
      placeholder: question.optionsCaption || 'Choose...',
      allowClear: true,
      width: '100%'
    });
  }
}

function initializeFileUpload(question, element) {
  const fileInput = element.querySelector('input[type="file"]');
  if (fileInput) {
    // Add drag and drop support
    const dropZone = document.createElement('div');
    dropZone.className = 'file-drop-zone';
    dropZone.innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <p>Drag and drop files here or click to browse</p>
    `;

    fileInput.parentNode.insertBefore(dropZone, fileInput);
    fileInput.style.display = 'none';

    dropZone.addEventListener('click', () => fileInput.click());

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
  }
}
