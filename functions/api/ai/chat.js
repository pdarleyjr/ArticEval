import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CloudflareVectorizeStore } from '@langchain/cloudflare';
import { CloudflareWorkersAIEmbeddings } from '@langchain/cloudflare';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

const app = new Hono();

// Helper function for safe JSON parsing
async function safeJson(req) {
  try {
    return await req.json();
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

// Apply CORS to all routes
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

// Health check endpoint
app.get('/health', async (c) => {
  console.log('[Health Check] Received request');
  try {
    // Check if bindings are available
    const bindings = {
      vectorize: !!c.env.VECTORIZE,
      chatMetadata: !!c.env.CHAT_METADATA,
      ai: !!c.env.AI
    };
    console.log('[Health Check] Bindings status:', bindings);
    
    // Check if vector index has data
    let vectorIndexStatus = 'unknown';
    let documentCount = 0;
    
    if (c.env.VECTORIZE) {
      try {
        console.log('[Health Check] Checking vector index...');
        const embeddings = new CloudflareWorkersAIEmbeddings({
          binding: c.env.AI,
          modelName: '@cf/baai/bge-base-en-v1.5',
        });
        
        const vectorStore = new CloudflareVectorizeStore(embeddings, {
          index: c.env.VECTORIZE,
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
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bindings,
      vectorIndex: {
        status: vectorIndexStatus,
        hasDocuments: documentCount > 0
      }
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Data ingestion endpoint
app.post('/load', async (c) => {
  console.log('Load endpoint called');
  try {
    // Rate limiting check using KV storage
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const rateLimitKey = `rate_limit:load:${clientIP}`;
    const rateLimitWindow = 60; // seconds
    const rateLimitMax = 10; // requests per window
    
    try {
      // Get current count from KV
      const currentCount = await c.env.CHAT_METADATA.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      if (count >= rateLimitMax) {
        console.error(`[Load] Rate limit exceeded for IP: ${clientIP}`);
        return c.json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitWindow
        }, 429);
      }
      
      // Increment count and store with TTL
      await c.env.CHAT_METADATA.put(rateLimitKey, String(count + 1), {
        expirationTtl: rateLimitWindow
      });
    } catch (rateLimitError) {
      console.error('[Load] Rate limiting error:', rateLimitError);
      // Continue without rate limiting if there's an error
    }
    
    // Check bindings first
    console.log('Checking bindings...');
    console.log('AI binding available:', !!c.env.AI);
    console.log('VECTORIZE binding available:', !!c.env.VECTORIZE);
    console.log('CHAT_METADATA binding available:', !!c.env.CHAT_METADATA);
    
    let chunks;
    try {
      const body = await safeJson(c.req);
      chunks = body.chunks;
    } catch (jsonError) {
      console.error('Invalid JSON in request body:', jsonError);
      return c.json({
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Malformed JSON'
      }, 400);
    }
    
    console.log(`Received ${chunks?.length || 0} chunks to load`);
    
    if (!chunks || !Array.isArray(chunks)) {
      return c.json({ error: 'Invalid request: chunks array required' }, 400);
    }

    console.log('Creating embeddings instance...');
    // Create embeddings for data loading
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: c.env.AI,
      modelName: '@cf/baai/bge-base-en-v1.5',
    });

    console.log('Creating vector store...');
    const vectorStore = new CloudflareVectorizeStore(embeddings, {
      index: c.env.VECTORIZE,
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
      await c.env.CHAT_METADATA.put(
        `chunk:${chunk.id}`,
        JSON.stringify({
          text: chunk.text,
          metadata: chunk.metadata,
          indexed_at: new Date().toISOString()
        })
      );
    }

    console.log('Load operation completed successfully');
    return c.json({
      success: true,
      message: `Successfully indexed ${chunks.length} chunks`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in load endpoint:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({
      error: 'Failed to index data',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Chat endpoint (root path for the function)
app.post('/', async (c) => {
  console.log('[Main] Chat endpoint called');
  console.log('[Main] Request headers:', Object.fromEntries(c.req.headers.entries()));
  
  try {
    // Rate limiting check using KV storage
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const rateLimitKey = `rate_limit:chat:${clientIP}`;
    const rateLimitWindow = 60; // seconds
    const rateLimitMax = 10; // requests per window
    
    try {
      // Get current count from KV
      const currentCount = await c.env.CHAT_METADATA.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      if (count >= rateLimitMax) {
        console.error(`[Main] Rate limit exceeded for IP: ${clientIP}`);
        return c.json({
          error: 'Rate limit exceeded',
          message: 'Too many chat requests. Please wait a moment before trying again.',
          retryAfter: rateLimitWindow
        }, 429);
      }
      
      // Increment count and store with TTL
      await c.env.CHAT_METADATA.put(rateLimitKey, String(count + 1), {
        expirationTtl: rateLimitWindow
      });
    } catch (rateLimitError) {
      console.error('[Main] Rate limiting error:', rateLimitError);
      // Continue without rate limiting if there's an error
    }
    
    // Check bindings first
    console.log('[Main] Checking bindings...');
    if (!c.env.AI) {
      throw new Error('AI binding not available');
    }
    if (!c.env.VECTORIZE) {
      throw new Error('VECTORIZE binding not available');
    }
    if (!c.env.CHAT_METADATA) {
      throw new Error('CHAT_METADATA binding not available');
    }
    console.log('[Main] All bindings confirmed');
    
    let message, conversationId;
    try {
      const body = await safeJson(c.req);
      message = body.message;
      conversationId = body.conversationId;
    } catch (jsonError) {
      console.error('[Main] Invalid JSON in request body:', jsonError);
      return c.json({
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Malformed JSON'
      }, 400);
    }
    
    console.log('[Main] Received message:', message);
    console.log('[Main] Conversation ID:', conversationId);
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    console.log('Creating embeddings instance...');
    // Initialize embeddings with BGE model
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: c.env.AI,
      modelName: '@cf/baai/bge-base-en-v1.5',
    });

    console.log('Creating vector store...');
    const vectorStore = new CloudflareVectorizeStore(embeddings, {
      index: c.env.VECTORIZE,
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
        return c.json({
          error: 'Vector store is empty',
          details: 'The knowledge base has not been loaded yet. Please run "npm run chat:load:prod" to populate the vector database.',
          requiresDataLoad: true
        }, 503);
      }
    } catch (searchError) {
      console.error('[Main] Error during vector search:', searchError);
      return c.json({
        error: 'Vector search failed',
        details: searchError instanceof Error ? searchError.message : 'Unknown search error',
        suggestion: 'If this is the first deployment, run "npm run chat:load:prod" to populate the vector database.'
      }, 500);
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
        () => c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
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
      return c.json({
        error: 'AI generation failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        fallbackResponse: 'I apologize, but I encountered an error while generating a response. Please try again later.'
      }, 500);
    }

    // Store conversation in KV if conversationId provided
    if (conversationId) {
      console.log('[Main] Storing conversation in KV...');
      try {
        const conversationKey = `conversation:${conversationId}`;
        let conversation = { messages: [] };
        
        // Try to get existing conversation
        const existingConversation = await c.env.CHAT_METADATA.get(conversationKey);
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
        
        await c.env.CHAT_METADATA.put(conversationKey, JSON.stringify(conversation));
        console.log('[Main] Conversation history updated successfully');
      } catch (kvError) {
        console.error('[Main] Error storing conversation history:', kvError);
        // Continue without storing - don't fail the response
      }
    }

    console.log('Chat request completed successfully');
    return c.json({
      response: aiResponse.response,
      sources: searchResults.map(doc => ({
        id: doc.metadata?.id,
        snippet: doc.pageContent.substring(0, 200) + '...'
      })),
      conversationId
    });
  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({
      error: 'Failed to process chat',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

export default app;