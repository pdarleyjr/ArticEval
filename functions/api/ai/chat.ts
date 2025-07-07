/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CloudflareVectorizeStore } from '@langchain/cloudflare';
import { CloudflareWorkersAIEmbeddings } from '@langchain/cloudflare';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

interface Env {
  VECTORIZE: VectorizeIndex;
  CHAT_METADATA: KVNamespace;
  AI: Ai;
}

interface LoadRequest {
  chunks: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
}

interface ChatRequest {
  message: string;
  conversationId?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Apply CORS to all routes
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

// Health check endpoint
app.get('/health', (c) => {
  console.log('Health check endpoint called');
  try {
    // Check if bindings are available
    const bindings = {
      vectorize: !!c.env.VECTORIZE,
      chatMetadata: !!c.env.CHAT_METADATA,
      ai: !!c.env.AI
    };
    console.log('Bindings available:', bindings);
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bindings
    });
  } catch (error) {
    console.error('Health check error:', error);
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
    // Check bindings first
    console.log('Checking bindings...');
    console.log('AI binding available:', !!c.env.AI);
    console.log('VECTORIZE binding available:', !!c.env.VECTORIZE);
    console.log('CHAT_METADATA binding available:', !!c.env.CHAT_METADATA);
    
    const { chunks } = await c.req.json<LoadRequest>();
    console.log(`Received ${chunks?.length || 0} chunks to load`);
    
    if (!chunks || !Array.isArray(chunks)) {
      return c.json({ error: 'Invalid request: chunks array required' }, 400);
    }

    console.log('Creating embeddings instance...');
    // Create embeddings for data loading
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: c.env.AI as any, // Type casting to handle conflicting Response types
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
    // Add documents to vector store
    await vectorStore.addDocuments(documents);

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
  console.log('Main chat endpoint called');
  try {
    // Check bindings first
    console.log('Checking bindings...');
    console.log('AI binding available:', !!c.env.AI);
    console.log('VECTORIZE binding available:', !!c.env.VECTORIZE);
    console.log('CHAT_METADATA binding available:', !!c.env.CHAT_METADATA);
    
    const { message, conversationId } = await c.req.json<ChatRequest>();
    console.log(`Received message: "${message}", conversationId: ${conversationId}`);
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    console.log('Creating embeddings instance...');
    // Initialize embeddings with BGE model
    const embeddings = new CloudflareWorkersAIEmbeddings({
      binding: c.env.AI as any, // Type casting to handle conflicting Response types
      modelName: '@cf/baai/bge-base-en-v1.5',
    });

    console.log('Creating vector store...');
    const vectorStore = new CloudflareVectorizeStore(embeddings, {
      index: c.env.VECTORIZE,
      textKey: 'text'
    });

    console.log('Performing similarity search...');
    // Search for relevant context
    const searchResults = await vectorStore.similaritySearch(message, 5);
    console.log(`Found ${searchResults.length} relevant documents`);
    
    // Build context from search results
    const context = searchResults
      .map(doc => doc.pageContent)
      .join('\n\n');
    console.log(`Context length: ${context.length} characters`);

    // Prepare the prompt
    const systemPrompt = `You are an AI assistant helping with questions about IPLC (Intellectual Property Legal Counsel) Standard Operating Procedures.
Use the following context to answer questions accurately and helpfully. If the answer cannot be found in the context, say so clearly.

Context:
${context}`;

    console.log('Generating AI response...');
    // Generate response using Cloudflare AI
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    }) as any;
    
    console.log('AI response generated successfully');
    console.log('AI response type:', typeof aiResponse);
    console.log('AI response keys:', Object.keys(aiResponse || {}));

    // Store conversation in KV if conversationId provided
    if (conversationId) {
      console.log('Storing conversation in KV...');
      const conversationKey = `conversation:${conversationId}`;
      const existingConversation = await c.env.CHAT_METADATA.get(conversationKey);
      const conversation = existingConversation ? JSON.parse(existingConversation) : { messages: [] };
      
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });
      
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
        sources: searchResults.map(doc => doc.metadata?.id).filter(Boolean)
      });
      
      await c.env.CHAT_METADATA.put(conversationKey, JSON.stringify(conversation));
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