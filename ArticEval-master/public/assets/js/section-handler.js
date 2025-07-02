/**
 * Section Handler for PDF Generation
 * 
 * This module ensures sections are properly formatted for PDF generation,
 * adding appropriate page breaks, fixing spacing issues, and ensuring
 * complete content in the clinical impressions and recommendations sections.
 */

class SectionHandler {
    constructor() {
        // Setup complete flag
        this.initialized = false;
    }

    /**
     * Initialize the section handler
     */
    initialize() {
        if (this.initialized) return;
        
        console.log('Section Handler: Initializing...');
        
        // Add section IDs for page break control
        this.addSectionIDs();
        
        // Fix section spacing
        this.fixSectionSpacing();
        
        // Ensure clinical impressions and recommendations are complete
        this.ensureCompleteSections();
        
        this.initialized = true;
        console.log('Section Handler: Initialization complete');
    }

    /**
     * Add IDs to sections for better page break control
     */
    addSectionIDs() {
        // Map of section titles to IDs
        const sectionMappings = [
            { title: 'Client Information', id: 'clientInfoSection' },
            { title: 'Articulation Evaluation Protocol', id: 'protocolSection' },
            { title: 'Relevant Background Information', id: 'backgroundInfoSection' },
            { title: 'Oral Mechanism Evaluation', id: 'oralMechanismSection' },
            { title: 'Standardized Assessment', id: 'standardizedAssessmentSection' },
            { title: 'Speech Sound Assessment', id: 'speechSoundSection' },
            { title: 'Connected Speech Sample', id: 'speechSampleSection' },
            { title: 'Clinical Impressions', id: 'clinicalImpressionsSection' },
            { title: 'Recommendations', id: 'recommendationsSection' }
        ];
        
        // Find all section headers
        const headers = document.querySelectorAll('h2, h3');
        
        // Add IDs to sections based on their titles
        headers.forEach(header => {
            const headerText = header.textContent.trim();
            
            sectionMappings.forEach(mapping => {
                if (headerText.includes(mapping.title)) {
                    // Find the parent section
                    let section = header.closest('section');
                    if (!section) {
                        // If no section parent, use the header's parent
                        section = header.parentElement;
                    }
                    
                    if (section) {
                        section.id = mapping.id;
                        section.classList.add('main-section');
                        console.log(`Section Handler: Added ID "${mapping.id}" to section "${mapping.title}"`);
                    }
                }
            });
        });
    }

    /**
     * Fix spacing issues between sections
     */
    fixSectionSpacing() {
        // Add appropriate margins between sections
        document.querySelectorAll('section, .main-section').forEach(section => {
            section.style.marginBottom = '0.3in';
            section.style.clear = 'both';
        });
        
        // First section shouldn't have top margin in PDF
        const firstSection = document.querySelector('section:first-of-type, .main-section:first-of-type');
        if (firstSection) {
            firstSection.style.marginTop = '0';
            firstSection.style.paddingTop = '0';
        }
        
        // Ensure proper page breaks
        document.querySelectorAll('#backgroundInfoSection, #oralMechanismSection, #standardizedAssessmentSection, #speechSoundSection, #clinicalImpressionsSection, #recommendationsSection').forEach(section => {
            section.classList.add('page-break-before');
        });
    }

    /**
     * Ensure clinical impressions and recommendations sections are complete
     */
    ensureCompleteSections() {
        // Check for clinical impressions section
        const clinicalImpressions = document.querySelector('#clinicalImpressionsSection');
        const clinicalImpressionsSummary = document.querySelector('#clinicalImpressionsSummary');
        
        if (clinicalImpressions && (!clinicalImpressionsSummary || !clinicalImpressionsSummary.innerHTML.trim())) {
            // If impressions section exists but no summary, create placeholder
            const newSummary = document.createElement('div');
            newSummary.id = 'clinicalImpressionsSummary';
            newSummary.className = 'clinical-summary';
            newSummary.innerHTML = `
                <h3>Therapist Notes:</h3>
                <p>Based on the results from this evaluation, family support, and adherence to recommendations that follow, 
                prognosis for improvement is favorable.</p>
            `;
            
            // Append to clinical impressions section
            const container = clinicalImpressions.querySelector('.section-content') || clinicalImpressions;
            if (container) {
                container.appendChild(newSummary);
            }
        }
        
        // Check for recommendations section
        const recommendations = document.querySelector('#recommendationsSection');
        const recommendationsSummary = document.querySelector('#recommendationsSummary');
        
        if (recommendations && (!recommendationsSummary || !recommendationsSummary.innerHTML.trim())) {
            // If recommendations section exists but no summary, create placeholder
            const newRecommendations = document.createElement('div');
            newRecommendations.id = 'recommendationsSummary';
            newRecommendations.className = 'recommendations-summary';
            
            // Create a list of standard recommendations
            newRecommendations.innerHTML = `
                <ul class="recommendations-list">
                    <li>Individual speech therapy is recommended</li>
                    <li>Implementation of home practice program</li>
                    <li>Reevaluation in 6 months to monitor progress</li>
                    <li>Parent training and education</li>
                    <li>Referral to: <span class="referral-field">&nbsp;</span></li>
                </ul>
            `;
            
            // Append to recommendations section
            const container = recommendations.querySelector('.section-content') || recommendations;
            if (container) {
                container.appendChild(newRecommendations);
            }
        }
    }

    /**
     * Prepare sections for PDF generation
     * @param {Document} doc - Document to prepare
     */
    prepareSectionsForPdf(doc) {
        // Add class to document for styling
        doc.body.classList.add('pdf-ready');
        
        // Ensure all sections have IDs
        this.addSectionIDs();
        
        // Fix section spacing
        this.fixSectionSpacing();
        
        // Ensure clinical impressions and recommendations sections are complete
        this.ensureCompleteSections();
        
        // Add page break classes for PDF
        doc.querySelectorAll('#backgroundInfoSection, #oralMechanismSection, #standardizedAssessmentSection, #speechSoundSection, #clinicalImpressionsSection, #recommendationsSection').forEach(section => {
            section.classList.add('page-break-before');
        });
        
        // Add avoid break classes to elements that shouldn't be split
        doc.querySelectorAll('table, .table-container, .field-group, h1, h2, h3, h4, h5, h6, li, ul, ol, img, figure').forEach(el => {
            el.classList.add('avoid-break');
        });
    }
}

// Create singleton instance
const sectionHandler = new SectionHandler();

// Auto-initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    sectionHandler.initialize();
});

// Export the section handler
export { sectionHandler };

// Default export for module import
export default SectionHandler;