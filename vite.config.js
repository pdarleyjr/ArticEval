import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Vite configuration for Form Builder
export default defineConfig({
  // Base public path
  base: '/',
  
  // Source root
  root: '.', 
  
  // Public directory
  publicDir: 'public',
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true,
    
    // Proxy API requests to Cloudflare Workers
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Asset directory within output
    assetsDir: 'assets',
    
    // Enable source maps for production
    sourcemap: true,
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    },
    
    // Rollup options
    rollupOptions: {
      // Entry points
      input: {
        main: resolve(__dirname, 'public/index.html'),
        builder: resolve(__dirname, 'public/builder.html'),
        'edit-forms': resolve(__dirname, 'public/edit-forms.html'),
        'template-selection': resolve(__dirname, 'public/template-selection.html'),
        'template-preview': resolve(__dirname, 'public/template-preview.html')
      },
      
      // Output configuration
      output: {
        // Entry file names
        entryFileNames: 'assets/[name].[hash].js',
        
        // Chunk file names
        chunkFileNames: 'assets/[name].[hash].js',
        
        // Asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(css|scss)$/.test(assetInfo.name)) {
            return 'assets/css/[name].[hash].[ext]';
          }
          
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name)) {
            return 'assets/images/[name].[hash].[ext]';
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name].[hash].[ext]';
          }
          
          return 'assets/[name].[hash].[ext]';
        },
        
        // Manual chunks for optimal code splitting
        manualChunks: {
          // Vendor chunk - large external libraries
          vendor: [
            'survey-core',
            'survey-creator-core',
            'survey-creator-knockout',
            'knockout'
          ],
          
          // SurveyJS widgets chunk
          'surveyjs-widgets': [
            '/public/assets/js/surveyjs-widgets.min.js'
          ],
          
          // Core application logic
          core: [
            '/src/core/dragDrop.js',
            '/src/core/eventHandlers.js',
            '/src/core/surveyConfig.js'
          ],
          
          // Components chunk
          components: [
            '/src/components/aiHelper.js',
            '/src/components/PreviewModal.js',
            '/src/components/dialogs/ElementTypeDialog.js',
            '/src/components/dialogs/EditDialog.js'
          ],
          
          // Services chunk
          services: [
            '/src/services/api.js',
            '/src/services/formService.js'
          ],
          
          // State management chunk
          state: [
            '/src/state/store.js'
          ],
          
          // Utilities chunk
          utils: [
            '/src/utils/debounce.js',
            '/src/utils/notifications.js'
          ]
        }
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Enable CSS source maps
    cssMinify: true,
    
    // Empty output directory before build
    emptyOutDir: true,
    
    // Copy public assets
    copyPublicDir: true,
    
    // Polyfill modules
    polyfillModulePreload: true
  },
  
  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@core': resolve(__dirname, './src/core'),
      '@services': resolve(__dirname, './src/services'),
      '@state': resolve(__dirname, './src/state'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles')
    },
    
    // Extensions to try when resolving modules
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx']
  },
  
  // CSS configuration
  css: {
    // CSS modules
    modules: {
      scopeBehaviour: 'local',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    
    // PostCSS configuration
    postcss: {
      plugins: []
    },
    
    // Preprocessor options
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/_variables.scss";`
      }
    }
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'survey-core',
      'survey-creator-core',
      'survey-creator-knockout',
      'knockout',
      'qrcode'
    ],
    
    exclude: [
      '@cloudflare/workers-types'
    ],
    
    // Force optimization on these entries
    entries: [
      'src/index.js'
    ]
  },
  
  // Define global constants
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version)
  },
  
  // Plugins
  plugins: [
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  // Worker configuration
  worker: {
    format: 'es',
    plugins: []
  },
  
  // SSR configuration (not used but configured for completeness)
  ssr: {
    noExternal: []
  },
  
  // JSON configuration
  json: {
    namedExports: true,
    stringify: false
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Log level
  logLevel: 'info',
  
  // Clear screen on startup
  clearScreen: true,
  
  // App type
  appType: 'spa'
});