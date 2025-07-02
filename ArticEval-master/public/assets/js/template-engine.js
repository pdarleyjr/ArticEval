// Simple template engine for form sections

class TemplateEngine {
    constructor() {
        this.templates = new Map();
        this.initializeTemplates();
    }

    // Initialize default templates
    initializeTemplates() {
        // Client Info template
        this.registerTemplate('clientInfo', (data) => {
            const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            const dob = this.formatDate(data.dateOfBirth);
            const age = this.formatAge(data.age);
            const evalDate = this.formatDate(data.evaluationDate);
            
            let info = `
                <div class="client-info-section avoid-break">
                    <p><strong>Client Name:</strong> ${this.escapeHTML(name)}</p>
                    ${dob ? `<p><strong>Date of Birth:</strong> ${dob}</p>` : ''}
                    ${age ? `<p><strong>Age:</strong> ${age}</p>` : ''}
                    ${evalDate ? `<p><strong>Evaluation Date:</strong> ${evalDate}</p>` : ''}
                    ${data.referralSource ? `<p><strong>Referral Source:</strong> ${this.escapeHTML(data.referralSource)}</p>` : ''}
                    ${data.evaluator ? `<p><strong>Evaluator:</strong> ${this.escapeHTML(data.evaluator)}</p>` : ''}
                </div>
                ${data.reasonForReferral ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2C5282; margin-bottom: 10px;">Reason for Referral</h3>
                    <p>${this.escapeHTML(data.reasonForReferral)}</p>
                </div>` : ''}
            `;
            return info;
        });

        // Clinical Impressions template
        this.registerTemplate('clinicalImpressions', (data) => {
            const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            const age = this.formatAge(data.age);
            
            // Determine which assessment components were used
            const assessmentComponents = [];
            if (data.standardizedAssessment) assessmentComponents.push('formal assessment');
            if (data.backgroundInfo) assessmentComponents.push('parent interview');
            if (data.speechSample || data.languageSample) assessmentComponents.push('clinical observation');
            if (data.oralMechanism) assessmentComponents.push('oral mechanism examination');
            if (data.speechSound) assessmentComponents.push('speech sound assessment');
            
            // Create a more specific introduction based on what was actually assessed
            let assessmentText = assessmentComponents.length > 0 
                ? assessmentComponents.join(', ').replace(/,([^,]*)$/, ' and$1')
                : 'formal and informal assessment';
            
            let impression = `Based on the results of ${assessmentText}, ${name}`;

            if (age) {
                impression += ` (${age})`;
            }

            impression += ' presents with ';

            let hasContent = false;
            // Add background info findings if available
            if (data.backgroundInfo) {
                impression += this.getBackgroundInfoSummary(data);
                hasContent = true;
            }

            // Add assessment findings
            if (data.standardizedAssessment) {
                impression += this.getStandardizedAssessmentSummary(data);
                hasContent = true;
            }
            
            // Add speech sound findings
            if (data.speechSound) {
                impression += this.getSpeechSoundSummary(data);
                hasContent = true;
            }

            // Add oral mechanism findings
            if (data.oralMechanism) {
                impression += this.getOralMechanismSummary(data);
                hasContent = true;
            }

            // Add articulation-specific information if available
            if (data.articulationInfo || data.articulationAnalysis) {
                impression += this.getArticulationAnalysisSummary(data);
                hasContent = true;
            }
            

            // If no specific findings were added, add a general statement
            if (!hasContent) {
                impression += 'speech and language skills that require further assessment. ';
            }

            // Add speech sample findings if available
            if (data.speechSample) {
                impression += this.getSpeechSampleSummary(data);
                hasContent = true;
            }

            // Add language sample findings if available
            if (data.languageSample) {
                impression += this.getLanguageSampleSummary(data);
                hasContent = true;
            }
            
            // Add insights from sample evaluations if available
            if (data.sampleInsights && data.sampleInsights.commonObservations && data.sampleInsights.commonObservations.length > 0) {
                impression += '\n\nComparison with similar cases suggests ';
                
                // Get a random observation from common observations
                const randomIndex = Math.floor(Math.random() * data.sampleInsights.commonObservations.length);
                const observation = data.sampleInsights.commonObservations[randomIndex];
                
                if (observation) {
                    impression += observation.toLowerCase() + '. ';
                }
            }

            // Add prognosis
            impression += '\n\nBased on these results and with appropriate intervention and family support, prognosis for improved communication skills is favorable.';
            
            // Add evidence-based prognosis if available
            if (data.prognosisEvidence) {
                impression += ' ' + data.prognosisEvidence;
            }
            
            impression += ' Regular attendance and participation in therapy sessions, along with consistent home practice, will be essential for optimal progress.';

            // Wrap each sentence in a div with avoid-break class
            let wrappedImpression;
            
            // If naturalText flag is set, don't wrap in divs for PDF generation
            if (data.naturalText) {
                // For natural text in PDF, just use paragraphs
                const paragraphs = impression.split(/\n\n/);
                wrappedImpression = paragraphs.map(para => `<p>${para.trim()}</p>`).join('');
            } else {
                // For editable preview, wrap each sentence in a div
                const sentences = impression.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
                wrappedImpression = sentences.map(sentence => `<div class="sentence avoid-break">${sentence.trim()}</div>`).join('');
            }

            return data.naturalText ? `<div class="natural-text">${wrappedImpression}</div>` : wrappedImpression;
        });

        // Recommendations template
        this.registerTemplate('recommendations', (data) => {
            let recommendations = 'Based on the information obtained through the assessment tools and parent interview, the following recommendations are made:\n\n';
            const recs = new Set();
            
            // Add recommendations based on which sections were filled out
            if (data.backgroundInfo) {
                recs.add('Continued monitoring of developmental milestones');
            }
            
            if (data.speechSound) {
                // Check for specific speech sound issues
                if (data.speechSound.articulation && data.speechSound.articulation.errorPatterns && 
                    data.speechSound.articulation.errorPatterns.length > 0) {
                    recs.add('Individual speech therapy focusing on sound production and phonological processes');
                    
                    // Add more specific recommendations based on error patterns
                    const errorPatterns = data.speechSound.articulation.errorPatterns;
                    if (errorPatterns.some(p => p.sound.includes('s'))) {
                        recs.add('Targeted intervention for sibilant sounds');
                    }
                    if (errorPatterns.some(p => p.sound.includes('r') || p.sound.includes('l'))) {
                        recs.add('Focused therapy on liquid sounds (r, l)');
                    }
                }
            }
            
            if (data.oralMechanism) {
                // Check for specific oral mechanism issues
                const structure = data.oralMechanism.structure || {};
                const functionData = data.oralMechanism.function || {};
                
                if (structure.mandibleConcern || structure.lipsConcern || 
                    functionData.jawConcern || functionData.motorConcern) {
                    recs.add('Oral motor exercises and activities to improve muscle strength and coordination');
                }
            }
            
            if (data.languageSample) {
                // Add language-specific recommendations if language sample was taken
                recs.add('Language stimulation activities to support expressive and receptive language development');
            }

            // Process protocol section which contains selected recommendations
            if (Array.isArray(data.protocol)) {
                if (data.protocol.includes('backgroundInfo')) {
                    recs.add('Continued monitoring of developmental milestones');
                }
                if (data.protocol.includes('speechSound')) {
                    recs.add('Individual speech therapy focusing on sound production and phonological processes');
                }

                if (data.protocol.includes('oralMechanism')) {
                    recs.add('Oral motor exercises and activities to improve muscle strength and coordination');
                }

                if (data.protocol.includes('otherComponent') && data.otherComponentText) {
                    recs.add(data.otherComponentText);
                }
            }

            // Add recommendations from similar cases if available
            if (data.sampleInsights && data.sampleInsights.commonRecommendations && 
                data.sampleInsights.commonRecommendations.length > 0) {
                
                // Add up to 2 recommendations from similar cases
                const commonRecs = data.sampleInsights.commonRecommendations;
                for (let i = 0; i < Math.min(2, commonRecs.length); i++) {
                    if (commonRecs[i] && typeof commonRecs[i] === 'string' && commonRecs[i].trim()) {
                        recs.add(commonRecs[i].trim());
                    }
                }
            }
            
            // Add a default recommendation if none were added
            if (recs.size === 0) {
                recs.add('Continued monitoring of speech and language development');
            }

            // Add recommendations based on standardized assessment
            if (data.standardizedAssessment) {
                const { tl } = data.standardizedAssessment;
                if (tl && tl.standardScore) {
                    if (tl.standardScore < 85) {
                        recs.add('Regular speech-language therapy sessions');
                        recs.add('Home practice program to reinforce therapy goals');
                        recs.add('Reevaluation in 6 months to monitor progress');
                    }
                }
            }

            if (data.referral && data.referralDetails && data.referralDetails.trim()) {
                recs.add(`Referral to: ${data.referralDetails || ''}`);
            }

            if (data.otherRecommendations && data.otherRecommendations.trim()) {
                recs.add(data.otherRecommendations);
            }

            // Format recommendations based on whether we need natural text or not
            if (data.naturalText) {
                // For natural text in PDF, use paragraphs
                return `<div class="natural-text">
                    <p>${recommendations}</p>
                    ${Array.from(recs).map(rec => `<p>• ${rec}</p>`).join('')}
                </div>`;
            } else {
                // For editable preview, wrap in avoid-break divs
                return `<div class="recommendations-section avoid-break">
                    ${recommendations}
                    ${Array.from(recs).map(rec => `<div class="recommendation-item avoid-break">• ${rec}</div>`).join('')}
                </div>`;
            }
        });

        // Oral Mechanism Summary template
        this.registerTemplate('oralMechanismSummary', (data) => this.getOralMechanismSummary(data));

        // Speech Sound Summary template
        this.registerTemplate('speechSoundSummary', (data) => this.getSpeechSoundSummary(data));
        
        // Articulation Analysis Summary template
        this.registerTemplate('articulationAnalysisSummary', (data) => this.getArticulationAnalysisSummary(data));
    }

    // New helper method for background info summary
    getBackgroundInfoSummary(data) {
        let summary = '';
        if (data.backgroundInfo) {
            const { developmentalHistory = '', medicalHistory = '', familyHistory = '' } = data.backgroundInfo;
            
            if (developmentalHistory) {
                summary += `developmental history ${developmentalHistory.toLowerCase()}`;
            }
            
            if (medicalHistory) {
                summary += summary ? ' and ' : '';
                summary += `medical history ${medicalHistory.toLowerCase()}`;
            }
            
            if (familyHistory) {
                summary += '. Family history includes ' + familyHistory.toLowerCase();
            }
            
            summary += '. ';
        }
        return summary;
    }

    // New helper method for speech sample summary
    getSpeechSampleSummary(data) {
        let summary = '';
        
        // Check for direct speech sample data
        if (data.speechSample && typeof data.speechSample.observations === 'string' && data.speechSample.observations.trim()) {
            summary += `\n\nDuring connected speech sample, ${data.speechSample.observations.toLowerCase().trim()}. `;
        }
        // Check for enhanced speech sample analysis
        else if (data.speechSampleAnalysis) {
            if (typeof data.speechSampleAnalysis.observations === 'string' && data.speechSampleAnalysis.observations.trim()) {
                summary += `\n\nDuring connected speech sample, ${data.speechSampleAnalysis.observations.toLowerCase().trim()}. `;
            }
            
            // Add information about common patterns if available
            if (data.speechSampleAnalysis.commonPatterns && data.speechSampleAnalysis.commonPatterns.length > 0) {
                summary += `\n\nThe following patterns were observed: ${data.speechSampleAnalysis.commonPatterns.join(', ')}. `;
            }
        }
        
        return summary;
    }

    // New helper method for language sample summary
    getLanguageSampleSummary(data) {
        let summary = '';
        
        // Check for direct language sample data
        if (data.languageSample && typeof data.languageSample.observations === 'string' && data.languageSample.observations.trim()) {
            summary += `\n\nLanguage sample analysis revealed ${data.languageSample.observations.toLowerCase().trim()}. `;
        }
        // Check for enhanced language sample analysis
        else if (data.languageSampleAnalysis) {
            if (typeof data.languageSampleAnalysis.observations === 'string' && data.languageSampleAnalysis.observations.trim()) {
                summary += `\n\nLanguage sample analysis revealed ${data.languageSampleAnalysis.observations.toLowerCase().trim()}. `;
            }
            
            // Add information about common features if available
            if (data.languageSampleAnalysis.commonFeatures && data.languageSampleAnalysis.commonFeatures.length > 0) {
                summary += `\n\nThe following language features were assessed: ${data.languageSampleAnalysis.commonFeatures.join(', ')}. `;
            }
        }
        
        return summary;
    }

    // New helper method for articulation analysis summary
    getArticulationAnalysisSummary(data) {
        let summary = '';
        
        // Add information from articulation analysis if available
        if (data.articulationAnalysis && data.articulationAnalysis.patterns && data.articulationAnalysis.patterns.length > 0) {
            summary += '\n\nAnalysis of articulation patterns revealed the presence of ';
            summary += data.articulationAnalysis.patterns.join(', ');
            summary += '. ';
            
            // Add implications if available
            if (data.articulationAnalysis.implications && data.articulationAnalysis.implications.length > 0) {
                summary += 'These patterns suggest ';
                summary += data.articulationAnalysis.implications.join(' and ');
                summary += '. ';
            }
        }
        
        // Add information from articulation info if available
        if (data.articulationInfo) {
            // Add information about standardized tests if relevant
            if (data.speechSound && data.articulationInfo.standardizedTests) {
                const tests = data.articulationInfo.standardizedTests;
                if (tests.length > 0) {
                    summary += `\n\nThe assessment utilized standardized measures including ${tests[0].name}, which ${tests[0].description} `;
                }
            }
            
            // Add information about phonological processes if relevant
            if (data.speechSound && data.articulationInfo.phonologicalProcesses) {
                summary += '\n\nIt is important to note that some of the observed phonological processes are developmentally appropriate, while others may require targeted intervention. ';
            }
        }
        
        return summary;
    }

    // Helper methods for generating specific parts of the summary
    getStandardizedAssessmentSummary(data) {
        let summary = '';
        if (data.standardizedAssessment && Object.keys(data.standardizedAssessment).length > 0) {
            const { ac, ec, tl } = data.standardizedAssessment;
            
            if (tl && tl.standardScore) {
                const score = tl.standardScore;
                if (score >= 85) {
                    summary += 'overall speech-language skills that are developing within normal limits';
                } else if (score >= 78) {
                    summary += 'mild delays in overall speech and language development';
                } else if (score >= 71) {
                    summary += 'moderate delays in overall speech and language development';
                } else {
                    summary += 'severe delays in overall speech and language development';
                }
                
                if (ac && ac.standardScore) {
                    summary += `. Auditory comprehension skills are in the ${ac.severity.toLowerCase()} range`;
                }
                
                if (ec && ec.standardScore) {
                    summary += `, and expressive communication skills are in the ${ec.severity.toLowerCase()} range`;
                }
                
                summary += '. ';
            } else {
                summary += 'speech-language skills that require further assessment. ';
            }
        }
        return summary;
    }

    getOralMechanismSummary(data) {
        let summary = '\n\nOral mechanism examination revealed: ';
        if (data.oralMechanism && (data.oralMechanism.structure || data.oralMechanism.function)) {
            // Use enhanced analysis if available, otherwise use raw data
            const oralMechData = data.oralMechanismAnalysis || data.oralMechanism;
            const structure = oralMechData.structure || {};
            const functionData = oralMechData.function || {};
            const overallNotes = oralMechData.overallNotes;

            summary += `\nStructure Assessment:\n`;
            if (Object.keys(structure).length > 0) {
                summary += `- Face: ${structure.faceWNL ? 'Within Normal Limits' : structure.faceConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Mandible: ${structure.mandibleWNL ? 'Within Normal Limits' : structure.mandibleConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Teeth: ${structure.teethWNL ? 'Within Normal Limits' : structure.teethConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Palatal: ${structure.palatalWNL ? 'Within Normal Limits' : structure.palatalConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Lips: ${structure.lipsWNL ? 'Within Normal Limits' : structure.lipsConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                
                if (structure.structureNotes) {
                    summary += `\nStructure Notes: ${structure.structureNotes}\n`;
                }
            }

            summary += `\nFunction Assessment:\n`;
            if (Object.keys(functionData).length > 0) {
                summary += `- Jaw Movement: ${functionData.jawWNL ? 'Within Normal Limits' : functionData.jawConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Velopharyngeal Function: ${functionData.velopharyngealWNL ? 'Within Normal Limits' : functionData.velopharyngealConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Phonation: ${functionData.phonationWNL ? 'Within Normal Limits' : functionData.phonationConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Oral Reflexes: ${functionData.reflexesWNL ? 'Within Normal Limits' : functionData.reflexesConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Motor Coordination: ${functionData.motorWNL ? 'Within Normal Limits' : functionData.motorConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                
                if (functionData.functionNotes) {
                    summary += `\nFunction Notes: ${functionData.functionNotes}\n`;
                }
            }
            
            if (overallNotes) {
                summary += `\nOverall Notes: ${overallNotes}\n`;
            }
        }
        return summary;
    }

    getSpeechSoundSummary(data) {
        let summary = '\n\nSpeech sound assessment revealed: ';
        if (data.speechSound && (data.speechSound.articulation || data.speechSound.intelligibility)) {
            // Use enhanced analysis if available, otherwise use raw data
            const speechSoundData = data.speechSoundAnalysis || data.speechSound;
            const articulation = speechSoundData.articulation;
            const intelligibility = speechSoundData.intelligibility || {};
            const overallNotes = speechSoundData.overallNotes;

            if (articulation && articulation.errorPatterns && articulation.errorPatterns.length) {
                summary += `\nError Patterns:\n`;
                articulation.errorPatterns.forEach(pattern => {
                    summary += `- Substitution of ${pattern.substitution} for ${pattern.sound} in ${pattern.positions.join(', ')} positions.\n`;
                });
            }

            if (articulation && articulation.developmentallyAppropriateErrors && articulation.developmentallyAppropriateErrors.length) {
                summary += `\nDevelopmentally Appropriate Errors (to monitor):\n`;
                articulation.developmentallyAppropriateErrors.forEach(error => {
                    summary += `- Substitution of ${error.substitution} for ${error.sound} (e.g., ${error.example})\n`;
                });
            }

            if (articulation && articulation.phonemeInventory && articulation.phonemeInventory.length) {
                summary += `\nPhoneme Inventory (partial):\n- ${articulation.phonemeInventory.join(', ')}\n`;
            }
            if (articulation && articulation.stimulability) {
                summary += `\nStimulability: ${articulation.stimulability}\n`;
            }
            if (articulation && articulation.consistency) {
                summary += `\nConsistency of Errors: ${articulation.consistency}\n`;
            }

            summary += `\nIntelligibility:\n`;
            if (Object.keys(intelligibility).length > 0) {
                summary += `- Familiar Listeners: ${intelligibility.familiarHigh ? 'High' : intelligibility.familiarModerate ? 'Moderate' : intelligibility.familiarPoor ? 'Poor' : intelligibility.familiarVeryPoor ? 'Very Poor' : 'Not assessed'}\n`;
                summary += `- Unfamiliar Listeners: ${intelligibility.unfamiliarHigh ? 'High' : intelligibility.unfamiliarModerate ? 'Moderate' : intelligibility.unfamiliarPoor ? 'Poor' : intelligibility.unfamiliarVeryPoor ? 'Very Poor' : 'Not assessed'}\n`;
                summary += intelligibility.intelligibilityNotes ? `\nNotes: ${intelligibility.intelligibilityNotes}\n` : '';
            }

            if (overallNotes) {
                summary += `\nOverall Notes: ${overallNotes}\n`;
            }
        }
        return summary;
    }


    // Register a template
    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    // Render a template with data
    render(name, data = {}) {
        const template = this.templates.get(name);
        if (!template) {
            throw new Error(`Template "${name}" not found`);
        }

        return template(data);
    }

    // Helper method to escape HTML
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Helper method to format dates
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    }

    // Helper method to format age
    formatAge(age) {
        if (!age) return '';

        // If age is already in the format "X years, Y months"
        if (typeof age === 'string' && age.includes('years')) {
            return age;
        }

        // If age is an object with years and months
        if (typeof age === 'object' && age !== null) {
            const years = age.years || 0;
            const months = age.months || 0;
            if (years === 0) {
                return `${months} month${months !== 1 ? 's' : ''} old`;
            }
            if (months === 0) {
                return `${years} year${years !== 1 ? 's' : ''} old`;
            }
            return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`;
        }

        // If age is a number (assumed to be years)
        const years = parseInt(age);
        if (!isNaN(years)) {
            return `${years} year${years !== 1 ? 's' : ''} old`;
        }

        return '';
    }

    // Generate complete summary
    generateSummary(formData) {
        try {
            // Generate clinical impressions (with naturalText flag for PDF)
            const impressions = this.render('clinicalImpressions', {...formData, naturalText: formData.generateForPDF});

            // Generate recommendations (with naturalText flag for PDF)
            const recommendations = this.render('recommendations', {...formData, naturalText: formData.generateForPDF});

            // Combine sections
            return `<div class="summary-container">
                ${impressions}
                ${recommendations}
            </div>`;
        } catch (error) {
            console.error('Error generating summary:', error);
            return 'Error generating summary. Please try again.';
        }
    }
}

// Create and export singleton instance
export const templateEngine = new TemplateEngine();