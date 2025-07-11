// Unit tests for API Service
import { jest } from '@jest/globals';
import { APIService, ENDPOINTS, formsAPI, aiAPI, authAPI, filesAPI, templatesAPI } from '../../src/services/api.js';
import * as notifications from '../../src/utils/notifications.js';

// Mock notifications
jest.mock('../../src/utils/notifications.js', () => ({
  showNotification: jest.fn()
}));

// Mock global objects
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: { addEventListener: jest.fn() },
  abort: jest.fn()
}));
global.FormData = jest.fn(() => ({
  append: jest.fn()
}));
global.URL = jest.fn((url) => ({
  toString: () => url,
  searchParams: {
    append: jest.fn()
  }
}));
global.Blob = jest.fn();
global.Response = jest.fn((data, init) => ({
  ...init,
  body: data,
  headers: new Map(Object.entries(init.headers || {}))
}));

// Mock document methods
const mockCSRFToken = 'test-csrf-token';
document.querySelector = jest.fn((selector) => {
  if (selector === 'meta[name="csrf-token"]') {
    return { content: mockCSRFToken };
  }
  return null;
});

// Mock DOM elements for download
const mockLink = {
  href: '',
  download: '',
  click: jest.fn()
};
document.createElement = jest.fn(() => mockLink);
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();
window.URL.createObjectURL = jest.fn(() => 'blob:url');
window.URL.revokeObjectURL = jest.fn();

