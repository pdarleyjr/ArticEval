import { CloudflareVectorizeStore } from '@langchain/cloudflare';
import { CloudflareWorkersAIEmbeddings } from '@langchain/cloudflare';
import { Document } from '@langchain/core/documents';

// Helper function for safe JSON parsing
async function safeJson(request) {
  try {
    return await request.json();
  } catch (error) {
    console.error('[safeJson] JSON parsing error:', error);
    throw new Error('Invalid JSON in request body');
  }
}

// Helper function for safe JSON parsing from string
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[safeJsonParse] JSON parsing error:', error);
    return defaultValue;
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

// Handle GET requests (health check)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  console.log('[GET] Request to:', pathname);
  
  // Health check endpoint
  if (pathname.endsWith('/health')) {
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
      
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bindings,
        vectorIndex: {
          status: vectorIndexStatus,
          hasDocuments: documentCount > 0
        }
      }), {
        status: 200,
        headers: corsHeaders()
      });
    } catch (error) {
      console.error('[Health Check] Error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
  
  // Unknown GET endpoint
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'Unknown GET endpoint'
  }), {
    status: 404,
    headers: corsHeaders()
  });
}

// Handle POST requests (chat and load endpoints)
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  console.log('[POST] Request to:', pathname);
  console.log('[POST] Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Data ingestion endpoint
  if (pathname.endsWith('/load')) {
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
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimitWindow
          }), {
            status: 429,
            headers: corsHeaders()
          });
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
        return new Response(JSON.stringify({
          error: 'Invalid JSON in request body',
          details: jsonError instanceof Error ? jsonError.message : 'Malformed JSON'
        }), {
          status: 400,
          headers: corsHeaders()
        });
      }
      
      console.log(`Received ${chunks?.length || 0} chunks to load`);
      
      if (!chunks || !Array.isArray(chunks)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid request: chunks array required' 
        }), {
          status: 400,
          headers: corsHeaders()
        });
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
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully indexed ${chunks.length} chunks`,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: corsHeaders()
      });
    } catch (error) {
      console.error('Error in load endpoint:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return new Response(JSON.stringify({
        error: 'Failed to index data',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
  
  // Main chat endpoint (root path)
  console.log('[Main] Chat endpoint called');
  try {
    // Rate limiting check using KV storage
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const rateLimitKey = `rate_limit:chat:${clientIP}`;
    const rateLimitWindow = 60; // seconds
    const rateLimitMax = 10; // requests per window
    
    try {
      // Get current count from KV
      const currentCount = await env.CHAT_METADATA.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      if (count >= rateLimitMax) {
        console.error(`[Main] Rate limit exceeded for IP: ${clientIP}`);
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many chat requests. Please wait a moment before trying again.',
          retryAfter: rateLimitWindow
        }), {
          status: 429,
          headers: corsHeaders()
        });
      }
      
      // Increment count and store with TTL
      await env.CHAT_METADATA.put(rateLimitKey, String(count + 1), {
        expirationTtl: rateLimitWindow
      });
    } catch (rateLimitError) {
      console.error('[Main] Rate limiting error:', rateLimitError);
      // Continue without rate limiting if there's an error
    }
    
    // Check bindings first
    console.log('[Main] Checking bindings...');
    if (!env.AI) {
      throw new Error('AI binding not available');
    }
    if (!env.VECTORIZE) {
      throw new Error('VECTORIZE binding not available');
    }
    if (!env.CHAT_METADATA) {
      throw new Error('CHAT_METADATA binding not available');
    }
    console.log('[Main] All bindings confirmed');
    
    let message, conversationId;
    try {
      const body = await safeJson(request);
      message = body.message;
      conversationId = body.conversationId;
    } catch (jsonError) {
      console.error('[Main] Invalid JSON in request body:', jsonError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Malformed JSON'
      }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
    console.log('[Main] Received message:', message);
    console.log('[Main] Conversation ID:', conversationId);
    
    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    console.log('Creating embeddings instance...');
    // Initialize embeddings with BGE model
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: env.AI,
      modelName: '@cf/baai/bge-base-en-v1.5',
    });

    console.log('Creating vector store...');
    const vectorStore = new CloudflareVectorizeStore(embeddings, {
      index: env.VECTORIZE,
      textKey: 'text'
    });

    console.log('[Main] Performing similarity search...');
    let searchResults = [];
    try {
      // Search for relevant context with retry
      searchResults = await retryWithBackoff(
        () => vectorStore.similaritySearch(message, 5),
        3,
        1000
      );
      console.log(`[Main] Found ${searchResults.length} relevant documents`);
      
      // Check if vector store is empty
      if (searchResults.length === 0) {
        console.error('[Main] No documents found in vector store - it appears to be empty');
        return new Response(JSON.stringify({
          error: 'Vector store is empty',
          details: 'The knowledge base has not been loaded yet. Please run "npm run chat:load:prod" to populate the vector database.',
          requiresDataLoad: true
        }), {
          status: 503,
          headers: corsHeaders()
        });
      }
    } catch (searchError) {
      console.error('[Main] Error during vector search:', searchError);
      return new Response(JSON.stringify({
        error: 'Vector search failed',
        details: searchError instanceof Error ? searchError.message : 'Unknown search error',
        suggestion: 'If this is the first deployment, run "npm run chat:load:prod" to populate the vector database.'
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }
    
    // Build context from search results
    const context = searchResults
      .map(doc => doc.pageContent)
      .join('\n\n');
    console.log(`[Main] Context length: ${context.length} characters`);

    // Prepare the prompt
    const systemPrompt = `You are an AI assistant helping with questions about IPLC (Intellectual Property Legal Counsel) Standard Operating Procedures.
