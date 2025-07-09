#!/bin/bash
set -e
echo "Setting up Codex CI environment..."
npm ci
npm run build
npm test
npx playwright install --with-deps
npx playwright test
echo "Codex CI setup complete!"