describe('APIService', () => {
  let api;
  
  beforeEach(() => {
    api = new APIService();
    jest.clearAllMocks();
    fetch.mockReset();
  });
  
  describe('Constructor and Configuration', () => {
    it('should initialize with default config', () => {
      expect(api.config.baseUrl).toBe(window.location.origin);
      expect(api.config.timeout).toBe(30000);
      expect(api.config.retryAttempts).toBe(3);
      expect(api.config.retryDelay).toBe(1000);
    });
    
    it('should merge custom config', () => {
      const customApi = new APIService({
        baseUrl: 'https://api.example.com',
        timeout: 5000
      });
      
      expect(customApi.config.baseUrl).toBe('https://api.example.com');
      expect(customApi.config.timeout).toBe(5000);
      expect(customApi.config.retryAttempts).toBe(3); // Default retained
    });
  });
  
  describe('Authentication', () => {
    it('should set auth token', () => {
      api.setAuthToken('test-token');
      
      expect(api.authToken).toBe('test-token');
      expect(api.config.headers['Authorization']).toBe('Bearer test-token');
    });
    
    it('should remove auth token when set to null', () => {
      api.setAuthToken('test-token');
      api.setAuthToken(null);
      
      expect(api.authToken).toBeNull();
      expect(api.config.headers['Authorization']).toBeUndefined();
    });
  });
  
  describe('Interceptors', () => {
    it('should add and remove request interceptor', () => {
      const interceptor = jest.fn(config => config);
      const remove = api.addRequestInterceptor(interceptor);
      
      expect(typeof remove).toBe('function');
      
      // Should be called during request processing
      // We'll test this in the request tests
      
      remove();
      // Interceptor should be removed
    });
    
    it('should add and remove response interceptor', () => {
      const interceptor = jest.fn(response => response);
      const remove = api.addResponseInterceptor(interceptor);
      
      expect(typeof remove).toBe('function');
      
      remove();
      // Interceptor should be removed
    });
  });
  
  describe('URL Building', () => {
    it('should build URL without params', () => {
      const url = api.buildUrl('/api/test');
      expect(url).toContain('/api/test');
    });
    
    it('should build URL with query params', () => {
      URL.mockImplementation((url) => ({
        toString: () => `${url}?page=1&limit=10`,
        searchParams: {
          append: jest.fn()
        }
      }));
      
      const url = api.buildUrl('/api/test', { page: 1, limit: 10 });
      expect(url).toContain('?page=1&limit=10');
    });
    
    it('should ignore null and undefined params', () => {
      const appendMock = jest.fn();
      URL.mockImplementation((url) => ({
        toString: () => url,
        searchParams: { append: appendMock }
      }));
      
      api.buildUrl('/api/test', { 
        valid: 'value',
        nullParam: null,
        undefinedParam: undefined 
      });
      
      expect(appendMock).toHaveBeenCalledWith('valid', 'value');
      expect(appendMock).not.toHaveBeenCalledWith('nullParam', expect.anything());
      expect(appendMock).not.toHaveBeenCalledWith('undefinedParam', expect.anything());
    });
  });
  
  describe('Abort Controller', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should create abort controller with timeout', () => {
      const abortMock = jest.fn();
      const addEventListenerMock = jest.fn();
      
      AbortController.mockImplementation(() => ({
        signal: { addEventListener: addEventListenerMock },
        abort: abortMock
      }));
      
      const controller = api.createAbortController('test-request');
      
      // Fast-forward timeout
      jest.advanceTimersByTime(api.config.timeout);
      
      expect(abortMock).toHaveBeenCalled();
    });
    
    it('should cancel specific request', () => {
      const abortMock = jest.fn();
      
      AbortController.mockImplementation(() => ({
        signal: { addEventListener: jest.fn() },
        abort: abortMock
      }));
      
      api.createAbortController('test-request');
      api.cancelRequest('test-request');
      
      expect(abortMock).toHaveBeenCalled();
    });
    
    it('should cancel all requests', () => {
      const abortMocks = [jest.fn(), jest.fn()];
      let callCount = 0;
      
      AbortController.mockImplementation(() => ({
        signal: { addEventListener: jest.fn() },
        abort: abortMocks[callCount++]
      }));
      
      api.createAbortController('request-1');
      api.createAbortController('request-2');
      api.cancelAllRequests();
      
      expect(abortMocks[0]).toHaveBeenCalled();
      expect(abortMocks[1]).toHaveBeenCalled();
    });
  });
  
  describe('Request Method', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ success: true })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await api.get('/api/test');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-Token': mockCSRFToken
          })
        })
      );
      
      expect(result.data).toEqual({ success: true });
      expect(result.status).toBe(200);
    });
    
    it('should make successful POST request with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ id: 123 })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const postData = { name: 'Test Form' };
      const result = await api.post('/api/forms', postData);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/forms'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      
      expect(result.data).toEqual({ id: 123 });
    });
    
    it('should handle text response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        text: jest.fn().mockResolvedValue('Plain text response')
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await api.get('/api/text');
      expect(result.data).toBe('Plain text response');
    });
    
    it('should handle blob response', async () => {
      const mockBlob = new Blob(['file content']);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/octet-stream']]),
        blob: jest.fn().mockResolvedValue(mockBlob)
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await api.get('/api/file');
      expect(result.data).toBe(mockBlob);
    });
    
    it('should apply request interceptors', async () => {
      const interceptor = jest.fn(config => ({
        ...config,
        headers: { ...config.headers, 'X-Custom': 'header' }
      }));
      
      api.addRequestInterceptor(interceptor);
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({})
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await api.get('/api/test');
      
      expect(interceptor).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'header'
          })
        })
      );
    });
    
    it('should apply response interceptors', async () => {
      const interceptor = jest.fn(response => response);
      
      api.addResponseInterceptor(interceptor);
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({})
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await api.get('/api/test');
      
      expect(interceptor).toHaveBeenCalledWith(mockResponse);
    });
    
    it('should use transform functions', async () => {
      const transformRequest = jest.fn(data => `transformed-${JSON.stringify(data)}`);
      const transformResponse = jest.fn(data => ({ transformed: data }));
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ original: true })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await api.post('/api/test', { data: 'test' }, {
        transformRequest,
        transformResponse
      });
      
      expect(transformRequest).toHaveBeenCalledWith({ data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: 'transformed-{"data":"test"}'
        })
      );
      
      expect(transformResponse).toHaveBeenCalledWith({ original: true });
      expect(result.data).toEqual({ transformed: { original: true } });
    });
  });
  
  describe('Error Handling', () => {
    it('should handle 401 unauthorized', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ message: 'Token expired' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      // Mock refresh token to fail
      api.authToken = 'expired-token';
      api.refreshAuthToken = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      
      await expect(api.get('/api/protected')).rejects.toThrow('Token expired');
    });
    
    it('should handle 403 forbidden', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: jest.fn().mockResolvedValue({ message: 'Access denied' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await expect(api.get('/api/admin')).rejects.toThrow('Access denied');
      expect(notifications.showNotification).toHaveBeenCalledWith('Access denied', 'error');
    });
    
    it('should handle 404 not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ message: 'Resource not found' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await expect(api.get('/api/missing')).rejects.toThrow('Resource not found');
      expect(notifications.showNotification).toHaveBeenCalledWith('Resource not found', 'error');
    });
    
    it('should handle 429 rate limit', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '60']]),
        json: jest.fn().mockResolvedValue({ message: 'Rate limited' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await expect(api.get('/api/limited')).rejects.toThrow('Rate limited');
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Rate limited. Please try again in 60 seconds',
        'warning'
      );
    });
    
    it('should handle 500 server error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await expect(api.get('/api/error')).rejects.toThrow('Server error');
      expect(notifications.showNotification).toHaveBeenCalledWith(
        'Server error. Please try again later.',
        'error'
      );
    });
    
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      await expect(api.get('/api/test')).rejects.toThrow('Failed to fetch');
    });
    
    it('should handle abort errors', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      
      fetch.mockRejectedValueOnce(abortError);
      
      await expect(api.get('/api/test')).rejects.toThrow('Request cancelled');
    });
  });
  
  describe('Retry Logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should retry on network failure', async () => {
      // First two attempts fail, third succeeds
      fetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: jest.fn().mockResolvedValue({ success: true })
        });
      
      const promise = api.get('/api/test');
      
      // Advance timers for retries
      await jest.advanceTimersByTimeAsync(1000); // First retry
      await jest.advanceTimersByTimeAsync(2000); // Second retry (exponential backoff)
      
      const result = await promise;
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result.data).toEqual({ success: true });
    });
    
    it('should retry on 500 errors', async () => {
      const error500 = {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      };
      
      const success = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ success: true })
      };
      
      fetch
        .mockResolvedValueOnce(error500)
        .mockResolvedValueOnce(success);
      
      const promise = api.get('/api/test');
      
      await jest.advanceTimersByTimeAsync(1000);
      
      const result = await promise;
      
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ success: true });
    });
    
    it('should not retry after max attempts', async () => {
      fetch.mockRejectedValue(new Error('Failed to fetch'));
      
      const promise = api.get('/api/test');
      
      // Advance through all retry attempts
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);
      await jest.advanceTimersByTimeAsync(4000);
      
      await expect(promise).rejects.toThrow('Failed to fetch');
      expect(fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
    
    it('should not retry when retry option is false', async () => {
      fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      await expect(api.get('/api/test', { retry: false })).rejects.toThrow('Failed to fetch');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Progress Handling', () => {
    it('should track download progress', async () => {
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9])
      ];
      
      let chunkIndex = 0;
      const reader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: false, value: chunks[1] })
          .mockResolvedValueOnce({ done: false, value: chunks[2] })
          .mockResolvedValueOnce({ done: true })
      };
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'application/octet-stream'],
          ['Content-Length', '9']
        ]),
        body: { getReader: () => reader }
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const progressUpdates = [];
      const onProgress = jest.fn(progress => progressUpdates.push(progress));
      
      // Mock Response constructor to return proper response
      Response.mockImplementation((data, init) => ({
        ok: true,
        status: init.status,
        headers: new Map(Object.entries(init.headers || {})),
        blob: jest.fn().mockResolvedValue(new Blob([data]))
      }));
      
      await api.get('/api/download', { onProgress });
      
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(progressUpdates[0]).toEqual({ loaded: 3, total: 9, percent: 33.33333333333333 });
      expect(progressUpdates[1]).toEqual({ loaded: 6, total: 9, percent: 66.66666666666666 });
      expect(progressUpdates[2]).toEqual({ loaded: 9, total: 9, percent: 100 });
    });
  });
  
  describe('File Operations', () => {
    it('should upload file', async () => {
      const mockFile = new Blob(['test content'], { type: 'text/plain' });
      mockFile.name = 'test.txt';
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ fileId: '123' })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      const formDataAppend = jest.fn();
      FormData.mockImplementation(() => ({
        append: formDataAppend
      }));
      
      const result = await api.upload('/api/upload', mockFile, {
        data: { description: 'Test file' }
      });
      
      expect(formDataAppend).toHaveBeenCalledWith('file', mockFile);
      expect(formDataAppend).toHaveBeenCalledWith('description', 'Test file');
      expect(result.data).toEqual({ fileId: '123' });
    });
    
    it('should download file', async () => {
      const mockBlob = new Blob(['file content']);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/octet-stream']]),
        blob: jest.fn().mockResolvedValue(mockBlob)
      };
      
      fetch.mockResolvedValueOnce(mockResponse);
      
      await api.download('/api/download/123', { filename: 'document.pdf' });
      
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.download).toBe('document.pdf');
      expect(mockLink.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
  });
  
  describe('Convenience Methods', () => {
    beforeEach(() => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: jest.fn().mockResolvedValue({ success: true })
      };
      
      fetch.mockResolvedValue(mockResponse);
    });
    
    it('should provide HTTP method shortcuts', async () => {
      await api.get('/test');
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'GET' }));
      
      await api.post('/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'POST' }));
      
      await api.put('/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PUT' }));
      
      await api.patch('/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }));
      
      await api.delete('/test');
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
    });
  });
});

