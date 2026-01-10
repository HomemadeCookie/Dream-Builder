// src/utils/db.js
const DB_NAME = 'DreamBuilderDB';
const DB_VERSION = 1;
const STORE_NAME = 'fields';

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  async saveField(field) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const fieldData = {
        ...field,
        lastModified: Date.now(),
        synced: field.synced ?? true
      };
      
      const request = store.put(fieldData);
      request.onsuccess = () => resolve(fieldData);
      request.onerror = () => reject(request.error);
    });
  }

  async getField(fieldId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fieldId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFields() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const fields = request.result;
        // Convert array to object keyed by id
        const fieldsObj = {};
        fields.forEach(field => {
          fieldsObj[field.id] = field;
        });
        resolve(fieldsObj);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateField(fieldId, updates) {
    await this.init();
    const field = await this.getField(fieldId);
    
    if (!field) {
      throw new Error(`Field ${fieldId} not found`);
    }

    const updatedField = {
      ...field,
      ...updates,
      lastModified: Date.now(),
      synced: false
    };

    return this.saveField(updatedField);
  }

  async deleteField(fieldId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fieldId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(fieldId) {
    await this.init();
    const field = await this.getField(fieldId);
    
    if (field) {
      field.synced = true;
      return this.saveField(field);
    }
  }

  async getUnsyncedFields() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(false);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async initializeDefaultData() {
    await this.init();
    
    const existingFields = await this.getAllFields();
    if (Object.keys(existingFields).length > 0) {
      return existingFields;
    }

    // Initialize with default data
    const defaultFields = {
      business: {
        id: 'business',
        name: 'Business',
        icon: '💼',
        progress: 0,
        timeSpent: 0,
        goal: 'Launch MVP by Q2',
        nextSteps: [
          { text: 'Get resort client', subtasks: [], completed: false },
          { text: 'Finalize Thesis Idea', subtasks: [], completed: false },
          { text: 'Build landing page', subtasks: [], completed: false },
          { text: 'Reach out to first 10 customers', subtasks: [], completed: false },
        ],
        milestones: 0,
        streak: 0,
        synced: true
      },
      tech: {
        id: 'tech',
        name: 'Tech',
        icon: '⚡',
        progress: 0,
        timeSpent: 0,
        goal: 'Master full-stack development',
        nextSteps: [
          { text: 'Develop Fullstack App', subtasks: [], completed: false },
          { text: 'Find Full-time Gig', subtasks: [], completed: false },
          { text: 'Learn system design', subtasks: [], completed: false },
          { text: 'Master TypeScript', subtasks: [], completed: false },
        ],
        milestones: 0,
        streak: 0,
        synced: true
      },
      physical: {
        id: 'physical',
        name: 'Physical',
        icon: '💪',
        progress: 0,
        timeSpent: 0,
        goal: 'Run a half marathon',
        nextSteps: [
          { text: 'Increase weekly mileage to 30km', subtasks: [], completed: false },
          { text: 'Add strength training 2x/week', subtasks: [], completed: false },
          { text: 'Join running club', subtasks: [], completed: false },
          { text: 'Focus on nutrition', subtasks: [], completed: false },
        ],
        milestones: 0,
        streak: 0,
        synced: true
      },
      social: {
        id: 'social',
        name: 'Social',
        icon: '🤝',
        progress: 0,
        timeSpent: 0,
        goal: 'Build meaningful connections',
        nextSteps: [
          { text: 'Attend 2 networking events/month', subtasks: [], completed: false },
          { text: 'Schedule coffee chats weekly', subtasks: [], completed: false },
          { text: 'Join community group', subtasks: [], completed: false },
          { text: 'Host a small gathering', subtasks: [], completed: false },
        ],
        milestones: 0,
        streak: 0,
        synced: true
      },
      misc: {
        id: 'misc',
        name: 'Misc',
        icon: '✨',
        progress: 0,
        timeSpent: 0,
        goal: 'Creative expression & hobbies',
        nextSteps: [
          { text: 'Practice guitar 3x/week', subtasks: [], completed: false },
          { text: 'Start photography course', subtasks: [], completed: false },
          { text: 'Read 2 books/month', subtasks: [], completed: false },
          { text: 'Write in journal daily', subtasks: [], completed: false },
        ],
        milestones: 0,
        streak: 0,
        synced: true
      }
    };

    // Save all default fields
    for (const field of Object.values(defaultFields)) {
      await this.saveField(field);
    }

    return defaultFields;
  }
}

export const db = new Database();