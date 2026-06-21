/**
 * parser.test.js — Lightweight unit tests for parser.js.
 * Runs under plain Node.js with zero dependencies: `node parser.test.js`.
 * Exit code is non-zero if any assertion fails (CI-friendly).
 */
const MD = require('./parser.js');

let passed = 0;
let failed = 0;

function assert(name, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.error('  ✗ ' + name);
    console.error('    expected: ' + JSON.stringify(expected));
    console.error('    actual:   ' + JSON.stringify(actual));
  }
}

function assertIncludes(name, haystack, needle) {
  if (haystack.includes(needle)) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.error('  ✗ ' + name + ' (missing: ' + JSON.stringify(needle) + ')');
    console.error('    in: ' + JSON.stringify(haystack));
  }
}

console.log('Markdown parser tests\n');

assert('h1 heading', MD.render('# Hello'), '<h1>Hello</h1>');
assert('h3 heading', MD.render('### Sub'), '<h3>Sub</h3>');
assert('bold', MD.render('**bold**'), '<p><strong>bold</strong></p>');
assert('italic', MD.render('*it*'), '<p><em>it</em></p>');
assert('strikethrough', MD.render('~~no~~'), '<p><del>no</del></p>');
assert('horizontal rule', MD.render('---'), '<hr>');

assertIncludes('inline code', MD.render('use `npm i`'), '<code>npm i</code>');
assertIncludes('link', MD.render('[site](https://x.com)'),
  '<a href="https://x.com" target="_blank" rel="noopener noreferrer">site</a>');
assertIncludes('image', MD.render('![alt](pic.png)'), '<img src="pic.png" alt="alt">');
assertIncludes('unordered list', MD.render('- a\n- b'), '<ul><li>a</li><li>b</li></ul>');
assertIncludes('ordered list', MD.render('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
assertIncludes('blockquote', MD.render('> quote'), '<blockquote>quote</blockquote>');
assertIncludes('fenced code block', MD.render('```\ncode\n```'), '<pre><code>code</code></pre>');
assertIncludes('code block language class', MD.render('```js\nx\n```'), 'class="language-js"');

// Security: XSS must be neutralised.
assertIncludes('escapes raw html', MD.render('<script>alert(1)</script>'), '&lt;script&gt;');
assertIncludes('blocks javascript: url', MD.render('[x](javascript:alert(1))'), 'href="#"');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
