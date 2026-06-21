# Markdown Editor — Live Preview

**Tool 6 of 30 — Building in public.**

A fast, zero-dependency Markdown editor that renders a live HTML preview as you
type. The interesting part isn't the UI — it's the **hand-written Markdown
parser** (`parser.js`), built without any library to demonstrate tokenizing,
block/inline parsing, regex handling and XSS-safe output escaping.

![Markdown Editor screenshot](screenshot.png)

## Features

- **Live preview** — split-pane editor with instant rendering.
- **Custom parser** — headings, bold/italic/strikethrough, inline code, fenced
  code blocks, blockquotes, ordered/unordered lists, links, images and rules.
- **XSS-safe** — all input is HTML-escaped and only safe URL schemes are
  allowed (`javascript:` and friends are neutralised).
- **Autosave** — content and theme persist in `localStorage`.
- **Export** — download your document as `.md` or a standalone `.html` file.
- **Toolbar + shortcuts** — `Ctrl/Cmd+B` bold, `Ctrl/Cmd+I` italic, plus
  buttons for headings, lists, quotes and links.
- **Light / dark theme.**

## Run it

It's a single static page — no build step.

```bash
# just open the file
open index.html        # macOS
start index.html       # Windows

# …or serve it locally
npx serve .
```

## Tests

The parser ships with a dependency-free test suite:

```bash
node parser.test.js
```

All assertions cover formatting, lists, code blocks and the security cases
(raw HTML escaping, blocked `javascript:` links).

## Tech & skills demonstrated

- Vanilla JavaScript, no framework or dependencies
- Writing a parser: regex, block vs. inline grammar, ordered transformation
- Security-minded output encoding (XSS prevention)
- `localStorage` persistence, Blob/file export, keyboard shortcuts
- UMD module pattern so the same code runs in the browser **and** under Node
  for unit testing

## Project structure

```
index.html       # editor UI + preview, toolbar, export, theme
parser.js        # the Markdown → HTML parser (browser + Node)
parser.test.js   # zero-dependency unit tests
```

---

Part of my [30 tools in 30 days](https://github.com/w1kicartel) series.
