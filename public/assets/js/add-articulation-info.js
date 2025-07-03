// Script to add articulation evaluation information to the database
import { dbManager } from './db-utils.js';

// Initialize database connection
async function initializeDatabase() {
    try {
        await dbManager.init();
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
}

// Structure the articulation evaluation information
const articulationEvaluationInfo = {
    id: 'articulation_evaluation_info',
    type: 'reference_data',
    dateCreated: new Date(),
    firstName: 'Reference',
    lastName: 'Data',
    patientName: 'Reference Data',
    content: {
        title: 'Articulation Evaluation',
        description: 'Comprehensive information about articulation evaluation process and components',
        sections: [
            {
                title: 'Case History and Background Information',
                content: 'The evaluation begins with gathering detailed information about the client\'s medical, developmental, and social history. This includes understanding any previous speech or hearing issues, developmental milestones, family history of speech-language disorders, and educational background. This context helps the SLP identify potential factors contributing to the speech difficulties.'
            },
            {
                title: 'Hearing Screening',
                content: 'Since hearing is integral to speech development and production, a hearing screening is often conducted to rule out hearing loss as a contributing factor to articulation problems.'
            },
            {
                title: 'Oral Mechanism Examination',
                content: 'The SLP examines the physical structures involved in speech production, such as the lips, tongue, teeth, palate, and jaw. This assessment checks for structural anomalies (e.g., cleft palate) or functional issues (e.g., muscle weakness) that might affect speech. Techniques like electropalatography may be utilized to monitor tongue-to-palate contact during speech, providing dynamic visual feedback on articulatory patterns.'
            },
            {
                title: 'Speech Sound Assessment',
                content: 'This core component evaluates the individual\'s ability to produce speech sounds correctly. The SLP may employ standardized tests, such as the Goldman-Fristoe Test of Articulation–3 (GFTA-3), where the client names pictures to elicit specific sounds in various word positions. This helps in identifying misarticulations and patterns of errors. Another tool is the Diagnostic Evaluation of Articulation and Phonology (DEAP), which assesses both articulation and phonological processes. It includes a series of subtests to diagnose articulation disorders and phonological impairments, providing a comprehensive profile of the individual\'s speech sound abilities.'
            },
            {
                title: 'Speech Sampling and Analysis',
                content: 'Beyond standardized tests, the SLP collects spontaneous speech samples during naturalistic interactions. This involves engaging the client in conversation or storytelling to observe speech in a functional context. The SLP analyzes these samples for error patterns, intelligibility, and the impact of speech sound errors on overall communication.'
            },
            {
                title: 'Stimulability Testing',
                content: 'This assesses the client\'s ability to produce correct sounds with assistance. The SLP provides cues or models specific sounds to determine if the individual can imitate them accurately. Stimulability testing helps in predicting which sounds may improve with intervention and guides the prioritization of therapy goals.'
            },
            {
                title: 'Phonological Process Analysis',
                content: 'For clients, especially children, who exhibit patterns of sound errors, the SLP analyzes these patterns to identify phonological processes. Understanding whether errors are due to typical developmental processes or indicative of a phonological disorder is crucial for effective treatment planning.'
            },
            {
                title: 'Documentation and Reporting',
                content: 'After the assessment, the SLP compiles a comprehensive report detailing: Background Information (summarizing the case history and any relevant medical or developmental information), Assessment Procedures (outlining the tests and tools used during the evaluation), Findings (describing observed speech sound errors, patterns, and any related factors), Diagnosis (providing a professional judgment regarding the presence and type of speech sound disorder), and Recommendations (suggesting intervention strategies, goals, and any referrals to other professionals if necessary). This report serves as a foundational document for planning therapy and tracking progress over time.'
            },
            {
                title: 'Client and Family Consultation',
                content: 'The SLP discusses the evaluation results with the client and their family, explaining the nature of the identified speech sound disorder in understandable terms. This collaborative discussion includes outlining the proposed intervention plan, setting realistic goals, and providing guidance on how the family can support the client\'s speech development at home.'
            }
        ],
        standardizedTests: [
            {
                name: 'Goldman-Fristoe Test of Articulation–3 (GFTA-3)',
                description: 'A standardized test where the client names pictures to elicit specific sounds in various word positions, helping to identify misarticulations and patterns of errors.',
                citation: 'citeturn0search6'
            },
            {
                name: 'Diagnostic Evaluation of Articulation and Phonology (DEAP)',
                description: 'Assesses both articulation and phonological processes through a series of subtests to diagnose articulation disorders and phonological impairments, providing a comprehensive profile of speech sound abilities.',
                citation: 'citeturn0search1'
            }
        ],
        techniques: [
            {
                name: 'Electropalatography',
                description: 'A technique used to monitor tongue-to-palate contact during speech, providing dynamic visual feedback on articulatory patterns.',
                citation: 'citeturn0search13'
            }
        ],
        phonologicalProcesses: [
            {
                name: 'Cluster Reduction',
                description: 'Simplifying consonant clusters by omitting one or more consonants (e.g., "stop" → "top")',
                ageOfElimination: '4 years'
            },
            {
                name: 'Final Consonant Deletion',
                description: 'Omitting the final consonant in words (e.g., "cat" → "ca")',
                ageOfElimination: '3 years'
            },
            {
                name: 'Fronting',
                description: 'Substituting sounds made in the back of the mouth with sounds made in the front (e.g., "key" → "tea")',
                ageOfElimination: '3.5 years'
            },
            {
                name: 'Stopping',
                description: 'Replacing fricatives or affricates with stop consonants (e.g., "see" → "tee")',
                ageOfElimination: '3-5 years'
            },
            {
                name: 'Weak Syllable Deletion',
                description: 'Omitting unstressed syllables (e.g., "banana" → "nana")',
                ageOfElimination: '4 years'
            }
        ],
        clinicalImpressionEnhancements: [
            {
                pattern: 'articulation disorder',
                enhancement: 'The articulation disorder is characterized by consistent errors in the production of specific speech sounds, affecting the physical production of sounds rather than the linguistic organization of the sound system. This is evidenced by the pattern of substitutions, omissions, and distortions observed during both structured assessment and spontaneous speech samples.'
            },
            {
                pattern: 'phonological disorder',
                enhancement: 'The phonological disorder is characterized by systematic patterns of sound errors that reflect difficulties with the linguistic organization of speech sounds rather than physical production abilities. This is evidenced by the presence of multiple phonological processes such as cluster reduction, final consonant deletion, and fronting that affect entire classes of sounds rather than individual phonemes.'
            },
            {
                pattern: 'oral mechanism',
                enhancement: 'The oral mechanism examination revealed structural and functional characteristics that may contribute to the observed speech production difficulties. The assessment of lips, tongue, teeth, palate, and jaw provides important context for understanding the physical basis of articulation errors and informs the development of appropriate intervention strategies.'
            },
            {
                pattern: 'stimulability',
                enhancement: 'Stimulability testing indicates which misarticulated sounds the client can produce correctly with cueing or modeling, providing valuable prognostic information. Sounds that are stimulable typically respond more quickly to intervention than those that are not stimulable, which helps prioritize treatment targets and predict the course of therapy.'
            }
        ]
    }
};

// Add the articulation evaluation information to the database
async function addArticulationInfo() {
    try {
        if (await initializeDatabase()) {
            // Check if the data already exists
            try {
                await dbManager.getEvaluation('articulation_evaluation_info');
                console.log('Articulation evaluation information already exists in the database');
                
                // Update the existing data
                await dbManager.updateEvaluation('articulation_evaluation_info', articulationEvaluationInfo);
                console.log('Articulation evaluation information updated successfully');
            } catch (error) {
                // If the data doesn't exist, add it
                if (error.name === 'ValidationError' && error.message.includes('not found')) {
                    const id = await dbManager.storeEvaluation(articulationEvaluationInfo);
                    console.log('Articulation evaluation information added successfully with ID:', id);
                } else {
                    throw error;
                }
            }
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to add articulation evaluation information:', error);
        return false;
    }
}

// Function to enhance the template engine with articulation information
async function enhanceTemplateEngine() {
    try {
        // Import the template engine
        const { templateEngine } = await import('./template-engine.js');
        
        // Add a new template for articulation evaluation
        templateEngine.registerTemplate('articulationEvaluationInfo', (data) => {
            return `
                <div class="articulation-evaluation-info">
                    <h3>Articulation Evaluation Process</h3>
                    <p>An articulation evaluation is a comprehensive assessment designed to identify and analyze speech sound disorders, aiming to understand the nature of speech difficulties and develop an effective intervention plan.</p>
                    
                    <h4>Key Components:</h4>
                    <ul>
                        ${articulationEvaluationInfo.content.sections.map(section => 
                            `<li><strong>${section.title}:</strong> ${section.content}</li>`
                        ).join('')}
                    </ul>
                    
                    <h4>Common Standardized Tests:</h4>
                    <ul>
                        ${articulationEvaluationInfo.content.standardizedTests.map(test => 
                            `<li><strong>${test.name}:</strong> ${test.description}</li>`
                        ).join('')}
                    </ul>
                    
                    <h4>Common Phonological Processes:</h4>
                    <ul>
                        ${articulationEvaluationInfo.content.phonologicalProcesses.map(process => 
                            `<li><strong>${process.name}:</strong> ${process.description} (typically eliminated by ${process.ageOfElimination})</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        });
        
        // Enhance the clinical impressions template
        const originalClinicalImpressionsTemplate = templateEngine.templates.get('clinicalImpressions');
        
        templateEngine.registerTemplate('clinicalImpressions', (data) => {
            let impression = originalClinicalImpressionsTemplate(data);
            
            // Enhance the impression with articulation-specific information if relevant
            if (data.speechSound || data.oralMechanism) {
                // Add articulation-specific enhancements
                articulationEvaluationInfo.content.clinicalImpressionEnhancements.forEach(enhancement => {
                    if (impression.toLowerCase().includes(enhancement.pattern)) {
                        impression += `\n\n<div class="enhanced-impression">${enhancement.enhancement}</div>`;
                    }
                });
            }
            
            return impression;
        });
        
        console.log('Template engine enhanced with articulation evaluation information');
        return true;
    } catch (error) {
        console.error('Failed to enhance template engine:', error);
        return false;
    }
}

// Execute the functions when the script is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Adding articulation evaluation information to the database...');
    const dbSuccess = await addArticulationInfo();
    
    if (dbSuccess) {
        console.log('Enhancing template engine with articulation information...');
        await enhanceTemplateEngine();
    }
});

// Export functions for use in other modules
export { addArticulationInfo, enhanceTemplateEngine };