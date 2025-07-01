// PDF Generation functionality for the Articulation Evaluation form

/**
 * PDFGenerator class
 * Handles the generation of PDFs for the Articulation Evaluation
 * Uses a preview-based approach where content is first displayed in a preview page
 * with editable fields, then converted to PDF when the user is ready
 */
class PDFGenerator {
    constructor() {
        // Initialize properties
        this.previewWindow = null;
        this.formData = null;
    }

    /**
     * Generate a preview of the evaluation that can be edited before PDF generation
     * @param {Object} formData - The form data to use for the preview
     * @returns {Promise<boolean>} - Whether the preview was successfully generated
     */
    async generatePreview(formData) {
        try {
            // Store the form data for later use
            this.formData = JSON.parse(JSON.stringify(formData));
            
            // Process the age from the form data
            if (this.formData.age) {
                // Extract age values from the age string if available
                const ageMatch = this.formData.age.match(/(\d+)\s*years?,\s*(\d+)\s*months?/i);
                if (ageMatch) {
                    this.formData.ageYears = ageMatch[1];
                    this.formData.ageMonths = ageMatch[2];
                } else {
                    this.formData.ageYears = '0';
                    this.formData.ageMonths = '0';
                    console.warn("Could not parse age string:", this.formData.age);
                }
            } else if (this.formData.dob && this.formData.evaluationDate) {
                // Calculate age from DOB and evaluation date
                this.calculateAge(this.formData);
            }
            
            console.log("Initial form data for preview:", this.formData);
            
            // Open the preview in a new window
            this.previewWindow = window.open('preview.html', '_blank');
            
            if (!this.previewWindow) {
                throw new Error('Preview window could not be opened. Please allow pop-ups for this site.');
            }
            
            // Wait for the preview window to load
            await new Promise(resolve => {
                this.previewWindow.addEventListener('load', resolve);
            });

            // Format the sections for the preview after the window has loaded
            // This ensures we have access to window objects if needed
            const sections = this.prepareSections(this.formData);
            console.log("Raw form data:", JSON.stringify(this.formData));

            console.log("Sections prepared for preview:", sections);
            
            // Send the data to the preview window
            this.previewWindow.postMessage({
                type: 'previewData',
                content: {
                    ...this.formData,
                    firstName: this.formData.firstName || '',
                    lastName: this.formData.lastName || '',
                    dob: this.formData.dob || '',
                    evaluationDate: this.formData.evaluationDate || '',
                    ageYears: this.formData.ageYears || '0',
                    ageMonths: this.formData.ageMonths || '0',
                    sections: sections
                }
            }, '*');
            
            return true;
        } catch (error) {
            console.error('Error generating preview:', error);
            throw error;
        }
    }
    
    /**
     * Calculate age from DOB and evaluation date
     * @param {Object} formData - The form data
     * @returns {void}
     */
    calculateAge(formData) {
        const dob = new Date(formData.dob);
        const evalDate = new Date(formData.evaluationDate);
        const ageInMilliseconds = evalDate - dob;
        const ageDate = new Date(Math.abs(ageInMilliseconds));
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        const months = ageDate.getUTCMonth();
        formData.ageYears = years.toString();
        formData.ageMonths = months.toString();
    }
    
