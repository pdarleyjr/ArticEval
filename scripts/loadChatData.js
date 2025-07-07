/**
 * Script to load IPLC SOP chunks into Cloudflare Vectorize
 * This script reads the IPLC_SOP_Chunks.json file and populates the vector database
 *
 * Features:
 * - Batch processing for efficient embedding generation
 * - Text splitting for documents exceeding token limits
 * - Progress tracking and error handling
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_ENDPOINT = process.env.CHAT_API_ENDPOINT || 'https://fbd5cde3.articeval.pages.dev/api/ai/chat/load'; // Update for production
const API_KEY = process.env.CHAT_API_KEY || ''; // Optional API key for authentication
const CHUNKS_FILE_PATH = path.join(__dirname, '..', 'IPLC_SOP_Chunks.json');
const BATCH_SIZE = 50; // Process 50 documents at a time (BGE model supports up to 100)
const MAX_CHUNK_SIZE = 400; // Characters per chunk (to stay within 512 token limit)
const CHUNK_OVERLAP = 50; // Character overlap between chunks

/**
 * Split text into smaller chunks if it exceeds the maximum size
 * @param {string} text - The text to split
 * @param {number} maxSize - Maximum characters per chunk
 * @param {number} overlap - Character overlap between chunks
 * @returns {string[]} Array of text chunks
 */
function splitText(text, maxSize = MAX_CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    if (text.length <= maxSize) {
        return [text];
    }
    
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        let end = start + maxSize;
        
        // Try to break at sentence boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            
            if (breakPoint > start + maxSize / 2) {
                end = breakPoint + 1;
            }
        }
        
        chunks.push(text.slice(start, Math.min(end, text.length)));
        start = end - overlap;
    }
    
    return chunks;
}

/**
 * Process documents in batches
 * @param {Array} documents - Array of documents to process
 * @param {number} batchSize - Number of documents per batch
 * @returns {Promise<Object>} Processing results
 */
