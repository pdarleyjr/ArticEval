// Advanced template-based summary generator with IndexedDB integration

/**
 * @typedef {Object} FormData
 */

// Initialize IndexedDB
let db;
const dbName = 'evaluationDB';
const dbVersion = 2; // Increment database version

// Initialize IndexedDB database
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('samples')) {
                db.createObjectStore('samples', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Template sections based on Ayla's evaluation model
const templateSections = {
    introduction: {
        base: (data) => `${data.name}, a ${data.age} ${data.gender === 'female' ? 'female' : 'male'} was seen for an initial speech-language evaluation at ${data.place} on ${data.date}. ${data.name} currently attends ${data.school || '[School]'} and is in ${data.grade || 'a Pre-K'} classroom.`,
        screening: (data) => data.screening ? ` The evaluation was scheduled following a speech-language screening conducted on ${data.screeningDate} with ${data.organization}. Results from the screening indicated a need for further evaluation in order to obtain additional information in the areas of ${data.areas.join(' and ')}.` : ''
    },

    assessment: {
        intro: `The Preschool Language Scale Edition - 5th Edition (PLS-5) - a standardized assessment of receptive and expressive language skills was administered in order to assess overall language skills. The PLS-5 is designed for children from birth through seven years, eleven months of age. It evaluates all aspects of an individual's oral language and language comprehension through the use of pictures, manipulatives and observation. The test is comprised of two subscales, auditory comprehension and expressive communication. These subscales are used to evaluate how much language a child understands and how well they communicate with others.`,

        scoreInterpretation: `Standard scores are based on a scale with a mean of 100 and a standard deviation of +/- 15. The following interpretation of standard scores is applicable:

Above 115: Above Average
85-115: Average/Within Normal Limits
78-84: Marginal/Below Average/Mild
71-77: Low Range/Moderate
70-50: Very low range/Severe
50 and below: Profound`,

        results: (data) => {
            const { ac_score, ac_interval, ac_percentile, ac_age_equiv,
                   ec_score, ec_interval, ec_percentile, ec_age_equiv,
                   tl_score, tl_interval, tl_percentile, tl_age_equiv } = data;

            return `
Auditory Comprehension - On the receptive portion of the PLS-5, ${data.name} obtained a standard score of ${ac_score}, yielding an age equivalent of ${ac_age_equiv}. Standard score is ${getScoreDescription(ac_score, data.age)} and age equivalent is ${getAgeEquivDescription(ac_age_equiv, data.age)}. This standard score and age equivalent yielded receptive language skills that are ${getSeverityDescription(ac_score)}.

Expressive Communication - On the expressive portion of the PLS-5, ${data.name} obtained a standard score of ${ec_score}, yielding an age equivalent of ${ec_age_equiv}. Standard score is ${getScoreDescription(ec_score, data.age)} and age equivalent is ${getAgeEquivDescription(ec_age_equiv, data.age)}. This standard score and age equivalent yielded expressive language skills that are ${getSeverityDescription(ec_score)}.

Total Language - ${data.name}'s total language scores revealed a standard score of ${tl_score}, and an age equivalent of ${tl_age_equiv}.`;
        }
    },

    strengths: {
        receptive: (strengths, data) => strengths.length > 0 ?
            `${data.name} demonstrated relative strength with the following receptive language tasks:\n${strengths.map(s => `• ${s}`).join('\n')}` : '',

        expressive: (strengths, data) => strengths.length > 0 ?
            `${data.name} demonstrated relative strength with the following expressive language tasks:\n${strengths.map(s => `• ${s}`).join('\n')}` : ''
    },

    difficulties: (difficulties, data) => difficulties.length > 0 ?
        `However, ${data.name} demonstrated difficulty with the following tasks expected of a child their age:\n${difficulties.map(d => `• ${d}`).join('\n')}` : '',

    behavioral: {
        base: (data) => {
            const observations = [];
            if (data.classroom_transition) observations.push('left classroom with clinicians independently');
            if (data.name_response) observations.push('demonstrated appropriate response to name');
            if (data.joint_attention) observations.push('joint attention');
            if (data.eye_contact) observations.push('eye contact');
            if (data.communicative_intent) observations.push('communicative intent');

            return observations.length > 0 ?
                `${data.name}, ${observations.join(', ')}. ${getPlaySkillsDescription(data)}` : '';
        },

        attention: (data) => data.attention ?
            `${data.name} demonstrated appropriate attention to tasks. Throughout the course of the evaluation, ${data.name} was able to perform all tasks and interacted well with the clinician.` : ''
    },

    oralMechanism: { // Simplified - delegate summary generation to template-engine.js
        structure: (data) => data.oralMechanism.structure.notes || '',
        function: (data) => data.oralMechanism.function.notes || ''
    },

    speechSound: { // Simplified - delegate summary generation to template-engine.js
        production: (data) => data.speechSound.productionNotes || '',
        intelligibility: (data) => {
            const familiar = getFamiliarIntelligibility(data);
            const unfamiliar = getUnfamiliarIntelligibility(data);
            return `${data.name}'s speech in spontaneous conversation was judged to be ${familiar} to familiar listeners and ${unfamiliar} to unfamiliar listeners.`;
        }
    },

    languageSample: {
        intro: (data) => `A speech-language sample was obtained in order to evaluate spontaneous speech and obtain more information about ${data.name}'s language skills in a less structured environment while playing with toys that were in the treatment room. A language sample can help identify the types of language behaviors in a child's repertoire and provides an enhanced overview of language development.`,
        structure: (data) => data.languageStructure ?
            `${data.name}'s language structure consisted of ${data.languageStructure}` : '',
        content: (data) => data.languageContent ?
            `${data.name}'s language content consisted of ${data.languageContent}` : '',
        social: (data) => data.socialLanguage ?
            `Social language use consisted of ${data.socialLanguage}` : ''
    },

    clinicalImpressions: (data) => {
        const score = parseInt(data.tl_standard_score);
        const severity = getSeverityLevel(score);

        return `Based on the results of formal and informal assessment, as well as parent interview and clinical observation, ${data.name}, a ${data.age} ${data.gender === 'female' ? 'female' : 'male'} presents with ${getOverallImpression(severity, score)}. ${getAgeConsideration(data)} ${getPrognosis()}

Based on the results from this evaluation, family support, and adherence to recommendations that follow, prognosis for improvement is favorable.`;
    }
};

// Helper functions (keeping these as they are likely used elsewhere)
function getSeverityLevel(score) {
    if (score >= 85) return 'withinNormalLimits';
    if (score >= 78) return 'mildDelay';
    if (score >= 71) return 'moderateDelay';
    return 'severeDelay';
}

function getScoreDescription(score, age) {
    if (score >= 100) return 'within the mean';
    if (score >= 85) return 'slightly below the mean';
    if (score >= 78) return 'below the mean';
    return 'significantly below the mean';
}

function getAgeEquivDescription(ageEquiv, actualAge) {
    if (!ageEquiv) {
        return 'data not available';
    } else {
        const [years, months] = ageEquiv.split('-').map(Number);
        const actualMonths = actualAge.years * 12 + actualAge.months;
        const equivMonths = years * 12 + months;
        const diff = actualMonths - equivMonths;

        if (diff <= 1) return 'consistent with chronological age';
        if (diff <= 3) return `${diff} months below chronological age`;
        return 'significantly below chronological age';
    }
}

function getSeverityDescription(score) {
    if (score >= 85) return 'grossly within normal limits';
    if (score >= 78) return 'mildly delayed';
    if (score >= 71) return 'moderately delayed';
    return 'severely delayed';
}

function getOverallImpression(severity, score) {
    switch(severity) {
        case 'withinNormalLimits':
            return 'speech-language skills that are developing grossly within normal limits';
        case 'mildDelay':
            return 'mild delays in speech and language development';
        case 'moderateDelay':
            return 'moderate delays in speech and language development';
        case 'severeDelay':
            return 'severe delays in speech and language development';
    }
}

function getAgeConsideration(data) {
    if (data.age.years < 4) {
        return 'It is important to note that the younger a child is assessed, the less predictive test results are of later performance. Therefore, longer-term impressions about development potential based on these test results cannot be made at this time.';
    }
    return '';
}

function getPrognosis() {
    return 'Based on these results and with appropriate intervention and family support, prognosis for improved communication skills is favorable.';
}

// Generate complete evaluation summary with AI integration
async function generateEvaluationSummary(formData, useAI = true) {
    try {
        // Try AI-powered summary generation first
        if (useAI) {
            const aiSummary = await generateAISummary(formData);
            if (aiSummary && aiSummary.success) {
                console.log('AI summary generated successfully');
                // Store AI summary in IndexedDB for future reference
                const data = formatFormData(formData);
                await storeSummary(data, { ai: true }, aiSummary.summary);
                return aiSummary.summary;
            } else {
                console.warn('AI summary generation failed, falling back to templates:', aiSummary?.error);
            }
        }

        // Fallback to local template generation
        console.log('Using local template generation');
        const data = formatFormData(formData);
        const sections = {
            introduction: templateSections.introduction.base(data) +
                         templateSections.introduction.screening(data),

            assessment: templateSections.assessment.intro + '\n\n' +
                      templateSections.assessment.scoreInterpretation + '\n\n' +
                      templateSections.assessment.results(data),

            strengths: templateSections.strengths.receptive(data.receptiveStrengths, data) + '\n\n' +
                      templateSections.strengths.expressive(data.expressiveStrengths, data),

            difficulties: templateSections.difficulties(data.difficulties, data),

            behavioral: templateSections.behavioral.base(data) + '\n' +
                      templateSections.behavioral.attention(data),

            oralMechanism: templateSections.oralMechanism.structure(data) + '\n' +
                           templateSections.oralMechanism.function(data),

            speechSound: templateSections.speechSound.production(data) + '\n' +
                         templateSections.speechSound.intelligibility(data),

            languageSample: templateSections.languageSample.intro(data) + '\n\n' +
                           templateSections.languageSample.structure(data) + '\n' +
                            templateSections.languageSample.content(data) + '\n' +
                           templateSections.languageSample.social(data),

            clinicalImpressions: templateSections.clinicalImpressions(data)
        };

        // Use templateEngine for enhanced summaries
        if (window.app?.templateEngine) {
            sections.oralMechanism = window.app.templateEngine.render('oralMechanismSummary', data);
            sections.speechSound = window.app.templateEngine.render('speechSoundSummary', data);
        }

        const summary = Object.values(sections).join('\n\n');

        // Store in IndexedDB for future reference
        await storeSummary(data, sections, summary);

        return summary;
    } catch (error) {
        console.error('Error generating evaluation summary:', error);
        return 'Error generating evaluation summary. Please try again.';
    }
}

// Generate AI-powered clinical summary using Cloudflare Workers AI
async function generateAISummary(formData) {
    try {
        // Get authentication token
        const token = getAuthToken();
        if (!token) {
            console.warn('No authentication token available for AI summary');
            return { success: false, error: 'No authentication token' };
        }

        // Prepare the request
        const response = await fetch('/api/ai/summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                formData: formData,
                summaryType: 'comprehensive',
                includeRecommendations: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('AI summary request failed:', response.status, errorData);
            return {
                success: false,
                error: `HTTP ${response.status}: ${errorData.message || 'Unknown error'}`
            };
        }

        const result = await response.json();
        
        if (result.success && result.data?.summary) {
            return {
                success: true,
                summary: result.data.summary,
                metadata: result.data.metadata
            };
        } else {
            console.error('AI summary response invalid:', result);
            return {
                success: false,
                error: result.message || 'Invalid AI response format'
            };
        }

    } catch (error) {
        console.error('Error calling AI summary API:', error);
        return {
            success: false,
            error: `Network error: ${error.message}`
        };
    }
}

// Get authentication token from localStorage or session storage
function getAuthToken() {
    // Try localStorage first
    let token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    // Try sessionStorage as backup
    if (!token) {
        token = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
    }
    
    // Try cookies as last resort
    if (!token) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'authToken' || name === 'token') {
                token = value;
                break;
            }
        }
    }
    
    return token;
}