    /**
     * Prepare the sections data for the preview
     * @param {Object} formData - The form data
     * @returns {Array} - Array of section objects with id, title, and content
     */
    prepareSections(formData) {
        const sections = [];
        
        console.log("Preparing sections with form data:", formData);

        // Helper function to wrap tables in a div for better page-break control
        const wrapTables = (content) => {
            if (!content || typeof content !== 'string') return content;
            if (content.includes('<table')) {
                return content.replace(/<table/g, '<div class="table-wrapper avoid-break"><table').replace(/<\/table>/g, '</table></div>');
            }
            return content;
        };

        // Protocol section - add this first
        sections.push({
            id: 'protocolSection',
            title: 'Articulation Evaluation Protocol',
            content: this.formatProtocolContent(formData) || '<p>Standard articulation evaluation protocol was followed.</p>'
        });
        
        // Background Information section
        sections.push({
            id: 'backgroundInfoSection',
            title: 'Relevant Background Information',
            content: this.formatBackgroundContent(formData) || '<p>No significant background information reported.</p>'
        });
        
        // Oral Mechanism section
        sections.push({
            id: 'oralMechanismSection',
            title: 'Oral Mechanism Evaluation',
            content: this.formatOralMechanismContent(formData) || '<p>Oral mechanism examination was completed.</p>'
        });
        
        // Standardized Assessment section - always include this section
        sections.push({
            id: 'standardizedAssessmentSection',
            title: 'Standardized Assessment',
            content: this.formatStandardizedAssessmentContent(formData) || '<p>The client was assessed using standardized articulation tests.</p>'
        });
 
        
        // Speech Sound section
        sections.push({
            id: 'speechSoundSection',
            title: 'Speech Sound Assessment',
            content: this.formatSpeechSoundContent(formData) || '<p>The client was assessed using standardized articulation tests and connected speech samples.</p>'
        });
        
        // Speech Sample section
        // Always include this section even if empty
        sections.push({
            id: 'speechSampleSection',
            title: 'Speech Sample Analysis',
            content: this.formatSpeechSampleContent(formData) || '<p>Speech samples were collected to analyze articulation skills in conversational speech.</p>'
        });
        
        // Clinical Impressions section
        let clinicalImpressions = this.formatClinicalImpressionsContent(formData);
        console.log("Clinical impressions content:", clinicalImpressions);
        
        sections.push({ 
            id: 'clinicalImpressionsSection',
            title: 'Clinical Impressions',
            content: clinicalImpressions || '<p>Based on the results of oral mechanism examination and speech sound assessment, the client presents with articulation difficulties that impact speech intelligibility.</p>'
        });
        
        // Recommendations section
        sections.push({
            id: 'recommendationsSection',
            title: 'Recommendations',
            content: this.formatRecommendationsContent(formData) || `
                <p>The following recommendations are made based on the results of this evaluation:</p>
                <ol>
                    <li>Speech therapy services are recommended to address articulation errors.</li>
                    <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                    <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
                </ol>
            `
        });
        
        // Process all sections to wrap tables for better page breaks
        sections.forEach(section => {
            section.content = wrapTables(section.content);
        });
        
        return sections;
    }
    
    /**
     * Extract relevant text content from HTML
     * @param {string} html - The HTML content
     * @returns {string} - Plain text extracted from HTML
     */
    extractTextFromHtml(html) {
        if (!html) return '';
        
        // Create a temporary div to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract text content
        return tempDiv.textContent || tempDiv.innerText || '';
    }
    
    /**
     * Format the protocol content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the protocol section
     */
    formatProtocolContent(formData) {
        // Get client's name
        const clientName = formData.firstName && formData.lastName
            ? `${formData.firstName} ${formData.lastName}`
            : "the client";

        let content = `
        <div class="protocol-content">
            <p class="protocol-description">
                An articulation evaluation was conducted to assess ${clientName}'s ability to produce speech
                sounds clearly and appropriately for their age. The purpose of the evaluation is to identify any
                speech sound errors that may affect ability to communicate effectively. Errors in articulation
                can significantly affect ability to be understood, academic performance, and social
                interactions. By understanding specific speech patterns, we can create a tailored intervention
                plan to improve overall communication skills.
            </p>`;

        // Add assessment language if specified
        if (formData.assessmentLanguage) {
            content += `<p><strong>Assessment Language:</strong> ${formData.assessmentLanguage}</p>`;
        }

        content += `
            <div class="components-list">
                <p>The evaluation included the following components:</p>
                <ul>`;

        // Check which components were included in the evaluation
        // We'll assume all sections were included if they aren't explicitly set to false
        const components = {
            backgroundInfo: formData.backgroundInfo !== false,
            oralMechanism: formData.oralMechanism !== false,
            speechSound: formData.speechSound !== false,
            speechSample: formData.speechSample !== false
        };

        // Add each component to the list
        if (components.backgroundInfo) {
            content += `<li>Collection of Relevant Background Information</li>`;
        }
        
        if (components.oralMechanism) {
            content += `<li>Oral Mechanism Examination</li>`;
        }
        
        if (components.speechSound) {
            content += `<li>Speech Sound Assessment</li>`;
        }
        
        if (components.speechSample) {
            content += `<li>Connected Speech Sample Analysis</li>`;
        }

        // Add any custom components
        if (formData.otherComponentText) {
            content += `<li>Other: ${formData.otherComponentText}</li>`;
        }

        content += `</ul></div></div>`;
        return content;
    }
    
