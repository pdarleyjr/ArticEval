import { createResponse, handleCORS } from '../../auth/utils.js';
import { authenticateUser } from '../../auth/middleware.js';

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  try {
    // Authenticate user for all operations
    const authResult = await authenticateUser(request, env);
    if (!authResult.success) {
      return createResponse(false, authResult.message, null, 401);
    }
    
    const { user } = authResult;
    
    switch (request.method) {
      case 'POST':
        return await handleGenerateSummary(request, env, user);
      case 'PUT':
        return await handleRefineeSummary(request, env, user);
      default:
        return createResponse(false, 'Method not allowed', null, 405);
    }
  } catch (error) {
    console.error('AI Summary API error:', error);
    return createResponse(false, 'Internal server error', null, 500);
  }
}

/**
 * Handle POST requests - generate AI-powered clinical summary
 */
async function handleGenerateSummary(request, env, user) {
  try {
    const data = await request.json();
    const { formData, templateId, summaryType = 'comprehensive' } = data;
    
    // Validate required fields
    if (!formData) {
      return createResponse(false, 'Form data is required', null, 400);
    }
    
    // Extract clinical data for AI processing
    const clinicalContext = extractClinicalContext(formData);
    
    // Generate AI prompt based on clinical context
    const prompt = generateClinicalPrompt(clinicalContext, summaryType);
    
    // Call Cloudflare Workers AI
    const aiResponse = await generateAISummary(env, prompt, clinicalContext);
    
    if (!aiResponse.success) {
      return createResponse(false, aiResponse.error, null, 500);
    }
    
    // Structure the AI response into clinical sections
    const structuredSummary = structureAIResponse(aiResponse.summary, clinicalContext);
    
    // Store AI summary in database for future reference and refinement
    const summaryId = await storeAISummary(env, {
      userId: user.id,
      templateId,
      formData: JSON.stringify(formData),
      aiPrompt: prompt,
      aiResponse: aiResponse.summary,
      structuredSummary: JSON.stringify(structuredSummary),
      summaryType,
      timestamp: new Date().toISOString()
    });
    
    return createResponse(true, 'AI summary generated successfully', {
      summaryId,
      summary: structuredSummary,
      metadata: {
        model: aiResponse.model,
        tokenCount: aiResponse.tokenCount,
        processingTime: aiResponse.processingTime
      }
    });
    
  } catch (error) {
    console.error('Generate AI summary error:', error);
    return createResponse(false, 'Failed to generate AI summary', null, 500);
  }
}

/**
 * Handle PUT requests - refine existing AI summary based on clinician feedback
 */
async function handleRefineeSummary(request, env, user) {
  try {
    const data = await request.json();
    const { summaryId, feedback, refinementType = 'correction' } = data;
    
    if (!summaryId || !feedback) {
      return createResponse(false, 'Summary ID and feedback are required', null, 400);
    }
    
    // Get original summary
    const originalSummary = await env.DB.prepare(`
      SELECT * FROM ai_summaries WHERE id = ? AND user_id = ?
    `).bind(summaryId, user.id).first();
    
    if (!originalSummary) {
      return createResponse(false, 'Summary not found', null, 404);
    }
    
    // Parse original data
    const originalData = JSON.parse(originalSummary.form_data);
    const clinicalContext = extractClinicalContext(originalData);
    
    // Generate refinement prompt
    const refinementPrompt = generateRefinementPrompt(
      originalSummary.ai_response,
      feedback,
      refinementType,
      clinicalContext
    );
    
    // Call AI for refinement
    const aiResponse = await generateAISummary(env, refinementPrompt, clinicalContext);
    
    if (!aiResponse.success) {
      return createResponse(false, aiResponse.error, null, 500);
    }
    
    // Structure refined response
    const refinedSummary = structureAIResponse(aiResponse.summary, clinicalContext);
    
    // Store refinement
    await env.DB.prepare(`
      UPDATE ai_summaries 
      SET ai_response = ?, structured_summary = ?, refinement_count = refinement_count + 1, updated_at = ?
      WHERE id = ?
    `).bind(
      aiResponse.summary,
      JSON.stringify(refinedSummary),
      new Date().toISOString(),
      summaryId
    ).run();
    
    // Store feedback for learning
    await storeClinicalFeedback(env, {
      summaryId,
      userId: user.id,
      feedback,
      refinementType,
      originalResponse: originalSummary.ai_response,
      refinedResponse: aiResponse.summary
    });
    
    return createResponse(true, 'AI summary refined successfully', {
      summaryId,
      summary: refinedSummary,
      metadata: {
        model: aiResponse.model,
        tokenCount: aiResponse.tokenCount,
        processingTime: aiResponse.processingTime,
        refinementType
      }
    });
    
  } catch (error) {
    console.error('Refine AI summary error:', error);
    return createResponse(false, 'Failed to refine AI summary', null, 500);
  }
}

