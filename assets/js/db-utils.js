// Database utilities for managing evaluation data using Dexie.js
// This implementation uses Dexie.js for better IndexedDB management

// Import Dexie from CDN in index.html
// <script src="https://unpkg.com/dexie@latest/dist/dexie.min.js"></script>

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class EvaluationDatabase {
    constructor() {
        this.dbName = 'evaluationDB';
        this.db = null;
        this.isInitialized = false;
        this.initPromise = null;
    }

    // Initialize the database
    async init() {
        if (this.isInitialized) return Promise.resolve();
        
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = new Promise((resolve, reject) => {
            try {
                // Check if Dexie is available
                if (typeof Dexie === 'undefined') {
                    // Fallback to native IndexedDB if Dexie is not available
                    return this.initWithIndexedDB().then(resolve).catch(reject);
                }
                
                // Initialize with Dexie
                this.db = new Dexie(this.dbName);
                
                // Define database schema
                this.db.version(1).stores({
                    evaluations: '++id, patientName, dateCreated, *concerns, age',
                    referenceData: 'id, type, dateCreated'
                });
                
                // Open the database
                this.db.open()
                    .then(() => {
                        console.log('Database opened successfully with Dexie');
                        this.isInitialized = true;
                        resolve();
                    })
                    .catch(error => {
                        console.error('Failed to open database with Dexie:', error);
                        // Fallback to native IndexedDB
                        this.initWithIndexedDB().then(resolve).catch(reject);
                    });
            } catch (error) {
                console.error('Error initializing database with Dexie:', error);
                // Fallback to native IndexedDB
                this.initWithIndexedDB().then(resolve).catch(reject);
            }
        });
        
        return this.initPromise;
    }
    
    // Fallback to native IndexedDB if Dexie is not available
    async initWithIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => {
                reject(new Error('Failed to open database with IndexedDB'));
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('Database opened successfully with native IndexedDB');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('evaluations')) {
                    const store = db.createObjectStore('evaluations', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('dateCreated', 'dateCreated', { unique: false });
                    store.createIndex('patientName', 'patientName', { unique: false });
                    store.createIndex('age', 'age', { unique: false });
                    console.log('Created evaluations store and indices');
                }
                
                if (!db.objectStoreNames.contains('referenceData')) {
                    const store = db.createObjectStore('referenceData', { keyPath: 'id' });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('dateCreated', 'dateCreated', { unique: false });
                    console.log('Created reference data store and indices');
                }
            };
        });
    }

    // Validate evaluation data
    validateEvaluation(data) {
        if (!data || typeof data !== 'object') {
            throw new ValidationError('Invalid evaluation data format');
        }
        
        // For reference data, only require an ID
        if (data.isReferenceData) {
            if (!data.id) {
                throw new ValidationError('Reference data requires an ID');
            }
            return;
        }

        const requiredFields = ['firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }

    // Store evaluation data
    async storeEvaluation(data) {
        await this.init();
        
        try {
            // Determine if this is reference data
            const isReferenceData = data.isReferenceData || false;
            
            // Validate data
            this.validateEvaluation(isReferenceData ? { ...data, isReferenceData: true } : data);
            
            // Prepare data for storage
            const storeName = isReferenceData ? 'referenceData' : 'evaluations';
            const storeData = isReferenceData ? data : {
                ...data,
                dateCreated: new Date(),
                lastModified: new Date(),
                patientName: `${data.firstName} ${data.lastName}`.trim()
            };
            
            // Store data using Dexie if available
            if (this.db instanceof Dexie) {
                return await this.db.table(storeName).add(storeData);
            }
            
            // Fallback to native IndexedDB
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(storeData);
                
                request.onsuccess = () => {
                    console.log('Successfully stored data:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    reject(new Error('Failed to store data'));
                };
            });
        } catch (error) {
            console.error('Error storing evaluation:', error);
            throw error;
        }
    }

    // Retrieve evaluation by ID
    async getEvaluation(id) {
        await this.init();
        
        try {
            // Use Dexie if available
            if (this.db instanceof Dexie) {
                // Try to get from evaluations first
                let result = await this.db.evaluations.get(id);
                
                // If not found, try reference data
                if (!result) {
                    result = await this.db.referenceData.get(id);
                }
                
                if (!result) {
                    throw new ValidationError(`Evaluation not found with ID: ${id}`);
                }
                
                return result;
            }
            
            // Fallback to native IndexedDB
            return new Promise((resolve, reject) => {
                // Try evaluations first
                const transaction = this.db.transaction(['evaluations'], 'readonly');
                const store = transaction.objectStore('evaluations');
                const request = store.get(id);
                
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result);
                    } else {
                        // Try reference data
                        const refTransaction = this.db.transaction(['referenceData'], 'readonly');
                        const refStore = refTransaction.objectStore('referenceData');
                        const refRequest = refStore.get(id);
                        
                        refRequest.onsuccess = () => {
                            if (refRequest.result) {
                                resolve(refRequest.result);
                            } else {
                                reject(new ValidationError(`Evaluation not found with ID: ${id}`));
                            }
                        };
                        
                        refRequest.onerror = () => {
                            reject(new Error('Failed to retrieve evaluation'));
                        };
                    }
                };
                
                request.onerror = () => {
                    reject(new Error('Failed to retrieve evaluation'));
                };
            });
        } catch (error) {
            console.error('Error retrieving evaluation:', error);
            throw error;
        }
    }

    // Update existing evaluation
    async updateEvaluation(id, data) {
        await this.init();
        
        try {
            // Validate data
            this.validateEvaluation(data);
            
            // Use Dexie if available
            if (this.db instanceof Dexie) {
                // Check if evaluation exists
                const existing = await this.db.evaluations.get(id);
                
                if (!existing) {
                    throw new ValidationError(`Evaluation not found with ID: ${id}`);
                }
                
                // Update evaluation
                const updatedEvaluation = {
                    ...existing,
                    ...data,
                    lastModified: new Date()
                };
                
                await this.db.evaluations.put(updatedEvaluation);
                return id;
            }
            
            // Fallback to native IndexedDB
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['evaluations'], 'readwrite');
                const store = transaction.objectStore('evaluations');
                
                // Get existing evaluation
                const getRequest = store.get(id);
                
                getRequest.onsuccess = () => {
                    if (!getRequest.result) {
                        reject(new ValidationError(`Evaluation not found with ID: ${id}`));
                        return;
                    }
                    
                    // Update evaluation
                    const updatedEvaluation = {
                        ...getRequest.result,
                        ...data,
                        lastModified: new Date()
                    };
                    
                    const putRequest = store.put(updatedEvaluation);
                    
                    putRequest.onsuccess = () => {
                        resolve(id);
                    };
                    
                    putRequest.onerror = () => {
                        reject(new Error('Failed to update evaluation'));
                    };
                };
                
                getRequest.onerror = () => {
                    reject(new Error('Failed to retrieve evaluation for update'));
                };
            });
        } catch (error) {
            console.error('Error updating evaluation:', error);
            throw error;
        }
    }

    // Delete evaluation
    async deleteEvaluation(id) {
        await this.init();
        
        try {
            // Use Dexie if available
            if (this.db instanceof Dexie) {
                // Check if evaluation exists
                const existing = await this.db.evaluations.get(id);
                
                if (!existing) {
                    throw new ValidationError(`Evaluation not found with ID: ${id}`);
                }
                
                // Delete evaluation
                await this.db.evaluations.delete(id);
                return;
            }
            
            // Fallback to native IndexedDB
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['evaluations'], 'readwrite');
                const store = transaction.objectStore('evaluations');
                
                // Get existing evaluation
                const getRequest = store.get(id);
                
                getRequest.onsuccess = () => {
                    if (!getRequest.result) {
                        reject(new ValidationError(`Evaluation not found with ID: ${id}`));
                        return;
                    }
                    
                    // Delete evaluation
                    const deleteRequest = store.delete(id);
                    
                    deleteRequest.onsuccess = () => {
                        resolve();
                    };
                    
                    deleteRequest.onerror = () => {
                        reject(new Error('Failed to delete evaluation'));
                    };
                };
                
                getRequest.onerror = () => {
                    reject(new Error('Failed to retrieve evaluation for deletion'));
                };
            });
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            throw error;
        }
    }

    // Get all evaluations with filtering options
    async getAllEvaluations(options = {}) {
        await this.init();
        
        try {
            // Use Dexie if available
            if (this.db instanceof Dexie) {
                let collection = this.db.evaluations.toCollection();
                
                // Apply filters
                if (options.fromDate) {
                    collection = collection.filter(record => 
                        new Date(record.dateCreated) >= new Date(options.fromDate)
                    );
                }
                
                if (options.toDate) {
                    collection = collection.filter(record => 
                        new Date(record.dateCreated) <= new Date(options.toDate)
                    );
                }
                
                return await collection.toArray();
            }
            
            // Fallback to native IndexedDB
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['evaluations'], 'readonly');
                const store = transaction.objectStore('evaluations');
                const request = store.getAll();
                
                request.onsuccess = () => {
                    let records = request.result;
                    
                    // Apply filters
                    if (options.fromDate) {
                        records = records.filter(record => 
                            new Date(record.dateCreated) >= new Date(options.fromDate)
                        );
                    }
                    
                    if (options.toDate) {
                        records = records.filter(record => 
                            new Date(record.dateCreated) <= new Date(options.toDate)
                        );
                    }
                    
                    resolve(records);
                };
                
                request.onerror = () => {
                    reject(new Error('Failed to retrieve evaluations'));
                };
            });
        } catch (error) {
            console.error('Error retrieving evaluations:', error);
            throw error;
        }
    }

    // Find similar cases based on age and concerns
    async findSimilarCases(data, limit = 5) {
        await this.init();
        
        try {
            // Get age in months
            const ageInMonths = getAgeInMonths(data.age);
            const minAge = ageInMonths - 12;
            const maxAge = ageInMonths + 12;
            
            // Use Dexie if available
            if (this.db instanceof Dexie) {
                return await this.db.evaluations
                    .filter(record => {
                        const evalAgeMonths = getAgeInMonths(record.age);
                        return evalAgeMonths >= minAge && evalAgeMonths <= maxAge;
                    })
                    .limit(limit)
                    .toArray();
            }
            
            // Fallback to native IndexedDB
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['evaluations'], 'readonly');
                const store = transaction.objectStore('evaluations');
                const request = store.getAll();
                
                request.onsuccess = () => {
                    let records = request.result;
                    
                    // Filter by age
                    records = records.filter(record => {
                        const recordAgeMonths = getAgeInMonths(record.age);
                        return recordAgeMonths >= minAge && recordAgeMonths <= maxAge;
                    });
                    
                    // Limit results
                    if (records.length > limit) {
                        records = records.slice(0, limit);
                    }
                    
                    resolve(records);
                };
                
                request.onerror = () => {
                    reject(new Error('Failed to retrieve similar cases'));
                };
            });
        } catch (error) {
            console.error('Error finding similar cases:', error);
            throw error;
        }
    }

    // Close the database connection
    async close() {
        if (this.db) {
            if (this.db instanceof Dexie) {
                this.db.close();
            } else {
                this.db.close();
            }
            
            this.db = null;
            this.isInitialized = false;
            this.initPromise = null;
            console.log('Database connection closed');
        }
    }
}

// Helper function to convert age to months
function getAgeInMonths(ageString) {
    if (!ageString) return 0;
    
    // If age is already an object with years and months
    if (typeof ageString === 'object' && ageString !== null) {
        const years = ageString.years || 0;
        const months = ageString.months || 0;
        return years * 12 + months;
    }
    
    // If age is a string in the format "X years, Y months"
    const match = String(ageString).match(/(\d+)\s*years?,?\s*(\d+)?\s*months?/i);
    if (match) {
        const years = parseInt(match[1]) || 0;
        const months = parseInt(match[2]) || 0;
        return years * 12 + months;
    }
    
    // If age is a number (assumed to be years)
    const years = parseInt(ageString);
    if (!isNaN(years)) {
        return years * 12;
    }
    
    return 0;
}

// Create and export singleton instance
export const dbManager = new EvaluationDatabase();