    /**
     * Format the background information content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the background section
     */
    formatBackgroundContent(formData) {
        let content = '<div>';
        
let hasBackgroundInfo = false;
        
        // Helper function to get value from direct property or from backgroundInfo object
        const getValue = (key) => {
            return formData[key] || (formData.backgroundInfo && formData.backgroundInfo[key]) || null;
        }
        
        // Add referral source
        const referralSource = getValue('referralSource');
        if (referralSource) {
            content += `<p><strong>Referral Source:</strong> ${referralSource}</p>`;
            hasBackgroundInfo = true;
        }

        
        // Add referral reason
        const referralReason = getValue('referralReason');
        if (referralReason) {
            content += `<p><strong>Reason for Referral:</strong> ${referralReason}</p>`;
            hasBackgroundInfo = true;
        }
        
        // Handle medical history
        const medicalHistory = getValue('medicalHistory') || getValue('medicalHistoryNotes');
        if (medicalHistory) {
            content += `<p><strong>Medical History:</strong> ${medicalHistory}</p>`;
            hasBackgroundInfo = true;
        }
        
        // Handle developmental history
        const developmentalHistory = getValue('developmentalHistory') || getValue('developmentalHistoryNotes');
        if (developmentalHistory) {
            content += `<p><strong>Developmental History:</strong> ${developmentalHistory}</p>`;
            hasBackgroundInfo = true;
        }
        
        // Handle previous evaluations
        const previousEvaluations = getValue('previousEvaluations') || getValue('previousEvaluationsNotes');
        if (previousEvaluations) {
            content += `<p><strong>Previous Evaluations:</strong> ${previousEvaluations}</p>`;
            hasBackgroundInfo = true;
        }
        
        // Handle current services
        const currentServices = getValue('currentServices') || getValue('currentServicesNotes');
        if (currentServices) {
            content += `<p><strong>Current Services:</strong> ${currentServices}</p>`;
            hasBackgroundInfo = true;
        } else if (getValue('serviceHistory')) {
            content += `<p><strong>Service History:</strong> ${getValue('serviceHistory')}</p>`;
            hasBackgroundInfo = true;
        }

        // Include the language history if available
        const languageHistory = getValue('languageHistory');
        if (languageHistory) {
            content += `<p><strong>Language History:</strong> ${languageHistory}</p>`;
            hasBackgroundInfo = true;
        }

        // Log the background info for debugging
        console.log("Background info content:", content, "Has background info:", hasBackgroundInfo);

        if (!hasBackgroundInfo) {
            content += '<p>No significant background information reported.</p>';
        }

        content += '</div>';

        return content;
    }
    
    /**
     * Format the oral mechanism content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the oral mechanism section
     */
    formatOralMechanismContent(formData) {
        let content = '<div>';
        
        // First, include a standard introduction
        content += `<p>The oral mechanism examination was conducted to assess structural and functional characteristics of the articulators that may impact speech production.</p>`;
        
        // Variables for structure tables
        let hasStructureData = false;
        let structureContent = `
            <h4>Structure Assessment</h4>
            <table>
                <tr>
                    <th>Structure</th>
                    <th>Observations</th>
                </tr>
        `;
        
        // Define structures to check in the oralMechanism.structure object
        const structures = [
            { name: 'Face', field: 'face' },
            { name: 'Mandible/Maxilla', field: 'mandible' },
            { name: 'Teeth', field: 'teeth' },
            { name: 'Palatal', field: 'palatal' },
            { name: 'Lips', field: 'lips' }
        ];
        
        // Add rows for each structure
        structures.forEach(structure => {
            // Check if we have structured data
            let observation = '';
            let hasData = false;
            
            if (formData.oralMechanism && formData.oralMechanism.structure) {
                const wnl = formData.oralMechanism.structure[`${structure.field}WNL`];
                const concern = formData.oralMechanism.structure[`${structure.field}Concern`];
                
                if (wnl !== undefined || concern !== undefined) {
                    hasData = true;
                    hasStructureData = true;
                    if (wnl) observation = 'Within normal limits';
                    if (concern) observation = 'Area of concern';
                }
            }
            
            // Also check direct field values
            if (formData[structure.field]) {
                if (observation) observation += '; ';
                observation += formData[structure.field];
                hasData = true;
                hasStructureData = true;
            }
            
            if (hasData) {
                structureContent += `
                    <tr>
                        <td>${structure.name}</td>
                        <td>${observation}</td>
                    </tr>
                `;
            }
        });
        
        structureContent += '</table>';
        
        // Add structure notes if available
        if (formData.oralMechanism && formData.oralMechanism.structure && formData.oralMechanism.structure.structureNotes) {
            structureContent += `<p><strong>Structure Notes:</strong> ${formData.oralMechanism.structure.structureNotes}</p>`;
            hasStructureData = true;
        }
        
        if (hasStructureData) {
            content += structureContent;
        }
        
        // Handle function assessment
        let hasFunctionData = false;
        let functionContent = `
            <h4>Function Assessment</h4>
            <table>
                <tr>
                    <th>Function</th>
                    <th>Observations</th>
                </tr>
        `;
        
        // Define functions to check in the oralMechanism.function object
        const functions = [
            { name: 'Jaw Movement', field: 'jaw' },
            { name: 'Velopharyngeal Function', field: 'velopharyngeal' },
            { name: 'Phonation/Breath Support', field: 'phonation' },
            { name: 'Oral Reflexes', field: 'reflexes' },
            { name: 'Motor Speech Coordination', field: 'motor' }
        ];
        
        // Add rows for each function
        functions.forEach(func => {
            let observation = '';
            let hasData = false;
            
            if (formData.oralMechanism && formData.oralMechanism.function) {
                const wnl = formData.oralMechanism.function[`${func.field}WNL`];
                const concern = formData.oralMechanism.function[`${func.field}Concern`];
                
                if (wnl !== undefined || concern !== undefined) {
                    hasData = true;
                    hasFunctionData = true;
                    if (wnl) observation = 'Within normal limits';
                    if (concern) observation = 'Area of concern';
                }
            }
            
            // Also check direct field values
            if (formData[func.field]) {
                if (observation) observation += '; ';
                observation += formData[func.field];
                hasData = true;
                hasFunctionData = true;
            }
            
            if (hasData) {
                functionContent += `
                    <tr>
                        <td>${func.name}</td>
                        <td>${observation}</td>
                    </tr>
                `;
            }
        });
        
        functionContent += '</table>';
        
        // Add function notes if available
        if (formData.oralMechanism && formData.oralMechanism.function && formData.oralMechanism.function.functionNotes) {
            functionContent += `<p><strong>Function Notes:</strong> ${formData.oralMechanism.function.functionNotes}</p>`;
            hasFunctionData = true;
        }
        
        if (hasFunctionData) {
            content += functionContent;
        }
        
        // Add diadochokinetic rates if available
        if (formData.diadochokinetic) {
            content += `<p><strong>Diadochokinetic Rates:</strong> ${formData.diadochokinetic}</p>`;
        }
        
        // Include other fields that might be available
        if (formData.structureNotes) {
            content += `<p><strong>Structure Notes:</strong> ${formData.structureNotes}</p>`;
        }
        
        if (formData.functionNotes) {
            content += `<p><strong>Function Notes:</strong> ${formData.functionNotes}</p>`;
        }
        
        // Add overall notes if available
        if (formData.oralMechanism && formData.oralMechanism.overallNotes) {
            content += `<p><strong>Overall Assessment:</strong> ${formData.oralMechanism.overallNotes}</p>`;
        }

        content += '</div>';
        
        return content;
    }
    
