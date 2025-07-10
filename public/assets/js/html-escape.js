/**
 * HTML Escape Utility for XSS Prevention
 * Provides safe HTML rendering functions
 */

(function(window) {
    'use strict';

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string safe for HTML
     */
    function escapeHtml(str) {
        if (str == null) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        
        return String(str).replace(/[&<>"'\/]/g, function(s) {
            return map[s];
        });
    }

    /**
     * Create a safe text node
     * @param {string} text - Text to create node from
     * @returns {Text} Text node
     */
    function createTextNode(text) {
        return document.createTextNode(text || '');
    }

    /**
     * Safely set element content (replaces innerHTML)
     * @param {HTMLElement} element - Element to set content
     * @param {string} content - Content to set
     */
    function setTextContent(element, content) {
        if (element) {
            element.textContent = content || '';
        }
    }

    /**
     * Safely create HTML element with escaped content
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes object
     * @param {string} content - Text content
     * @returns {HTMLElement} Created element
     */
    function createElement(tag, attrs = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes safely
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.assign(element.dataset, value);
            } else if (key.startsWith('on')) {
                // Skip event handlers for security
                console.warn(`Event handler ${key} ignored for security`);
            } else {
                element.setAttribute(key, String(value));
            }
        }
        
        // Set content safely
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }

    /**
     * Sanitize HTML string (basic sanitization)
     * Only allows specific safe tags and attributes
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    function sanitizeHtml(html) {
        if (!html) return '';
        
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.textContent = html;
        
        // For now, return escaped version
        // In production, use a proper sanitization library like DOMPurify
        return temp.innerHTML;
    }

    /**
     * Build HTML string with escaped values
     * @param {Array} strings - Template literal strings
     * @param {...any} values - Values to escape
     * @returns {string} Safe HTML string
     */
    function html(strings, ...values) {
        let result = strings[0];
        for (let i = 0; i < values.length; i++) {
            result += escapeHtml(values[i]) + strings[i + 1];
        }
        return result;
    }

    // Export utilities
    window.HtmlEscape = {
        escape: escapeHtml,
        createTextNode: createTextNode,
        setTextContent: setTextContent,
        createElement: createElement,
        sanitize: sanitizeHtml,
        html: html
    };

})(window);