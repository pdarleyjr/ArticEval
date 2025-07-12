import { CloudflareVectorizeStore } from '@langchain/community/vectorstores/cloudflare_vectorize';
import { CloudflareWorkersAIEmbeddings } from '@langchain/community/embeddings/cloudflare_workersai';
import { createResponse } from '../../../utils/api-utils.js';

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

// Main handler for all requests
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  
  console.log(`[Health] ${method} request received`);
  
  // Handle OPTIONS requests for CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  
  // Handle GET requests
  if (method === 'GET') {
    console.log('[Health Check] Received request');
    try {
      // Check if bindings are available
      const bindings = {
        vectorize: !!env.VECTORIZE,
        chatMetadata: !!env.CHAT_METADATA,
        ai: !!env.AI
      };
      console.log('[Health Check] Bindings status:', bindings);
      
      // Check if vector index has data
      let vectorIndexStatus = 'unknown';
      let documentCount = 0;
      
      if (env.VECTORIZE) {
        try {
          console.log('[Health Check] Checking vector index...');
          const embeddings = new CloudflareWorkersAIEmbeddings({
            binding: env.AI,
            modelName: '@cf/baai/bge-base-en-v1.5',
          });
          
          const vectorStore = new CloudflareVectorizeStore(embeddings, {
            index: env.VECTORIZE,
            textKey: 'text'
          });
          
          // Try a simple search to see if there's data
          const testResults = await retryWithBackoff(
            () => vectorStore.similaritySearch('test', 1),
            2, // fewer retries for health check
            500 // shorter initial delay
          );
          documentCount = testResults.length;
          vectorIndexStatus = documentCount > 0 ? 'populated' : 'empty';
          console.log(`[Health Check] Vector index status: ${vectorIndexStatus}, documents found: ${documentCount}`);
        } catch (error) {
          console.error('[Health Check] Error checking vector index:', error);
          vectorIndexStatus = 'error';
        }
      }
      
      return createResponse({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          bindings,
          vectorIndex: {
            status: vectorIndexStatus,
            hasDocuments: documentCount > 0
          }
        }
      });
    } catch (error) {
      console.error('[Health Check] Error:', error);
      return createResponse({
        success: false,
        error: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }, 500);
    }
  }
  
  // Method not allowed
  return createResponse({
    success: false,
    error: {
      error: 'Method not allowed',
      message: 'This endpoint only supports GET requests'
    }
  }, 405);
}