    /**
     * Format the standardized assessment content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the standardized assessment section
     */
    formatStandardizedAssessmentContent(formData) {
        // If there's no assessment data, return a basic template
        if (!formData.standardizedAssessment && 
            !formData.assessmentResults && 
            !formData.ac_standard_score && 
            !formData.ec_standard_score && 
            !formData.tl_standard_score) {
            return `
                <div><p>The client was assessed using standardized articulation tests to evaluate speech sound production skills.</p></div>
            `;
        }
        
        let content = '<div>';
        
        if (typeof formData.standardizedAssessment === 'string' && formData.standardizedAssessment) {
            content += `<p>${formData.standardizedAssessment}</p>`;
        }
        
        if (formData.assessmentResults) {
            // Check if it's an array
            if (Array.isArray(formData.assessmentResults)) {
                content += '<table><tr><th>Assessment</th><th>Score</th><th>Interpretation</th></tr>';
                
                formData.assessmentResults.forEach(result => {
                    content += `
                        <tr>
                            <td>${result.name || ''}</td>
                            <td>${result.score || ''}</td>
                            <td>${result.interpretation || ''}</td>
                        </tr>
                    `;
                });
                
                content += '</table>';
            } else {
                // It's a string
                content += `<p>${formData.assessmentResults}</p>`;
            }
        } else if (typeof formData.standardizedAssessment === 'object' && formData.standardizedAssessment) {
            // Handle structured assessment data
            content += '<table><tr><th>Assessment</th><th>Standard Score</th><th>Severity</th></tr>';
            
            // Check for AC, EC, TL subtest data
            const subtests = {
                ac: { name: 'Auditory Comprehension', score: 'ac_standard_score', severity: 'ac_severity' },
                ec: { name: 'Expressive Communication', score: 'ec_standard_score', severity: 'ec_severity' },
                tl: { name: 'Total Language', score: 'tl_standard_score', severity: 'tl_severity' }
            };
            
            Object.entries(subtests).forEach(([key, subtest]) => {
                const score = formData[subtest.score] || (formData.standardizedAssessment[key] ? formData.standardizedAssessment[key].standardScore : null);
                
                // Skip this row if we don't have score data
                if (!score) return;
                
                const severity = formData[subtest.severity] || (formData.standardizedAssessment[key] ? formData.standardizedAssessment[key].severity : '');
                
                content += `
                    <tr>
                        <td>${subtest.name}</td>
                        <td>${score}</td>
                        <td>${severity || ''}</td>
                    </tr>
                `;
            });
            
            content += '</table>';

            // Include standardized assessment notes if available
            if (formData.standardizedAssessmentNotes) {
                content += `<p>${formData.standardizedAssessmentNotes}</p>`;
            } else if (formData.assessmentNotes) {
                content += `<p>${formData.assessmentNotes}</p>`;
            }
            
            content += `<p>Standard scores are based on a scale with a mean of 100 and a standard deviation of +/- 15.</p>`;
        }

        content += '</div>';
        
        return content;
    }
    
