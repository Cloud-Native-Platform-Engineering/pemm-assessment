# Platform Engineering Maturity Model Assessment - Instructions

## Overview

This document outlines the recent updates made to the Platform Engineering Maturity Model Assessment application, transforming it from a static multi-file structure to a dynamic, YAML-driven single-template system.

## Major Changes Summary

### 1. YAML-Driven Content System
- **Before**: Static HTML with hardcoded questions and text
- **After**: Dynamic content loaded from YAML files
- **Benefits**: Easier content management, translation support, centralized data

### 2. Single HTML Template
- **Before**: Separate HTML files for English (`index.html`) and Chinese (`zh/index.html`)
- **After**: Single dynamic template (`index.html`) that loads content based on language parameter
- **Benefits**: Single source of truth, easier maintenance, consistent structure

### 3. Asset Organization
- **Before**: CSS and JS files in root directory
- **After**: Organized under `/assets/` folder
- **Benefits**: Cleaner file structure, better organization

### 4. Language Selector
- **Before**: Separate URLs for different languages
- **After**: Dropdown selector in navigation bar
- **Benefits**: Better UX, instant language switching, intuitive interface

## File Structure

```
/pemm-assessment/
├── index.html              # Single dynamic template
├── assets/
│   ├── style.css          # CSS with language selector styling
│   └── app.js             # Enhanced JavaScript with YAML loading
├── data/
│   ├── questions-en.yaml  # English content and UI text
│   └── questions-zh.yaml  # Chinese content and UI text
├── docker-compose.yml     # Local development environment
├── nginx.conf            # Web server configuration
├── README-docker.md      # Docker setup instructions
└── INSTRUCTIONS.md       # This file
```

## YAML Data Structure

### Metadata Section
Each YAML file contains a metadata section with UI text:

```yaml
metadata:
  title: "Platform Engineering Maturity Model Assessment"
  language: "en"
  intro: "Introduction text with HTML support"
  results_title: "Assessment Results"
  feedback_message: "Thank you message"
  copy_link_text: "📋 Copy Shareable Link"
  share_feedback_text: "💬 Share Feedback"
  language_label: "Language:"
  language_english: "English"
  language_chinese: "中文"
  language_spanish: "Español"
```

### Categories and Questions
Questions are organized by categories with consistent structure:

```yaml
categories:
  - id: "investment"
    name: "Investment"
    order: 1
    questions:
      - id: 1
        text: "Question text"
        field_name: "investment_1"
        options:
          - value: 1
            level: "Option name"
            description: "Option description"
```

## Language System

### URL Structure
- **English**: `/pemm-assessment/` or `/pemm-assessment/?lang=en`
- **Chinese**: `/pemm-assessment/?lang=zh`
- **Spanish**: `/pemm-assessment/?lang=es`
- **Legacy**: `/pemm-assessment/zh/` (redirects to main template)

### Language Detection
The JavaScript automatically detects language from:
1. URL parameter: `?lang=zh` or `?lang=es`
2. Legacy path: `/zh/` (redirects)
3. Hash parameter: `#lang=zh` or `#lang=es`
4. Default: English

### Adding New Languages
To add a new language:
1. Create new YAML file: `data/questions-[lang].yaml`
2. Update JavaScript language detection in `loadQuestionsData()`
3. Add option to language dropdown in HTML template
4. Update `changeLanguage()` function if needed
5. **Follow translation workflow**: Ensure all content is properly translated and synchronized

## Dynamic Content Loading

### JavaScript Flow
1. **Language Detection**: Determine language from URL
2. **YAML Loading**: Fetch appropriate YAML file with fallback paths
3. **Content Update**: Update all page elements with dynamic content
4. **Form Generation**: Create form HTML from YAML data
5. **Dropdown Update**: Set language selector to current language

### Key Functions
- `loadQuestionsData()`: Handles YAML loading and language detection
- `generateFormFromData()`: Updates page content and generates form
- `changeLanguage()`: Handles language switching
- `updateLanguageDropdown()`: Sets dropdown to current language

## Development Setup

### Local Development with Docker
```bash
# Start development server
docker compose up -d

# Access application
# English: http://localhost:8080/pemm-assessment/
# Chinese: http://localhost:8080/pemm-assessment/?lang=zh

# Stop server
docker compose down
```

### File Serving
The nginx configuration:
- Serves static files from `/assets/` and `/data/`
- Redirects legacy Chinese URLs to main template
- Handles proper MIME types for YAML files
- Includes CORS headers for local development

## CSS Architecture

### Language Selector Styling
```css
nav.languages {
    /* Navigation bar with right-aligned dropdown */
    display: flex;
    justify-content: flex-end;
    padding-right: var(--spacing-xl);
}

nav.languages select {
    /* Styled dropdown with hover/focus states */
    background: var(--bg-white);
    border: 2px solid var(--primary-color);
    /* ... additional styling */
}
```