// Refine AI summary based on clinician feedback
async function refineAISummary(summaryId, feedback, refinementRequest) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        const response = await fetch('/api/ai/summary', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                summaryId: summaryId,
                feedback: feedback,
                refinementRequest: refinementRequest
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Error refining AI summary:', error);
        throw error;
    }
}

// Store summary in IndexedDB (no changes needed here)
async function storeSummary(data, sections, fullSummary) {
    try {
        const transaction = db.transaction(['samples'], 'readwrite');
        const store = transaction.objectStore('samples');

        await store.add({
            data,
            sections,
            fullSummary,
            score: parseInt(data.tl_standard_score),
            severity: getSeverityLevel(parseInt(data.tl_standard_score)),
            dateCreated: new Date()
        });
    } catch (error) {
        console.error('Error storing summary:', error);
    }
}


// Format form data for template use (needs to be updated to match new structure)
function formatFormData(formData) {
    return {
        name: `${formData.firstName} ${formData.lastName}`,
        age: formData.age,
        gender: formData.gender || 'male',
        place: formData.placeOfEvaluation,
        date: new Date(formData.evaluationDate).toLocaleDateString(),
        school: formData.school,
        grade: formData.grade,
        screening: formData.screening === 'true',
        screeningDate: formData.screeningDate,
        organization: formData.organization,
        areas: formData.evaluationAreas || ['articulation', 'language'],

        // Assessment scores
        ac_score: formData.ac_standard_score,
        ac_interval: formData.ac_confidence_interval,
        ac_percentile: formData.ac_percentile,
        ac_age_equiv: formData.ac_age_equivalent,

        ec_score: formData.ec_standard_score,
        ec_interval: formData.ec_confidence_interval,
        ec_percentile: formData.ec_percentile,
        ec_age_equiv: formData.ec_age_equivalent,

        tl_score: formData.tl_standard_score,
        tl_interval: formData.tl_confidence_interval,
        tl_percentile: formData.tl_percentile,
        tl_age_equiv: formData.tl_age_equivalent,

        // Strengths and difficulties
        receptiveStrengths: getCheckedItems(formData, 'strength_'),
        expressiveStrengths: getCheckedItems(formData, 'expressive_strength_'),
        difficulties: getCheckedItems(formData, 'difficulty_'),

        // Behavioral observations
        classroom_transition: formData.classroom_transition === 'true',
        name_response: formData.name_response === 'true',
        joint_attention: formData.joint_attention === 'true',
        eye_contact: formData.eye_contact === 'true',
        communicative_intent: formData.communicative_intent === 'true',
        attention: formData.attention === 'true',

        // Oral mechanism - needs to be updated to structured format
        oralMechanism: {
            structure: {
 // Structure data
                face: formData.faceStructure,
                mandibleMaxilla: formData.mandibleStructure,
                teeth: formData.teethStructure,
                palatal: formData.palatalStructure,
                lips: formData.lipsStructure,
                notes: formData.structureNotes
            },
            function: {
 // Function data
                jaw: formData.jawFunction,
                velopharyngeal: formData.velopharyngealFunction,
                phonationBreathSupport: formData.phonationFunction,
                oralReflexes: formData.oralReflexes,
                motorSpeechCoordination: formData.motorCoordination,
                notes: formData.functionNotes
            },
            overallNotes: formData.oralMechanismOverallNotes
        },


        // Speech sound production - needs to be updated to structured format
        speechSound: {
            articulation: { // Articulation data
                errorPatterns: [ // Example - needs to be dynamically generated from table
                    formData.sound_p_misarticulated ? { sound: '/p/', substitution: formData.sound_p_type, positions: [formData.sound_p_position], detail: formData.sound_p_detail } : null,
                    formData.sound_t_misarticulated ? { sound: '/t/', substitution: formData.sound_t_type, positions: [formData.sound_t_position], detail: formData.sound_t_detail } : null,
                    formData.sound_k_misarticulated ? { sound: '/k/', substitution: formData.sound_k_type, positions: [formData.sound_k_position], detail: formData.sound_k_detail } : null,
                    formData.sound_b_misarticulated ? { sound: '/b/', substitution: formData.sound_b_type, positions: [formData.sound_b_position], detail: formData.sound_b_detail } : null,
                    formData.sound_m_misarticulated ? { sound: '/m/', substitution: formData.sound_m_type, positions: [formData.sound_m_position], detail: formData.sound_m_detail } : null,
                    formData.sound_n_misarticulated ? { sound: '/n/', substitution: formData.sound_n_type, positions: [formData.sound_n_position], detail: formData.sound_n_detail } : null,
                    formData.sound_g_misarticulated ? { sound: '/g/', substitution: formData.sound_g_type, positions: [formData.sound_g_position], detail: formData.sound_g_detail } : null,
                    formData.sound_h_misarticulated ? { sound: '/h/', substitution: formData.sound_h_type, positions: [formData.sound_h_position], detail: formData.sound_h_detail } : null,
                    formData.sound_w_misarticulated ? { sound: '/w/', substitution: formData.sound_w_type, positions: [formData.sound_w_position], detail: formData.sound_w_detail } : null,
                    formData.sound_j_misarticulated ? { sound: '/j/', substitution: formData.sound_j_type, positions: [formData.sound_j_position], detail: formData.sound_j_detail } : null
                  ].filter(Boolean), // Filter out null entries
                developmentallyAppropriateErrors: [],
 // Not collected in form
                phonemeInventory: [],
 // Not collected in form
                stimulability: '',
 // Not collected in form
                consistency: ''
 // Not collected in form
            },
            intelligibilityNotes: formData.intelligibilityNotes, // Placeholder - needs restructuring
            intelligibility: { // Intelligibility data
                familiarListeners: '',
                unfamiliarListeners: '',
                connectedSpeech: ''
            },
            overallNotes: formData.speechSoundOverallNotes // Placeholder - new field?
        }
    };
}