async function processBatches(documents, batchSize = BATCH_SIZE) {
    const results = {
        successful: 0,
        failed: 0,
        errors: []
    };
    
    console.log(`\n📊 Processing ${documents.length} documents in batches of ${batchSize}...`);
    
    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(documents.length / batchSize);
        
        console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} documents)...`);
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Add API key if provided
            if (API_KEY) {
                headers['Authorization'] = `Bearer ${API_KEY}`;
            }
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    chunks: batch.map(doc => ({
                        id: doc.id,
                        text: doc.text,
                        metadata: doc.metadata
                    }))
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                results.successful += batch.length;
                console.log(`✅ Batch ${batchNumber} processed successfully`);
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
            
            // Add a small delay between batches to avoid overwhelming the API
            if (i + batchSize < documents.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.error(`❌ Error processing batch ${batchNumber}:`, error.message);
            results.failed += batch.length;
            results.errors.push({
                batch: batchNumber,
                error: error.message
            });
        }
    }
    
    return results;
}

async function loadData() {
    console.log('🚀 Starting IPLC SOP data loading process...');
    console.log(`📋 Configuration:`);
    console.log(`   - API Endpoint: ${API_ENDPOINT}`);
    console.log(`   - Batch Size: ${BATCH_SIZE}`);
    console.log(`   - Max Chunk Size: ${MAX_CHUNK_SIZE} characters`);
    console.log(`   - Chunk Overlap: ${CHUNK_OVERLAP} characters`);
    
    try {
        // Read the chunks file
        console.log('\n📖 Reading IPLC_SOP_Chunks.json...');
        const fileContent = await fs.readFile(CHUNKS_FILE_PATH, 'utf-8');
        const chunks = JSON.parse(fileContent);
        
        if (!Array.isArray(chunks)) {
            throw new Error('Expected chunks to be an array');
        }
        
        console.log(`✅ Found ${chunks.length} chunks to process`);
        
        // Prepare and split documents
        console.log('\n🔍 Preparing documents and splitting large texts...');
        const documents = [];
        let splitCount = 0;
        
        chunks.forEach((chunk, index) => {
            // Ensure each chunk has required fields
            if (!chunk.text || typeof chunk.text !== 'string') {
                console.warn(`⚠️  Skipping chunk ${index}: missing or invalid text field`);
                return;
            }
            
            // Split text if it's too large
            const textChunks = splitText(chunk.text);
            
            if (textChunks.length > 1) {
                splitCount++;
                console.log(`📄 Split chunk ${chunk.id || index} into ${textChunks.length} parts`);
            }
            
            textChunks.forEach((text, partIndex) => {
                documents.push({
                    id: textChunks.length > 1
                        ? `${chunk.id || `chunk_${index}`}_part_${partIndex + 1}`
                        : (chunk.id || `chunk_${index}`),
                    text: text,
                    metadata: {
                        source: chunk.source || 'IPLC_SOP',
                        section: chunk.section || 'General',
                        subsection: chunk.subsection || '',
                        page: chunk.page || null,
                        part: textChunks.length > 1 ? `${partIndex + 1}/${textChunks.length}` : null,
                        ...chunk.metadata // Include any additional metadata
                    }
                });
            });
        });
        
        console.log(`📦 Prepared ${documents.length} documents for upload`);
        if (splitCount > 0) {
            console.log(`   - ${splitCount} original chunks were split due to size`);
        }
        
        // Process documents in batches
        const results = await processBatches(documents);
        
        // Display final results
        console.log('\n' + '='.repeat(50));
        console.log('📈 Final Loading Statistics:');
        console.log('='.repeat(50));
        console.log(`✅ Successfully loaded: ${results.successful} documents`);
        console.log(`❌ Failed to load: ${results.failed} documents`);
        console.log(`📊 Total processed: ${documents.length} documents`);
        console.log(`📅 Timestamp: ${new Date().toISOString()}`);
        console.log(`📁 Data source: IPLC Standard Operating Procedures`);
        
        if (results.errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            results.errors.forEach(err => {
                console.log(`   - Batch ${err.batch}: ${err.error}`);
            });
        }
        
        // Save loading log
        const logEntry = {
            timestamp: new Date().toISOString(),
            chunksLoaded: results.successful,
            chunksFailed: results.failed,
            totalDocuments: documents.length,
            success: results.failed === 0,
            source: CHUNKS_FILE_PATH,
            batchSize: BATCH_SIZE,
            errors: results.errors
        };
        
        await saveLoadingLog(logEntry);
        
        if (results.failed > 0) {
            throw new Error(`Failed to load ${results.failed} documents. Check logs for details.`);
        }
        
    } catch (error) {
        console.error('❌ Error loading data:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Save error log
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: error.message,
            success: false,
            source: CHUNKS_FILE_PATH
        };
        
        await saveLoadingLog(logEntry);
        
        process.exit(1);
    }
}

// Save loading log for tracking
async function saveLoadingLog(logEntry) {
    const logPath = path.join(__dirname, 'loading-log.json');
    
    try {
        let logs = [];
        
        // Read existing logs if file exists
        try {
            const existingLogs = await fs.readFile(logPath, 'utf-8');
            logs = JSON.parse(existingLogs);
        } catch (err) {
            // File doesn't exist, start with empty array
        }
        
        // Add new log entry
        logs.push(logEntry);
        
        // Keep only last 100 entries
        if (logs.length > 100) {
            logs = logs.slice(-100);
        }
        
        // Write updated logs
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
        console.log('📝 Loading log saved to:', logPath);
        
    } catch (error) {
        console.warn('⚠️  Could not save loading log:', error.message);
    }
}

// Run the loader
console.log('='.repeat(60));
console.log('IPLC SOP Data Loader for Cloudflare Vectorize');
console.log('Using BGE Embeddings with CLS Pooling');
console.log('='.repeat(60) + '\n');

loadData()
    .then(() => {
        console.log('\n✅ Data loading completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Data loading failed:', error);
        process.exit(1);
    });

export { loadData };