### Responsive Design
- Mobile-optimized language selector
- Flexible grid layout for form and charts
- Consistent spacing using CSS custom properties

## Content Management

### Translation Management and Synchronization

**⚠️ CRITICAL: All translation files must be kept synchronized when updating content.**

The assessment now supports three languages with separate YAML files:
- `data/questions-en.yaml` - English (primary/source language)
- `data/questions-zh.yaml` - Chinese translation
- `data/questions-es.yaml` - Spanish translation

#### Mandatory Translation Workflow

When updating ANY content in the assessment, you MUST follow this workflow:

1. **Always start with English source**: Make changes to `data/questions-en.yaml` first
2. **Update Chinese translation**: Apply equivalent changes to `data/questions-zh.yaml`
3. **Update Spanish translation**: Apply equivalent changes to `data/questions-es.yaml`
4. **Verify structural consistency**: Ensure all files maintain identical:
   - Category IDs and order
   - Question IDs within each category
   - Option values (1-5) for consistent scoring
   - Field names for form compatibility

#### What Must Be Translated

When updating content, ensure these elements are properly translated:

**Metadata Section:**
- `title`, `intro`, `results_title`, `feedback_message`
- All UI text (`copy_link_text`, `share_feedback_text`, etc.)
- Language labels (`language_english`, `language_chinese`, `language_spanish`)

**Content Structure:**
- Category `name` fields
- Question `text` content
- Option `level` names and `description` text

#### Translation Quality Assurance

After updating translations:

1. **Test each language**: Use URL parameters `?lang=en`, `?lang=zh`, `?lang=es`
2. **Verify functionality**: Complete full assessment in each language
3. **Check UI elements**: Ensure all buttons, labels, and messages display correctly
4. **Validate scoring**: Confirm results calculation works across all languages
5. **Test language switching**: Verify dropdown selector preserves functionality

#### Common Translation Pitfalls

- **Forgetting to update all three files** when changing English content
- **Changing structural elements** (IDs, values) instead of just text
- **Breaking HTML markup** in translated intro/feedback messages
- **Inconsistent option values** that break scoring calculations
- **Missing UI text translations** that leave English text in other languages

### Updating Questions
1. Edit appropriate YAML file in `/data/` directory
2. Maintain consistent structure for categories and questions
3. Use same field names across languages for form compatibility
4. Test both languages after changes

### UI Text Updates
- All user-facing text is in YAML metadata sections
- Includes button labels, titles, messages
- HTML markup supported in intro and feedback messages

### Adding New Questions
1. Add to appropriate category in YAML file
2. Ensure unique `field_name` (format: `category_id_number`)
3. Maintain consistent option value structure
4. Update both language files

## Best Practices

### YAML Maintenance
- **CRITICAL**: Keep all three language files (EN/ZH/ES) synchronized in structure
- Always update English source first, then translate to other languages
- Use consistent indentation (2 spaces)
- Quote strings containing special characters
- Test YAML validity after changes
- Verify identical category/question IDs and option values across all languages

### JavaScript Development
- Use `console.log()` for debugging YAML loading
- Handle fallback cases when YAML fails to load
- Maintain backward compatibility with legacy URLs
- Test language switching functionality

### CSS Updates
- Use existing CSS custom properties for consistency
- Test responsive behavior on different screen sizes
- Maintain accessibility standards for form elements
- Follow existing naming conventions

## Troubleshooting

### Common Issues

**YAML not loading**:
- Check browser console for fetch errors
- Verify YAML file syntax
- Ensure proper file paths in JavaScript
- Test with local HTTP server (not file:// protocol)

**Language switching not working**:
- Verify `changeLanguage()` function is accessible globally
- Check URL parameter handling
- Ensure dropdown update logic is working
- Test fallback language detection

**Styling issues**:
- Check CSS custom property values
- Verify responsive media queries
- Test cross-browser compatibility
- Validate HTML structure

### Development Tips
- Use browser dev tools to inspect YAML loading
- Test both languages thoroughly
- Verify Docker setup matches GitHub Pages structure
- Check nginx logs for serving issues

## Future Enhancements

### Potential Improvements
- Add more languages (Spanish, French, etc.)
- Implement client-side URL routing
- Add progress indicators for form completion
- Enhance accessibility features
- Add form validation feedback

### Technical Debt
- Consider removing legacy `drawLanguageSwitcher()` function entirely
- Optimize YAML loading with caching
- Add error handling for malformed YAML
- Implement automated testing for language switching

This documentation should be updated when making future changes to maintain accuracy and help new developers understand the system architecture.