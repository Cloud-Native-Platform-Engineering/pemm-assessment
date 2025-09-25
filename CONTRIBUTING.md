# Contributing to Platform Engineering Maturity Model Assessment

## AI-Assisted Development

This project is developed using AI assistance to ensure consistent, high-quality code and maintain project standards.

### AI Tools Used

- **GitHub Copilot**: For code suggestions, completions, and inline assistance
- **Claude Sonnet 4.0**: For comprehensive code generation, refactoring, and architectural decisions

### Development Guidelines

All AI assistants working on this project are configured to follow the guidelines specified in `.github/instructions/instructions.md`. This ensures:

- Consistent code quality and style
- Proper synchronization between English and Chinese versions
- Adherence to GitHub Pages deployment requirements
- Maintenance of project architecture and patterns

### AI Instruction Compliance

When contributing with AI assistance:

1. **Read the Instructions**: AI tools must reference `.github/instructions/instructions.md` before making changes
2. **Multi-language Sync**: Any changes to `/index.html` must be synchronized with `/zh/index.html`
3. **GitHub Pages Compatibility**: All code must remain client-side compatible
4. **Consistent Styling**: Follow established CSS custom properties and design patterns

### Human Review Process

While AI assists in development, all changes should be reviewed by humans to ensure:

- Proper functionality across both language versions
- Adherence to project goals and user experience
- Code quality and maintainability
- Accessibility and cross-browser compatibility

## Making Contributions

### For AI-Assisted Development

1. Ensure AI tools have access to and follow `.github/instructions/instructions.md`
2. Test changes in both English (`/index.html`) and Chinese (`/zh/index.html`) versions
3. Verify GitHub Pages compatibility
4. Follow established code patterns and styling

### For Human Contributors

1. Review the project structure and existing code patterns
2. Read `.github/instructions/instructions.md` for development guidelines
3. Ensure any new features work in both language versions
4. Test locally before submitting changes
5. Consider accessibility and cross-browser compatibility

## Code Quality Standards

- Use semantic HTML5 elements
- Follow CSS custom properties defined in `style.css`
- Maintain consistent spacing and design patterns
- Write clear, readable JavaScript without external dependencies
- Ensure all functionality works offline/client-side only

## Questions or Issues

If you have questions about the development process or encounter issues with AI-assisted contributions, please open an issue describing:

- The specific problem or question
- Which AI tool was being used (if applicable)
- Steps to reproduce any issues
- Expected vs actual behavior

Thank you for contributing to making platform engineering maturity assessment more accessible and useful!