    /**
     * Format the speech sound content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the speech sound section
     */
    formatSpeechSoundContent(formData) {
        // If there's no speech sound data, return a basic template
        if (!formData.speechSoundIntro && 
            !formData.speechSoundErrors && 
            !formData.phonologicalProcesses && 
            (!formData.speechSound || Object.keys(formData.speechSound || {}).length === 0)) {
            return `
                <div><p>The client was assessed using standardized articulation tests and connected speech samples to evaluate speech sound production skills.</p></div>
            `;
        }
        
        let content = '<div>';
        
        // Add introduction text
        if (formData.speechSoundIntro) {
            content += `<p>${formData.speechSoundIntro}</p>`;
        } else {
            // Include the standard speech sound assessment text from the template
            content += `<p>Speech Sound Assessment: The ability to produce speech sounds was assessed throughout 
            the course of the evaluation in order to measure articulation of sounds and determine types of misarticulation. The Clinical Assessment of Articulation and Phonology - 2nd Edition (CAAP-2) was administered. Additionally, spontaneous speech was elicited both in words and connected speech. Data was collected and analyzed using the Age of Customary Consonant Production chart as recommended by The American Speech-Language-Hearing Association (ASHA). The acquisition of speech sounds is a developmental process and children often demonstrate "typical" errors and phonological patterns during this acquisition period. Developmentally appropriate error patterns were taken into consideration during assessment of speech sounds in order to differentiate typical errors from those that are not.</p>`;
        }
        
        // Process structured speech sound data if available
        if (formData.speechSound && formData.speechSound.articulation) {
            if (formData.speechSound.articulation.errorPatterns && 
                formData.speechSound.articulation.errorPatterns.length > 0) {
                
                content += `
                    <h4>Speech Sound Errors</h4>
                    <table>
                        <tr>
                            <th>Sound</th>
                            <th>Error Type</th>
                            <th>Position</th>
                            <th>Details</th>
                        </tr>
                `;
                
                formData.speechSound.articulation.errorPatterns.forEach(error => {
                    content += `
                        <tr>
                            <td>${error.sound || ''}</td>
                            <td>${error.substitution || ''}</td>
                            <td>${error.positions ? error.positions.join(', ') : ''}</td>
                            <td>${error.detail || ''}</td>
                        </tr>
                    `;
                });
                
                content += '</table>';
            }
        }
        
        // Always include the comprehensive sound assessment table, regardless of whether there's error data
        content += `
            <h4>Sound Assessment Table</h4>
            <table>
                <tr>
                    <th>Sound</th>
                    <th>Status</th>
                    <th>Position</th>
                    <th>Error Type</th>
                    <th>Notes</th>
                </tr>
        `;

        // Define all the sounds to include in the table
        const allSounds = [
            { symbol: '/p/', id: 'p' },
            { symbol: '/b/', id: 'b' },
            { symbol: '/t/', id: 't' },
            { symbol: '/d/', id: 'd' },
            { symbol: '/k/', id: 'k' },
            { symbol: '/g/', id: 'g' },
            { symbol: '/f/', id: 'f' },
            { symbol: '/v/', id: 'v' },
            { symbol: '/s/', id: 's' },
            { symbol: '/z/', id: 'z' },
            { symbol: '/sh/', id: 'sh' },
            { symbol: '/ch/', id: 'ch' },
            { symbol: '/j/', id: 'j' },
            { symbol: '/th/ (voiced)', id: 'th_voiced' },
            { symbol: '/th/ (voiceless)', id: 'th_voiceless' },
            { symbol: '/r/', id: 'r' },
            { symbol: '/l/', id: 'l' },
            { symbol: '/w/', id: 'w' },
            { symbol: '/y/', id: 'y' },
            { symbol: '/h/', id: 'h' },
            { symbol: '/m/', id: 'm' },
            { symbol: '/n/', id: 'n' },
            { symbol: '/ng/', id: 'ng' }
        ];
        
        // Go through each sound and add a row to the table
        allSounds.forEach(sound => {
            let status = 'Correct';
            let position = '';
            let errorType = '';
            let notes = '';

            // Check if this sound has error data in the newer format
            if (formData.speechSound?.articulation?.errorPatterns) {
                const errorPattern = formData.speechSound.articulation.errorPatterns.find(
                    error => error.sound === sound.symbol || error.sound === `/${sound.id}/`
                );
                
                if (errorPattern) {
                    status = 'Misarticulated';
                    position = errorPattern.positions ? errorPattern.positions.join(', ') : '';
                    errorType = errorPattern.substitution || '';
                    notes = errorPattern.detail || '';
                }
            }
            
            // Check if we have data in the older format (individual fields)
            const soundChecked = formData[`sound_${sound.id}`] === true || formData[`sound_${sound.id}_misarticulated`] === true;
            if (soundChecked) {
                status = 'Misarticulated';
                position = formData[`sound_${sound.id}_position`] || '';
                errorType = formData[`sound_${sound.id}_type`] || '';
                notes = formData[`sound_${sound.id}_detail`] || '';
            }
            
            content += `
                <tr>
                    <td>${sound.symbol}</td>
                    <td>${status}</td>
                    <td>${position}</td>
                    <td>${errorType}</td>
                    <td>${notes}</td>
                </tr>
            `;
        });
        
        content += '</table>';
            
        // Add intelligibility information if available
        if (formData.speechSound && formData.speechSound.intelligibility) {
            content += '<h4>Speech Intelligibility</h4>';
            content += '<p><strong>Intelligibility Assessment:</strong></p>';
            
            if (formData.speechSound.intelligibility.intelligibilityNotes) {
                content += `<p>${formData.speechSound.intelligibility.intelligibilityNotes}</p>`;
            }
        }
        
        // Legacy format - Add speech sound errors table if available
        if (formData.speechSoundErrors && Array.isArray(formData.speechSoundErrors)) {
            content += `
                <table>
                    <tr>
                        <th>Sound</th>
                        <th>Initial</th>
                        <th>Medial</th>
                        <th>Final</th>
                    </tr>
            `;
            
            formData.speechSoundErrors.forEach(error => {
                content += `
                    <tr>
                        <td>${error.sound || ''}</td>
                        <td>${error.initial || ''}</td>
                        <td>${error.medial || ''}</td>
                        <td>${error.final || ''}</td>
                    </tr>
                `;
            });
            
            content += '</table>';
        }
        
        // Add phonological processes if available
        if (formData.phonologicalProcesses) {
            content += `
                <p><strong>Phonological Processes:</strong> ${formData.phonologicalProcesses}</p>
            `;
        }

        // Include any additional notes from the speechSound object
        if (formData.speechSound?.overallNotes) {
            content += `<p>${formData.speechSound.overallNotes}</p>`;
        }
        
        // Include any additional notes not already covered
        if (formData.speechSoundNotes && !content.includes(formData.speechSoundNotes)) {
            content += `<p>${formData.speechSoundNotes}</p>`;
        }

        content += '</div>';
        
        return content;
    }
    
