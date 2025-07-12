import { CloudflareVectorizeStore } from '@langchain/community/vectorstores/cloudflare_vectorize';
import { CloudflareWorkersAIEmbeddings } from '@langchain/community/embeddings/cloudflare_workersai';
import { Document } from '@langchain/core';
import { createResponse } from '../../../utils/api-utils.js';

// Helper function for safe JSON parsing
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

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

// Main handler for all requests
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  
  console.log(`[Load] ${method} request received`);
  console.log('[Load] Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Handle OPTIONS requests for CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  
  // Handle POST requests
  if (method === 'POST') {
    console.log('Load endpoint called');
    try {
      // Rate limiting check using KV storage
      const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
      const rateLimitKey = `rate_limit:load:${clientIP}`;
      const rateLimitWindow = 60; // seconds
      const rateLimitMax = 10; // requests per window
      
      try {
        // Get current count from KV
        const currentCount = await env.CHAT_METADATA.get(rateLimitKey);
        const count = currentCount ? parseInt(currentCount) : 0;
        
        if (count >= rateLimitMax) {
          console.error(`[Load] Rate limit exceeded for IP: ${clientIP}`);
          return createResponse({
            success: false,
            error: {
              error: 'Rate limit exceeded',
              message: 'Too many requests. Please try again later.',
              retryAfter: rateLimitWindow
            }
          }, 429);
        }
        
        // Increment count and store with TTL
        await env.CHAT_METADATA.put(rateLimitKey, String(count + 1), {
          expirationTtl: rateLimitWindow
        });
      } catch (rateLimitError) {
        console.error('[Load] Rate limiting error:', rateLimitError);
        // Continue without rate limiting if there's an error
      }
      
      // Check bindings first
      console.log('Checking bindings...');
      console.log('AI binding available:', !!env.AI);
      console.log('VECTORIZE binding available:', !!env.VECTORIZE);
      console.log('CHAT_METADATA binding available:', !!env.CHAT_METADATA);
      
      let chunks;
      try {
        const body = await safeJson(request);
        chunks = body.chunks;
      } catch (jsonError) {
        console.error('Invalid JSON in request body:', jsonError);
        return createResponse({
          success: false,
          error: {
            error: 'Invalid JSON in request body',
            details: jsonError instanceof Error ? jsonError.message : 'Malformed JSON'
          }
        }, 400);
      }
      
      console.log(`Received ${chunks?.length || 0} chunks to load`);
      
      if (!chunks || !Array.isArray(chunks)) {
        return createResponse({
          success: false,
          error: {
            error: 'Invalid request: chunks array required'
          }
        }, 400);
      }

      console.log('Creating embeddings instance...');
      // Create embeddings for data loading
      const embeddings = new CloudflareWorkersAIEmbeddings({
        binding: env.AI,
        modelName: '@cf/baai/bge-base-en-v1.5',
      });

      console.log('Creating vector store...');
      const vectorStore = new CloudflareVectorizeStore(embeddings, {
        index: env.VECTORIZE,
        textKey: 'text'
      });

      console.log('Processing documents...');
      // Process chunks and create documents
      const documents = chunks.map(chunk => new Document({
        pageContent: chunk.text,
        metadata: {
          id: chunk.id,
          ...chunk.metadata
        }
      }));

      console.log(`Adding ${documents.length} documents to vector store...`);
      // Add documents to vector store with retry
      await retryWithBackoff(
        () => vectorStore.addDocuments(documents),
        3,
        1000
      );

      console.log('Storing metadata in KV...');
      // Store metadata in KV for reference
      for (const chunk of chunks) {
        await env.CHAT_METADATA.put(
          `chunk:${chunk.id}`,
          JSON.stringify({
            text: chunk.text,
            metadata: chunk.metadata,
            indexed_at: new Date().toISOString()
          })
        );
      }

      console.log('Load operation completed successfully');
      return createResponse({
        success: true,
        data: {
          message: `Successfully indexed ${chunks.length} chunks`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in load endpoint:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return createResponse({
        success: false,
        error: 'Failed to index data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
  
  // Method not allowed
  return createResponse({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports POST requests'
  }, 405);
}