# Articulation Evaluation Repository Guide

This document provides an overview of the files included in this repository and explains why each component is necessary for the application to function properly.

## Core Files

| File | Purpose |
|------|---------|
| `index.html` | Main entry point for the application |
| `preview.html` | Handles PDF preview and generation |
| `.nojekyll` | Tells GitHub Pages not to process the site with Jekyll |
| `README.md` | Project documentation |
| `serve.json` | Configuration for local development server |

## Assets

### JavaScript Files

| File | Purpose |
|------|---------|
| `assets/js/pdf-generator.js` | Core functionality for generating PDFs |
| `assets/js/pdf-fixes.js` | Fixes for PDF rendering and page breaks |
| `assets/js/db-utils.js` | Database utilities for storing form data |
| `assets/js/summarizer.js` | Generates clinical impressions summaries |
| `assets/js/template-engine.js` | Handles templating for the application |
| `assets/js/summary-generator.js` | Creates summary content for reports |
| `assets/js/form-handler.js` | Manages form submission and validation |
| `assets/js/main.js` | Main application logic |
| `assets/js/table-handler.js` | Manages table creation and editing |
| `assets/js/section-handler.js` | Handles different sections of the evaluation form |
| `assets/js/table-utils.js` | Utilities for handling tables |

### CSS Files

| File | Purpose |
|------|---------|
| `assets/css/bootstrap-overrides.css` | Custom Bootstrap styling |
| `assets/css/compat.css` | Browser compatibility styles |
| `assets/css/page-break-fixes.css` | Ensures proper page breaks in PDF output |
| `assets/css/pdf-print.css` | Styles for PDF printing |
| `assets/css/pdf-styles-enhanced.css` | Enhanced styles for PDF rendering |
| `assets/css/pdf-styles.css` | Base styles for PDF rendering |
| `assets/css/print.css` | Print stylesheet |
| `assets/css/styles.css` | Main application styles |
| `assets/css/table-fixes.css` | Fixes for table styling in PDFs |

### Images

| File | Purpose |
|------|---------|
| `assets/images/400dpiLogo.PNG` | IPLC logo used in reports |
| `assets/images/favicon.ico` | Website favicon |

## Form Sections

The `backup/sections/` directory contains HTML templates for each section of the evaluation form:

- `patient-info.html` - Patient information section
- `protocol.html` - Evaluation protocol section
- `background-info.html` - Background information section
- `oral-mechanism.html` - Oral mechanism examination section
- `speech-sound.html` - Speech sound assessment section
- `speech-sample.html` - Speech sample analysis section
- `clinical-impressions.html` - Clinical impressions section
- `recommendations.html` - Recommendations section
- `language-sample.html` - Language sample analysis section
- `standardized-assessment.html` - Standardized assessment section

## GitHub Configuration

- `.github/workflows/pages.yml` - GitHub Actions workflow for automatic deployment to GitHub Pages

## Repository Setup Scripts

- `setup-github.bat` - Batch script for setting up the GitHub repository
- `setup-github.ps1` - PowerShell script for setting up the GitHub repository

## GitHub Pages

The application is configured to work with GitHub Pages. The main entry point for GitHub Pages is `index.html`, which is a landing page that links to the main application.

## Running Locally

To run the application locally, you can use a simple HTTP server like:

```
npx serve
```

This will serve the application at http://localhost:3000.