import { CloudflareVectorizeStore } from '@langchain/community/vectorstores/cloudflare_vectorize';
import { CloudflareWorkersAIEmbeddings } from '@langchain/community/embeddings/cloudflare_workersai';
import { createResponse, handleCORS, handleError } from '../../utils/api-utils.js';

// Helper function for safe JSON parsing from string
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[safeJsonParse] JSON parsing error:', error);
    return defaultValue;
  }
}

// Helper function for safe JSON parsing from request
async function safeJson(request) {
  try {
    return await request.json();
  } catch (error) {
    console.error('[safeJson] JSON parsing error:', error);
    throw new Error('Invalid JSON in request body');
  }
}

// Helper function for exponential backoff retry
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Rate limiting function
async function isRateLimited(env, ip) {
  const rateLimitKey = `rate_limit:chat:${ip}`;
  const rateLimitWindow = 60; // seconds
  const rateLimitMax = 10; // requests

  try {
    const currentCount = await env.CHAT_METADATA.get(rateLimitKey);
    const count = currentCount ? parseInt(currentCount) : 0;
    
    if (count >= rateLimitMax) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return true;
    }

    await env.CHAT_METADATA.put(rateLimitKey, String(count + 1), { expirationTtl: rateLimitWindow });
    return false;
  } catch (e) {
    console.error(`Rate limiting failed for IP ${ip}:`, e.message);
    return false; // Fail open
  }
}

// Store conversation function
async function storeConversation(env, conversationId, userMessage, aiMessage, sources) {
  try {
    const key = `conversation:${conversationId}`;
    const existingData = await env.CHAT_METADATA.get(key);
    const conversation = existingData ? safeJsonParse(existingData, { messages: [] }) : { messages: [] };

    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });
    conversation.messages.push({
      role: 'assistant',
      content: aiMessage,
      timestamp: new Date().toISOString(),
      sources: sources.map(doc => doc.metadata?.id).filter(Boolean)
    });

    // Keep the last 10 exchanges (20 messages)
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    await env.CHAT_METADATA.put(key, JSON.stringify(conversation));
  } catch (e) {
    console.error(`Failed to store conversation ${conversationId}:`, e.message);
    // Do not fail the main request if KV storage fails
  }
}

// Main handler for all requests
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  
  console.log(`[Chat] ${method} request received`);
  console.log('[Chat] Request headers:', Object.fromEntries(request.headers.entries()));
  
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  if (request.method !== 'POST') {
    return handleError(`Method not allowed: ${request.method}`, 405, { 'Allow': 'POST, OPTIONS' });
  }
  
  try {
    // Rate limiting check
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await isRateLimited(env, clientIP)) {
      return handleError('Too many requests. Please wait a moment before trying again.', 429);
    }
    
    // Check for required bindings
    if (!env.AI) return handleError('AI service not configured', 503);
    if (!env.VECTORIZE) return handleError('Vector store not configured', 503);
    if (!env.CHAT_METADATA) return handleError('Chat metadata store not configured', 503);
    
    const { message, conversationId } = await safeJson(request);
    
    if (!message) {
      return handleError('Message is a required field', 400);
    }
    
    // Initialize LangChain components
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: env.AI,
      modelName: '@cf/baai/bge-base-en-v1.5',
    });
    const vectorStore = new CloudflareVectorizeStore(embeddings, {
      index: env.VECTORIZE
    });
    
    // Perform similarity search
    const searchResults = await retryWithBackoff(() => vectorStore.similaritySearch(message, 5));
    
    if (searchResults.length === 0) {
      return handleError(
        'Knowledge base is not populated. Please run "npm run chat:load:prod" to load data.',
        503,
        { 'X-Error-Code': 'KB_EMPTY' }
      );
    }
    
    const contextContent = searchResults.map(doc => doc.pageContent).join('\n\n');
    
    // Generate AI response
    const systemPrompt = `You are an AI assistant for IPLC Standard Operating Procedures. Use the provided context to answer. If the answer isn't in the context, state that clearly.
Context:
${contextContent}`;
    
    const aiResponse = await retryWithBackoff(() => env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 500
    }));
    
    if (!aiResponse || !aiResponse.response) {
      return handleError('AI service returned an invalid response structure.', 502);
    }
    
    // Store conversation history
    if (conversationId) {
      await storeConversation(env, conversationId, message, aiResponse.response, searchResults);
    }
    
    return createResponse({
      success: true,
      data: {
        response: aiResponse.response,
        sources: searchResults.map(doc => ({
          id: doc.metadata?.id,
          snippet: doc.pageContent.substring(0, 200) + '...'
        })),
        conversationId
      }
    });
    
  } catch (error) {
    if (error.message.includes('Invalid JSON')) {
      return handleError(error, 400);
    }
    return handleError(error);
  }
}