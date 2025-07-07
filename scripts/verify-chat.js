import fetch from 'node-fetch';
import fs from 'fs/promises';

const PRODUCTION_URL = 'https://articeval.pages.dev';
const CHAT_ENDPOINT = `${PRODUCTION_URL}/api/ai/chat/`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testHealthEndpoint() {
  console.log(`\n${colors.blue}Testing Health Endpoint...${colors.reset}`);
  
  try {
    const response = await fetch(`${CHAT_ENDPOINT}health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Health endpoint is responding${colors.reset}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Environment: ${data.environment}`);
      console.log(`  Bindings: ${Object.keys(data.bindings || {}).join(', ')}`);
      console.log(`  Index populated: ${data.indexInfo?.hasData ? 'Yes' : 'No'}`);
      console.log(`  Document count: ${data.indexInfo?.documentCount || 0}`);
      
      if (!data.indexInfo?.hasData) {
        console.log(`${colors.yellow}⚠ Vector index is empty - run 'npm run chat:load:prod' to populate it${colors.reset}`);
      }
      
      return true;
    } else {
      console.log(`${colors.red}✗ Health endpoint failed: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`  Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to reach health endpoint${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testBasicChat() {
  console.log(`\n${colors.blue}Testing Basic Chat...${colors.reset}`);
  
  try {
    const chatRequest = {
      message: "What is IPLC?",
      conversationId: `test-${Date.now()}`
    };
    
    console.log('  Sending chat request:', chatRequest.message);
    
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatRequest)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Chat response received${colors.reset}`);
      console.log(`  Response preview: ${data.response?.substring(0, 100)}...`);
      console.log(`  Sources found: ${data.sources?.length || 0}`);
      console.log(`  Conversation ID: ${data.conversationId}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Chat request failed: ${response.status}${colors.reset}`);
      console.log(`  Error: ${data.error}`);
      console.log(`  Details: ${data.details}`);
      
      if (data.error === 'Vector search returned no results') {
        console.log(`${colors.yellow}⚠ The vector database appears to be empty. Run 'npm run chat:load:prod' to populate it.${colors.reset}`);
      }
      
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to send chat request${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testVectorSearch() {
  console.log(`\n${colors.blue}Testing Vector Search Functionality...${colors.reset}`);
  
  try {
    const searchQueries = [
      "trademark registration process",
      "patent filing requirements",
      "copyright protection"
    ];
    
    for (const query of searchQueries) {
      console.log(`\n  Testing query: "${query}"`);
      
      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });
      
      const data = await response.json();
      
      if (response.ok && data.sources && data.sources.length > 0) {
        console.log(`  ${colors.green}✓ Found ${data.sources.length} relevant sources${colors.reset}`);
      } else if (response.ok && (!data.sources || data.sources.length === 0)) {
        console.log(`  ${colors.yellow}⚠ No sources found - vector database may be empty${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ Search failed: ${data.error}${colors.reset}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Vector search test failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  console.log(`\n${colors.blue}Testing Rate Limiting...${colors.reset}`);
  
  // Test configuration
  const rateLimit = 10; // Based on wrangler.toml configuration
  const testRequests = 15; // Send more than the limit
  const results = {
    mainEndpoint: { success: 0, rateLimited: 0, errors: 0 },
    loadEndpoint: { success: 0, rateLimited: 0, errors: 0 }
  };
  
  try {
    // Test main chat endpoint rate limiting
    console.log(`\n  Testing main chat endpoint (/) - sending ${testRequests} rapid requests...`);
    const mainPromises = [];
    
    for (let i = 0; i < testRequests; i++) {
      const promise = fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Request': `rate-limit-test-${i}` // Add header to track requests
        },
        body: JSON.stringify({
          message: `Rate limit test ${i}`,
          conversationId: `rate-test-${Date.now()}-${i}`
        })
      }).then(async response => {
        const data = await response.json();
        
        if (response.status === 429) {
          results.mainEndpoint.rateLimited++;
          
          // Check for retry-after header
          const retryAfter = response.headers.get('retry-after');
          if (i === rateLimit) { // Log details for the first rate-limited request
            console.log(`  ${colors.yellow}✓ Rate limit triggered after ${i} requests${colors.reset}`);
            console.log(`    Status: 429`);
            console.log(`    Error: ${data.error}`);
            if (retryAfter) {
              console.log(`    Retry-After: ${retryAfter} seconds`);
            }
          }
        } else if (response.ok) {
          results.mainEndpoint.success++;
        } else {
          results.mainEndpoint.errors++;
          console.log(`  ${colors.red}✗ Unexpected error: ${response.status} - ${data.error}${colors.reset}`);
        }
        
        return { status: response.status, data };
      }).catch(error => {
        results.mainEndpoint.errors++;
        console.log(`  ${colors.red}✗ Request failed: ${error.message}${colors.reset}`);
        return { error: error.message };
      });
      
      mainPromises.push(promise);
    }
    
    // Wait for all requests to complete
    await Promise.all(mainPromises);
    
    console.log(`\n  Main endpoint results:`);
    console.log(`    Successful: ${results.mainEndpoint.success}`);
    console.log(`    Rate limited: ${results.mainEndpoint.rateLimited}`);
    console.log(`    Errors: ${results.mainEndpoint.errors}`);
    
    if (results.mainEndpoint.rateLimited > 0) {
      console.log(`  ${colors.green}✓ Rate limiting is working on main endpoint${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Rate limiting did not trigger on main endpoint${colors.reset}`);
    }
    
    // Wait a bit before testing load endpoint
    console.log(`\n  Waiting 2 seconds before testing load endpoint...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test load endpoint rate limiting
    console.log(`\n  Testing load endpoint (/load) - sending ${testRequests} rapid requests...`);
    const loadPromises = [];
    
    for (let i = 0; i < testRequests; i++) {
      const promise = fetch(`${CHAT_ENDPOINT}load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Request': `rate-limit-load-test-${i}`
        },
        body: JSON.stringify({})
      }).then(async response => {
        const data = await response.json();
        
        if (response.status === 429) {
          results.loadEndpoint.rateLimited++;
          
          if (i === rateLimit) { // Log details for the first rate-limited request
            console.log(`  ${colors.yellow}✓ Rate limit triggered after ${i} requests${colors.reset}`);
            console.log(`    Error: ${data.error}`);
          }
        } else if (response.ok) {
          results.loadEndpoint.success++;
        } else {
          results.loadEndpoint.errors++;
        }
        
        return { status: response.status, data };
      }).catch(error => {
        results.loadEndpoint.errors++;
        return { error: error.message };
      });
      
      loadPromises.push(promise);
    }
    
    await Promise.all(loadPromises);
    
    console.log(`\n  Load endpoint results:`);
    console.log(`    Successful: ${results.loadEndpoint.success}`);
    console.log(`    Rate limited: ${results.loadEndpoint.rateLimited}`);
    console.log(`    Errors: ${results.loadEndpoint.errors}`);
    
    if (results.loadEndpoint.rateLimited > 0) {
      console.log(`  ${colors.green}✓ Rate limiting is working on load endpoint${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ Rate limiting did not trigger on load endpoint${colors.reset}`);
    }
    
    // Test rate limit recovery
    console.log(`\n  Testing rate limit recovery...`);
    console.log(`  Waiting 60 seconds for rate limit window to reset...`);
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    const recoveryResponse = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "Test after rate limit recovery",
        conversationId: `recovery-test-${Date.now()}`
      })
    });
    
    if (recoveryResponse.ok) {
      console.log(`  ${colors.green}✓ Access restored after rate limit window${colors.reset}`);
    } else {
      const data = await recoveryResponse.json();
      console.log(`  ${colors.red}✗ Still rate limited: ${data.error}${colors.reset}`);
    }
    
    return results.mainEndpoint.rateLimited > 0 && results.loadEndpoint.rateLimited > 0;
  } catch (error) {
    console.log(`${colors.red}✗ Rate limiting test failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function generateReport() {
  console.log(`\n${colors.blue}Generating Verification Report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: CHAT_ENDPOINT,
    tests: {
      health: false,
      basicChat: false,
      vectorSearch: false,
      rateLimiting: false
    },
    recommendations: []
  };
  
  // Check if rate limiting test should be skipped
  const skipRateLimit = process.argv.includes('--skip-rate-limit');
  
  // Run tests
  report.tests.health = await testHealthEndpoint();
  
  if (report.tests.health) {
    report.tests.basicChat = await testBasicChat();
    report.tests.vectorSearch = await testVectorSearch();
    
    // Rate limiting test is optional and can be skipped with --skip-rate-limit flag
    if (skipRateLimit) {
      console.log(`\n${colors.yellow}⚠ Skipping rate limiting test (--skip-rate-limit flag detected)${colors.reset}`);
      report.tests.rateLimiting = 'skipped';
    } else {
      report.tests.rateLimiting = await testRateLimiting();
    }
  }
  
  // Generate recommendations
  if (!report.tests.health) {
    report.recommendations.push("1. Check that the deployment completed successfully");
    report.recommendations.push("2. Verify the API endpoint URL is correct");
    report.recommendations.push("3. Check Cloudflare Pages Functions logs for errors");
  } else if (!report.tests.basicChat || !report.tests.vectorSearch) {
    report.recommendations.push("1. Run 'npm run chat:load:prod' to populate the vector database");
    report.recommendations.push("2. Check that the AI bindings are properly configured in Cloudflare");
    report.recommendations.push("3. Review the Cloudflare Pages Functions logs for specific errors");
  }
  
  if (report.tests.rateLimiting === false) {
    report.recommendations.push("4. Verify rate limiting configuration in wrangler.toml");
    report.recommendations.push("5. Check that the RATE_LIMITER binding is properly deployed");
    report.recommendations.push("6. Note: Rate limits are eventually consistent across Cloudflare edge locations");
  }
  
  // Save report
  const reportPath = 'scripts/chat-verification-report.json';
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n${colors.blue}========== VERIFICATION SUMMARY ==========${colors.reset}`);
  console.log(`Health Check: ${report.tests.health ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Basic Chat: ${report.tests.basicChat ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Vector Search: ${report.tests.vectorSearch ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  
  if (report.tests.rateLimiting === 'skipped') {
    console.log(`Rate Limiting: ${colors.yellow}⚠ SKIPPED${colors.reset}`);
  } else {
    console.log(`Rate Limiting: ${report.tests.rateLimiting ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  }
  
  if (report.recommendations.length > 0) {
    console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  console.log(`\nFull report saved to: ${reportPath}`);
  
  if (!skipRateLimit && report.tests.rateLimiting !== 'skipped') {
    console.log(`\n${colors.yellow}Note: Rate limiting test takes ~60 seconds to complete.${colors.reset}`);
    console.log(`${colors.yellow}Use 'npm run chat:verify -- --skip-rate-limit' to skip this test.${colors.reset}`);
  }
  
  return report;
}

// Run all tests
console.log(`${colors.blue}ArticEval Chat Feature Verification Script${colors.reset}`);
console.log('==========================================');

generateReport().catch(error => {
  console.error(`${colors.red}Verification script failed:${colors.reset}`, error);
  process.exit(1);
});