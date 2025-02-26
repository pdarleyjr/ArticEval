// Simple summary generator for articulation evaluations
import { dbManager } from './db-utils.js';
import { templateEngine } from './template-engine.js';

export async function generateSummary(formData) {
    try {
        // Load sample evaluations for comparison
        let sampleEvaluations = [];
        try {
            // Try to find similar cases first for better relevance
            sampleEvaluations = await dbManager.findSimilarCases(formData, 10);
            
            // If not enough similar cases, get all evaluations
            if (sampleEvaluations.length < 3) {
                sampleEvaluations = await dbManager.getAllEvaluations();
            }
            
            console.log(`Found ${sampleEvaluations.length} sample evaluations for comparison`);
        } catch (err) {
            console.warn('Could not load sample evaluations, using empty set:', err);
        }

        if (!formData || typeof formData !== 'object' || !formData.firstName) {
            console.error('Invalid or incomplete form data:', formData);
            throw new Error('Invalid form data provided');
        }

        // Enhance form data with sample evaluation insights
        let enhancedData = await enhanceWithSampleData(formData, sampleEvaluations);
        
        // Further enhance with articulation evaluation information
        enhancedData = await enhanceWithArticulationInfo(enhancedData);
        
        // Ensure all utilized sections are included
        enhancedData = ensureAllSectionsIncluded(enhancedData);

        // Check if we're generating for the PDF or just for the clinical impressions section
        const isForPDF = enhancedData.generateForPDF === true;

        
// Check if we already have clinical impressions text
        if (enhancedData.clinicalImpressionsText && !isForPDF) {
            // If we have existing clinical impressions text and we're not generating for PDF,
            // return it directly instead of generating a new one
            return enhancedData.clinicalImpressionsText;
        }

        // Generate summary using template engine
        let summary = '';
        summary += templateEngine.render('clinicalImpressions', enhancedData);

        
        
        // Only include recommendations if this is for the PDF
        if (isForPDF) {
            summary += '\n\n';
            summary += templateEngine.render('recommendations', enhancedData);
        }
        
        return summary.trim();
    } catch (error) {
        console.error('Error generating summary:', error);
        console.error('Error stack:', error.stack);
        return `Error generating summary: ${error.message}. Please try again.`;
    }
}

// Ensure all sections that have been filled out are included in the summary
function ensureAllSectionsIncluded(formData) {
    const enhancedData = { ...formData };
    
    // Check for sections that have data but might not be explicitly included in the summary
    const sectionChecks = [
        { key: 'speechSample', check: data => data.speechSample && typeof data.speechSample === 'object' },
        { key: 'languageSample', check: data => data.languageSample && typeof data.languageSample === 'object' },
        { key: 'oralMechanism', check: data => data.oralMechanism && typeof data.oralMechanism === 'object' },
        { key: 'speechSound', check: data => data.speechSound && typeof data.speechSound === 'object' },
        { key: 'backgroundInfo', check: data => data.backgroundInfo && typeof data.backgroundInfo === 'object' },
        { key: 'standardizedAssessment', check: data => data.standardizedAssessment && typeof data.standardizedAssessment === 'object' }
    ];
    
    // For each section, ensure it's properly structured for the template engine
    sectionChecks.forEach(({ key, check }) => {
        if (check(formData) && !enhancedData[`${key}Analysis`]) {
            console.log(`Ensuring section ${key} is included in summary`);
            
            // Create a basic analysis object if one doesn't exist
            switch(key) {
                case 'speechSample':
                    enhancedData.speechSampleAnalysis = {
                        observations: formData.speechSample.observations,
                        analyzed: true
                    };
                    break;
                case 'languageSample':
                    enhancedData.languageSampleAnalysis = {
                        observations: formData.languageSample.observations,
                        analyzed: true
                    };
                    break;
                case 'oralMechanism':
                    if (!enhancedData.oralMechanismAnalysis) {
                        enhancedData.oralMechanismAnalysis = { ...formData.oralMechanism, analyzed: true };
                    }
                    break;
                case 'speechSound':
                    if (!enhancedData.speechSoundAnalysis) {
                        enhancedData.speechSoundAnalysis = { ...formData.speechSound, analyzed: true };
                    }
                    break;
                case 'backgroundInfo':
                    if (!enhancedData.backgroundInfoAnalysis) {
                        enhancedData.backgroundInfoAnalysis = { ...formData.backgroundInfo, analyzed: true };
                    }
                    break;
                case 'standardizedAssessment':
                    // Already handled by the template engine
                    break;
            }
        }
    });
    
    return enhancedData;
}

