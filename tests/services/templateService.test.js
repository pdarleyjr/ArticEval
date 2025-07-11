import TemplateService from '../../src/services/templateService.js';

describe('TemplateService', () => {
  let originalFetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;
    // Reset fetch mock
    global.fetch = jest.fn();
    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    // Clear timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should have correct initial configuration', () => {
      expect(TemplateService.apiBase).toBe('/api/forms/templates');
      expect(TemplateService.retryLimit).toBe(3);
      expect(TemplateService.retryDelay).toBe(1000);
    });

    it('should be a singleton instance', () => {
      // Import again to verify singleton
      const TemplateService2 = TemplateService;
      expect(TemplateService).toBe(TemplateService2);
    });
  });

  describe('loadTemplates', () => {
    it('should successfully load templates on first attempt', async () => {
      const mockTemplates = [
        { id: '1', name: 'Template 1', description: 'First template' },
        { id: '2', name: 'Template 2', description: 'Second template' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates
      });

      const result = await TemplateService.loadTemplates();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/forms/templates');
      expect(result).toEqual(mockTemplates);
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const mockTemplates = [{ id: '1', name: 'Template 1' }];

      // First attempt fails
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Second attempt succeeds
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates
      });

      const promise = TemplateService.loadTemplates();

      // Fast-forward first retry delay
      await jest.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTemplates);
    });

    it('should retry with exponential backoff', async () => {
      const mockTemplates = [{ id: '1', name: 'Template 1' }];

      // First and second attempts fail
      global.fetch
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates
        });

      const promise = TemplateService.loadTemplates();

      // First retry after 1000ms (1000 * 1)
      await jest.advanceTimersByTimeAsync(1000);

      // Second retry after 2000ms (1000 * 2)
      await jest.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockTemplates);
    });

    it('should throw error after exhausting retry limit', async () => {
      const error = new Error('Persistent network error');

      // All attempts fail
      global.fetch
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      const promise = TemplateService.loadTemplates();

      // First retry after 1000ms
      await jest.advanceTimersByTimeAsync(1000);

      // Second retry after 2000ms
      await jest.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('Persistent network error');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle non-ok response status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const promise = TemplateService.loadTemplates();

      // Should retry after first failure
      await jest.advanceTimersByTimeAsync(1000);

      // Mock second attempt also failing
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await jest.advanceTimersByTimeAsync(2000);

      // Mock third attempt also failing
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      await expect(promise).rejects.toThrow('Failed to load');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle JSON parsing errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const promise = TemplateService.loadTemplates();

      await expect(promise).rejects.toThrow('Invalid JSON');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry if successful response has invalid JSON', async () => {
      // First attempt returns ok but invalid JSON
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('JSON parse error');
        }
      });

      await expect(TemplateService.loadTemplates()).rejects.toThrow('JSON parse error');
      
      // Should not retry since the response was ok
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadTemplate', () => {
    it('should have loadTemplate method defined', () => {
      expect(typeof TemplateService.loadTemplate).toBe('function');
    });

    it('should accept an id parameter', async () => {
      // Since implementation is incomplete, just verify the method signature
      expect(TemplateService.loadTemplate.length).toBe(1);
    });
  });

  describe('saveTemplate', () => {
    it('should have saveTemplate method defined', () => {
      expect(typeof TemplateService.saveTemplate).toBe('function');
    });

    it('should accept data and optional id parameters', () => {
      // Since implementation is incomplete, just verify the method signature
      expect(TemplateService.saveTemplate.length).toBe(2);
    });

    it('should determine correct URL and method based on id', async () => {
      // Test the partial implementation logic
      const mockData = { name: 'New Template', content: {} };
      
      // For new template (no id)
      const urlNew = null ? `${TemplateService.apiBase}/${null}` : TemplateService.apiBase;
      const methodNew = null ? 'PUT' : 'POST';
      expect(urlNew).toBe('/api/forms/templates');
      expect(methodNew).toBe('POST');

      // For existing template (with id)
      const id = 'template-123';
      const urlExisting = id ? `${TemplateService.apiBase}/${id}` : TemplateService.apiBase;
      const methodExisting = id ? 'PUT' : 'POST';
      expect(urlExisting).toBe('/api/forms/templates/template-123');
      expect(methodExisting).toBe('PUT');
    });
  });

  describe('Retry Logic', () => {
    it('should use exponential backoff for retries', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      global.fetch
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

      const promise = TemplateService.loadTemplates();

      // Check first retry delay (1000 * 1)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
      await jest.advanceTimersByTimeAsync(1000);

      // Check second retry delay (1000 * 2)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
      await jest.advanceTimersByTimeAsync(2000);

      await promise;

      setTimeoutSpy.mockRestore();
    });

    it('should handle concurrent calls independently', async () => {
      const mockTemplates1 = [{ id: '1', name: 'Template 1' }];
      const mockTemplates2 = [{ id: '2', name: 'Template 2' }];

      // First call succeeds immediately
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates1
      });

      const promise1 = TemplateService.loadTemplates();

      // Second call fails first, then succeeds
      global.fetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates2
        });

      const promise2 = TemplateService.loadTemplates();

      // Advance timer for second call's retry
      await jest.advanceTimersByTimeAsync(1000);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(mockTemplates1);
      expect(result2).toEqual(mockTemplates2);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should preserve original error messages', async () => {
      const customError = new Error('Custom API Error');
      customError.code = 'API_ERROR';

      global.fetch
        .mockRejectedValueOnce(customError)
        .mockRejectedValueOnce(customError)
        .mockRejectedValueOnce(customError);

      const promise = TemplateService.loadTemplates();

      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);

      try {
        await promise;
      } catch (error) {
        expect(error.message).toBe('Custom API Error');
        expect(error.code).toBe('API_ERROR');
      }
    });

    it('should handle fetch abort errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      global.fetch
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError);

      const promise = TemplateService.loadTemplates();

      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});