Use the following context to answer questions accurately and helpfully. If the answer cannot be found in the context, say so clearly.

Context:
${context}`;

    console.log('[Main] Generating AI response...');
    let aiResponse;
    try {
      // Generate response using Cloudflare AI with retry
      aiResponse = await retryWithBackoff(
        () => env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
        3,
        1000
      );
      
      console.log('[Main] AI response generated successfully');
      console.log('[Main] AI response type:', typeof aiResponse);
      console.log('[Main] AI response keys:', Object.keys(aiResponse || {}));
      
      // Validate AI response
      if (!aiResponse || !aiResponse.response) {
        console.error('[Main] Invalid AI response structure:', aiResponse);
        throw new Error('AI service returned invalid response structure');
      }
    } catch (aiError) {
      console.error('[Main] Error generating AI response:', aiError);
      return new Response(JSON.stringify({
        error: 'AI generation failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        fallbackResponse: 'I apologize, but I encountered an error while generating a response. Please try again later.'
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }

    // Store conversation in KV if conversationId provided
    if (conversationId) {
      console.log('[Main] Storing conversation in KV...');
      try {
        const conversationKey = `conversation:${conversationId}`;
        let conversation = { messages: [] };
        
        // Try to get existing conversation
        const existingConversation = await env.CHAT_METADATA.get(conversationKey);
        if (existingConversation) {
          const parsedConversation = safeJsonParse(existingConversation, null);
          if (parsedConversation && parsedConversation.messages) {
            conversation = parsedConversation;
          } else {
            console.log('[Main] Invalid conversation data, starting fresh');
          }
        }
        
        // Add user message
        conversation.messages.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });
        
        // Add assistant response
        conversation.messages.push({
          role: 'assistant',
          content: aiResponse.response,
          timestamp: new Date().toISOString(),
          sources: searchResults.map(doc => doc.metadata?.id).filter(Boolean)
        });
        
        // Keep only last 20 messages (10 exchanges)
        if (conversation.messages.length > 20) {
          conversation.messages = conversation.messages.slice(-20);
        }
        
        await env.CHAT_METADATA.put(conversationKey, JSON.stringify(conversation));
        console.log('[Main] Conversation history updated successfully');
      } catch (kvError) {
        console.error('[Main] Error storing conversation history:', kvError);
        // Continue without storing - don't fail the response
      }
    }

    console.log('Chat request completed successfully');
    return new Response(JSON.stringify({
      response: aiResponse.response,
      sources: searchResults.map(doc => ({
        id: doc.metadata?.id,
        snippet: doc.pageContent.substring(0, 200) + '...'
      })),
      conversationId
    }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({
      error: 'Failed to process chat',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Default handler for unsupported methods
export async function onRequest(context) {
  return new Response(JSON.stringify({
    error: 'Method not allowed',
    message: 'This endpoint only supports GET and POST requests'
  }), {
    status: 405,
    headers: {
      ...corsHeaders(),
      'Allow': 'GET, POST, OPTIONS'
    }
  });
}