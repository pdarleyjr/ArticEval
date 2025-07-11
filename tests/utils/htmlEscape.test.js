import HtmlEscape from '../../src/utils/htmlEscape.js';

describe('htmlEscape utilities', () => {
  describe('HtmlEscape.escape', () => {
    it('should escape HTML special characters', () => {
      const input = '<div class="test">Hello & "World"</div>';
      const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;';
      expect(HtmlEscape.escape(input)).toBe(expected);
    });

    it('should escape all HTML entities', () => {
      const input = '< > & " \'';
      const expected = '&lt; &gt; &amp; &quot; &#39;';
      expect(HtmlEscape.escape(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(HtmlEscape.escape('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      const input = 'Hello World 123';
      expect(HtmlEscape.escape(input)).toBe(input);
    });

    it('should handle null and undefined gracefully', () => {
      expect(HtmlEscape.escape(null)).toBe('');
      expect(HtmlEscape.escape(undefined)).toBe('');
    });

    it('should convert non-string values to strings', () => {
      expect(HtmlEscape.escape(123)).toBe('123');
      expect(HtmlEscape.escape(true)).toBe('true');
      expect(HtmlEscape.escape(false)).toBe('false');
    });

    it('should handle script tags', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(HtmlEscape.escape(input)).toBe(expected);
    });

    it('should handle multiple occurrences', () => {
      const input = '<p>First & Second & Third</p>';
      const expected = '&lt;p&gt;First &amp; Second &amp; Third&lt;/p&gt;';
      expect(HtmlEscape.escape(input)).toBe(expected);
    });

    it('should handle nested quotes', () => {
      const input = `<div onclick="alert('Hello')">Click me</div>`;
      const expected = `&lt;div onclick=&quot;alert(&#39;Hello&#39;)&quot;&gt;Click me&lt;/div&gt;`;
      expect(HtmlEscape.escape(input)).toBe(expected);
    });

    it('should handle unicode characters', () => {
      const input = '<div>Hello 👋 & "世界"</div>';
      const expected = '&lt;div&gt;Hello 👋 &amp; &quot;世界&quot;&lt;/div&gt;';
      expect(HtmlEscape.escape(input)).toBe(expected);
    });
  });

  describe('HtmlEscape.unescape', () => {
    it('should unescape HTML entities', () => {
      const input = '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;';
      const expected = '<div class="test">Hello & "World"</div>';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });

    it('should unescape all HTML entities', () => {
      const input = '&lt; &gt; &amp; &quot; &#39;';
      const expected = '< > & " \'';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });

    it('should handle empty strings', () => {
      expect(HtmlEscape.unescape('')).toBe('');
    });

    it('should handle strings without entities', () => {
      const input = 'Hello World 123';
      expect(HtmlEscape.unescape(input)).toBe(input);
    });

    it('should handle null and undefined gracefully', () => {
      expect(HtmlEscape.unescape(null)).toBe('');
      expect(HtmlEscape.unescape(undefined)).toBe('');
    });

    it('should convert non-string values to strings', () => {
      expect(HtmlEscape.unescape(123)).toBe('123');
      expect(HtmlEscape.unescape(true)).toBe('true');
      expect(HtmlEscape.unescape(false)).toBe('false');
    });

    it('should handle escaped script tags', () => {
      const input = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      const expected = '<script>alert("XSS")</script>';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });

    it('should handle multiple occurrences', () => {
      const input = '&lt;p&gt;First &amp; Second &amp; Third&lt;/p&gt;';
      const expected = '<p>First & Second & Third</p>';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });

    it('should handle numeric entities', () => {
      const input = '&#39;Hello&#39;';
      const expected = '\'Hello\'';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });

    it('should handle unicode with entities', () => {
      const input = '&lt;div&gt;Hello 👋 &amp; &quot;世界&quot;&lt;/div&gt;';
      const expected = '<div>Hello 👋 & "世界"</div>';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });

    it('should handle partial entities (invalid HTML)', () => {
      const input = '&lt incomplete &gt;';
      // Should only unescape complete entities
      expect(HtmlEscape.unescape(input)).toBe('&lt incomplete >');
    });

    it('should handle mixed escaped and unescaped content', () => {
      const input = 'Normal text &lt;b&gt;bold&lt;/b&gt; more text';
      const expected = 'Normal text <b>bold</b> more text';
      expect(HtmlEscape.unescape(input)).toBe(expected);
    });
  });

  describe('HtmlEscape.escape and HtmlEscape.unescape roundtrip', () => {
    it('should properly roundtrip simple HTML', () => {
      const original = '<p>Hello & "World"</p>';
      const escaped = HtmlEscape.escape(original);
      const unescaped = HtmlEscape.unescape(escaped);
      expect(unescaped).toBe(original);
    });

    it('should properly roundtrip complex HTML', () => {
      const original = `<div class="container" data-value='test'>
        <h1>Title & Subtitle</h1>
        <p>Content with "quotes" and 'apostrophes'</p>
        <script>alert("Hello")</script>
      </div>`;
      const escaped = HtmlEscape.escape(original);
      const unescaped = HtmlEscape.unescape(escaped);
      expect(unescaped).toBe(original);
    });

    it('should properly roundtrip empty and special cases', () => {
      const testCases = ['', ' ', '\n', '\t', '   spaces   '];
      testCases.forEach(original => {
        const escaped = HtmlEscape.escape(original);
        const unescaped = HtmlEscape.unescape(escaped);
        expect(unescaped).toBe(original);
      });
    });
  });
});