// Get checked items from form data (no changes needed)
function getCheckedItems(formData, prefix) {
    return Object.entries(formData)
        .filter(([key, value]) => key.startsWith(prefix) && value === true)
        .map(([key]) => key.replace(prefix, ''));
}

// Initialize database and set up event listeners (no changes needed)
document.addEventListener('DOMContentLoaded', function() {
    try {
        initDB().then(() => {
            ('Database initialized');
        
            const button = document.getElementById('generateReport');
            if (button) {
                button.onclick = handleReportGeneration;
            }
        }).catch(error => {
            console.error('Error initializing summarizer:', error);
        });
    } catch (error) {
        console.error('Error initializing summarizer:', error);
    }
});

/**
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function handleReportGeneration(event) {
    event.preventDefault();

    try {
        // Get form data
        const formHandler = window.app && window.app.formHandler;
        const formData = formHandler ? formHandler.collectFormData() : {};

        // Generate summary
        const summary = await generateEvaluationSummary(formData);

        // Update clinical impressions textarea
        const impressionsField = document.getElementById('clinicalImpressionsText');
        if (impressionsField) {
            impressionsField.value = summary;
            impressionsField.dispatchEvent(new Event('input'));
        }
    } catch (error) {
        console.error('Error handling report generation:', error);
        alert('Error generating report. Please try again.');
    }
}

// Helper functions (assuming these will be defined elsewhere or are placeholders)
/**
 * Determines speech intelligibility rating for familiar listeners
 * @param {Object} data - The evaluation data object
 * @returns {string} Intelligibility rating (e.g., 'Fair', 'Good', 'Poor')
 */
function getFamiliarIntelligibility(data) {
    return data.intelligibility?.familiarListeners || 'Fair';
}

/**
 * Determines speech intelligibility rating for unfamiliar listeners
 * @param {Object} data - The evaluation data object
 * @returns {string} Intelligibility rating (e.g., 'Fair', 'Good', 'Poor')
 */
function getUnfamiliarIntelligibility(data) {
    return data.intelligibility?.unfamiliarListeners || 'Poor';
}

/**
 * Generates a description of the patient's play skills
 * @param {Object} data - The evaluation data object
 * @returns {string} Description of play skills or empty string if no data
 */
function getPlaySkillsDescription(data) {
    if (!data.playSkills) return '';
    return `${data.name} demonstrated age-appropriate play skills during the evaluation.`;
}

export default generateEvaluationSummary;
