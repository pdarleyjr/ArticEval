// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Critical Production Issues Regression Tests', () => {
  
  // Test 1: Verify SurveyJS assets load correctly from local vendor directory
  test('SurveyJS assets load without MIME type blocking', async ({ page }) => {
    // Monitor network requests for SurveyJS resources
    const surveyJSRequests = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/vendor/surveyjs/')) {
        surveyJSRequests.push({
          url,
          status: response.status(),
          contentType: response.headers()['content-type']
        });
      }
    });

    // Navigate to form dashboard
    await page.goto('/form-dashboard.html');
    
    // Wait for SurveyJS to initialize
    await page.waitForFunction(() => typeof window['Survey'] !== 'undefined', { timeout: 10000 });
    
    // Verify all SurveyJS resources loaded successfully
    expect(surveyJSRequests.length).toBeGreaterThan(0);
    
    for (const request of surveyJSRequests) {
      // All resources should return 200 OK
      expect(request.status).toBe(200);
      
      // Verify correct MIME types
      if (request.url.endsWith('.js')) {
        expect(request.contentType).toContain('application/javascript');
      } else if (request.url.endsWith('.css')) {
        expect(request.contentType).toContain('text/css');
      }
    }
    
    // Verify SurveyJS is functional
    const surveyContainer = await page.locator('#surveyContainer');
    await expect(surveyContainer).toBeVisible();
  });

  // Test 2: Verify malformed JSON doesn't crash the Worker
  test('API handles malformed JSON gracefully', async ({ page, request }) => {
    // Test chat endpoint with malformed JSON
    const chatResponse = await request.post('/api/ai/chat', {
      data: '{"invalid": json}', // Malformed JSON
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Should return 400 error, not crash
    expect(chatResponse.status()).toBe(400);
    const chatError = await chatResponse.json();
    expect(chatError.error).toContain('Invalid JSON');
    
    // Test summary endpoint with malformed JSON
    const summaryResponse = await request.post('/api/ai/summary', {
      data: '{broken: json', // Malformed JSON
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Should return 400 error, not crash
    expect(summaryResponse.status()).toBe(400);
    const summaryError = await summaryResponse.json();
    expect(summaryError.error).toContain('Invalid JSON');
    
    // Verify the API is still responsive after malformed requests
    const healthCheck = await request.get('/api/ai/chat');
    expect(healthCheck.status()).toBeLessThan(500); // Not a server error
  });

  // Test 3: Verify no sourcemap references cause 404 errors
  test('No sourcemap 404 errors in production', async ({ page }) => {
    const notFoundRequests = [];
    
    // Monitor for 404 errors
    page.on('response', response => {
      if (response.status() === 404) {
        notFoundRequests.push(response.url());
      }
    });
    
    // Visit main pages
    const pages = [
      '/',
      '/form-dashboard.html',
      '/evaluation.html',
      '/clinician-dashboard.html',
      '/builder.html'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
    }
    
    // Filter for sourcemap-related 404s
    const sourcemapErrors = notFoundRequests.filter(url => 
      url.includes('.map') || 
      url.includes('sourceMappingURL')
    );
    
    // Should have no sourcemap 404 errors
    expect(sourcemapErrors).toHaveLength(0);
  });

  // Test 4: Verify FontAwesome loads correctly (no beta version issues)
  test('FontAwesome stable version loads successfully', async ({ page }) => {
    let fontAwesomeLoaded = false;
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('fontawesome') && url.includes('6.5.2')) {
        fontAwesomeLoaded = response.status() === 200;
      }
    });
    
    await page.goto('/form-dashboard.html');
    await page.waitForLoadState('networkidle');
    
    // Verify FontAwesome loaded
    expect(fontAwesomeLoaded).toBe(true);
    
    // Verify an icon is rendered
    const icon = await page.locator('.fa-sync-alt').first();
    await expect(icon).toBeVisible();
  });

  // Test 5: Form submission workflow smoke test
  test('Form submission workflow functions correctly', async ({ page }) => {
    await page.goto('/evaluation.html');
    
    // Wait for form to load
    await page.waitForSelector('.sv-container-modern', { timeout: 10000 });
    
    // Fill out a simple form field (if present)
    const textInput = await page.locator('input[type="text"]').first();
    if (await textInput.isVisible()) {
      await textInput.fill('Test submission');
    }
    
    // Submit form
    const submitButton = await page.locator('button:has-text("Complete")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Verify submission doesn't cause errors
      await page.waitForTimeout(2000);
      
      // Check for error messages
      const errorMessages = await page.locator('.sv-error').count();
      expect(errorMessages).toBe(0);
    }
  });

  // Test 6: AI chat interaction smoke test
  test('AI chat endpoint responds correctly', async ({ request }) => {
    // Send valid chat request
    const response = await request.post('/api/ai/chat', {
      data: {
        message: "What is the purpose of IPLC evaluation?",
        conversationId: "test-conversation"
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('conversationId');
  });

  // Test 7: Summary generation smoke test
  test('Summary generation handles data correctly', async ({ request }) => {
    // Create a test summary request
    const response = await request.post('/api/ai/summary', {
      data: {
        form_data: {
          question1: "Test answer 1",
          question2: "Test answer 2"
        },
        form_id: "test-form",
        submission_id: "test-submission"
      }
    });
    
    // Should either succeed or return appropriate error
    expect(response.status()).toBeLessThan(500); // Not a server error
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('summary');
    }
  });
});

// Performance regression tests
test.describe('Performance Regression Tests', () => {
  test('Page load performance within acceptable limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/form-dashboard.html');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
  
  test('No excessive DOM growth from repeated form interactions', async ({ page }) => {
    await page.goto('/evaluation.html');
    
    // Get initial DOM node count
    const initialNodeCount = await page.evaluate(() => {
      return document.getElementsByTagName('*').length;
    });
    
    // Perform repeated interactions
    for (let i = 0; i < 5; i++) {
      const inputs = await page.locator('input[type="text"]').all();
      for (const input of inputs.slice(0, 3)) { // Limit to first 3 inputs
        await input.fill(`Test ${i}`);
      }
      await page.waitForTimeout(500);
    }
    
    // Get final DOM node count
    const finalNodeCount = await page.evaluate(() => {
      return document.getElementsByTagName('*').length;
    });
    
    // DOM growth should be minimal (less than 20% increase)
    const nodeIncrease = finalNodeCount - initialNodeCount;
    const percentIncrease = (nodeIncrease / initialNodeCount) * 100;
    expect(percentIncrease).toBeLessThan(20);
  });
});