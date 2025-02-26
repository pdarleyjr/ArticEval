# GitHub Pages Setup Guide for ArticEval

This document provides instructions for setting up GitHub Pages for the Articulation Evaluation System.

## Configuration Steps

1. **Go to the repository settings**:
   - Navigate to https://github.com/pdarleyjr/ArticEval/settings
   - Click on "Pages" in the left sidebar

2. **Configure the source branch**:
   - Under "Source", select "Deploy from a branch"
   - From the dropdown, select "main" as the branch
   - Select "/ (root)" for the folder
   - Click "Save"

3. **Enable HTTPS**:
   - Ensure the "Enforce HTTPS" checkbox is selected
   - This provides secure access to your site

4. **Custom domain (if applicable)**:
   - If you have a custom domain, enter it in the "Custom domain" field
   - Add the required DNS records as prompted
   - Click "Save"
   - Wait for DNS verification to complete

5. **Wait for deployment**:
   - GitHub Pages will build and deploy your site automatically
   - A GitHub Actions workflow (.github/workflows/pages.yml) has been configured to handle the deployment

## Technology Stack Considerations

The Articulation Evaluation System uses the following technologies:

- Static HTML/CSS/JavaScript (no build step required)
- ES6 Modules
- IndexedDB for local storage
- The `.nojekyll` file is included to prevent GitHub Pages from processing the files with Jekyll

## Verifying Deployment

Once deployed, your site will be available at:
https://pdarleyjr.github.io/ArticEval/

To verify everything is working correctly:

1. Open the URL in different browsers to test compatibility
2. Test the PDF generation feature
3. Check that form data is properly saved to IndexedDB
4. Verify that all UI elements render correctly

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions tab for any failed workflow runs
2. Ensure the `.nojekyll` file is present in the repository
3. Verify that all paths in the HTML/JavaScript files use relative paths

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Actions for GitHub Pages](https://github.com/marketplace/actions/github-pages-action)