// Enhance data with articulation evaluation information
async function enhanceWithArticulationInfo(formData) {
    try {
        // Get articulation evaluation reference data from the database
        const articulationInfo = await dbManager.getEvaluation('articulation_evaluation_info').catch(() => null);
        
        if (articulationInfo && articulationInfo.content) {
            // Add articulation evaluation information to the form data
            return {
                ...formData,
                articulationInfo: {
                    sections: articulationInfo.content.sections,
                    standardizedTests: articulationInfo.content.standardizedTests,
                    techniques: articulationInfo.content.techniques,
                    phonologicalProcesses: articulationInfo.content.phonologicalProcesses,
                    clinicalImpressionEnhancements: articulationInfo.content.clinicalImpressionEnhancements
                }
            };
        }
        return formData;
    } catch (error) {
        console.error('Error enhancing with articulation info:', error);
        return formData;
    }
}

async function enhanceWithSampleData(formData, sampleEvaluations) {
    const enhancedData = { ...formData };

    if (sampleEvaluations && sampleEvaluations.length > 0) {
        const similarCases = findSimilarCases(formData, sampleEvaluations);
        enhancedData.similarCases = similarCases;
        enhancedData.backgroundInfo = enhanceBackgroundInfo(formData, similarCases);
        enhancedData.commonPatterns = extractCommonPatterns(similarCases);
        enhancedData.scoreAnalysis = analyzeScores(formData, sampleEvaluations);
        enhancedData.oralMechanismAnalysis = analyzeOralMechanism(formData, similarCases);
        enhancedData.speechSoundAnalysis = analyzeSpeechSound(formData, similarCases);
        enhancedData.speechSampleAnalysis = analyzeSpeechSample(formData, similarCases);
        enhancedData.languageSampleAnalysis = analyzeLanguageSample(formData, similarCases);
        enhancedData.prognosisEvidence = generatePrognosisWithEvidence(formData, sampleEvaluations);
        enhancedData.articulationAnalysis = analyzeArticulation(formData, similarCases);
        
        // Add additional insights from sample evaluations
        enhancedData.sampleInsights = extractInsightsFromSamples(similarCases);
    }
    
    return enhancedData;
}

function findSimilarCases(currentData, sampleEvaluations) {
    return sampleEvaluations.filter(sample => {
        try {
            // Match age range (within 1 year)
            const ageDiff = Math.abs(getAgeInMonths(sample.age) - getAgeInMonths(currentData.age));
            if (ageDiff > 12) return false;
        
            // Match primary concerns
            return hasMatchingConcerns(currentData, sample);
        } catch (error) {
            console.warn('Error comparing cases:', error);
            return false;
        }
    });
}

function getAgeInMonths(ageString) {
    if (!ageString) return 0;
    
    // If age is already an object with years and months
    if (typeof ageString === 'object' && ageString !== null) {
        const years = ageString.years || 0;
        const months = ageString.months || 0;
        return years * 12 + months;
    }
    
    // If age is a string in the format "X years, Y months"
    const match = String(ageString).match(/(\d+)\s*years?,?\s*(\d+)?\s*months?/i);
    if (match) {
        const years = parseInt(match[1]) || 0;
        const months = parseInt(match[2]) || 0;
        return years * 12 + months;
    }
    
    // If age is a number (assumed to be years)
    const years = parseInt(ageString);
    if (!isNaN(years)) {
        return years * 12;
    }
    
    return 0;
}

function hasMatchingConcerns(data1, data2) {
    try {
        const concerns1 = extractConcerns(data1);
        const concerns2 = extractConcerns(data2);
        return concerns1.some(concern => concerns2.includes(concern));
    } catch (error) {
        console.warn('Error comparing concerns:', error);
        return false;
    }
}

