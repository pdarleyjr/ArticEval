import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CloudflareVectorizeStore } from '@langchain/cloudflare';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

interface Env {
  VECTORIZE: VectorizeIndex;
  chat_metadata: KVNamespace;
  AI: any;
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
app.get('/api/ai/chat/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Data ingestion endpoint
app.post('/api/ai/chat/load', async (c) => {
  try {
    const { chunks } = await c.req.json<LoadRequest>();
    
    if (!chunks || !Array.isArray(chunks)) {
      return c.json({ error: 'Invalid request: chunks array required' }, 400);
    }

    const vectorStore = new CloudflareVectorizeStore(
      {
        index: c.env.VECTORIZE,
        textKey: 'text'
      }
    );

    // Process chunks and create documents
    const documents = chunks.map(chunk => new Document({
      pageContent: chunk.text,
      metadata: {
        id: chunk.id,
        ...chunk.metadata
      }
    }));

    // Add documents to vector store
    await vectorStore.addDocuments(documents);

    // Store metadata in KV for reference
    for (const chunk of chunks) {
      await c.env.chat_metadata.put(
        `chunk:${chunk.id}`,
        JSON.stringify({
          text: chunk.text,
          metadata: chunk.metadata,
          indexed_at: new Date().toISOString()
        })
      );
    }

    return c.json({ 
      success: true, 
      message: `Successfully indexed ${chunks.length} chunks`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in load endpoint:', error);
    return c.json({ 
      error: 'Failed to index data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Chat endpoint
app.post('/api/ai/chat', async (c) => {
  try {
    const { message, conversationId } = await c.req.json<ChatRequest>();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Initialize vector store
    const vectorStore = new CloudflareVectorizeStore(
      {
        index: c.env.VECTORIZE,
        textKey: 'text'
      }
    );

    // Search for relevant context
    const searchResults = await vectorStore.similaritySearch(message, 5);
    
    // Build context from search results
    const context = searchResults
      .map(doc => doc.pageContent)
      .join('\n\n');

    // Prepare the prompt
    const systemPrompt = `You are an AI assistant helping with questions about IPLC (Intellectual Property Legal Counsel) Standard Operating Procedures. 
Use the following context to answer questions accurately and helpfully. If the answer cannot be found in the context, say so clearly.

Context:
${context}`;

    // Generate response using Cloudflare AI
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Store conversation in KV if conversationId provided
    if (conversationId) {
      const conversationKey = `conversation:${conversationId}`;
      const existingConversation = await c.env.chat_metadata.get(conversationKey);
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
      
      await c.env.chat_metadata.put(conversationKey, JSON.stringify(conversation));
    }

    return c.json({
      response: aiResponse.response,
      sources: searchResults.map(doc => ({
        id: doc.metadata?.id,
        snippet: doc.pageContent.substring(0, 200) + '...'
      })),
      conversationId: conversationId || null
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return c.json({ 
      error: 'Failed to generate response', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export default app;