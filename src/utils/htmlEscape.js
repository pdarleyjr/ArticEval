// HTML Escape Utility
// Extracted from original form-builder.js

class HtmlEscape {
  static escape(text) {
    if (text == null) {
      return '';
    }

    const str = String(text);
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
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

  static unescape(text) {
    if (text == null) {
      return '';
    }

    const str = String(text);

    // Map of HTML entities to their unescaped values
    const unescapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&#x2F;': '/'
    };

    // Replace only complete HTML entities (ending with semicolon)
    return str.replace(
      /&(?:amp|lt|gt|quot|#39|#x27|#x2F);/g,
      (match) => unescapeMap[match] || match
    );
  }
}

export default HtmlEscape;
