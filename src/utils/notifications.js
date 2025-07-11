// Notification utility for displaying alerts and messages

class NotificationManager {
    constructor(containerId = 'notification-container') {
        this.containerId = containerId;
        this.container = null;
        this.timeout = null;
        this.init();
    }

    init() {
        // Find the parent container
        let parentContainer = document.getElementById(this.containerId);
        
        // If parent doesn't exist, create app container and use that
        if (!parentContainer) {
            parentContainer = document.getElementById('app');
            if (!parentContainer) {
                parentContainer = document.createElement('div');
                parentContainer.id = 'app';
                document.body.appendChild(parentContainer);
            }
        }
        
        // Check if notification container already exists within parent
        this.container = parentContainer.querySelector('.notification-container');
        
        // Create notification container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            parentContainer.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        // Don't clear existing notifications to allow multiple
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            padding: 16px 24px;
            margin-bottom: 10px;
            background: ${this.getBackgroundColor(type)};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
            position: relative;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;

        // Add icon and message content
        const icon = this.getIcon(type);
        if (icon) {
            const iconElement = document.createElement('span');
            iconElement.innerHTML = icon;
            notification.appendChild(iconElement);
        }
        
        // Add message text (always escape HTML)
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        notification.appendChild(messageSpan);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-button';
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            line-height: 1;
            opacity: 0.7;
        `;
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        notification.appendChild(closeBtn);

        this.container.appendChild(notification);

        // Add 'show' class after a brief delay for animation
        setTimeout(() => {
            notification.classList.add('show');
            notification.style.opacity = '1';
        }, 10);

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                notification.remove();
            }, duration);
        }

        return notification;
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }

    getIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm-2 15l-5-5 1.4-1.4L8 12.2l7.6-7.6L17 6l-9 9z"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0L0 18h20L10 0zm0 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H9V7h2v6z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0zm1 15H9v-6h2v6zm0-8H9V5h2v2z"/></svg>'
        };
        return icons[type] || '';
    }

    clear() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Create singleton instance
const notifications = new NotificationManager();

// Add CSS animation
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export both the class and the singleton instance
export { NotificationManager };
export default notifications;