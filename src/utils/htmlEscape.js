// HTML Escape Utility
// Extracted from original form-builder.js

class HtmlEscape {
    static escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        return element;
    }

    static setTextContent(element, text) {
        element.textContent = text;
    }
}

export default HtmlEscape;