/**
 * Extract clinical context from form data for AI processing
 */
function extractClinicalContext(formData) {
  return {
    // Patient Demographics
    patientInfo: {
      name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
      age: formData.age,
      gender: formData.gender,
      school: formData.school,
      grade: formData.grade
    },
    
    // Evaluation Context
    evaluationInfo: {
      date: formData.evaluationDate,
      place: formData.placeOfEvaluation,
      screening: formData.screening === 'true',
      screeningDate: formData.screeningDate,
      organization: formData.organization,
      areas: formData.evaluationAreas || []
    },
    
    // Assessment Scores (PLS-5)
    assessmentScores: {
      auditoryComprehension: {
        standardScore: formData.ac_standard_score,
        ageEquivalent: formData.ac_age_equivalent,
        percentile: formData.ac_percentile,
        confidenceInterval: formData.ac_confidence_interval
      },
      expressiveCommunication: {
        standardScore: formData.ec_standard_score,
        ageEquivalent: formData.ec_age_equivalent,
        percentile: formData.ec_percentile,
        confidenceInterval: formData.ec_confidence_interval
      },
      totalLanguage: {
        standardScore: formData.tl_standard_score,
        ageEquivalent: formData.tl_age_equivalent,
        percentile: formData.tl_percentile,
        confidenceInterval: formData.tl_confidence_interval
      }
    },
    
    // Clinical Observations
    clinicalObservations: {
      strengths: extractCheckedItems(formData, 'strength_'),
      expressiveStrengths: extractCheckedItems(formData, 'expressive_strength_'),
      difficulties: extractCheckedItems(formData, 'difficulty_'),
      behavioralObservations: {
        classroomTransition: formData.classroom_transition === 'true',
        nameResponse: formData.name_response === 'true',
        jointAttention: formData.joint_attention === 'true',
        eyeContact: formData.eye_contact === 'true',
        communicativeIntent: formData.communicative_intent === 'true',
        attention: formData.attention === 'true'
      }
    },
    
    // Speech Sound Production
    speechProduction: {
      intelligibilityNotes: formData.intelligibilityNotes,
      articulationErrors: extractArticulationErrors(formData)
    },
    
    // Language Sample
    languageSample: {
      structure: formData.languageStructure,
      content: formData.languageContent,
      socialLanguage: formData.socialLanguage
    }
  };
}

/**
 * Generate clinical AI prompt for summary generation
 */
function generateClinicalPrompt(clinicalContext, summaryType) {
  const { patientInfo, evaluationInfo, assessmentScores, clinicalObservations } = clinicalContext;
  
  const basePrompt = `You are a certified speech-language pathologist writing a professional clinical evaluation summary. Generate a comprehensive, evidence-based evaluation report for:

PATIENT: ${patientInfo.name}, ${patientInfo.age} years old, ${patientInfo.gender}
EVALUATION DATE: ${evaluationInfo.date}
SETTING: ${evaluationInfo.place}

ASSESSMENT RESULTS (PLS-5):
- Auditory Comprehension: Standard Score ${assessmentScores.auditoryComprehension.standardScore}, Age Equivalent ${assessmentScores.auditoryComprehension.ageEquivalent}
- Expressive Communication: Standard Score ${assessmentScores.expressiveCommunication.standardScore}, Age Equivalent ${assessmentScores.expressiveCommunication.ageEquivalent}  
- Total Language: Standard Score ${assessmentScores.totalLanguage.standardScore}, Age Equivalent ${assessmentScores.totalLanguage.ageEquivalent}

CLINICAL OBSERVATIONS:
- Strengths: ${clinicalObservations.strengths.join(', ')}
- Areas of Difficulty: ${clinicalObservations.difficulties.join(', ')}

Please generate a professional clinical summary that includes:
1. Introduction with patient demographics and evaluation context
2. Assessment results interpretation with score analysis
3. Behavioral observations and clinical impressions
4. Evidence-based recommendations for intervention

Use professional clinical language appropriate for a speech-language pathology evaluation report. Ensure all interpretations are evidence-based and follow current clinical standards.`;

  if (summaryType === 'brief') {
    return basePrompt + '\n\nGenerate a BRIEF summary (2-3 paragraphs maximum) focusing on key findings and primary recommendations.';
  }
  
  return basePrompt + '\n\nGenerate a COMPREHENSIVE evaluation summary with detailed analysis of all assessment domains.';
}

