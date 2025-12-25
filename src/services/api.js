// src/services/api.js
import { db } from '../utils/db';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const USER_ID = 'user123'; // Replace with actual auth later

class ApiService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async initialize() {
    try {
      await db.init();
      return await db.initializeDefaultData();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async fetchFields() {
    try {
      await db.init();
      
      // Always get from IndexedDB first for instant loading
      const localData = await db.getAllFields();
      
      // If online, try to sync with server in the background
      if (this.isOnline) {
        this.syncWithServer().catch(err => {
          console.error('Background sync failed:', err);
        });
      }
      
      return localData;
    } catch (error) {
      console.error('Error fetching fields:', error);
      return {};
    }
  }

  async syncWithServer() {
    try {
      const response = await fetch(`${API_URL}/fields/${USER_ID}`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const serverData = await response.json();
        
        // Update local data with server data
        for (const field of serverData) {
          await db.saveField({ ...field, synced: true });
        }
        
        return serverData;
      }
    } catch (error) {
      // Server not available, continue with local data
      console.log('Server not available, using local data');
    }
  }

  async updateField(fieldId, updates) {
    try {
      await db.init();
      
      // Update locally first for instant feedback
      const updatedField = await db.updateField(fieldId, updates);

      // If online, try to sync to server
      if (this.isOnline) {
        try {
          const response = await fetch(`${API_URL}/fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: USER_ID,
              fieldId,
              ...updates
            }),
            timeout: 5000
          });
          
          if (response.ok) {
            await db.markAsSynced(fieldId);
          }
        } catch (error) {
          console.log('Server update failed, will sync later');
        }
      }
      
      return updatedField;
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  }

  async updateProgress(fieldId, progress) {
    return this.updateField(fieldId, { progress });
  }

  async addTimeSpent(fieldId, hours) {
    const field = await db.getField(fieldId);
    const newTime = (field?.timeSpent || 0) + hours;
    return this.updateField(fieldId, { timeSpent: newTime });
  }

  async updateMilestone(fieldId, increment = 1) {
    const field = await db.getField(fieldId);
    const newMilestones = (field?.milestones || 0) + increment;
    return this.updateField(fieldId, { milestones: Math.max(0, newMilestones) });
  }

  async updateStreak(fieldId, streak) {
    return this.updateField(fieldId, { streak });
  }

  async updateGoal(fieldId, goal) {
    return this.updateField(fieldId, { goal });
  }

  async addNextStep(fieldId, step) {
    const field = await db.getField(fieldId);
    const nextSteps = [...(field?.nextSteps || []), step];
    return this.updateField(fieldId, { nextSteps });
  }

  async updateNextStep(fieldId, stepIndex, newText) {
    const field = await db.getField(fieldId);
    const nextSteps = [...(field?.nextSteps || [])];
    nextSteps[stepIndex] = newText;
    return this.updateField(fieldId, { nextSteps });
  }

  async removeNextStep(fieldId, stepIndex) {
    const field = await db.getField(fieldId);
    const nextSteps = [...(field?.nextSteps || [])];
    nextSteps.splice(stepIndex, 1);
    return this.updateField(fieldId, { nextSteps });
  }

  async toggleNextStepComplete(fieldId, stepIndex) {
    const field = await db.getField(fieldId);
    const nextSteps = [...(field?.nextSteps || [])];
    
    if (typeof nextSteps[stepIndex] === 'string') {
      // Convert to object format
      nextSteps[stepIndex] = {
        text: nextSteps[stepIndex],
        completed: true
      };
    } else {
      nextSteps[stepIndex].completed = !nextSteps[stepIndex].completed;
    }
    
    return this.updateField(fieldId, { nextSteps });
  }

  async syncOfflineData() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      await db.init();
      const unsyncedFields = await db.getUnsyncedFields();
      
      if (unsyncedFields.length === 0) {
        console.log('No data to sync');
        return;
      }
      
      console.log(`Syncing ${unsyncedFields.length} fields...`);
      
      for (const field of unsyncedFields) {
        try {
          const response = await fetch(`${API_URL}/fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: USER_ID,
              ...field
            }),
            timeout: 5000
          });
          
          if (response.ok) {
            await db.markAsSynced(field.id);
            console.log(`Synced field: ${field.id}`);
          }
        } catch (error) {
          console.error(`Failed to sync field ${field.id}:`, error);
        }
      }
      
      console.log('Sync complete!');
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async resetAllData() {
    await db.clearAll();
    return await db.initializeDefaultData();
  }

  getConnectionStatus() {
    return this.isOnline;
  }

  async getUnsyncedCount() {
    await db.init();
    const unsynced = await db.getUnsyncedFields();
    return unsynced.length;
  }
}

export const apiService = new ApiService();