    /**
     * Format the speech sample content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the speech sample section
     */
    formatSpeechSampleContent(formData) {
        let content = '<div>';
        
        // Basic introduction text
        if (formData.speechSample) {
            content += `<p>${formData.speechSample}</p>`;
        } else if (formData.languageSample?.observations) {
            content += `<p>${formData.languageSample.observations}</p>`;
        } else {
            content += `
                <p>A speech sample was collected during spontaneous conversation, play-based activities, and 
                picture description tasks to assess articulation and intelligibility in connected speech. The 
                following observations were made:</p>
            `;
        }

        // 1. Sound Production Section
        content += `<h4>Sound Production</h4>`;
        
        // Create a list of sound production observations
        let soundObservations = [];
        
        if (formData.accurateProduction) {
            soundObservations.push('Accurate production of sounds observed.');
        }
        
        if (formData.substitutionErrors) {
            soundObservations.push('Substitution errors noted in conversation.');
        }
        
        if (formData.omissionErrors) {
            soundObservations.push('Omission of sounds observed in conversation.');
        }
        
        if (formData.distortionErrors) {
            soundObservations.push('Distortion of sounds noted in conversation.');
        }
        
        if (formData.additionErrors) {
            soundObservations.push('Addition of sounds observed in conversation.');
        }
        
        if (formData.otherSoundProduction && formData.otherSoundProductionText) {
            soundObservations.push(`Other: ${formData.otherSoundProductionText}`);
        }
        
        // If there are no specific observations, add a default
        if (soundObservations.length === 0) {
            content += `<p>Analysis of sound production in connected speech was conducted to identify any articulation errors.</p>`;
        } else {
            content += `<ul>`;
            soundObservations.forEach(observation => {
                content += `<li>${observation}</li>`;
            });
            content += `</ul>`;
        }

        // 2. Phonological Patterns Section
        content += `<h4>Phonological Patterns</h4>`;
        
        // Create a list of phonological patterns observed
        let phonologicalPatterns = [];
        
        if (formData.clusterReduction) {
            phonologicalPatterns.push('Cluster reduction');
        }
        
        if (formData.finalConsonantDeletion) {
            phonologicalPatterns.push('Final consonant deletion');
        }
        
        if (formData.weakSyllableDeletion) {
            phonologicalPatterns.push('Weak syllable deletion');
        }
        
        if (formData.frontingSounds) {
            phonologicalPatterns.push('Fronting of sounds');
        }
        
        if (formData.glidingLiquids) {
            phonologicalPatterns.push('Gliding of liquids');
        }
        
        if (formData.stopping) {
            phonologicalPatterns.push('Stopping');
        }
        
        if (formData.otherPattern && formData.otherPatternText) {
            phonologicalPatterns.push(`Other: ${formData.otherPatternText}`);
        }
         
        // If there are no specific patterns, add a default
        if (phonologicalPatterns.length === 0) {
            content += `<p>Analysis of phonological patterns in connected speech was conducted.</p>`;
        } else {
            content += `<p>The following phonological patterns were observed:</p>`;
            content += `<ul>`;
            phonologicalPatterns.forEach(pattern => {
                content += `<li>${pattern}</li>`;
            });
            content += `</ul>`;
        }
        
        // Add phonological notes if available
        if (formData.phonologicalNotes) {
            content += `<p>${formData.phonologicalNotes}</p>`;
        }
        
        // 3. Speech Intelligibility Section
        content += `<h4>Speech Intelligibility</h4>`;
        
        // Determine intelligibility for familiar listeners
        let familiarIntelligibility = 'Not assessed';
        if (formData.familiarHigh) {
            familiarIntelligibility = 'Highly intelligible (90–100%)';
        } else if (formData.familiarModerate) {
            familiarIntelligibility = 'Moderately intelligible (70–89%)';
        } else if (formData.familiarPoor) {
            familiarIntelligibility = 'Poor intelligibility (50–69%)';
        } else if (formData.familiarVeryPoor) {
            familiarIntelligibility = 'Very poor intelligibility (<50%)';
        }
        
        // Determine intelligibility for unfamiliar listeners
        let unfamiliarIntelligibility = 'Not assessed';
        if (formData.unfamiliarHigh) {
            unfamiliarIntelligibility = 'Highly intelligible (90–100%)';
        } else if (formData.unfamiliarModerate) {
            unfamiliarIntelligibility = 'Moderately intelligible (70–89%)';
        } else if (formData.unfamiliarPoor) {
            unfamiliarIntelligibility = 'Poor intelligibility (50–69%)';
        } else if (formData.unfamiliarVeryPoor) {
            unfamiliarIntelligibility = 'Very poor intelligibility (<50%)';
        }
        
        content += `
            <p><strong>Familiar Listeners:</strong> ${familiarIntelligibility}</p>
            <p><strong>Unfamiliar Listeners:</strong> ${unfamiliarIntelligibility}</p>
        `;
        
        // Add intelligibility notes if available
        if (formData.intelligibilityNotes) {
            content += `<p>${formData.intelligibilityNotes}</p>`;
        }
        
        // 4. Connected Speech Characteristics Section
        content += `<h4>Connected Speech Characteristics</h4>`;
        
        // Create a list of connected speech characteristics
        let speechCharacteristics = [];
        
        if (formData.speechOrganized) {
            speechCharacteristics.push('Speech is organized and fluent.');
        }
        
        if (formData.speechDisorganized) {
            speechCharacteristics.push('Disorganized speech noted (e.g., frequent pauses, hesitations).');
        }
        
        if (formData.speechRateNormal) {
            speechCharacteristics.push('Speech rate is within normal limits.');
        }
        
        if (formData.speechRateSlow) {
            speechCharacteristics.push('Speech rate is slow, impacting clarity.');
        }
        
        if (formData.speechRateFast) {
            speechCharacteristics.push('Speech rate is fast, impacting clarity.');
        }
        
        if (formData.selfCorrections) {
            speechCharacteristics.push('Self-corrections observed.');
        }
        
        if (formData.otherCharacteristic && formData.otherCharacteristicText) {
            speechCharacteristics.push(`Other: ${formData.otherCharacteristicText}`);
        }
        
        // If there are no specific characteristics, add a default
        if (speechCharacteristics.length === 0) {
            content += `<p>Analysis of connected speech characteristics was conducted.</p>`;
        } else {
            content += `<ul>`;
            speechCharacteristics.forEach(characteristic => {
                content += `<li>${characteristic}</li>`;
            });
            content += `</ul>`;
        }
           
        // Add characteristics notes if available
        if (formData.characteristicsNotes) {
            content += `<p>${formData.characteristicsNotes}</p>`;
        }
        
        // 5. Strengths Observed Section
        content += `<h4>Strengths Observed</h4>`;
        
        // Create a list of strengths observed
        let strengths = [];
        
        if (formData.varietySentences) {
            strengths.push('Variety of sentence structures used.');
        }
        
        if (formData.ageVocabulary) {
            strengths.push('Age-appropriate vocabulary observed.');
        }
        
        if (formData.selfCorrectEfforts) {
            strengths.push('Efforts to self-correct noted.');
        }
        
        if (formData.otherStrength && formData.otherStrengthText) {
            strengths.push(`Other: ${formData.otherStrengthText}`);
        }
        
        // If there are no specific strengths, add a default
        if (strengths.length === 0) {
            content += `<p>Assessment of communication strengths was conducted.</p>`;
        } else {
            content += `<ul>`;
            strengths.forEach(strength => {
                content += `<li>${strength}</li>`;
            });
            content += `</ul>`;
        }

        content += '</div>';
        
        return content;
    }
    
