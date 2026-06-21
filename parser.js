/**
 * parser.js — A small, dependency-free Markdown → HTML parser.
 *
 * Why hand-rolled instead of a library? This file is the "logic showcase"
 * of the project: it demonstrates tokenizing, block/inline parsing, regex
 * handling and (critically) XSS-safe output escaping. It is written as a
 * UMD-style module so the SAME code runs both in the browser (window.MD)
 * and under Node.js (require), which lets us unit-test it (see parser.test.js).
 *
 * Supported syntax:
 *   # .. ###### headings
 *   **bold**  __bold__   *italic*  _italic_   `inline code`
 *   ~~strikethrough~~
 *   > blockquotes (multi-line)
 *   - / * / + unordered lists, 1. ordered lists (nestable one level)
 *   ```fenced code blocks```
 *   --- horizontal rules
 *   [text](url) links, ![alt](url) images
 *   paragraphs separated by blank lines
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(); // Node.js / CommonJS
  } else {
    root.MD = factory();        // browser global
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Escape HTML special chars so user input can never inject markup. */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Only allow safe URL schemes (blocks javascript: and data: payloads). */
  function safeUrl(url) {
    const trimmed = url.trim();
    if (/^(https?:\/\/|mailto:|\/|#|\.\.?\/)/i.test(trimmed)) return trimmed;
    if (/^[^:]+$/.test(trimmed)) return trimmed; // relative path, no scheme
    return '#';
  }

  /**
   * Parse inline-level markdown (runs on already HTML-escaped text).
   * Order matters: code spans first so their content is not re-parsed.
   */
  function parseInline(text) {
    // Inline code — protect contents from further inline parsing.
    const codeStore = [];
    text = text.replace(/`([^`]+)`/g, function (_, code) {
      codeStore.push('<code>' + code + '</code>');
      return ' ' + (codeStore.length - 1) + ' ';
    });

    // Images: ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, url) {
      return '<img src="' + safeUrl(url) + '" alt="' + alt + '">';
    });
    // Links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
      return '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });

    // Bold, italic, strikethrough.
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Restore protected code spans.
    text = text.replace(/ (\d+) /g, function (_, i) {
      return codeStore[Number(i)];
    });
    return text;
  }

  /** Main entry point: full document → HTML string. */
  function render(markdown) {
    const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      let line = lines[i];

      // Fenced code block.
      if (/^```/.test(line)) {
        const lang = line.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          buf.push(escapeHtml(lines[i]));
          i++;
        }
        i++; // skip closing fence
        const cls = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
        out.push('<pre><code' + cls + '>' + buf.join('\n') + '</code></pre>');
        continue;
      }

      // Blank line → separates blocks.
      if (/^\s*$/.test(line)) { i++; continue; }

      // Horizontal rule.
      if (/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(line)) {
        out.push('<hr>');
        i++;
        continue;
      }

      // Heading.
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        out.push('<h' + level + '>' + parseInline(escapeHtml(heading[2].trim())) + '</h' + level + '>');
        i++;
        continue;
      }

      // Blockquote (consume consecutive > lines).
      if (/^\s*>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + parseInline(escapeHtml(buf.join(' '))) + '</blockquote>');
        continue;
      }

      // Lists (unordered or ordered).
      const ulItem = /^\s*[-*+]\s+(.*)$/;
      const olItem = /^\s*\d+\.\s+(.*)$/;
      if (ulItem.test(line) || olItem.test(line)) {
        const ordered = olItem.test(line);
        const re = ordered ? olItem : ulItem;
        const tag = ordered ? 'ol' : 'ul';
        const items = [];
        while (i < lines.length && re.test(lines[i])) {
          const m = re.exec(lines[i]);
          items.push('<li>' + parseInline(escapeHtml(m[1].trim())) + '</li>');
          i++;
        }
        out.push('<' + tag + '>' + items.join('') + '</' + tag + '>');
        continue;
      }

      // Paragraph: gather until blank line or a block-starting token.
      const para = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^(#{1,6})\s+/.test(lines[i]) &&
        !/^\s*>\s?/.test(lines[i]) &&
        !ulItem.test(lines[i]) &&
        !olItem.test(lines[i])
      ) {
        para.push(lines[i]);
        i++;
      }
      out.push('<p>' + parseInline(escapeHtml(para.join('\n'))).replace(/\n/g, '<br>') + '</p>');
    }

    return out.join('\n');
  }

  return { render: render, escapeHtml: escapeHtml, parseInline: parseInline, safeUrl: safeUrl };
});
