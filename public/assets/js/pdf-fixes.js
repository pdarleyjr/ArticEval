/**
 * PDF Rendering Fixes
 * This script provides additional fixes for PDF generation to ensure proper rendering
 * without dotted borders, proper page breaks, and clean layout.
 */

// Function to prepare document for PDF rendering
function prepareForPdfRendering(containerElement) {
    if (!containerElement) return;
    
    console.log("Running PDF fixes...");
    
    // Remove all borders and outlines
    const allElements = containerElement.querySelectorAll('*');
    allElements.forEach(el => {
        // Remove borders, outlines, and dotted lines
        el.style.outline = 'none';
        el.style.border = 'none';
        
        // For contenteditable elements
        if (el.hasAttribute('contenteditable')) {
            el.style.outline = 'none';
            el.style.border = 'none';
            el.style.padding = '0';
            el.style.margin = '0';
        }
        
        // Only keep borders for table cells
        if (el.tagName === 'TD' || el.tagName === 'TH') {
            el.style.border = '0.5pt solid rgba(0, 0, 0, 0.2)';
        }
    });
    
    // Handle tables to prevent page breaks
    const tables = containerElement.querySelectorAll('table');
    tables.forEach(table => {
        // Add class for page break prevention
        table.classList.add('avoid-break');
        
        // Ensure tables have proper wrapper
        if (!table.parentElement.classList.contains('table-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper avoid-break';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
        
        // Add classes to each row to prevent cell splitting
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            row.classList.add('avoid-break');
        });
    });
    
    // Special handling for sections with minimal content to reduce white space
    const sections = containerElement.querySelectorAll('section, .section');
    sections.forEach((section, index) => {
        // Get the section content
        const content = section.querySelector('.section-content');
        if (content) {
            // Check if content is empty or has just one small paragraph
            const paragraphs = content.querySelectorAll('p');
            if (paragraphs.length === 0 || 
                (paragraphs.length === 1 && paragraphs[0].textContent.trim().length < 100)) {
                // Minimal content section - reduce spacing
                section.style.marginBottom = '0';
                section.style.paddingBottom = '0';
                
                // If this is the "Relevant Background Information" section
                // which is the one showing too much whitespace
                if (section.id === 'backgroundInfoSection' || section.id.includes('background')) {
                    // Apply significant reduction to whitespace for this section
                    content.style.marginBottom = '0';
                    content.style.paddingBottom = '0';
                    content.style.marginTop = '0';
                    content.style.paddingTop = '0';
                    content.style.height = 'auto';
                    content.style.minHeight = '0';
                    content.style.maxHeight = '0.5in';
                    
                    // For the section itself
                    section.style.marginBottom = '0.05in';
                    section.style.paddingBottom = '0';
                    section.style.minHeight = '0';
                    section.style.maxHeight = '0.7in';
                    
                    // Apply to heading as well
                    const heading = section.querySelector('h2, h3, h4');
                    if (heading) {
                        heading.style.marginBottom = '0.05in';
                        heading.style.paddingBottom = '0';
                    }
                    
                    // If there is a next section, adjust its spacing too
                    if (index < sections.length - 1) {
                        const nextSection = sections[index + 1];
                        if (nextSection) {
                            nextSection.style.marginTop = '0';
                            nextSection.style.paddingTop = '0';
                        }
                    }
                }
            }
            
            // Add a class to make targeting easier
            if (paragraphs.length <= 1) {
                content.classList.add('minimal-content');
                section.classList.add('compact-section');
            }
        }
        
        // Specifically target the background info section which is showing too much white space
        if (section.id === 'backgroundInfoSection' || section.id.includes('background')) {
            section.classList.add('background-info-section');
            
            // Try to find the Oral Mechanism section which follows
            if (index < sections.length - 1) {
                const nextSection = sections[index + 1];
                if (nextSection && (nextSection.id === 'oralMechanismSection' || 
                                   nextSection.id.includes('oral'))) {
                    // Reduce the gap between these two sections specifically
                    section.style.marginBottom = '0.05in';
                    section.style.paddingBottom = '0';
                    nextSection.style.marginTop = '0';
                    nextSection.style.paddingTop = '0.05in';
                }
            }
        }
    });
    
    // Fix clinical impressions section whitespace
    const clinicalSection = containerElement.querySelector('#clinicalImpressionsSection');
    if (clinicalSection) {
        const content = clinicalSection.querySelector('.section-content');
        if (content) {
            // Clean up whitespace
            content.innerHTML = content.innerHTML
                .replace(/<p>\s*<\/p>/g, '')  // Remove empty paragraphs
                .replace(/>\s+</g, '> <')      // Remove spaces between tags
                .replace(/\s{2,}/g, ' ')       // Normalize whitespace
                .replace(/\n\s*/g, '')         // Remove newlines
                .trim();
                
            // Ensure proper paragraph spacing
            const paragraphs = content.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.marginBottom = '0.15in';
                p.style.marginTop = '0.15in';
                p.style.whiteSpace = 'normal';
            });
        }
    }
    
    // Add specific class to mark tables that should not break
    const wrapAllTables = containerElement.querySelectorAll('.table-wrapper');
    wrapAllTables.forEach(wrapper => {
        wrapper.setAttribute('data-html2pdf-pagebreak', 'avoid');
    });
    
    // Inject additional CSS to fix spacing issues
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        /* Fix for excessive white space between sections */
        #backgroundInfoSection, .background-info-section {
            margin-bottom: 0.05in !important;
            padding-bottom: 0 !important;
            max-height: 1in !important;
            min-height: 0.3in !important;
        }
        
        #backgroundInfoSection + section,
        .background-info-section + section {
            margin-top: 0 !important;
            padding-top: 0.05in !important;
        }
        
        /* Compact minimal sections */
        .minimal-content {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            margin-top: 0.05in !important;
        }
        
        .compact-section {
            margin-bottom: 0.05in !important;
            padding-bottom: 0 !important;
        }
        
        /* Remove excessive space between sections */
        section, .section {
            margin-bottom: 0.1in !important; 
            padding-bottom: 0.05in !important;
        }
        
        /* Fix spacing between headings and content */
        h2 + .section-content, 
        h3 + .section-content, 
        h4 + .section-content {
            margin-top: 0.05in !important;
            padding-top: 0 !important;
        }
    `;
    
    // Add the style to the document head
    document.head.appendChild(styleTag);
    
    console.log("PDF fixes completed");
}

// Export the function for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { prepareForPdfRendering };
}