// API Service - Centralized API communication layer
import notifications from '../utils/notifications.js';

// API configuration
const API_CONFIG = {
  baseUrl: window.location.origin,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
};

// API endpoints
const ENDPOINTS = {
  // Forms
  forms: {
    list: '/api/forms',
    get: (id) => `/api/forms/${id}`,
    create: '/api/forms',
    update: (id) => `/api/forms/${id}`,
    delete: (id) => `/api/forms/${id}`,
    render: '/api/forms/render',
    submissions: '/api/forms/submissions',
    analytics: '/api/forms/analytics',
    templates: '/api/forms/templates'
  },

  // AI
  ai: {
    chat: '/api/ai/chat',
    summary: '/api/ai/summary',
    health: '/api/ai/chat/health'
  },

  // Auth
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    user: '/api/auth/user'
  },

  // Files
  files: {
    upload: '/api/files/upload',
    download: (id) => `/api/files/${id}`,
    delete: (id) => `/api/files/${id}`
  },

  // Templates
  templates: {
    list: '/api/templates',
    get: (id) => `/api/templates/${id}`,
    create: '/api/templates',
    update: (id) => `/api/templates/${id}`,
    delete: (id) => `/api/templates/${id}`
  }
};

// Request interceptors
const requestInterceptors = [];

// Response interceptors
const responseInterceptors = [];

// Active requests tracking for abort functionality
const activeRequests = new Map();

// Main API class
export class APIService {
  constructor(config = {}) {
    this.config = { ...API_CONFIG, ...config };
    this.authToken = null;
    this.refreshTokenPromise = null;
  }

  // Set authentication token
  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      this.config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.config.headers['Authorization'];
    }
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    requestInterceptors.push(interceptor);
    return () => {
      const index = requestInterceptors.indexOf(interceptor);
      if (index !== -1) {
        requestInterceptors.splice(index, 1);
      }
    };
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    responseInterceptors.push(interceptor);
    return () => {
      const index = responseInterceptors.indexOf(interceptor);
      if (index !== -1) {
        responseInterceptors.splice(index, 1);
      }
    };
  }

  // Build full URL
  buildUrl(endpoint, params = {}) {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);

    // Add query parameters
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  // Create abort controller
  createAbortController(requestId) {
    const controller = new AbortController();

    // Store controller
    activeRequests.set(requestId, controller);

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      activeRequests.delete(requestId);
    }, this.config.timeout);

    // Clear timeout on completion
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });

    return controller;
  }

  // Cancel request
  cancelRequest(requestId) {
    const controller = activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      activeRequests.delete(requestId);
    }
  }

  // Cancel all requests
  cancelAllRequests() {
    activeRequests.forEach((controller) => controller.abort());
    activeRequests.clear();
  }

  // Process request interceptors
  async processRequestInterceptors(config) {
    let processedConfig = config;

    for (const interceptor of requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
        throw error;
      }
    }

    return processedConfig;
  }

  // Process response interceptors
  async processResponseInterceptors(response) {
    let processedResponse = response;

    for (const interceptor of responseInterceptors) {
      try {
        processedResponse = await interceptor(processedResponse);
      } catch (error) {
        console.error('Response interceptor error:', error);
        throw error;
      }
    }

    return processedResponse;
  }

  // Main request method
  async request(method, endpoint, options = {}) {
    const {
      data,
      params,
      headers = {},
      retry = true,
      requestId = `${method}-${endpoint}-${Date.now()}`,
      onProgress,
      transformRequest,
      transformResponse
    } = options;

    // Create abort controller
    const controller = this.createAbortController(requestId);

    // Build request config
    let requestConfig = {
      method,
      headers: { ...this.config.headers, ...headers },
      signal: controller.signal,
      credentials: 'include'
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestConfig.body = transformRequest ? transformRequest(data) : JSON.stringify(data);
    }

    // Process request interceptors
    requestConfig = await this.processRequestInterceptors(requestConfig);

    // Build URL
    const url = this.buildUrl(endpoint, method === 'GET' ? { ...params, ...data } : params);

    try {
      // Make request
      let response = await fetch(url, requestConfig);

      // Handle progress for downloads
      if (onProgress && response.body) {
        response = await this.handleProgress(response, onProgress);
      }

      // Process response interceptors
      response = await this.processResponseInterceptors(response);

      // Handle response
      const result = await this.handleResponse(response, transformResponse);

      // Clean up
      activeRequests.delete(requestId);

      return result;
    } catch (error) {
      // Clean up
      activeRequests.delete(requestId);

      // Handle errors
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }

      // Retry logic
      if (retry && this.shouldRetry(error, options.retryCount || 0)) {
        return this.retryRequest(method, endpoint, {
          ...options,
          retryCount: (options.retryCount || 0) + 1
        });
      }

      throw error;
    }
  }

  // Handle response
  async handleResponse(response, transformResponse) {
    // Check if response is ok
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // Transform response if needed
    if (transformResponse) {
      data = transformResponse(data);
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
      ok: response.ok
    };
  }

  // Handle error response
  async handleErrorResponse(response) {
    let errorData;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    // Handle specific error codes
    switch (response.status) {
      case 401:
        // Unauthorized - try to refresh token
        if (this.authToken && !this.refreshTokenPromise) {
          this.refreshTokenPromise = this.refreshAuthToken();
          await this.refreshTokenPromise;
          this.refreshTokenPromise = null;
          // Retry original request
          throw new Error('RETRY_AFTER_REFRESH');
        }
        break;

      case 403:
        // Forbidden
        notifications.error('Access denied');
        break;

      case 404:
        // Not found
        notifications.error('Resource not found');
        break;

      case 429:
        // Rate limited
        const retryAfter = response.headers.get('Retry-After');
        showNotification(
          `Rate limited. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}`,
          'warning'
        );
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        notifications.error('Server error. Please try again later.');
        break;
    }

    const error = new Error(errorData.message || `HTTP ${response.status} error`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Should retry request
  shouldRetry(error, retryCount) {
    if (retryCount >= this.config.retryAttempts) {
      return false;
    }

    // Retry on network errors
    if (error.message === 'Failed to fetch') {
      return true;
    }

    // Retry on specific status codes
    if (error.status && [408, 429, 500, 502, 503, 504].includes(error.status)) {
      return true;
    }

    // Retry after token refresh
    if (error.message === 'RETRY_AFTER_REFRESH') {
      return true;
    }

    return false;
  }

  // Retry request
  async retryRequest(method, endpoint, options) {
    const delay = this.config.retryDelay * Math.pow(2, options.retryCount - 1);

    await new Promise((resolve) => setTimeout(resolve, delay));

    return this.request(method, endpoint, options);
  }

  // Handle progress for large responses
  async handleProgress(response, onProgress) {
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');

    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      // Call progress callback
      onProgress({
        loaded: receivedLength,
        total: contentLength,
        percent: contentLength ? (receivedLength / contentLength) * 100 : 0
      });
    }

    // Reconstruct the response
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }

    // Create new response with the data
    return new Response(chunksAll, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  // Refresh auth token
  async refreshAuthToken() {
    try {
      const result = await this.post(ENDPOINTS.auth.refresh);

      if (result.data.token) {
        this.setAuthToken(result.data.token);
        return result.data.token;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      // Clear token on refresh failure
      this.setAuthToken(null);

      // Redirect to login
      window.location.href = '/login';

      throw error;
    }
  }

  // HTTP method shortcuts
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, { ...options, data });
  }

  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, { ...options, data });
  }

  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, { ...options, data });
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  // File upload
  async upload(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional fields
    if (options.data) {
      Object.keys(options.data).forEach((key) => {
        formData.append(key, options.data[key]);
      });
    }

    return this.request('POST', endpoint, {
      ...options,
      data: formData,
      headers: {
        // Let browser set Content-Type with boundary
      },
      transformRequest: (data) => data // Don't JSON.stringify FormData
    });
  }

  // Download file
  async download(endpoint, options = {}) {
    const response = await this.request('GET', endpoint, {
      ...options,
      transformResponse: (data) => data // Return blob as-is
    });

    // Create download link
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response;
  }
}

