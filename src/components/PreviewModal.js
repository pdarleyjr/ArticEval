// Preview Modal component for form preview functionality
import notifications from '../utils/notifications.js';

export class PreviewModal {
  constructor(survey, options = {}) {
    this.survey = survey;
    this.options = {
      theme: 'modern',
      showCompleteButton: true,
      showProgressBar: true,
      fullscreen: true,
      allowEdit: false,
      ...options
    };

    this.modal = null;
    this.previewSurvey = null;
    this.isOpen = false;

    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.switchDevice = this.switchDevice.bind(this);
  }

  open() {
    if (this.isOpen) {
      return;
    }

    // Create modal
    this.createModal();

    // Initialize preview survey
    this.initializePreviewSurvey();

    // Show modal
    document.body.appendChild(this.modal);
    this.modal.classList.add('show');
    this.isOpen = true;

    // Focus trap
    this.setupFocusTrap();

    // Analytics
    this.trackPreviewOpen();
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    // Remove modal with animation
    this.modal.classList.remove('show');

    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.previewSurvey = null;
      this.isOpen = false;
    }, 300);

    // Remove event listeners
    this.removeEventListeners();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'preview-modal';
    this.modal.innerHTML = `
      <div class="preview-modal-overlay"></div>
      <div class="preview-modal-container">
        <div class="preview-modal-header">
          <div class="preview-header-left">
            <h2><i class="fas fa-eye"></i> Form Preview</h2>
            <div class="preview-device-selector">
              <button class="device-btn active" data-device="desktop" title="Desktop">
                <i class="fas fa-desktop"></i>
              </button>
              <button class="device-btn" data-device="tablet" title="Tablet">
                <i class="fas fa-tablet-alt"></i>
              </button>
              <button class="device-btn" data-device="mobile" title="Mobile">
                <i class="fas fa-mobile-alt"></i>
              </button>
            </div>
          </div>
          <div class="preview-header-right">
            <button class="preview-theme-btn" title="Toggle Theme">
              <i class="fas fa-palette"></i>
            </button>
            <button class="preview-fullscreen-btn" title="Toggle Fullscreen">
              <i class="fas fa-expand"></i>
            </button>
            <button class="preview-close-btn" title="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="preview-modal-body">
          <div class="preview-device-frame desktop">
            <div class="preview-device-screen">
              <div class="preview-survey-container" id="preview-survey"></div>
            </div>
          </div>
        </div>
        <div class="preview-modal-footer">
          <div class="preview-info">
            <span class="preview-page-info"></span>
            <span class="preview-progress-info"></span>
          </div>
          <div class="preview-actions">
            <button class="btn secondary share-btn">
              <i class="fas fa-share"></i> Share Preview
            </button>
            <button class="btn secondary test-data-btn">
              <i class="fas fa-database"></i> Load Test Data
            </button>
            <button class="btn primary close-preview-btn">Close Preview</button>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close buttons
    this.modal.querySelector('.preview-close-btn').addEventListener('click', this.close);
    this.modal.querySelector('.close-preview-btn').addEventListener('click', this.close);
    this.modal.querySelector('.preview-modal-overlay').addEventListener('click', this.close);

    // Device selector
    this.modal.querySelectorAll('.device-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const device = e.currentTarget.dataset.device;
        this.switchDevice(device);
      });
    });

    // Theme toggle
    this.modal.querySelector('.preview-theme-btn').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Fullscreen toggle
    this.modal.querySelector('.preview-fullscreen-btn').addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Share button
    this.modal.querySelector('.share-btn').addEventListener('click', () => {
      this.sharePreview();
    });

    // Test data button
    this.modal.querySelector('.test-data-btn').addEventListener('click', () => {
      this.loadTestData();
    });

    // Keyboard shortcuts
    this.handleKeyboard = (e) => {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    };

    document.addEventListener('keydown', this.handleKeyboard);
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this.handleKeyboard);
  }

  initializePreviewSurvey() {
    // Clone survey JSON
    const surveyJSON = this.survey.toJSON();

    // Create preview survey instance
    this.previewSurvey = new Survey.Model(surveyJSON);

    // Configure preview settings
    this.configurePreviewSurvey();

    // Render survey
    const container = this.modal.querySelector('#preview-survey');
    this.previewSurvey.render(container);

    // Setup preview event handlers
    this.setupPreviewHandlers();

    // Update info
    this.updatePreviewInfo();
  }

  configurePreviewSurvey() {
    // Set preview mode
    this.previewSurvey.mode = 'display';

    // Configure appearance
    this.previewSurvey.showNavigationButtons = this.options.showNavigationButtons !== false;
    this.previewSurvey.showProgressBar = this.options.showProgressBar ? 'top' : 'off';
    this.previewSurvey.showCompletedPage = this.options.showCompleteButton;

    // Set theme
    this.previewSurvey.applyTheme(this.options.theme);

    // Disable design mode features
    this.previewSurvey.allowCompleteSurveyAutomatic = false;
    this.previewSurvey.sendResultOnPageNext = false;

    // Configure validation
    this.previewSurvey.checkErrorsMode = 'onValueChanged';
    this.previewSurvey.textUpdateMode = 'onTyping';
  }

  setupPreviewHandlers() {
    // Page changed
    this.previewSurvey.onCurrentPageChanged.add(() => {
      this.updatePreviewInfo();
      this.scrollToTop();
    });

    // Value changed
    this.previewSurvey.onValueChanged.add((sender, options) => {
      // Track interactions
      this.trackInteraction('value_changed', {
        question: options.name,
        value: options.value
      });
    });

    // Complete
    this.previewSurvey.onComplete.add(() => {
      this.handlePreviewComplete();
    });

    // Validation error
    this.previewSurvey.onValidationError.add((sender, options) => {
      this.trackInteraction('validation_error', {
        question: options.name,
        errors: options.errors
      });
    });
  }

  switchDevice(device) {
    // Update active button
    this.modal.querySelectorAll('.device-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.device === device);
    });

    // Update frame class
    const frame = this.modal.querySelector('.preview-device-frame');
    frame.className = `preview-device-frame ${device}`;

    // Track device switch
    this.trackInteraction('device_switch', { device });

    // Update preview info
    this.updateDeviceInfo(device);
  }

  toggleTheme() {
    const themes = ['modern', 'default', 'bootstrap', 'winterstone', 'orange'];
    const currentTheme = this.previewSurvey.theme || 'modern';
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    // Apply new theme
    this.previewSurvey.applyTheme(nextTheme);

    // Show notification
    notifications.info(`Theme changed to: ${nextTheme}`);

    // Track theme change
    this.trackInteraction('theme_change', { theme: nextTheme });
  }

  toggleFullscreen() {
    const container = this.modal.querySelector('.preview-modal-container');
    const isFullscreen = container.classList.contains('fullscreen');

    container.classList.toggle('fullscreen');

    // Update icon
    const icon = this.modal.querySelector('.preview-fullscreen-btn i');
    icon.className = isFullscreen ? 'fas fa-expand' : 'fas fa-compress';

    // Track fullscreen toggle
    this.trackInteraction('fullscreen_toggle', { fullscreen: !isFullscreen });
  }

  sharePreview() {
    // Generate shareable link
    const shareData = {
      surveyId: this.survey.surveyId || 'preview',
      timestamp: Date.now(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };

    // Create share modal
    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal';
    shareModal.innerHTML = `
      <div class="share-modal-content">
        <h3>Share Preview Link</h3>
        <p>This preview link will expire in 24 hours</p>
        <div class="share-link-container">
          <input type="text" class="share-link-input" value="${this.generateShareLink(shareData)}" readonly>
          <button class="copy-link-btn" title="Copy link">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="share-options">
          <button class="share-option-btn" data-method="email">
            <i class="fas fa-envelope"></i> Email
          </button>
          <button class="share-option-btn" data-method="qr">
            <i class="fas fa-qrcode"></i> QR Code
          </button>
        </div>
        <button class="btn primary close-share-btn">Done</button>
      </div>
    `;

    // Add to modal
    this.modal.appendChild(shareModal);

    // Setup share modal events
    this.setupShareModalEvents(shareModal);

    // Show with animation
    setTimeout(() => shareModal.classList.add('show'), 10);
  }

  setupShareModalEvents(shareModal) {
    // Copy link
    const copyBtn = shareModal.querySelector('.copy-link-btn');
    const input = shareModal.querySelector('.share-link-input');

    copyBtn.addEventListener('click', () => {
      input.select();
      document.execCommand('copy');

      // Show feedback
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);

      notifications.success('Link copied to clipboard!');
    });

    // Share options
    shareModal.querySelectorAll('.share-option-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const method = e.currentTarget.dataset.method;
        this.handleShareMethod(method, input.value);
      });
    });

    // Close
    shareModal.querySelector('.close-share-btn').addEventListener('click', () => {
      shareModal.classList.remove('show');
      setTimeout(() => shareModal.remove(), 300);
    });
  }

  generateShareLink(data) {
    // In production, this would generate a real shareable link
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      preview: data.surveyId,
      token: btoa(JSON.stringify(data)),
      t: data.timestamp
    });

    return `${baseUrl}/preview?${params.toString()}`;
  }

  handleShareMethod(method, link) {
    switch (method) {
      case 'email':
        const subject = encodeURIComponent(`Preview: ${this.survey.title || 'Form'}`);
        const body = encodeURIComponent(`Click here to preview the form:\n\n${link}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
        break;

      case 'qr':
        this.showQRCode(link);
        break;
    }
  }

  showQRCode(link) {
    // Create QR code modal
    const qrModal = document.createElement('div');
    qrModal.className = 'qr-modal';
    qrModal.innerHTML = `
      <div class="qr-modal-content">
        <h3>QR Code</h3>
        <div class="qr-code-container" id="qr-code"></div>
        <p>Scan this code to preview on mobile</p>
        <button class="btn primary">Close</button>
      </div>
    `;

    this.modal.appendChild(qrModal);

    // Generate QR code (requires qrcode.js library)
    if (window.QRCode) {
      new QRCode(qrModal.querySelector('#qr-code'), {
        text: link,
        width: 200,
        height: 200
      });
    } else {
      // Fallback - show link
      qrModal.querySelector('#qr-code').innerHTML = `
        <p style="padding: 20px; text-align: center; color: #666;">
          QR Code library not loaded
        </p>
      `;
    }

    // Close button
    qrModal.querySelector('button').addEventListener('click', () => {
      qrModal.remove();
    });

    // Show with animation
    setTimeout(() => qrModal.classList.add('show'), 10);
  }

  loadTestData() {
    // Generate test data based on question types
    const testData = this.generateTestData();

    // Apply test data
    Object.keys(testData).forEach((key) => {
      this.previewSurvey.setValue(key, testData[key]);
    });

    notifications.success('Test data loaded');

    // Track test data load
    this.trackInteraction('test_data_loaded');
  }

  generateTestData() {
    const testData = {};

    this.previewSurvey.getAllQuestions().forEach((question) => {
      const name = question.name;
      const type = question.getType();

      switch (type) {
        case 'text':
          testData[name] = this.generateTextData(question);
          break;

        case 'comment':
          testData[name] =
            'This is a sample comment for testing purposes. It contains multiple sentences to show how longer text appears.';
          break;

        case 'radiogroup':
        case 'dropdown':
          if (question.choices && question.choices.length > 0) {
            const randomIndex = Math.floor(Math.random() * question.choices.length);
            testData[name] = question.choices[randomIndex].value || question.choices[randomIndex];
          }
          break;

        case 'checkbox':
          if (question.choices && question.choices.length > 0) {
            const selectedCount = Math.min(
              2,
              Math.floor(Math.random() * question.choices.length) + 1
            );
            const selected = [];
            for (let i = 0; i < selectedCount; i++) {
              const choice = question.choices[i];
              selected.push(choice.value || choice);
            }
            testData[name] = selected;
          }
          break;

        case 'boolean':
          testData[name] = Math.random() > 0.5;
          break;

        case 'rating':
          const min = question.rateMin || 1;
          const max = question.rateMax || 5;
          testData[name] = Math.floor(Math.random() * (max - min + 1)) + min;
          break;

        case 'matrix':
          const matrixData = {};
          if (question.rows) {
            question.rows.forEach((row) => {
              const rowValue = row.value || row;
              if (question.columns && question.columns.length > 0) {
                const randomCol =
                  question.columns[Math.floor(Math.random() * question.columns.length)];
                matrixData[rowValue] = randomCol.value || randomCol;
              }
            });
          }
          testData[name] = matrixData;
          break;

        case 'file':
          // Skip file questions
          break;

        case 'signaturepad':
          // Skip signature questions
          break;

        default:
          // For other types, try to set a generic value
          testData[name] = `Test value for ${type}`;
      }
    });

    return testData;
  }

  generateTextData(question) {
    const inputType = question.inputType || 'text';

    switch (inputType) {
      case 'email':
        return 'test@example.com';
      case 'tel':
        return '(555) 123-4567';
      case 'number':
        return Math.floor(Math.random() * 100).toString();
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'time':
        return '14:30';
      case 'url':
        return 'https://example.com';
      default:
        return 'Sample text response';
    }
  }

  handlePreviewComplete() {
    // Show completion screen
    const container = this.modal.querySelector('#preview-survey');
    container.innerHTML = `
      <div class="preview-complete">
        <i class="fas fa-check-circle"></i>
        <h2>Form Completed!</h2>
        <p>This is what users will see after submitting the form.</p>
        <div class="preview-complete-actions">
          <button class="btn secondary restart-preview">
            <i class="fas fa-redo"></i> Restart Preview
          </button>
          <button class="btn primary view-results">
            <i class="fas fa-chart-bar"></i> View Results
          </button>
        </div>
      </div>
    `;

    // Setup complete screen events
    container.querySelector('.restart-preview').addEventListener('click', () => {
      this.restartPreview();
    });

    container.querySelector('.view-results').addEventListener('click', () => {
      this.showPreviewResults();
    });

    // Track completion
    this.trackInteraction('preview_completed');
  }

  restartPreview() {
    // Reinitialize preview survey
    this.initializePreviewSurvey();
  }

  showPreviewResults() {
    const data = this.previewSurvey.data;

    // Create results modal
    const resultsModal = document.createElement('div');
    resultsModal.className = 'results-modal';
    resultsModal.innerHTML = `
      <div class="results-modal-content">
        <h3>Preview Results</h3>
        <div class="results-data">
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
        <div class="results-actions">
          <button class="btn secondary copy-results">
            <i class="fas fa-copy"></i> Copy JSON
          </button>
          <button class="btn primary close-results">Close</button>
        </div>
      </div>
    `;

    this.modal.appendChild(resultsModal);

    // Setup events
    resultsModal.querySelector('.copy-results').addEventListener('click', () => {
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(data, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      notifications.success('Results copied to clipboard');
    });

    resultsModal.querySelector('.close-results').addEventListener('click', () => {
      resultsModal.remove();
    });

    // Show with animation
    setTimeout(() => resultsModal.classList.add('show'), 10);
  }

  updatePreviewInfo() {
    // Update page info
    const pageInfo = this.modal.querySelector('.preview-page-info');
    const currentPage = this.previewSurvey.currentPageNo + 1;
    const totalPages = this.previewSurvey.visiblePageCount;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    // Update progress info
    const progressInfo = this.modal.querySelector('.preview-progress-info');
    const progress = Math.round(this.previewSurvey.getProgress());
    progressInfo.textContent = `${progress}% Complete`;
  }

  updateDeviceInfo(device) {
    const deviceSizes = {
      desktop: { width: '100%', info: 'Desktop View' },
      tablet: { width: '768px', info: 'Tablet View (768px)' },
      mobile: { width: '375px', info: 'Mobile View (375px)' }
    };

    const info = deviceSizes[device];
    notifications.info(info.info);
  }

  scrollToTop() {
    const screen = this.modal.querySelector('.preview-device-screen');
    screen.scrollTop = 0;
  }

  setupFocusTrap() {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.handleTab = (e) => {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    this.modal.addEventListener('keydown', this.handleTab);

    // Focus first element
    setTimeout(() => firstElement.focus(), 100);
  }

  trackPreviewOpen() {
    // Analytics tracking
    if (window.gtag) {
      window.gtag('event', 'preview_open', {
        survey_id: this.survey.surveyId,
        question_count: this.survey.getAllQuestions().length,
        page_count: this.survey.pages.length
      });
    }
  }

  trackInteraction(action, data = {}) {
    // Analytics tracking
    if (window.gtag) {
      window.gtag('event', `preview_${action}`, {
        survey_id: this.survey.surveyId,
        ...data
      });
    }
  }

  // Public API
  isVisible() {
    return this.isOpen;
  }

  refresh() {
    if (this.isOpen && this.previewSurvey) {
      // Update survey JSON
      const surveyJSON = this.survey.toJSON();
      this.previewSurvey.fromJSON(surveyJSON);

      // Update info
      this.updatePreviewInfo();
    }
  }

  destroy() {
    this.close();
    this.survey = null;
    this.options = null;
  }
}

// Factory function
export function createPreviewModal(survey, options) {
  return new PreviewModal(survey, options);
}

// Export default options
export const PREVIEW_MODAL_OPTIONS = {
  theme: 'modern',
  showCompleteButton: true,
  showProgressBar: true,
  showNavigationButtons: true,
  fullscreen: true,
  allowEdit: false,
  devices: ['desktop', 'tablet', 'mobile'],
  themes: ['modern', 'default', 'bootstrap', 'winterstone', 'orange'],
  testDataEnabled: true,
  shareEnabled: true,
  analyticsEnabled: true
};
