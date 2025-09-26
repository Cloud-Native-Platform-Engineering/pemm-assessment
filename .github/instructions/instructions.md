---
applyTo: '**'
---

# Platform Engineering Maturity Model Assessment Project

## Project Overview
This is a web application for assessing platform engineering maturity. It provides an interactive questionnaire with visual results including spider charts and maturity matrices.

**Deployment**: This application is designed to run on GitHub Pages as a static website. All functionality is client-side using vanilla HTML, CSS, and JavaScript.

## Multi-language Support
The application supports both English and Chinese versions:
- **English**: `/index.html` (root level)
- **Chinese**: `/zh/index.html`

## Critical Synchronization Requirements

### Keep Chinese Version Updated
**IMPORTANT**: When making any changes to the root `/index.html`, you MUST also update the Chinese version at `/zh/index.html` to maintain feature parity.

#### What needs to be synchronized:
1. **HTML Structure**: Any new elements, sections, or layout changes
2. **Form Fields**: New questions, options, or input modifications
3. **Interactive Features**: New buttons, links, or JavaScript functionality
4. **CSS Classes**: New styling classes or ID attributes
5. **Meta Tags**: Updates to viewport, charset, or other meta information

#### What should NOT be synchronized (Chinese-specific):
- Text content (questions, labels, descriptions should remain in Chinese)
- `lang` attribute (should stay "zh" for Chinese version)
- Page title and headings (should remain in Chinese)

#### Synchronization Workflow:
1. Make changes to `/index.html`
2. Identify structural/functional changes (not content changes)
3. Apply the same structural/functional changes to `/zh/index.html`
4. Preserve all Chinese text content
5. Test both versions to ensure feature parity

### Shared Resources
Both versions share:
- `style.css` - Common stylesheet
- `app.js` - Common JavaScript functionality
- All CSS variable definitions and styling rules

## GitHub Pages Deployment Considerations
- All code must be client-side compatible (no server-side processing)
- Use relative paths for resources when possible
- Ensure cross-browser compatibility for static hosting
- All functionality relies on vanilla JavaScript (no build process required)
- Assets and scripts are served directly from the repository

## Coding Guidelines
- Use semantic HTML5 elements
- Follow CSS custom properties (variables) defined in `style.css`
- Maintain consistent spacing using the defined CSS variables
- Ensure accessibility with proper labels and ARIA attributes
- Test both language versions when making changes
- Keep all dependencies client-side compatible for GitHub Pages hosting