/**
 * Generate refinement prompt for clinician feedback
 */
function generateRefinementPrompt(originalSummary, feedback, refinementType, clinicalContext) {
  return `You are refining a clinical speech-language evaluation summary based on professional feedback.

ORIGINAL SUMMARY:
${originalSummary}

CLINICIAN FEEDBACK (${refinementType}):
${feedback}

PATIENT CONTEXT: ${clinicalContext.patientInfo.name}, ${clinicalContext.patientInfo.age} years old

Please revise the summary incorporating the clinician's feedback while maintaining professional clinical standards and evidence-based interpretations. Ensure the revised summary is accurate, comprehensive, and follows speech-language pathology documentation standards.`;
}

/**
 * Call Cloudflare Workers AI for summary generation
 */
async function generateAISummary(env, prompt, clinicalContext) {
  try {
    const startTime = Date.now();
    
    // Use Llama 3.3 70B for clinical text generation
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a certified speech-language pathologist with expertise in clinical evaluation and documentation. Provide professional, evidence-based clinical summaries following ASHA guidelines.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.3, // Lower temperature for clinical consistency
      top_p: 0.9
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response || !response.response) {
      throw new Error('Invalid AI response');
    }
    
    return {
      success: true,
      summary: response.response,
      model: '@cf/meta/llama-3.3-70b-instruct',
      tokenCount: estimateTokenCount(prompt + response.response),
      processingTime
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    return {
      success: false,
      error: `AI generation failed: ${error.message}`
    };
  }
}

/**
 * Structure AI response into clinical sections
 */
function structureAIResponse(aiSummary, clinicalContext) {
  // Basic structure - could be enhanced with more sophisticated parsing
  return {
    fullSummary: aiSummary,
    patientInfo: clinicalContext.patientInfo,
    evaluationDate: clinicalContext.evaluationInfo.date,
    assessmentScores: clinicalContext.assessmentScores,
    generatedAt: new Date().toISOString(),
    aiGenerated: true
  };
}

/**
 * Store AI summary in database
 */
async function storeAISummary(env, summaryData) {
  try {
    const result = await env.DB.prepare(`
      INSERT INTO ai_summaries (user_id, template_id, form_data, ai_prompt, ai_response, structured_summary, summary_type, created_at, updated_at, refinement_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(
      summaryData.userId,
      summaryData.templateId,
      summaryData.formData,
      summaryData.aiPrompt,
      summaryData.aiResponse,
      summaryData.structuredSummary,
      summaryData.summaryType,
      summaryData.timestamp,
      summaryData.timestamp
    ).run();
    
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Store AI summary error:', error);
    throw error;
  }
}

/**
 * Store clinical feedback for learning
 */
async function storeClinicalFeedback(env, feedbackData) {
  try {
    await env.DB.prepare(`
      INSERT INTO ai_feedback (summary_id, user_id, feedback, refinement_type, original_response, refined_response, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      feedbackData.summaryId,
      feedbackData.userId,
      feedbackData.feedback,
      feedbackData.refinementType,
      feedbackData.originalResponse,
      feedbackData.refinedResponse,
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.error('Store feedback error:', error);
    // Don't throw - feedback storage is supplementary
  }
}

/**
 * Helper function to extract checked items
 */
function extractCheckedItems(formData, prefix) {
  return Object.entries(formData)
    .filter(([key, value]) => key.startsWith(prefix) && value === true)
    .map(([key]) => key.replace(prefix, '').replace(/_/g, ' '));
}

/**
 * Helper function to extract articulation errors
 */
function extractArticulationErrors(formData) {
  const errors = [];
  const sounds = ['p', 't', 'k', 'b', 'm', 'n', 'g', 'h', 'w', 'j'];
  
  for (const sound of sounds) {
    if (formData[`sound_${sound}_misarticulated`]) {
      errors.push({
        sound: `/${sound}/`,
        substitution: formData[`sound_${sound}_type`],
        position: formData[`sound_${sound}_position`],
        detail: formData[`sound_${sound}_detail`]
      });
    }
  }
  
  return errors;
}

/**
 * Estimate token count for cost tracking
 */
function estimateTokenCount(text) {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}