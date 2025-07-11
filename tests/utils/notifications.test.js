import { NotificationManager } from '../../src/utils/notifications.js';

describe('NotificationManager', () => {
  let container;
  let notificationManager;

  beforeEach(() => {
    // Create a container element for notifications
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Create a new instance for each test
    notificationManager = new NotificationManager('test-container');
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.removeChild(container);
    // Clear any remaining timeouts
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create a notification container', () => {
      const notificationContainer = container.querySelector('.notification-container');
      expect(notificationContainer).toBeInTheDocument();
    });

    it('should use default container ID if none provided', () => {
      const defaultManager = new NotificationManager();
      const defaultContainer = document.querySelector('#app .notification-container');
      expect(defaultContainer).toBeInTheDocument();
      // Clean up
      defaultContainer?.remove();
    });

    it('should create app container if it does not exist', () => {
      const customManager = new NotificationManager('non-existent-container');
      const appContainer = document.querySelector('#app');
      expect(appContainer).toBeInTheDocument();
      const notificationContainer = appContainer.querySelector('.notification-container');
      expect(notificationContainer).toBeInTheDocument();
      // Clean up
      appContainer?.remove();
    });
  });

  describe('show', () => {
    it('should display a success notification', () => {
      notificationManager.show('Success message', 'success');
      
      const notification = container.querySelector('.notification.success');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Success message');
    });

    it('should display an error notification', () => {
      notificationManager.show('Error message', 'error');
      
      const notification = container.querySelector('.notification.error');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Error message');
    });

    it('should display an info notification', () => {
      notificationManager.show('Info message', 'info');
      
      const notification = container.querySelector('.notification.info');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Info message');
    });

    it('should display a warning notification', () => {
      notificationManager.show('Warning message', 'warning');
      
      const notification = container.querySelector('.notification.warning');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Warning message');
    });

    it('should default to info type if type is not specified', () => {
      notificationManager.show('Default message');
      
      const notification = container.querySelector('.notification.info');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Default message');
    });

    it('should display multiple notifications', () => {
      notificationManager.show('First message', 'success');
      notificationManager.show('Second message', 'error');
      notificationManager.show('Third message', 'info');
      
      const notifications = container.querySelectorAll('.notification');
      expect(notifications).toHaveLength(3);
      expect(notifications[0]).toHaveClass('success');
      expect(notifications[1]).toHaveClass('error');
      expect(notifications[2]).toHaveClass('info');
    });

    it('should add show class after a brief delay', () => {
      jest.useFakeTimers();
      
      notificationManager.show('Test message', 'success');
      
      const notification = container.querySelector('.notification');
      expect(notification).not.toHaveClass('show');
      
      // Fast forward to trigger the show class
      jest.advanceTimersByTime(10);
      
      expect(notification).toHaveClass('show');
      
      jest.useRealTimers();
    });

    it('should auto-dismiss notification after duration', () => {
      jest.useFakeTimers();
      
      notificationManager.show('Test message', 'success', 3000);
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      
      // Fast forward past the duration
      jest.advanceTimersByTime(3000);
      
      expect(notification).not.toHaveClass('show');
      
      // Fast forward to complete removal
      jest.advanceTimersByTime(300);
      
      expect(notification).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });

    it('should use default duration if not specified', () => {
      jest.useFakeTimers();
      
      notificationManager.show('Test message', 'success');
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      
      // Fast forward past the default duration (5000ms)
      jest.advanceTimersByTime(5000);
      
      expect(notification).not.toHaveClass('show');
      
      jest.useRealTimers();
    });

    it('should handle empty message', () => {
      notificationManager.show('', 'success');
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('');
    });

    it('should escape HTML in messages', () => {
      notificationManager.show('<script>alert("XSS")</script>', 'error');
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      expect(notification.textContent).toBe('<script>alert("XSS")</script>');
      expect(notification.innerHTML).not.toContain('<script>');
    });
  });

  describe('success', () => {
    it('should show a success notification', () => {
      notificationManager.success('Success!');
      
      const notification = container.querySelector('.notification.success');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Success!');
    });

    it('should use custom duration', () => {
      jest.useFakeTimers();
      
      notificationManager.success('Success!', 1000);
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      
      jest.advanceTimersByTime(1000);
      expect(notification).not.toHaveClass('show');
      
      jest.useRealTimers();
    });
  });

  describe('error', () => {
    it('should show an error notification', () => {
      notificationManager.error('Error!');
      
      const notification = container.querySelector('.notification.error');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Error!');
    });

    it('should use custom duration', () => {
      jest.useFakeTimers();
      
      notificationManager.error('Error!', 2000);
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      
      jest.advanceTimersByTime(2000);
      expect(notification).not.toHaveClass('show');
      
      jest.useRealTimers();
    });
  });

  describe('info', () => {
    it('should show an info notification', () => {
      notificationManager.info('Info!');
      
      const notification = container.querySelector('.notification.info');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Info!');
    });

    it('should use custom duration', () => {
      jest.useFakeTimers();
      
      notificationManager.info('Info!', 1500);
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      
      jest.advanceTimersByTime(1500);
      expect(notification).not.toHaveClass('show');
      
      jest.useRealTimers();
    });
  });

  describe('warning', () => {
    it('should show a warning notification', () => {
      notificationManager.warning('Warning!');
      
      const notification = container.querySelector('.notification.warning');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveTextContent('Warning!');
    });

    it('should use custom duration', () => {
      jest.useFakeTimers();
      
      notificationManager.warning('Warning!', 2500);
      
      const notification = container.querySelector('.notification');
      expect(notification).toBeInTheDocument();
      
      jest.advanceTimersByTime(2500);
      expect(notification).not.toHaveClass('show');
      
      jest.useRealTimers();
    });
  });

  describe('positioning', () => {
    it('should stack multiple notifications vertically', () => {
      notificationManager.show('First', 'success');
      notificationManager.show('Second', 'error');
      notificationManager.show('Third', 'info');
      
      const notifications = container.querySelectorAll('.notification');
      const positions = Array.from(notifications).map(n => n.getBoundingClientRect());
      
      // Check that each notification is below the previous one
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].top).toBeGreaterThan(positions[i - 1].bottom);
      }
    });
  });

  describe('notification removal', () => {
    it('should remove notification when clicking close button', () => {
      notificationManager.show('Closeable message', 'info');
      
      const notification = container.querySelector('.notification');
      const closeButton = notification.querySelector('.close-button');
      
      expect(notification).toBeInTheDocument();
      
      // Simulate click on close button
      closeButton.click();
      
      // Wait for removal animation
      setTimeout(() => {
        expect(notification).not.toBeInTheDocument();
      }, 300);
    });

    it('should handle multiple notifications being removed', () => {
      jest.useFakeTimers();
      
      notificationManager.show('First', 'success', 1000);
      notificationManager.show('Second', 'error', 2000);
      notificationManager.show('Third', 'info', 3000);
      
      expect(container.querySelectorAll('.notification')).toHaveLength(3);
      
      // First notification should be removed after 1000ms
      jest.advanceTimersByTime(1300);
      expect(container.querySelectorAll('.notification')).toHaveLength(2);
      
      // Second notification should be removed after 2000ms
      jest.advanceTimersByTime(1000);
      expect(container.querySelectorAll('.notification')).toHaveLength(1);
      
      // Third notification should be removed after 3000ms
      jest.advanceTimersByTime(1000);
      expect(container.querySelectorAll('.notification')).toHaveLength(0);
      
      jest.useRealTimers();
    });
  });
});