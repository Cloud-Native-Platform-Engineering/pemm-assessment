# Platform Engineering Maturity Model Assessment - Local Development

## Docker Development Setup

This Docker Compose setup provides a local development environment that mimics the GitHub Pages file structure.

### Prerequisites

- Docker and Docker Compose installed
- All project files in place

### Quick Start

1. **Start the development server:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - English version: http://localhost:8080/pemm-assessment/
   - Chinese version: http://localhost:8080/pemm-assessment/zh/

3. **Stop the development server:**
   ```bash
   docker-compose down
   ```

### File Structure

The Docker setup serves files exactly as GitHub Pages would:
```
/pemm-assessment/
├── index.html          # English version
├── style.css           # Shared styles
├── app.js              # Main application logic
├── data/
│   ├── questions-en.yaml  # English questions
│   └── questions-zh.yaml  # Chinese questions
└── zh/
    └── index.html      # Chinese version
```

### Development Workflow

1. Make changes to your files
2. Refresh the browser to see changes (nginx serves files directly from the project directory)
3. No rebuild required - changes are reflected immediately

### Troubleshooting

- **YAML files not loading**: Check browser console for errors and verify file paths
- **Port 8080 in use**: Change the port in docker-compose.yml (e.g., "8081:80")
- **CORS issues**: The nginx configuration includes CORS headers for local development

### Configuration Files

- `docker-compose.yml`: Container orchestration
- `nginx.conf`: Web server configuration with GitHub Pages path structure