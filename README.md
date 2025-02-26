# Articulation Evaluation System

A template-based speech-language evaluation system with dynamic summary generation.

## Features

- Dynamic template selection
- Natural language generation
- Pattern learning
- Real-time validation
- IndexedDB storage
- Automatic data recovery

## Deployment on GitHub Pages

1. Create a new repository on GitHub
2. Push the code to the repository:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

3. Go to repository Settings > Pages
4. Under "Source", select "main" branch
5. Select "/ (root)" as the folder
6. Click Save

The site will be available at `https://[username].github.io/[repository-name]/`

## Local Development

1. Clone the repository
2. Open the project folder
3. Start a local server:
   - Using Python: `python -m http.server`
   - Using Node.js: `npx serve`
   - Using PHP: `php -S localhost:8000`
4. Open `http://localhost:8000` in your browser

## Browser Support

The application uses modern web features including:
- ES6 Modules
- IndexedDB
- Modern CSS
- Modern JavaScript APIs

Supported browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Data Storage

The application uses IndexedDB for storing:
- Evaluation samples
- Templates
- User patterns
- Form data

All data is stored locally in the browser.