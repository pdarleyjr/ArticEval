import { escapeHtml, unescapeHtml } from '../../src/utils/htmlEscape.js';

describe('htmlEscape utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<div class="test">Hello & "World"</div>';
      const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape all HTML entities', () => {
      const input = '< > & " \'';
      const expected = '&lt; &gt; &amp; &quot; &#39;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      const input = 'Hello World 123';
      expect(escapeHtml(input)).toBe(input);
    });

    it('should handle null and undefined gracefully', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should convert non-string values to strings', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(true)).toBe('true');
      expect(escapeHtml(false)).toBe('false');
    });

    it('should handle script tags', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle multiple occurrences', () => {
      const input = '<p>First & Second & Third</p>';
      const expected = '&lt;p&gt;First &amp; Second &amp; Third&lt;/p&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle nested quotes', () => {
      const input = `<div onclick="alert('Hello')">Click me</div>`;
      const expected = `&lt;div onclick=&quot;alert(&#39;Hello&#39;)&quot;&gt;Click me&lt;/div&gt;`;
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle unicode characters', () => {
      const input = '<div>Hello 👋 & "世界"</div>';
      const expected = '&lt;div&gt;Hello 👋 &amp; &quot;世界&quot;&lt;/div&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });
  });

  describe('unescapeHtml', () => {
    it('should unescape HTML entities', () => {
      const input = '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;';
      const expected = '<div class="test">Hello & "World"</div>';
      expect(unescapeHtml(input)).toBe(expected);
    });

    it('should unescape all HTML entities', () => {
      const input = '&lt; &gt; &amp; &quot; &#39;';
      const expected = '< > & " \'';
      expect(unescapeHtml(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(unescapeHtml('')).toBe('');
    });

    it('should handle strings without entities', () => {
      const input = 'Hello World 123';
      expect(unescapeHtml(input)).toBe(input);
    });

    it('should handle null and undefined gracefully', () => {
      expect(unescapeHtml(null)).toBe('');
      expect(unescapeHtml(undefined)).toBe('');
    });

    it('should convert non-string values to strings', () => {
      expect(unescapeHtml(123)).toBe('123');
      expect(unescapeHtml(true)).toBe('true');
      expect(unescapeHtml(false)).toBe('false');
    });

    it('should handle escaped script tags', () => {
      const input = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      const expected = '<script>alert("XSS")</script>';
      expect(unescapeHtml(input)).toBe(expected);
    });

    it('should handle multiple occurrences', () => {
      const input = '&lt;p&gt;First &amp; Second &amp; Third&lt;/p&gt;';
      const expected = '<p>First & Second & Third</p>';
      expect(unescapeHtml(input)).toBe(expected);
    });

    it('should handle numeric entities', () => {
      const input = '&#39;Hello&#39;';
      const expected = '\'Hello\'';
      expect(unescapeHtml(input)).toBe(expected);
    });

    it('should handle unicode with entities', () => {
      const input = '&lt;div&gt;Hello 👋 &amp; &quot;世界&quot;&lt;/div&gt;';
      const expected = '<div>Hello 👋 & "世界"</div>';
      expect(unescapeHtml(input)).toBe(expected);
    });

    it('should handle partial entities (invalid HTML)', () => {
      const input = '&lt incomplete &gt;';
      // Should only unescape complete entities
      expect(unescapeHtml(input)).toBe('&lt incomplete >');
    });

    it('should handle mixed escaped and unescaped content', () => {
      const input = 'Normal text &lt;b&gt;bold&lt;/b&gt; more text';
      const expected = 'Normal text <b>bold</b> more text';
      expect(unescapeHtml(input)).toBe(expected);
    });
  });

  describe('escapeHtml and unescapeHtml roundtrip', () => {
    it('should properly roundtrip simple HTML', () => {
      const original = '<p>Hello & "World"</p>';
      const escaped = escapeHtml(original);
      const unescaped = unescapeHtml(escaped);
      expect(unescaped).toBe(original);
    });

    it('should properly roundtrip complex HTML', () => {
      const original = `<div class="container" data-value='test'>
        <h1>Title & Subtitle</h1>
        <p>Content with "quotes" and 'apostrophes'</p>
        <script>alert("Hello")</script>
      </div>`;
      const escaped = escapeHtml(original);
      const unescaped = unescapeHtml(escaped);
      expect(unescaped).toBe(original);
    });

    it('should properly roundtrip empty and special cases', () => {
      const testCases = ['', ' ', '\n', '\t', '   spaces   '];
      testCases.forEach(original => {
        const escaped = escapeHtml(original);
        const unescaped = unescapeHtml(escaped);
        expect(unescaped).toBe(original);
      });
    });
  });
});