describe('API Convenience Methods', () => {
  let mockGet, mockPost, mockPut, mockDelete, mockUpload, mockDownload;
  
  beforeEach(() => {
    // Create a mock API instance
    mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
    mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
    mockPut = jest.fn().mockResolvedValue({ data: { success: true } });
    mockDelete = jest.fn().mockResolvedValue({ data: { success: true } });
    mockUpload = jest.fn().mockResolvedValue({ data: { success: true } });
    mockDownload = jest.fn().mockResolvedValue({ data: { success: true } });
    
    // Mock the default export
    jest.unstable_mockModule('../../src/services/api.js', () => ({
      default: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
        upload: mockUpload,
        download: mockDownload
      },
      ENDPOINTS,
      formsAPI,
      aiAPI,
      authAPI,
      filesAPI,
      templatesAPI
    }));
  });
  
  describe('formsAPI', () => {
    it('should call correct endpoints', async () => {
      await formsAPI.list({ page: 1 });
      expect(mockGet).toHaveBeenCalledWith('/api/forms', { params: { page: 1 } });
      
      await formsAPI.get('123');
      expect(mockGet).toHaveBeenCalledWith('/api/forms/123');
      
      await formsAPI.create({ name: 'Test' });
      expect(mockPost).toHaveBeenCalledWith('/api/forms', { name: 'Test' });
      
      await formsAPI.update('123', { name: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/api/forms/123', { name: 'Updated' });
      
      await formsAPI.delete('123');
      expect(mockDelete).toHaveBeenCalledWith('/api/forms/123');
    });
  });
  
  describe('aiAPI', () => {
    it('should call correct endpoints', async () => {
      await aiAPI.chat({ message: 'Hello' }, { timeout: 60000 });
      expect(mockPost).toHaveBeenCalledWith('/api/ai/chat', { message: 'Hello' }, { timeout: 60000 });
      
      await aiAPI.summary({ formId: '123' });
      expect(mockPost).toHaveBeenCalledWith('/api/ai/summary', { formId: '123' });
      
      await aiAPI.checkHealth();
      expect(mockGet).toHaveBeenCalledWith('/api/ai/chat/health');
    });
  });
  
  describe('authAPI', () => {
    it('should call correct endpoints', async () => {
      await authAPI.login({ username: 'test', password: 'pass' });
      expect(mockPost).toHaveBeenCalledWith('/api/auth/login', { username: 'test', password: 'pass' });
      
      await authAPI.logout();
      expect(mockPost).toHaveBeenCalledWith('/api/auth/logout');
      
      await authAPI.refresh();
      expect(mockPost).toHaveBeenCalledWith('/api/auth/refresh');
      
      await authAPI.getUser();
      expect(mockGet).toHaveBeenCalledWith('/api/auth/user');
    });
  });
  
  describe('filesAPI', () => {
    it('should call correct endpoints', async () => {
      const mockFile = new Blob(['content']);
      
      await filesAPI.upload(mockFile, { onProgress: jest.fn() });
      expect(mockUpload).toHaveBeenCalledWith('/api/files/upload', mockFile, { onProgress: expect.any(Function) });
      
      await filesAPI.download('123', 'document.pdf');
      expect(mockDownload).toHaveBeenCalledWith('/api/files/123', { filename: 'document.pdf' });
      
      await filesAPI.delete('123');
      expect(mockDelete).toHaveBeenCalledWith('/api/files/123');
    });
  });
  
  describe('templatesAPI', () => {
    it('should call correct endpoints', async () => {
      await templatesAPI.list();
      expect(mockGet).toHaveBeenCalledWith('/api/templates');
      
      await templatesAPI.get('123');
      expect(mockGet).toHaveBeenCalledWith('/api/templates/123');
      
      await templatesAPI.create({ name: 'Template' });
      expect(mockPost).toHaveBeenCalledWith('/api/templates', { name: 'Template' });
      
      await templatesAPI.update('123', { name: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/api/templates/123', { name: 'Updated' });
      
      await templatesAPI.delete('123');
      expect(mockDelete).toHaveBeenCalledWith('/api/templates/123');
    });
  });
});