function extractConcerns(data) {
    const concerns = [];
    
    try {
        if (data.speechSound) {
            // Extract sound errors
             // from articulation data
           if (data.speechSound.articulation && data.speechSound.articulation.errorPatterns) {
                const errorPatterns = data.speechSound.articulation.errorPatterns;
                if (Array.isArray(errorPatterns)) {
                    errorPatterns.forEach(pattern => {
                        if (pattern.substitution) concerns.push('substitution');
                        if (pattern.sound && !pattern.substitution) concerns.push('omission');
                    });
                }
            }
            
            // Also check for direct flags
            if (data.substitutionErrors) concerns.push('substitution');
            if (data.omissionErrors) concerns.push('omission');
            if (data.distortionErrors) concerns.push('distortion');
        }
        
        // Check for language concerns
        if (data.languageSample && data.languageSample.observations) {
            concerns.push('language');
        }
        
        // Check for oral mechanism concerns
        if (data.oralMechanism) {
            const structure = data.oralMechanism.structure || {};
            const functionData = data.oralMechanism.function || {};
            
            if (structure.faceConcern || structure.mandibleConcern || 
                structure.teethConcern || structure.palatalConcern || 
                structure.lipsConcern) {
                concerns.push('oral-structure');
            }
            
            if (functionData.jawConcern || functionData.velopharyngealConcern || 
                functionData.phonationConcern || functionData.reflexesConcern || 
                functionData.motorConcern) {
                concerns.push('oral-function');
            }
        }
    } catch (error) {
        console.warn('Error extracting concerns:', error);
    }
    
    return concerns;
}

// Extract additional insights from sample evaluations
function extractInsightsFromSamples(cases) {
    if (!cases || cases.length === 0) return null;
    
    const insights = {
        commonObservations: new Set(),
        commonRecommendations: new Set(),
        commonTreatmentApproaches: new Set()
    };
    
    cases.forEach(case_ => {
        // Extract observations
        if (case_.speechSample && case_.speechSample.observations) {
            insights.commonObservations.add(case_.speechSample.observations);
        }
        if (case_.languageSample && case_.languageSample.observations) {
            insights.commonObservations.add(case_.languageSample.observations);
        }
        
        // Extract recommendations
        if (case_.recommendations) {
            if (Array.isArray(case_.recommendations)) {
                case_.recommendations.forEach(rec => insights.commonRecommendations.add(rec));
            } else if (typeof case_.recommendations === 'string') {
                insights.commonRecommendations.add(case_.recommendations);
            }
        }
        
        // Extract treatment approaches
        if (case_.treatmentApproach) {
            insights.commonTreatmentApproaches.add(case_.treatmentApproach);
        }
    });
    
    return {
        commonObservations: Array.from(insights.commonObservations),
        commonRecommendations: Array.from(insights.commonRecommendations),
        commonTreatmentApproaches: Array.from(insights.commonTreatmentApproaches)
    };
}

function extractCommonPatterns(cases) {
    const patterns = new Map();
    
    cases.forEach(case_ => {
        // Analyze speech patterns
        if (case_.speechSound) {
            if (case_.clusterReduction) {
                patterns.set('Cluster reduction', (patterns.get('Cluster reduction') || 0) + 1);
            }
            if (case_.finalConsonantDeletion) {
                patterns.set('Final consonant deletion', (patterns.get('Final consonant deletion') || 0) + 1);
            }
        }
    });
    
    // Return patterns that appear in at least 30% of cases
    const threshold = cases.length * 0.3;
    return Array.from(patterns.entries())
        .filter(([_, count]) => count >= threshold)
        .map(([pattern, count]) => `${pattern} observed in ${Math.round(count/cases.length*100)}% of similar cases`);
}

function getDevelopmentalContext(data) {
    const context = {};
    
    // Analyze developmental milestones
    if (data.developmentalMilestones === 'WNL') {
        context['Overall Development'] = 'Age appropriate';
    } else if (data.developmentalMilestones === 'Delayed') {
        context['Overall Development'] = 'Shows some delays';
    }
    
    // Analyze language milestones
    if (data.languageMilestones === 'WNL') {
        context['Language Development'] = 'Age appropriate';
    } else if (data.languageMilestones === 'Delayed') {
        context['Language Development'] = 'Shows some delays';
    }
    
    return context;
}

function analyzeScores(data, sampleEvaluations) {
    if (!data.tl_standard_score) return null;
    
    const currentScore = parseInt(data.tl_standard_score);
    const similarScores = sampleEvaluations
        .filter(sample => sample.tl_standard_score)
        .map(sample => parseInt(sample.tl_standard_score))
        .filter(score => !isNaN(score));
    
    if (similarScores.length === 0) return null;
    
    const avgScore = similarScores.reduce((a, b) => a + b, 0) / similarScores.length;
    let analysis = `Current total language score (${currentScore}) `;
    
    if (currentScore > avgScore + 10) {
        analysis += `is notably higher than the average score (${Math.round(avgScore)}) observed in similar cases.`;
    } else if (currentScore < avgScore - 10) {
        analysis += `is lower than the average score (${Math.round(avgScore)}) observed in similar cases.`;
    } else {
        analysis += `is consistent with the average score (${Math.round(avgScore)}) observed in similar cases.`;
    }
    
    return analysis;
}