    /**
     * Format the clinical impressions content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the clinical impressions section
     */
    formatClinicalImpressionsContent(formData) {
        let content = '<div>';
        
        if (formData.clinicalImpressionsSummary) {
            // Use the clinical impressions summary from HTML if available
            // Clean up any excessive whitespace that might be causing formatting issues
            if (typeof formData.clinicalImpressionsSummary === 'string') {
                formData.clinicalImpressionsSummary = formData.clinicalImpressionsSummary.replace(/\s+/g, ' ').trim();
            }
            content += formData.clinicalImpressionsSummary;
        } else if (formData.clinicalImpressionsText) {
            // Use the clinical impressions text if available
            content += formData.clinicalImpressionsText;
        } else {
            // Check if summary data exists in various possible fields
            const summary = formData.summary || formData.clinicalSummary || formData.impressionsSummary;
            if (summary) {
                content += `<p>${summary}</p>`;
            }
            
            // Try to get it from the template engine if available
            try {
                if (window.templateEngine && typeof window.templateEngine.render === 'function') {
                    content += window.templateEngine.render('clinicalImpressions', {...formData, generateForPDF: true, naturalText: true});
                } else {
                    content += '<p>Based on the results of this evaluation, the client presents with articulation difficulties that impact speech intelligibility.</p>';
                }
            } catch (error) {
                console.error('Error rendering clinical impressions template:', error);
                content += '<p>Based on the results of this evaluation, the client presents with articulation difficulties that impact speech intelligibility.</p>';
                content += '<p>Prognosis for improvement is favorable with speech therapy intervention.</p>';
            }
        }
        
        // Ensure proper spacing and clean whitespace
        content = content.replace(/<p>\s*<\/p>/g, '');
        content = content.replace(/>\s+</g, '> <');

        content += '</div>';
        
        return content;
    }
    