// Create default instance
const api = new APIService();

// Setup default interceptors
api.addRequestInterceptor(async (config) => {
  // Add timestamp to prevent caching
  if (config.method === 'GET') {
    config.headers['Cache-Control'] = 'no-cache';
  }

  // Add CSRF token if available
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

api.addResponseInterceptor(async (response) => {
  // Log successful requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${response.status} ${response.url}`);
  }

  return response;
});

// Export instance and endpoints
export default api;
export { ENDPOINTS };

// Convenience methods for common operations
export const formsAPI = {
  list: (params) => api.get(ENDPOINTS.forms.list, { params }),
  get: (id) => api.get(ENDPOINTS.forms.get(id)),
  create: (data) => api.post(ENDPOINTS.forms.create, data),
  update: (id, data) => api.put(ENDPOINTS.forms.update(id), data),
  delete: (id) => api.delete(ENDPOINTS.forms.delete(id)),
  render: (data) => api.post(ENDPOINTS.forms.render, data),
  getSubmissions: (params) => api.get(ENDPOINTS.forms.submissions, { params }),
  getAnalytics: (params) => api.get(ENDPOINTS.forms.analytics, { params }),
  getTemplates: () => api.get(ENDPOINTS.forms.templates)
};

export const aiAPI = {
  chat: (data, options) => api.post(ENDPOINTS.ai.chat, data, options),
  summary: (data) => api.post(ENDPOINTS.ai.summary, data),
  checkHealth: () => api.get(ENDPOINTS.ai.health)
};

export const authAPI = {
  login: (credentials) => api.post(ENDPOINTS.auth.login, credentials),
  logout: () => api.post(ENDPOINTS.auth.logout),
  refresh: () => api.post(ENDPOINTS.auth.refresh),
  getUser: () => api.get(ENDPOINTS.auth.user)
};

export const filesAPI = {
  upload: (file, options) => api.upload(ENDPOINTS.files.upload, file, options),
  download: (id, filename) => api.download(ENDPOINTS.files.download(id), { filename }),
  delete: (id) => api.delete(ENDPOINTS.files.delete(id))
};

export const templatesAPI = {
  list: () => api.get(ENDPOINTS.templates.list),
  get: (id) => api.get(ENDPOINTS.templates.get(id)),
  create: (data) => api.post(ENDPOINTS.templates.create, data),
  update: (id, data) => api.put(ENDPOINTS.templates.update(id), data),
  delete: (id) => api.delete(ENDPOINTS.templates.delete(id))
};