function getOralMechanismImplications(data) {
    const implications = [];
    
    // Analyze structural findings
    if (data.mandibleStructure === 'Concern') {
        implications.push('Mandibular alignment issues may impact articulation precision');
    }
    if (data.palatalStructure === 'Concern') {
        implications.push('Palatal arch configuration may affect production of certain sounds');
    }
    
    // Analyze functional findings
    if (data.motorCoordination === 'Concern') {
        implications.push('Motor coordination patterns suggest need for targeted oral-motor exercises');
    }
    
    return implications;
}

function analyzePhonologicalProcesses(data) {
    const processes = {};
    
    if (data.clusterReduction) {
        processes['Cluster Reduction'] = 'Present in connected speech';
    }
    if (data.finalConsonantDeletion) {
        processes['Final Consonant Deletion'] = 'Observed in word-final position';
    }
    if (data.weakSyllableDeletion) {
        processes['Weak Syllable Deletion'] = 'Present in multisyllabic words';
    }
    
    return Object.keys(processes).length > 0 ? processes : null;
}

function enhanceBackgroundInfo(data, similarCases) {
    if (!data.backgroundInfo) return null;
    
    const enhancedInfo = { ...data.backgroundInfo };
    const relevantCases = similarCases.filter(c => c.backgroundInfo);
    
    if (relevantCases.length > 0) {
        const commonDevelopmentalPatterns = new Set();
        const commonMedicalFactors = new Set();
        
        relevantCases.forEach(case_ => {
            if (case_.backgroundInfo.developmentalHistory) {
                commonDevelopmentalPatterns.add(case_.backgroundInfo.developmentalHistory);
            }
            if (case_.backgroundInfo.medicalHistory) {
                commonMedicalFactors.add(case_.backgroundInfo.medicalHistory);
            }
        });
        
        enhancedInfo.commonDevelopmentalPatterns = Array.from(commonDevelopmentalPatterns);
        enhancedInfo.commonMedicalFactors = Array.from(commonMedicalFactors);
    }
    
    return enhancedInfo;
}

function analyzeOralMechanism(data, similarCases) {
    if (!data.oralMechanism) return null;
    
    const analysis = { ...data.oralMechanism };
    const relevantCases = similarCases.filter(c => c.oralMechanism);
    
    if (relevantCases.length > 0) {
        const commonStructuralFindings = new Map();
        const commonFunctionalFindings = new Map();
        
        relevantCases.forEach(case_ => {
            if (case_.oralMechanism.structure) {
                Object.entries(case_.oralMechanism.structure).forEach(([key, value]) => {
                    commonStructuralFindings.set(key, (commonStructuralFindings.get(key) || 0) + 1);
                });
            }
            if (case_.oralMechanism.function) {
                Object.entries(case_.oralMechanism.function).forEach(([key, value]) => {
                    commonFunctionalFindings.set(key, (commonFunctionalFindings.get(key) || 0) + 1);
                });
            }
        });
        
        analysis.commonStructuralFindings = Object.fromEntries(commonStructuralFindings);
        analysis.commonFunctionalFindings = Object.fromEntries(commonFunctionalFindings);
    }
    
    return analysis;
}

// Add the missing analyzeSpeechSound function
function analyzeSpeechSound(data, similarCases) {
    if (!data.speechSound) return null;
    
    const analysis = { ...data.speechSound };
    const relevantCases = similarCases.filter(c => c.speechSound);
    
    if (relevantCases.length > 0) {
        // Extract common articulation patterns
        const errorPatterns = new Map();
        const intelligibilityRatings = new Map();
        
        relevantCases.forEach(c => {
            if (c.speechSound.articulation && c.speechSound.articulation.errorPatterns) {
                c.speechSound.articulation.errorPatterns.forEach(pattern => {
                    const key = `${pattern.sound}-${pattern.substitution || 'omission'}`;
                    errorPatterns.set(key, (errorPatterns.get(key) || 0) + 1);
                });
            }
            
            if (c.speechSound.intelligibility) {
                Object.entries(c.speechSound.intelligibility).forEach(([key, value]) => {
                    if (value === true) {
                        intelligibilityRatings.set(key, (intelligibilityRatings.get(key) || 0) + 1);
                    }
                });
            }
        });
        
        analysis.commonErrorPatterns = Object.fromEntries(errorPatterns);
        analysis.commonIntelligibilityRatings = Object.fromEntries(intelligibilityRatings);
    }
    
    return analysis;
}