    /**
     * Format the recommendations content
     * @param {Object} formData - The form data
     * @returns {string} - HTML content for the recommendations section
     */
    formatRecommendationsContent(formData) {
        // If there are no recommendations, return a default template
        if (!formData.recommendationsSummary && !formData.recommendations) {
            return this.getDefaultRecommendations();
        }
        
        let content = '<div>';
        
        if (formData.recommendationsSummary) {
            content += formData.recommendationsSummary;
        } else if (formData.recommendations) {
            // If recommendations exists as a string
            if (typeof formData.recommendations === 'string') {
                content += formData.recommendations;
            } else if (Array.isArray(formData.recommendations)) {
                content += '<ol>' + formData.recommendations.map(rec => `<li>${rec}</li>`).join('') + '</ol>';
            }
        } else {
            // Try to get it from the template engine if available
            try {
                if (window.templateEngine && typeof window.templateEngine.render === 'function') {
                    content += window.templateEngine.render('recommendations', {...formData, naturalText: true});
                } else {
                    content += `
                        <p>The following recommendations are made based on the results of this evaluation:</p>
                        <ol>
                            <li>Speech therapy services are recommended to address articulation errors.</li>
                            <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                            <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
                        </ol>
                    `;
                }
            } catch (error) {
                console.error('Error rendering recommendations template:', error);
                content += `
                    <p>The following recommendations are made based on the results of this evaluation:</p>
                    <ol>
                        <li>Speech therapy services are recommended to address articulation errors.</li>
                        <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                        <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
                    </ol>
                `;
            }
        }

        content += '</div>';
        
        return content;
    }
    
    /**
     * Get default recommendations content
     * @returns {string} - HTML content with default recommendations
     */
    getDefaultRecommendations() {
        let content = '<div>';
        
        content += `
            <p>The following recommendations are made based on the results of this evaluation:</p>
            <ol>
                <li>Speech therapy services are recommended to address articulation errors.</li>
                <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
            </ol>
        `;
        
        content += '</div>';
        
        return content;
    }
}

// Export both the class and a factory function
export { PDFGenerator };

export function createPDFGenerator() {
    return new PDFGenerator();
}
