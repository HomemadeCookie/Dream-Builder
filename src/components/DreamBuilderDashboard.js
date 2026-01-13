import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock, TrendingUp, CheckCircle2, Menu, X, Flame, Calendar, Wifi, WifiOff, RefreshCw, Play, Pause, Square } from 'lucide-react';
import { supabaseService } from '../services/supabaseService.js'; 
import { offlineService } from '../services/offlineService.js';
import { supabase } from '../lib/supabase.js';
import ExpandableTask from './ExpandableTask.js';
import { storageService } from '../services/storageService.js'


const EditableText = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    if (text !== value) {
      onSave(text);
    }
  };

  if (isEditing) {
    return (
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 600,
          outline: 'none'
        }}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        cursor: 'pointer',
        fontSize: '20px',
        fontWeight: 600
      }}
    >
      {value}
    </div>
  );
};

// Add this component near the top of the file, after EditableText
const RadarChart = ({ data }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 40;
    const sides = data.length;
    const angleStep = (Math.PI * 2) / sides;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value), 10);
    
    // 1. Draw Background Pentagon Grid
    const levels = 5;
    ctx.lineWidth = 1;
    for (let i = levels; i > 0; i--) {
      const radius = (maxRadius / levels) * i;
      ctx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const angle = angleStep * j - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();
    }
    
    // 2. Draw Axes and Icons
    data.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;
      
      // Axis Line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();
      
      // Icon Only
      const iconDistance = maxRadius + 25;
      const iconX = centerX + Math.cos(angle) * iconDistance;
      const iconY = centerY + Math.sin(angle) * iconDistance;
      
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, iconX, iconY);
    });
    
    // 3. Draw Data Polygon
    ctx.beginPath();
    data.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = Math.min(item.value, maxValue);
      const radius = (value / maxValue) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    
    // Fill with Raycast Red Gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 78, 78, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 78, 78, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Sharp Red Stroke
    ctx.strokeStyle = '#ff4e4e';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // 4. Draw Glow Points
    data.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = Math.min(item.value, maxValue);
      const radius = (value / maxValue) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4e4e';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff4e4e';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow for other elements
    });
    
  }, [data]);
  
  return (
    <div style={{ 
      background: '#000', 
      padding: '20px', 
      borderRadius: '24px',
      border: '1px solid #262626'
    }}>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400}
        style={{ width: '100%', height: 'auto', maxWidth: '400px' }}
      />
    </div>
  );
};

// Replace the apiService in DreamBuilderDashboard.js with this:
// Import at the top: import { offlineService } from '../services/offlineService.js'

// Replace your apiService.initialize with this version:

const apiService = {
  initialize: async () => {
    return await storageService.initialize()
  },
  
  updateProgress: async (fieldId, newProgress) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      data[fieldId].progress = newProgress
      await storageService.saveData(data)
    }
  },
  
  updateGoal: async (fieldId, newGoal) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      data[fieldId].goal = newGoal
      await storageService.saveData(data)
    }
  },
  
  updateNextSteps: async (fieldId, nextSteps) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      const uniqueSteps = deduplicateTasks(nextSteps)
      data[fieldId].nextSteps = uniqueSteps
      await storageService.saveData(data)
    }
  },
  
  addNextStep: async (fieldId, step) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      data[fieldId].nextSteps = data[fieldId].nextSteps || []
      data[fieldId].nextSteps.push(step)
      data[fieldId].nextSteps = deduplicateTasks(data[fieldId].nextSteps)
      await storageService.saveData(data)
    }
  },
  
  addTimeSpent: async (fieldId, hours) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      data[fieldId].timeSpent = (data[fieldId].timeSpent || 0) + hours
      await storageService.saveData(data)
    }
  },

  updateStreak: async (fieldId, newStreak) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      data[fieldId].streak = newStreak
      await storageService.saveData(data)
    }
  },

  updateMilestones: async (fieldId, newMilestones) => {
    const data = await storageService.loadData()
    if (data[fieldId]) {
      data[fieldId].milestones = newMilestones
      await storageService.saveData(data)
    }
  },
  
  fetchFields: async () => {
    const data = await storageService.loadData()
    if (!data) return {}
    
    
    return data
  },
  
  getUnsyncedCount: async () => {
    const needsSync = await storageService.checkNeedsSync()
    return needsSync ? 1 : 0
  },
  
  // UPDATED: Now returns the sync result
  syncOfflineData: async () => {
    return await storageService.syncToCloud()
  }
}


