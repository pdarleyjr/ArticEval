// Template Service for API interactions and retry logic

class TemplateService {
    constructor() {
        this.apiBase = '/api/forms/templates';
        this.retryLimit = 3;
        this.retryDelay = 1000; // ms
    }

    async loadTemplates() {
        // Logic for fetching templates with retries
        for (let attempt = 1; attempt <= this.retryLimit; attempt++) {
            try {
                const response = await fetch(this.apiBase);
                if (!response.ok) throw new Error('Failed to load');
                return await response.json();
            } catch (error) {
                if (attempt === this.retryLimit) throw error;
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    async loadTemplate(id) {
        // Similar with retries
    }

    async saveTemplate(data, id = null) {
        const url = id ? `${this.apiBase}/${id}` : this.apiBase;
        const method = id ? 'PUT' : 'POST';
        // Fetch with retries
    }

    // Other template-related methods
}

export default new TemplateService();