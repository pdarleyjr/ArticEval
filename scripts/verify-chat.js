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

async function generateReport() {
  console.log(`\n${colors.blue}Generating Verification Report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: CHAT_ENDPOINT,
    tests: {
      health: false,
      basicChat: false,
      vectorSearch: false
    },
    recommendations: []
  };
  
  // Run tests
  report.tests.health = await testHealthEndpoint();
  
  if (report.tests.health) {
    report.tests.basicChat = await testBasicChat();
    report.tests.vectorSearch = await testVectorSearch();
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
  
  // Save report
  const reportPath = 'scripts/chat-verification-report.json';
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n${colors.blue}========== VERIFICATION SUMMARY ==========${colors.reset}`);
  console.log(`Health Check: ${report.tests.health ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Basic Chat: ${report.tests.basicChat ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  console.log(`Vector Search: ${report.tests.vectorSearch ? colors.green + '✓ PASSED' : colors.red + '✗ FAILED'}${colors.reset}`);
  
  if (report.recommendations.length > 0) {
    console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  console.log(`\nFull report saved to: ${reportPath}`);
}

// Run all tests
console.log(`${colors.blue}ArticEval Chat Feature Verification Script${colors.reset}`);
console.log('==========================================');

generateReport().catch(error => {
  console.error(`${colors.red}Verification script failed:${colors.reset}`, error);
  process.exit(1);
});