// Helper function
const deduplicateTasks = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) return []
  
  const seen = new Set()
  const uniqueTasks = []
  
  tasks.forEach(task => {
    const taskObj = typeof task === 'string' 
      ? { text: task, subtasks: [], id: `temp-${Date.now()}-${Math.random()}` } 
      : task
    
    // ALWAYS use the id - don't fall back to text
    const taskId = taskObj.id
    
    if (!taskId) {
      // If no ID exists, this is a bug - but add it with a warning
      console.warn('Task without ID found:', taskObj)
      uniqueTasks.push(taskObj)
      return
    }
    
    if (!seen.has(taskId)) {
      seen.add(taskId)
      uniqueTasks.push(taskObj)
    } else {
      console.log('🔄 Skipping duplicate task ID:', taskId, taskObj.text)
    }
  })
  
  return uniqueTasks
}


const DreamBuilderDashboard = () => {
  const isMobile = window.innerWidth < 768;
  const timerAtBottom = true;
  const timerShouldStick = isMobile && !timerAtBottom; 
  
  const timerCardStyle = {
    gridColumn: isMobile ? 'span 1' : 'span 4',
    gridRow: isMobile ? 'span 1' : 'span 2',
    position: timerShouldStick ? 'sticky' : 'relative',
    bottom: timerShouldStick ? '16px' : 'auto',
    background: timerShouldStick
      ? 'linear-gradient(to bottom right, #450a0a, #881337)'
      : 'linear-gradient(to bottom right, rgba(220, 38, 38, 0.2), rgba(225, 29, 72, 0.2))',
    border: timerShouldStick
      ? '2px solid rgba(239, 68, 68, 0.9)'
      : '1px solid rgba(220, 38, 38, 0.3)',
    boxShadow: timerShouldStick
      ? '0 12px 40px rgba(0,0,0,0.85)'
      : 'none',
    borderRadius: '24px',
    padding: '24px',
    zIndex: timerShouldStick ? 50 : 'auto'
  };

  const [currentGoal, setCurrentGoal] = useState("Make a $1,000,000");

  const [nextSteps, setNextSteps] = useState([
    "Get resort client",
    "Find business thesis idea"
  ]);

  const updateNextStep = async (index, updatedTask) => {
    const newSteps = [...nextSteps];
    newSteps[index] = updatedTask; 
    
    // FIX: Deduplicate before saving
    const uniqueSteps = deduplicateTasks(newSteps);
    setNextSteps(uniqueSteps);

    try {
      await apiService.updateNextSteps(selectedField, uniqueSteps);
    } catch (error) {
      console.error('Error updating next step:', error);
    }
  };

  const addNextStep = async () => {
    const newId = `task-${Date.now()}`;
    const newStep = { 
      text: "New Step", 
      subtasks: [], 
      completed: false,
      id: newId
    };
    
    const updatedSteps = [...nextSteps, newStep];
    const uniqueSteps = deduplicateTasks(updatedSteps);
    setNextSteps(uniqueSteps);
    
    try {
      await apiService.updateNextSteps(selectedField, uniqueSteps);
    } catch (error) {
      console.error('Error adding next step:', error);
    }
  };

  const deleteNextStep = async (indexToDelete) => {
    const taskToDelete = nextSteps[indexToDelete];
    const taskId = taskToDelete.id || `task-${indexToDelete}`;
    
    const updatedSteps = nextSteps.filter((_, idx) => idx !== indexToDelete);
    setNextSteps(updatedSteps);
    
    // Update checked steps - remove by ID
    const newCheckedSteps = { ...checkedSteps };
    delete newCheckedSteps[taskId];
    
    setCheckedSteps(newCheckedSteps);
    stepStorageService.saveCheckedSteps(selectedField, newCheckedSteps);
    
    // Update milestones count
    const completedCount = Object.values(newCheckedSteps).filter(s => s.checked).length;
    await apiService.updateMilestones(selectedField, completedCount);
    
    // Update today's count
    const todayCount = countTodayCompleted(newCheckedSteps);
    setTodayCompletedCount(todayCount);
    
    try {
      await apiService.updateNextSteps(selectedField, updatedSteps);
    } catch (error) {
      console.error('Error deleting next step:', error);
    }
  };

  const [selectedField, setSelectedField] = useState('business');
  const [menuOpen, setMenuOpen] = useState(false);
  const [fields, setFields] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);


  const initializeApp = async () => {
    try {
      setLoading(true);
      await apiService.initialize();
      await loadFields();
      await checkUnsyncedData();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async () => {
    try {
      const data = await apiService.fetchFields();
      setFields(data);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };


  const checkUnsyncedData = async () => {
    try {
      const count = await apiService.getUnsyncedCount();
      setUnsyncedCount(count);
    } catch (error) {
      console.error('Error checking unsynced data:', error);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      console.log('🔄 Manual sync triggered...');
      
      const result = await apiService.syncOfflineData();
      
      if (result && result.success) {
        console.log('✅ Sync completed successfully:', result);
        await loadFields();
        await checkUnsyncedData();
      } else {
        console.log('⚠️ Sync completed with issues:', result);
        // Still reload to show current state
        await loadFields();
        await checkUnsyncedData();
      }
    } catch (error) {
      console.error('❌ Error syncing data:', error);
    } finally {
      setSyncing(false);
    }
  };

  // For Next Steps

  // Add these new state variables
  const [checkedSteps, setCheckedSteps] = useState({}); // { stepIndex: { checked: true, date: '2024-12-28' } }
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);

  // Add these storage functions with your other apiService methods
  const stepStorageService = {
    saveCheckedSteps: async (fieldId, steps) => {
      await storageService.init();
      return new Promise((resolve, reject) => {
        const transaction = storageService.db.transaction(['dreamData'], 'readwrite');
        const store = transaction.objectStore('dreamData');
        const key = `checkedSteps_${fieldId}`;
        
        const request = store.put({
          id: key,
          data: steps,
          lastModified: Date.now(),
          needsSync: false
        });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    
    loadCheckedSteps: async (fieldId) => {
      await storageService.init();
      return new Promise((resolve, reject) => {
        const transaction = storageService.db.transaction(['dreamData'], 'readonly');
        const store = transaction.objectStore('dreamData');
        const key = `checkedSteps_${fieldId}`;
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result?.data || {});
        };
        request.onerror = () => reject(request.error);
      });
    },
    
    saveLastCheckDate: async (fieldId, date) => {
      await storageService.init();
      return new Promise((resolve, reject) => {
        const transaction = storageService.db.transaction(['dreamData'], 'readwrite');
        const store = transaction.objectStore('dreamData');
        const key = `lastCheckDate_${fieldId}`;
        
        const request = store.put({
          id: key,
          data: date,
          lastModified: Date.now(),
          needsSync: false
        });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
    
    loadLastCheckDate: async (fieldId) => {
      await storageService.init();
      return new Promise((resolve, reject) => {
        const transaction = storageService.db.transaction(['dreamData'], 'readonly');
        const store = transaction.objectStore('dreamData');
        const key = `lastCheckDate_${fieldId}`;
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result?.data || null);
        };
        request.onerror = () => reject(request.error);
      });
    }
  };

  // Add this helper function to get today's date string
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };


  // Add this helper function to calculate overall metrics
  const calculateOverallMetrics = (fields) => {
    const fieldKeys = ['business', 'tech', 'physical', 'social', 'misc'];
    const validFields = fieldKeys.map(key => fields[key]).filter(Boolean);
    
    if (validFields.length === 0) {
      return { progress: 0, timeSpent: 0, streak: 0 };
    }
    
    const totalProgress = validFields.reduce((sum, field) => sum + (field.progress || 0), 0);
    const avgProgress = Math.round(totalProgress / validFields.length);
    
    const totalTimeSpent = validFields.reduce((sum, field) => sum + (field.timeSpent || 0), 0);
    
    const minStreak = Math.min(...validFields.map(field => field.streak || 0));
    
    return {
      progress: avgProgress,
      timeSpent: totalTimeSpent,
      streak: minStreak
    };
  };


  useEffect(() => {
    // Only save if we have a currentField and nextSteps have been initialized
    if (currentField && nextSteps.length > 0) {
      const saveSubtasks = async () => {
        try {
          await apiService.updateNextSteps(selectedField, nextSteps);
        } catch (error) {
          console.error('Error auto-saving subtasks:', error);
        }
      };
      
      // Debounce the save to avoid too many calls
      const timeoutId = setTimeout(saveSubtasks, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [nextSteps]);


  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);
    
    initializeApp();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const syncInterval = setInterval(checkUnsyncedData, 10000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentField = fields[selectedField];


  // Timer

  // Add these timer storage functions after stepStorageService
  const saveTimerState = async (fieldId, seconds, accumulated, running) => {
    await storageService.init();
    return new Promise((resolve, reject) => {
      const transaction = storageService.db.transaction(['dreamData'], 'readwrite');
      const store = transaction.objectStore('dreamData');
      const key = `timer_${fieldId}`;
      
      const request = store.put({
        id: key,
        data: {
          seconds,
          accumulated,
          running,
          timestamp: Date.now()
        },
        lastModified: Date.now(),
        needsSync: false
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const loadTimerState = async (fieldId) => {
    await storageService.init();
    return new Promise((resolve, reject) => {
      const transaction = storageService.db.transaction(['dreamData'], 'readonly');
      const store = transaction.objectStore('dreamData');
      const key = `timer_${fieldId}`;
      const request = store.get(key);
      
      request.onsuccess = () => {
        const state = request.result?.data;
        const isPageLoad = !window.timerInitialized;
        
        if (state) {
          if (state.running) {
            const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);
            resolve({
              seconds: state.seconds + elapsed,
              accumulated: state.accumulated,
              running: isPageLoad ? false : true
            });
          } else {
            resolve(state);
          }
        } else {
          resolve({ seconds: 0, accumulated: 0, running: false });
        }
      };
      request.onerror = () => reject(request.error);
    });
  };


  useEffect(() => {
    if (currentField) {
      setCurrentGoal(currentField.goal || "");
      
      const uniqueTasks = deduplicateTasks(currentField.nextSteps || []);
      console.log(`🎯 [UI] Loading ${selectedField} area with ${uniqueTasks.length} steps`);
      console.log(`🎯 [UI] Steps:`, uniqueTasks.map(s => s.text || s));
      setNextSteps(uniqueTasks);
      
      // Make these async calls properly
      (async () => {
        const loadedCheckedSteps = await stepStorageService.loadCheckedSteps(selectedField);
        setCheckedSteps(loadedCheckedSteps);
        
        const loadedLastCheckDate = await stepStorageService.loadLastCheckDate(selectedField);
        setLastCheckDate(loadedLastCheckDate);
        
        const todayCount = countTodayCompleted(loadedCheckedSteps);
        setTodayCompletedCount(todayCount);
        
        const savedTimer = await loadTimerState(selectedField);
        if (savedTimer) {
          setFieldTimers(prev => ({
            ...prev,
            [selectedField]: savedTimer
          }));
          
          if (savedTimer.running && !timerIntervalRef.current) {
            timerIntervalRef.current = setInterval(() => {
              setFieldTimers(prev => {
                const newTimers = { ...prev };
                Object.keys(newTimers).forEach(fieldId => {
                  if (newTimers[fieldId]?.running) {
                    newTimers[fieldId] = {
                      ...newTimers[fieldId],
                      seconds: newTimers[fieldId].seconds + 1
                    };
                    saveTimerState(fieldId, newTimers[fieldId].seconds, newTimers[fieldId].accumulated, true);
                  }
                });
                return newTimers;
              });
            }, 1000);
          }
        }
      })();
    }
  }, [selectedField]);// ONLY depend on selectedField, not fields or currentField

  // Add this new useEffect to check streak at midnight
  useEffect(() => {
    const checkDailyStreak = async () => {
      if (!currentField) return;
      
      const today = getTodayString();
      const lastCheck = stepStorageService.loadLastCheckDate(selectedField);
      
      // If last check wasn't today, check if streak should reset
      if (lastCheck && lastCheck !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        // If last check wasn't yesterday, reset streak to 0
        if (lastCheck !== yesterdayString) {
          await apiService.updateStreak(selectedField, 0);
          await loadFields();
        }
      }
    };
    
    checkDailyStreak();
    
    // Check every hour if day has changed
    const intervalId = setInterval(checkDailyStreak, 3600000); // 1 hour
    
    return () => clearInterval(intervalId);
  }, [selectedField, currentField]);

  const updateProgress = async (fieldId, newProgress) => {
    try {
      await apiService.updateProgress(fieldId, newProgress);
      await loadFields();
      await checkUnsyncedData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

    // Timer state - stores ALL field timers
  const [fieldTimers, setFieldTimers] = useState({}); // { fieldId: { seconds, accumulated, running } }
  const timerIntervalRef = useRef(null);

  // Get current field's timer or default
  const currentTimer = fieldTimers[selectedField] || { seconds: 0, accumulated: 0, running: false };

  // Start timer for current field
  const startTimer = async () => {
    // Stop any other running timers
    const runningField = Object.keys(fieldTimers).find(
      fieldId => fieldTimers[fieldId]?.running && fieldId !== selectedField
    );
    
    if (runningField) {
      await stopTimerForField(runningField);
    }
    
    // Start timer for current field
    setFieldTimers(prev => ({
      ...prev,
      [selectedField]: {
        ...currentTimer,
        running: true
      }
    }));
    
    saveTimerState(selectedField, currentTimer.seconds, currentTimer.accumulated, true);
    
    // Start interval
    if (!timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setFieldTimers(prev => {
          const newTimers = { ...prev };
          // Find and update the running timer
          Object.keys(newTimers).forEach(fieldId => {
            if (newTimers[fieldId]?.running) {
              newTimers[fieldId] = {
                ...newTimers[fieldId],
                seconds: newTimers[fieldId].seconds + 1
              };
              saveTimerState(fieldId, newTimers[fieldId].seconds, newTimers[fieldId].accumulated, true);
            }
          });
          return newTimers;
        });
      }, 1000);
    }
  };

  const pauseTimer = () => {
    setFieldTimers(prev => ({
      ...prev,
      [selectedField]: {
        ...currentTimer,
        running: false
      }
    }));
    
    saveTimerState(selectedField, currentTimer.seconds, currentTimer.accumulated, false);
  };

  const stopTimerForField = async (fieldId) => {
    const timer = fieldTimers[fieldId];
    if (!timer) return;
    
    const currentSessionHours = timer.seconds / 3600;
    const totalHours = timer.accumulated + currentSessionHours;
    
    // Update the field timers first
    const updatedFieldTimers = {
      ...fieldTimers,
      [fieldId]: {
        seconds: 0,
        accumulated: totalHours >= 1 ? totalHours - Math.floor(totalHours) : totalHours,
        running: false
      }
    };
    
    setFieldTimers(updatedFieldTimers);
    
    // Save timer state
    if (totalHours >= 1) {
      const hoursToAdd = Math.floor(totalHours);
      const remainingHours = totalHours - hoursToAdd;
      saveTimerState(fieldId, 0, remainingHours, false);
      
      try {
        await apiService.addTimeSpent(fieldId, hoursToAdd);
        await loadFields();
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
    } else {
      saveTimerState(fieldId, 0, totalHours, false);
    }
    
    // Clear interval if no timers are running
    const hasRunningTimer = Object.values(updatedFieldTimers).some(t => t?.running);
    if (!hasRunningTimer && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopTimer = async () => {
    await stopTimerForField(selectedField);
  };

  const formatTimerDisplay = () => {
    const totalSeconds = currentTimer.seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getAccumulatedDisplay = () => {
    const totalHours = currentTimer.accumulated + (currentTimer.seconds / 3600);
    return totalHours.toFixed(2);
  };


  // Continuation of Streak

  // Calculate streak based on check dates
  const calculateStreak = (fieldId, currentCheckedSteps) => {
    const today = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const lastCheck = stepStorageService.loadLastCheckDate(fieldId);
    
    // If no previous checks, streak is 1 if checked today
    if (!lastCheck) {
      return Object.values(currentCheckedSteps).some(step => step.date === today) ? 1 : 0;
    }
    
    // If last check was today, maintain current streak
    if (lastCheck === today) {
      return currentField.streak;
    }
    
    // If last check was yesterday and we checked today, increment streak
    if (lastCheck === yesterdayString && Object.values(currentCheckedSteps).some(step => step.date === today)) {
      return currentField.streak + 1;
    }
    
    // If we checked today but last check was before yesterday, reset to 1
    if (Object.values(currentCheckedSteps).some(step => step.date === today)) {
      return 1;
    }
    
    // If we didn't check today and last check wasn't today, reset to 0
    return 0;
  };

  // Count today's completed steps
  const countTodayCompleted = (steps) => {
    const today = getTodayString();
    return Object.values(steps).filter(step => step.checked && step.date === today).length;
  };

  // Handle checking a step
  const handleCheckStep = async (taskId) => {
    const today = getTodayString();
    const newCheckedSteps = {
      ...checkedSteps,
      [taskId]: { checked: true, date: today }
    };
    
    setCheckedSteps(newCheckedSteps);
    await stepStorageService.saveCheckedSteps(selectedField, newCheckedSteps); // ADD await
    
    const wasCheckedToday = Object.values(checkedSteps).some(step => step.date === today);
    if (!wasCheckedToday) {
      await stepStorageService.saveLastCheckDate(selectedField, today); // ADD await
      setLastCheckDate(today);
    }
    
    const newStreak = calculateStreak(selectedField, newCheckedSteps);
    await apiService.updateStreak(selectedField, newStreak);
    
    const completedCount = Object.values(newCheckedSteps).filter(s => s.checked).length;
    await apiService.updateMilestones(selectedField, completedCount);
    
    const todayCount = countTodayCompleted(newCheckedSteps);
    setTodayCompletedCount(todayCount);
    
    await loadFields();
  };

  // Handle unchecking a step
  const handleUncheckStep = async (taskId) => {
    const today = getTodayString();
    const stepToUncheck = checkedSteps[taskId];
    
    if (!stepToUncheck || stepToUncheck.date !== today) {
      return;
    }
    
    const newCheckedSteps = { ...checkedSteps };
    delete newCheckedSteps[taskId];
    
    setCheckedSteps(newCheckedSteps);
    await stepStorageService.saveCheckedSteps(selectedField, newCheckedSteps); // ADD await
    
    const newStreak = calculateStreak(selectedField, newCheckedSteps);
    await apiService.updateStreak(selectedField, newStreak);
    
    const completedCount = Object.values(newCheckedSteps).filter(s => s.checked).length;
    await apiService.updateMilestones(selectedField, completedCount);
    
    const todayCount = countTodayCompleted(newCheckedSteps);
    setTodayCompletedCount(todayCount);
    
    await loadFields();
  };



  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);
    
    // Mark that timers are being initialized
    window.timerInitialized = false;
    
    initializeApp();
    
    // After initialization, mark as initialized
    window.timerInitialized = true;
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const syncInterval = setInterval(checkUnsyncedData, 10000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading Dream Builder...</div>
          <div style={{ color: '#6b7280' }}>Initializing your data</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', position: 'relative' }}>
      {/* Online/Offline Indicator */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {unsyncedCount > 0 && (
          <button
            onClick={syncData}
            disabled={!isOnline || syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(234, 179, 8, 0.2)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '999px',
              cursor: isOnline && !syncing ? 'pointer' : 'not-allowed',
              opacity: isOnline && !syncing ? 1 : 0.5
            }}
          >
            <RefreshCw size={16} color="#eab308" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            <span style={{ fontSize: '14px' }}>{unsyncedCount} unsynced</span>
          </button>
        )}
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '999px'
        }}>
          {isOnline ? <Wifi size={16} color="#22c55e" /> : <WifiOff size={16} color="#ef4444" />}
          <span style={{ fontSize: '14px' }}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Hamburger Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed', top: '24px', left: '24px', zIndex: 50, width: '48px', height: '48px',
          backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
          e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.backgroundColor = '#1a1a1a';
        }}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Slide-out Menu */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100%', width: isMobile ? '100%' : '320px',
        backgroundColor: '#0a0a0a',
        padding: isMobile ? '20px' : '16px',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 40,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '24px', paddingTop: '96px' }}>
          <h2 style={{ 
            fontSize: '24px', fontWeight: 'bold', marginBottom: '8px',
            background: 'linear-gradient(to right, #fff, #6b7280)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Dream Builder
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>Track your progress</p>
          
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            top: isMobile ? '12px' : '24px',
            right: isMobile ? '12px' : '24px',
            gap: '8px' }}>
            {Object.values(fields).map((field) => (
              <button
                key={field.id}
                onClick={() => { setSelectedField(field.id); setMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                  borderRadius: '12px',
                  border: selectedField === field.id ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedField === field.id ? 'linear-gradient(to right, rgba(220, 38, 38, 0.2), rgba(225, 29, 72, 0.2))' : '#1a1a1a',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '28px' }}>{field.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{field.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{field.progress}% complete</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{field.progress}%</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)', zIndex: 30
        }} />
      )}

      {/* Main Content */}
      {currentField && (
        <div style={{ 
          padding: isMobile ? '80px 16px 48px' : '96px 24px 48px', 
          width: '100%', 
          boxSizing: 'border-box' // Add this
        }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '48px' }}>{currentField.icon}</div>
                <div>
                  <h1 style={{ fontSize: isMobile ? '24px':'36px', fontWeight: 'bold' }}>{currentField.name}</h1>
                  <p style={{ color: '#6b7280' }}>{currentField.goal}</p>
                </div>
              </div>
            </div>

            {/* Conditional rendering: Overall tab vs Individual field tab */}
            {selectedField === 'overall' ? (
            // OVERALL TAB CONTENT
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
              gap: isMobile ? '12px' : '16px',
              gridAutoRows: isMobile ? 'auto' : '140px'
            }}>
              {/* Overall Stats Summary - UPDATE THIS SECTION */}
              <div style={{
                gridColumn: isMobile ? 'span 1' : 'span 12',
                gridRow: 'span 2',
                background: 'linear-gradient(to bottom right, rgba(220, 38, 38, 0.15), rgba(225, 29, 72, 0.15))',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '24px',
                padding: '32px'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Your Journey Overview</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
                  {/* Average Progress */}
                  <div style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    padding: '24px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Average Progress</div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '12px' }}>
                      {calculateOverallMetrics(fields).progress}%
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${calculateOverallMetrics(fields).progress}%`,
                        background: 'linear-gradient(to right, #dc2626, #e11d48)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Total Time */}
                  <div style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    padding: '24px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Total Time Invested</div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
                      {calculateOverallMetrics(fields).timeSpent}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>hours across all fields</div>
                  </div>

                  {/* Minimum Streak */}
                  <div style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                    padding: '24px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Consistency Streak</div>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={40} color="#dc2626" />
                      {calculateOverallMetrics(fields).streak}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>days minimum across fields</div>
                  </div>
                </div>
              </div>

              {/* ADD THIS NEW RADAR CHART SECTION */}
              <div style={{
                gridColumn: isMobile ? 'span 1' : 'span 12',
                gridRow: 'span 3',
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Time Distribution</h2>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
                  Hours invested across all areas
                </p>
                
                <RadarChart 
                  data={[
                    { 
                      label: 'Business', 
                      icon: fields.business?.icon || '💼', 
                      value: fields.business?.timeSpent || 0 
                    },
                    { 
                      label: 'Tech', 
                      icon: fields.tech?.icon || '⚡', 
                      value: fields.tech?.timeSpent || 0 
                    },
                    { 
                      label: 'Physical', 
                      icon: fields.physical?.icon || '💪', 
                      value: fields.physical?.timeSpent || 0 
                    },
                    { 
                      label: 'Social', 
                      icon: fields.social?.icon || '🤝', 
                      value: fields.social?.timeSpent || 0 
                    },
                    { 
                      label: 'Misc', 
                      icon: fields.misc?.icon || '✨', 
                      value: fields.misc?.timeSpent || 0 
                    }
                  ]} 
                />
              </div>

                {/* Individual Field Breakdown */}
                <div style={{
                  gridColumn: isMobile ? 'span 1' : 'span 12',
                  gridRow: 'span 4',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  padding: '32px'
                }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Field Breakdown</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {['business', 'tech', 'physical', 'social', 'misc'].map(fieldKey => {
                      const field = fields[fieldKey];
                      if (!field) return null;
                      
                      return (
                        <div key={fieldKey} style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : '80px 1fr 120px 120px 120px',
                          gap: '16px',
                          alignItems: 'center',
                          padding: '20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {/* Icon & Name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '32px' }}>{field.icon}</div>
                            <div style={{ fontWeight: 600, fontSize: '18px' }}>{field.name}</div>
                          </div>

                          {/* Progress Bar */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Progress</span>
                              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{field.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${field.progress}%`,
                                background: 'linear-gradient(to right, #dc2626, #e11d48)',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>

                          {/* Time */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Time</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{field.timeSpent}h</div>
                          </div>

                          {/* Streak */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Streak</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Flame size={16} color="#dc2626" />
                              {field.streak}
                            </div>
                          </div>

                          {/* View Button */}
                          <button
                            onClick={() => setSelectedField(fieldKey)}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(to right, #dc2626, #e11d48)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 600
                            }}
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // INDIVIDUAL FIELD TAB CONTENT (your existing Bento Grid)
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
                  gap: isMobile ? '12px' : '16px',
                  gridAutoRows: isMobile ? 'auto' : '140px'
                }}>
                  {/* Progress Card */}
                  <div style={{
                    gridColumn: isMobile ? 'span 1' : 'span 4', gridRow: isMobile ? 'span 1' : 'span 2', backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '24px',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                      top: isMobile ? '12px' : '24px',
                      right: isMobile ? '12px' : '24px',
                      }}>
                      <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Overall Progress</div>
                      <div style={{ fontSize: '72px', fontWeight: 'bold', marginBottom: '16px' }}>{currentField.progress}%</div>
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ width: '100%', height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${currentField.progress}%`,
                            background: 'linear-gradient(to right, #dc2626, #e11d48)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button
                            onClick={() => updateProgress(currentField.id, Math.max(0, currentField.progress - 5))}
                            style={{
                              padding: '8px 16px', backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px',
                              color: '#fff', cursor: 'pointer', fontSize: '14px'
                            }}
                          >
                            -5%
                          </button>
                          <button
                            onClick={() => updateProgress(currentField.id, Math.min(100, currentField.progress + 5))}
                            style={{
                              padding: '8px 16px', background: 'linear-gradient(to right, #dc2626, #e11d48)',
                              border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '14px'
                            }}
                          >
                            +5%
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div style={{ gridColumn: isMobile ? 'span 1':'span 2', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Clock size={16} color="#dc2626" />
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Time</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{currentField.timeSpent}h</div>
                  </div>

                  {/* Timer Card */}
                  <div style={timerCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={20} color="#fca5a5" />
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>Time Tracker</div>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '4px' }}>
                        {formatTimerDisplay()}
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        Accumulated: {getAccumulatedDisplay()}h (increments per hour)
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px',
                        marginTop: '8px',
                        flexDirection: isMobile ? 'column' : 'row',
                        width: '100%'
                      }}>
                        {!currentTimer.running ? (
                          <button
                            onClick={startTimer}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '12px 24px',
                              background: 'linear-gradient(to right, #22c55e, #16a34a)',
                              border: 'none', borderRadius: '12px',
                              color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                              width: isMobile ? '100%' : 'auto'
                            }}
                          >
                            <Play size={20} />
                            Start
                          </button>
                        ) : (
                          <button
                            onClick={pauseTimer}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '12px 24px',
                              background: 'linear-gradient(to right, #eab308, #ca8a04)',
                              border: 'none', borderRadius: '12px',
                              color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: 600,
                              width: isMobile ? '100%' : 'auto'
                            }}
                          >
                            <Pause size={20} />
                            Pause
                          </button>
                        )}
                        
                        <button
                          onClick={stopTimer}
                          disabled={currentTimer.seconds === 0}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px',
                            background: currentTimer.seconds === 0 ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(to right, #dc2626, #e11d48)',
                            border: 'none', borderRadius: '12px',
                            color: '#fff', cursor: currentTimer.seconds === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '16px', fontWeight: 600,
                            opacity: currentTimer.seconds === 0 ? 0.5 : 1,
                            width: isMobile ? '100%' : 'auto'
                          }}
                        >
                          <Square size={20} />
                          Stop & Save
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Done stat card */}
                  <div style={{ 
                    gridColumn: isMobile ? 'span 1' : 'span 2', 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '16px', 
                    padding: '16px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CheckCircle2 size={16} color="#dc2626" />
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Done Today</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{todayCompletedCount}</div>
                    </div>
                  </div>

                  {/* Streak */}
                  <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Flame size={16} color="#dc2626" />
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Streak</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{currentField.streak}</div>
                  </div>

                  {/* Week */}
                  <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Calendar size={16} color="#dc2626" />
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>Week</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>5d</div>
                  </div>

                  {/* Goal Card */}
                  <div style={{
                    gridColumn: isMobile ? 'span 1' : 'span 4', gridRow: isMobile ? 'span 1' : 'span 1',
                    background: 'linear-gradient(to bottom right, rgba(220, 38, 38, 0.15), rgba(225, 29, 72, 0.15))',
                    border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '24px', padding: '24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Target size={20} color="#fca5a5" />
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>Current Goal</div>
                    </div>
                    <EditableText
                      value={currentGoal}
                      onSave={async (newValue) => {
                        setCurrentGoal(newValue);
                        await apiService.updateGoal(selectedField, newValue);
                        await loadFields();
                      }}
                    />
                  </div>

                  {/* Next Steps */}
                  <div style={{ 
                    gridColumn: isMobile ? 'span 1' : 'span 8', 
                    gridRow: isMobile ? 'span 1' : 'span 3', 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '24px', 
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={20} color="#fca5a5" />
                        <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Next Steps</h3>
                      </div>
                      
                      <button
                        onClick={addNextStep}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '6px 12px', backgroundColor: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px',
                          color: '#4ade80', cursor: 'pointer', fontSize: '13px'
                        }}
                      >
                        <Play size={14} style={{ transform: 'rotate(-90deg)' }} />
                        Add Step
                      </button>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '12px', 
                      maxHeight: '340px', 
                      overflowY: 'auto',
                      overflowX: 'hidden', // Add this to prevent horizontal overflow
                      paddingRight: '8px'
                    }}>
                      {nextSteps.map((step, idx) => {
                        const taskObj = typeof step === 'string' 
                          ? { text: step, subtasks: [], id: `task-${idx}` }
                          : { ...step, id: step.id || `task-${idx}` };
                        
                        const taskId = taskObj.id;
                        const isChecked = checkedSteps[taskId]?.checked;
                        const checkDate = checkedSteps[taskId]?.date;
                        const today = getTodayString();
                        const canUndo = isChecked && checkDate === today;
                        
                        const uniqueKey = `${selectedField}-task-${taskId}`;
                        
                        return (
                          <ExpandableTask
                            key={uniqueKey}
                            task={taskObj}
                            index={idx}
                            onUpdateTask={async (index, updatedTask) => {
                              // Ensure task has an ID
                              if (!updatedTask.id) {
                                updatedTask.id = taskObj.id;
                              }
                              
                              const newSteps = [...nextSteps];
                              newSteps[index] = updatedTask;
                              
                              const uniqueSteps = deduplicateTasks(newSteps);
                              setNextSteps(uniqueSteps);
                              
                              await apiService.updateNextSteps(selectedField, uniqueSteps);
                            }}
                            onDeleteTask={deleteNextStep}
                            isChecked={isChecked}
                            onCheck={() => handleCheckStep(taskId)}
                            onUncheck={() => handleUncheckStep(taskId)}
                            canUndo={canUndo}
                            onTimeComplete={async (hours) => {
                              await apiService.addTimeSpent(selectedField, hours);
                              await loadFields();
                            }}
                          />
                        );
                      })}

                      {nextSteps.length === 0 && (
                        <div style={{ color: '#6b7280', textAlign: 'center', padding: '32px' }}>
                          No next steps yet. Click add to begin.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DreamBuilderDashboard;