function analyzeSpeechSample(data, similarCases) {
    if (!data.speechSample) return null;

    const analysis = { ...data.speechSample };
    const relevantCases = similarCases.filter(c => c.speechSample && c.speechSample.observations);

    if (relevantCases.length > 0) {
        analysis.commonObservations = relevantCases.map(c => c.speechSample.observations);
        
        // Extract common patterns from similar cases
        const patterns = new Set();
        relevantCases.forEach(c => {
            const text = c.speechSample.observations.toLowerCase();
            if (text.includes('substitution')) patterns.add('sound substitution');
            if (text.includes('omission')) patterns.add('sound omission');
            if (text.includes('distortion')) patterns.add('sound distortion');
            if (text.includes('cluster')) patterns.add('cluster reduction');
            if (text.includes('final consonant')) patterns.add('final consonant deletion');
        });
        
        analysis.commonPatterns = Array.from(patterns);
    }  
    return analysis;
}

function analyzeLanguageSample(data, similarCases) {
    if (!data.languageSample) return null;

    const analysis = { ...data.languageSample };
    const relevantCases = similarCases.filter(c => c.languageSample && c.languageSample.observations);

    if (relevantCases.length > 0) {
        analysis.commonObservations = relevantCases.map(c => c.languageSample.observations);
        
        // Extract common language features from similar cases
        const features = new Set();
        relevantCases.forEach(c => {
            const text = c.languageSample.observations.toLowerCase();
            if (text.includes('sentence')) features.add('sentence structure');
            if (text.includes('vocabulary')) features.add('vocabulary usage');
            if (text.includes('grammar')) features.add('grammatical structures');
            if (text.includes('pragmatic')) features.add('pragmatic skills');
        });
        
        analysis.commonFeatures = Array.from(features);
    }  
    return analysis;
}

function generatePrognosisWithEvidence(data, sampleEvaluations) {
    let prognosis = '';
    
    // Identify positive factors
    const positiveFactors = [];
    if (getAgeInMonths(data.age) < 60) {
        positiveFactors.push('early identification and intervention');
    }
    if (data.homeProgram) {
        positiveFactors.push('family commitment to home practice program');
    }
    
    // Add evidence from similar cases if available
    const similarCases = findSimilarCases(data, sampleEvaluations);
    if (similarCases.length > 0) {
        const successfulCases = similarCases.filter(c => c.outcome === 'successful' || c.outcome === 'improved');
        if (successfulCases.length > 0) {
            const successRate = Math.round((successfulCases.length / similarCases.length) * 100);
            if (successRate > 50) {
                prognosis += `Research and clinical evidence from similar cases suggests a ${successRate}% success rate with appropriate intervention. `;
            }
        }
    }
    
    if (positiveFactors.length > 0) {
        prognosis += 'Positive prognostic factors include ' + positiveFactors.join(' and ') + '. ';
    }
    return prognosis;
}

// New function to analyze articulation patterns
function analyzeArticulation(data, similarCases) {
    const analysis = {
        patterns: [],
        implications: [],
        recommendations: []
    };
    
    // Analyze speech sound errors if present
    if (data.speechSound && data.speechSound.articulation && data.speechSound.articulation.errorPatterns) {
        const errorPatterns = Array.isArray(data.speechSound.articulation.errorPatterns) ? 
            data.speechSound.articulation.errorPatterns : [];
        
        // Identify common phonological processes
        const processes = new Set();
        errorPatterns.forEach(error => {
            if (error.sound.includes('s') && error.positions.includes('initial')) {
                processes.add('Initial consonant deletion');
            }
            if (error.sound.includes('l') || error.sound.includes('r')) {
                processes.add('Liquid simplification');
            }
            if (error.positions.includes('final')) {
                processes.add('Final consonant deletion');
            }
            // Add more pattern detection logic
            if (error.sound.includes('s') && error.substitution.includes('t')) {
                processes.add('Fronting');
            }
            if (error.sound.includes('k') && error.substitution.includes('t')) {
                processes.add('Fronting');
            }
            if (error.sound.includes('g') && error.substitution.includes('d')) {
                processes.add('Fronting');
            }
        });

        // Add implications based on identified patterns
        
        analysis.patterns = Array.from(processes);
    }
    
    return analysis;
}