/**
 * Script to load IPLC SOP chunks into Cloudflare Vectorize
 * This script reads the IPLC_SOP_Chunks.json file and populates the vector database
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const API_ENDPOINT = 'http://localhost:8788/api/ai/chat/load'; // Update for production
const CHUNKS_FILE_PATH = path.join(__dirname, '..', 'IPLC_SOP_Chunks.json');

async function loadData() {
    console.log('🚀 Starting IPLC SOP data loading process...');
    
    try {
        // Read the chunks file
        console.log('📖 Reading IPLC_SOP_Chunks.json...');
        const fileContent = await fs.readFile(CHUNKS_FILE_PATH, 'utf-8');
        const chunks = JSON.parse(fileContent);
        
        if (!Array.isArray(chunks)) {
            throw new Error('Expected chunks to be an array');
        }
        
        console.log(`✅ Found ${chunks.length} chunks to process`);
        
        // Prepare the documents for the API
        const documents = chunks.map((chunk, index) => {
            // Ensure each chunk has required fields
            if (!chunk.text || typeof chunk.text !== 'string') {
                console.warn(`⚠️  Skipping chunk ${index}: missing or invalid text field`);
                return null;
            }
            
            return {
                id: chunk.id || `chunk_${index}`,
                text: chunk.text,
                metadata: {
                    source: chunk.source || 'IPLC_SOP',
                    section: chunk.section || 'General',
                    subsection: chunk.subsection || '',
                    page: chunk.page || null,
                    ...chunk.metadata // Include any additional metadata
                }
            };
        }).filter(doc => doc !== null);
        
        console.log(`📦 Prepared ${documents.length} valid documents for upload`);
        
        // Send to the API
        console.log('📤 Sending data to Cloudflare Worker...');
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documents })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Data loaded successfully!');
            console.log(`📊 Summary: ${result.message}`);
            
            // Display results
            console.log('\n📈 Loading Statistics:');
            console.log(`   - Total chunks processed: ${documents.length}`);
            console.log(`   - Data source: IPLC Standard Operating Procedures`);
            console.log(`   - Timestamp: ${new Date().toISOString()}`);
            
            // Save loading log
            const logEntry = {
                timestamp: new Date().toISOString(),
                chunksLoaded: documents.length,
                success: true,
                source: CHUNKS_FILE_PATH
            };
            
            await saveLoadingLog(logEntry);
            
        } else {
            throw new Error(result.message || 'Unknown error occurred');
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
if (require.main === module) {
    console.log('====================================');
    console.log('IPLC SOP Data Loader for Vectorize');
    console.log('====================================\n');
    
    loadData()
        .then(() => {
            console.log('\n✅ Data loading completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Data loading failed:', error);
            process.exit(1);
        });
}

module.exports = { loadData };