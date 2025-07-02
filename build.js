import { build } from 'esbuild';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

async function buildProject() {
  try {
    console.log('🔨 Building project...');
    
    // No specific client-side bundles needed for this Cloudflare Pages project
    // The functions are already in the functions/ directory
    // Static files are already in public/
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: public/');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildProject();