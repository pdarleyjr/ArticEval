// Preview Page functionality for the Articulation Evaluation form
import { templateEngine } from './template-engine.js';

class PreviewPage {
    constructor() {
        this.previewWindow = null;
        this.formData = null;
    }

    /**
     * Opens a new window with a preview of the evaluation form
     * @param {Object} formData - The collected form data
     */
    async openPreviewPage(formData) {
        try {
            this.formData = formData;
            
            // Create a new window
            this.previewWindow = window.open('', 'PreviewPage', 'width=1000,height=800,scrollbars=yes');
            
            if (!this.previewWindow) {
                throw new Error('Unable to open preview window. Please check your popup blocker settings.');
            }
            
            // Create the preview page content
            const previewContent = this.generatePreviewContent(formData);
            
            // Write the content to the new window
            this.previewWindow.document.open();
            this.previewWindow.document.write(previewContent);
            this.previewWindow.document.close();
            
            // Add event listeners to the preview window
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('Error opening preview page:', error);
            if (this.previewWindow) {
                this.previewWindow.close();
                this.previewWindow = null;
            }
            throw error;
        }
    }
    
    /**
     * Generates the HTML content for the preview page
     * @param {Object} formData - The collected form data
     * @returns {string} - The HTML content
     */
    generatePreviewContent(formData) {
        const { firstName, lastName, evaluationDate } = formData;
        const dateStr = evaluationDate ? new Date(evaluationDate).toLocaleDateString() : 'N/A';
        
        // Get all sections from the main form
        const sections = [
            'patient-info', 'protocol', 'background-info', 'oral-mechanism',
            'speech-sound', 'speech-sample', 'clinical-impressions', 'recommendations'
        ];
        
        const filename = `${lastName}_${firstName}_Articulation_Evaluation_${dateStr.replace(/\//g, '-')}.pdf`;
        
        // Get the CSS from the main page
        const mainStyles = Array.from(document.styleSheets)
            .filter(sheet => !sheet.href || sheet.href.includes(window.location.origin))
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    console.warn('Could not access cssRules for sheet', sheet.href);
                    return '';
                }
            })
            .join('\n');
        
        // Get the actual content from the main page
        const contentElement = document.getElementById('formSections');
        let formContent = '';
        
        if (contentElement) {
            // Clone the content element to avoid modifying the original
            const contentClone = contentElement.cloneNode(true);
            formContent = contentClone.innerHTML;
        }
        
        // Create the HTML content
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - ${firstName} ${lastName} Evaluation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        ${mainStyles}
        
        /* Additional styles for the preview page */
        body {
            padding: 20px;
            background-color: #f8f9fa;
            font-size: 14pt;
        }
        
        .preview-container {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            width: 100%;
            max-width: 100%;
        }
        
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .preview-actions {
            position: sticky;
            top: 0;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        [contenteditable="true"] {
            outline: none;
            padding: 2px 5px;
            border-radius: 3px;
            min-height: 1em;
            display: inline-block;
        }
        
        [contenteditable="true"]:hover {
            background-color: rgba(0, 115, 230, 0.05);
            cursor: text;
        }
        
        [contenteditable="true"]:focus {
            background-color: rgba(0, 115, 230, 0.08);
            box-shadow: 0 0 0 2px rgba(0, 115, 230, 0.25);
        }
        
        .editable-notice {
            font-style: italic;
            color: #6c757d;
            margin-bottom: 10px;
        }

        .section-controls {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 5px;
            padding: 2px 0;
            opacity: 0.7;
            transition: opacity 0.2s;
        }

        .section-controls:hover {
            opacity: 1;
        }

        .section-controls button {
            font-size: 0.8rem;
            padding: 2px 8px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 3px;
            cursor: pointer;
            margin-left: 5px;
            color: #6c757d;
            transition: all 0.2s;
        }

        .section-controls button:hover {
            background-color: #e9ecef;
            color: #495057;
            border-color: #ced4da;
        }
        
        /* Additional styling for sections and dividers */
        .form-content section h2, 
        .form-content .section h2,
        .form-content .section-header {
            position: relative;
            padding-top: 8px;
            padding-bottom: 8px;
            margin-bottom: 12px;
            color: #2C5282;
            font-weight: 600;
        }
        
        /* Blue dividers for section headers */
        .form-content section h2::before, 
        .form-content section h2::after,
        .form-content .section h2::before, 
        .form-content .section h2::after,
        .form-content .section-header::before, 
        .form-content .section-header::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background-color: #0073e6;
        }
        
        .form-content section h2::before,
        .form-content .section h2::before,
        .form-content .section-header::before {
            top: 0;
        }
        
        .form-content section h2::after,
        .form-content .section h2::after,
        .form-content .section-header::after {
            bottom: 0;
        }
        
        /* Make sure the logo displays properly */
        .preview-header img {
            max-width: 250px;
            height: auto;
            display: block;
            margin-bottom: 10px;
            object-fit: contain;
            object-position: left center;
        }
        
        /* Optimize text size and spacing */
        p, div, span, li, td, th {
            font-size: 14pt;
            line-height: 1.3;
        }
        
        .form-content {
            width: 100%;
            max-width: 100%;
        }
        
        section, .section {
            width: 100%;
            max-width: 100%;
            margin-bottom: 0.5em;
            padding: 3pt 0;
        }
        
        .field-group {
            margin: 2pt 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        table {
            margin: 4pt 0;
            padding: 0;
            border-collapse: collapse;
            width: 100%;
        }
        
        td, th {
            padding: 3pt;
            font-size: 12pt;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js"></script>
</head>
<body>
    <div class="preview-actions">
        <div>
            <h4>Preview Mode</h4>
            <h5>Full Document Preview</h5>
            <p class="editable-notice">All content is editable. Click on any text to make changes. Use the controls above each section to remove sections if needed.</p>
        </div>
        <div>
            <button id="generatePDF" class="btn btn-success">Generate PDF</button>
            <button id="closePreview" class="btn btn-secondary ms-2">Close Preview</button>
        </div>
    </div>
    
    <div class="preview-container" id="pdfContent">
        <!-- Full Form Content -->
        <div class="form-content" id="completeFormContent">
            ${formContent}
            
        </div>
    </div>
    
    <script>
        // PDF generation functionality
        document.getElementById('generatePDF').addEventListener('click', function() {
            // Show loading state
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating PDF...';
            
            // Get the content element
            const element = document.getElementById('pdfContent');
            
            // PDF options optimized based on the HTML2PDF guide
            const pdfOptions = {
                margin: [5, 10, 5, 10], // Minimal margins to maximize content area
                filename: '${filename}',
                html2canvas: { 
                    scale: 2.0, // Increased scale for better quality
                    useCORS: true,
                    imageTimeout: 30000,
                    removeContainer: true,
                    backgroundColor: '#ffffff',
                    windowWidth: 1200, // Increased width for better rendering
                    scrollX: 0,
                    scrollY: 0,
                    width: 1200, // Matching windowWidth
                    height: undefined,
                    logging: false,
                    allowTaint: true,
                    letterRendering: true,
                    dpi: 300, // Increased DPI for better quality
                    foreignObjectRendering: false, // Disable to avoid conflicts
                    pagesplit: true, // Split content into multiple canvases to avoid size limits
                    imageQuality: 1.0,
                    onclone: function(doc) {
                        // Remove editable attributes and cleanup styles
                        doc.querySelectorAll('[contenteditable="true"]').forEach(el => {
                            el.removeAttribute('contenteditable');
                            el.style.backgroundColor = '';
                            el.style.boxShadow = '';
                            el.style.padding = '';
                        });

                        // Process logo with proper size and style
                        const logo = doc.querySelector('img[src*="400dpiLogo"]');
                        if (logo) {
                            logo.style.width = '250px'; // Smaller logo to save space
                            logo.style.height = 'auto';
                            logo.style.margin = '0 0 15px 0';
                            logo.style.display = 'block';
                            logo.crossOrigin = 'anonymous';
                        }

                        // Remove any UI elements that shouldn't be in the PDF
                        doc.querySelectorAll('.preview-actions, .form-controls, button, .no-print').forEach(el => {
                            if (el && !el.closest('.section-removed')) {
                                el.remove();
                            }
                        });

                        // Add IPLC blue dividers to section headers
                        doc.querySelectorAll('section h2, .section h2, .section-header').forEach(header => {
                            header.style.position = 'relative';
                            header.style.paddingTop = '8px';
                            header.style.paddingBottom = '8px';
                            header.style.marginBottom = '10px';
                            header.style.color = '#2C5282';
                            header.style.fontWeight = '600';
                            header.style.pageBreakAfter = 'avoid';
                            header.style.pageBreakBefore = 'auto';
                        });
                        
                        // Add dividers using CSS style element
                        const style = doc.createElement('style');
                        style.textContent = 
                            "section h2::before, section h2::after, .section h2::before, .section h2::after, .section-header::before, .section-header::after {" +
                            "content: '';" +
                            "position: absolute;" +
                            "left: 0;" +
                            "right: 0;" +
                            "height: 2px;" +
                            "background-color: #0073e6;" +
                            "}" +
                            "section h2::before, .section h2::before, .section-header::before {" +
                            "top: 0;" +
                            "}" +
                            "section h2::after, .section h2::after, .section-header::after {" +
                            "bottom: 0;" +
                            "}";
                        doc.head.appendChild(style);
                        
                        // Display input values correctly
                        doc.querySelectorAll('input, select, textarea').forEach(input => {
                            const value = input.value || '';
                            const span = doc.createElement('span');
                            span.textContent = value;
                            input.parentNode.replaceChild(span, input);
                        });
                        
                        // Ensure sentences don't break across pages
                        doc.querySelectorAll('.sentence, .recommendation-item').forEach(sentence => {
                            sentence.style.pageBreakInside = 'avoid';
                        });

                        // Remove sections that were marked for removal
                        doc.querySelectorAll('.section-removed').forEach(section => {
                            section.remove();
                        });

                        // Remove empty "other" fields and unused large text boxes
                        doc.querySelectorAll('textarea, [data-field-type="other"], .large-text-box').forEach(field => {
                            const content = field.textContent.trim();
                            if (!content || content === '' || 
                                (content.toLowerCase().includes('other:') && content.length < 10) || 
                                (content.toLowerCase() === 'notes:' || content.toLowerCase() === 'notes')) {
                                // Try to remove the parent field group if it exists
                                const fieldGroup = field.closest('.field-group');
                                if (fieldGroup) {
                                    fieldGroup.remove();
                                } else {
                                    // Otherwise just remove the field itself
                                    field.remove();
                                }
                            }
                        });
                        
                        // Also check for any empty text areas or fields with default placeholder text
                        doc.querySelectorAll('.notes-field, [placeholder]').forEach(field => {
                            const content = field.textContent.trim();
                            if (!content || content === '' || content === field.getAttribute('placeholder')) {
                                field.closest('.field-group')?.remove() || field.remove();
                            }
                        });
                        
                        // Optimize paragraphs and text content
                        doc.querySelectorAll('p, .text-content').forEach(text => {
                            text.style.margin = '2pt 0'; // Minimal margin to save space
                            text.style.lineHeight = '1.3'; // Slightly increased for better readability
                            text.style.fontSize = '14pt'; // Larger font for better readability
                        });
                        
                        // Optimize form elements for compact layout
                        doc.querySelectorAll('.field-group').forEach(group => {
                            group.style.margin = '2pt 0'; // Minimal margin to save space
                            group.style.display = 'flex';
                            group.style.alignItems = 'center';
                            group.style.gap = '6px';
                        });
                        
                        // Optimize section spacing
                        doc.querySelectorAll('section, .section').forEach(section => {
                            section.style.marginBottom = '0.5em'; // Reduced margin to save space
                            section.style.padding = '3pt 0'; // Reduced padding to save space
                            section.style.width = '100%';
                        });
                        
                        // Add global styles to maximize content area
                        const globalStyle = document.createElement('style');
                        globalStyle.textContent = 
                            "* { box-sizing: border-box; }" +
                            "body, html { margin: 0; padding: 0; width: 100%; }" +
                            "p, div, span, li, td, th { font-size: 14pt; line-height: 1.3; }" +
                            ".form-content { width: 100%; max-width: 100%; }" +
                            "section, .section { width: 100%; max-width: 100%; }";
                        doc.head.appendChild(globalStyle);
                    }
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'letter', // Changed to letter format for US standard
                    orientation: 'portrait',
                    compress: true,
                    precision: 16,
                    putOnlyUsedFonts: true,
                    enableLinks: true, // Preserve hyperlinks in the PDF
                    hotfixes: ["px_scaling"], // Apply hotfixes for better rendering
                    floatPrecision: "smart"
                },
                pagebreak: {
                    mode: ['css', 'avoid-all', 'legacy'], // Added avoid-all for better control
                    before: [
                        '.page-break-before',
                        'section h2:not(:first-of-type):not(.keep-with-previous)',
                        '.section-header:not(:first-of-type)'
                    ],
                    after: ['.page-break-after'],
                    avoid: [
                        '.avoid-break',
                        'table',
                        '.table-responsive',
                        '.field-group',
                        '.clinical-impression',
                        '.clinical-summary',
                        'p:not(.allow-break)',
                        '.sentence',
                        '.recommendation-item',
                        'h1, h2, h3, h4, h5, h6',
                        'li',
                        'tr'
                    ]
                }
            };
            
            // Generate PDF
            html2pdf()
                .set(pdfOptions)
                .from(element)
                .save()
                .catch(error => {
                    console.error('Error in PDF generation:', error);
                    // Try again with slightly reduced settings if there's an error
                    const reducedOptions = {...pdfOptions};
                    reducedOptions.html2canvas.scale = 1.8; // Still maintain good quality
                    reducedOptions.html2canvas.dpi = 250; // Still maintain good quality
                    
                    // Show error message but continue with reduced settings
                    alert('PDF generation encountered an issue. Trying with reduced quality settings...');
                    
                    return html2pdf()
                        .set(reducedOptions)
                        .from(element)
                        .save();
                })
                .then(() => {
                    // Reset button state
                    this.disabled = false;
                    this.textContent = 'Generate PDF';
                })
                .catch(error => {
                    console.error('Error generating PDF:', error);
                    alert('Error generating PDF: ' + error.message);
                    
                    // Reset button state
                    this.disabled = false;
                    this.textContent = 'Generate PDF';
                });
        });
        
        // Close preview button
        document.getElementById('closePreview').addEventListener('click', function() {
            window.close();
        });
    </script>
</body>
</html>`;
    }
    
    /**
     * Sets up event listeners for the preview window
     */
    setupEventListeners() {
        if (!this.previewWindow || !this.previewWindow.document) return;
        
        // Make all elements editable
        setTimeout(() => {
            try {
                const doc = this.previewWindow.document;
                
                // Make all text content editable
                doc.querySelectorAll('#completeFormContent p, #completeFormContent li, #completeFormContent td, #completeFormContent th, #completeFormContent span, #completeFormContent div:not(.section-controls):not(.preview-actions):not(.form-content):not(.section):not(#completeFormContent), #completeFormContent label, #completeFormContent input, #completeFormContent select, #completeFormContent textarea, #clinicalImpressionsSummary, #recommendationsSummary')
                    .forEach(el => {
                        // Skip elements that are containers or already have contenteditable
                        if (el.children.length > 0 && !el.classList.contains('field-group') && 
                            !el.classList.contains('clinical-summary') && 
                            !el.classList.contains('recommendations-summary')) {
                            return;
                        }
                        
                        // Make the element editable
                        el.setAttribute('contenteditable', 'true');
                    });
                
                // Add section controls to each section
                doc.querySelectorAll('#completeFormContent section, #completeFormContent .section').forEach(section => {
                    // Create section controls
                    const sectionControls = doc.createElement('div');
                    sectionControls.className = 'section-controls no-print';
                    
                    // Create remove button
                    const removeButton = doc.createElement('button');
                    removeButton.className = 'btn-remove-section no-print';
                    removeButton.textContent = 'Remove Section';
                    removeButton.type = 'button';
                    
                    // Add event listener to remove button
                    removeButton.addEventListener('click', function() {
                        if (confirm('Are you sure you want to remove this section? This cannot be undone.')) {
                            section.classList.add('section-removed');
                            section.style.display = 'none';
                        }
                    });
                    
                    // Add button to controls
                    sectionControls.appendChild(removeButton);
                    
                    // Insert controls before the section
                    section.parentNode.insertBefore(sectionControls, section);
                });
            } catch (error) {
                console.error('Error setting up contenteditable attributes:', error);
            }
        }, 500);
        
        // Add any additional event listeners here if needed
    }
}

// Export both the class and a factory function
export { PreviewPage };

export function createPreviewPage() {
    const previewPage = new PreviewPage();
    
    // Add to global app object if it exists
    if (window.app && !window.app.previewPage) {
        window.app.previewPage = previewPage;
    }
    
    return previewPage;
}