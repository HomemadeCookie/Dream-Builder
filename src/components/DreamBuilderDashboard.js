import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock, TrendingUp, CheckCircle2, Menu, X, Flame, Calendar, Wifi, WifiOff, RefreshCw, Play, Pause, Square } from 'lucide-react';



const apiService = {
  initialize: async () => {
    // Load from localStorage if exists
    const stored = localStorage.getItem('dreamBuilderData');
    if (!stored) {
      // Initialize with default data
      const defaultData = {
        overall: {
          id: 'overall',
          name: 'Overall',
          icon: '🎯',
          goal: 'Become the best version of myself',
          progress: 0,
          timeSpent: 0,
          milestones: 0,
          streak: 0,
          nextSteps: []
        },
        business: {
          id: 'business',
          name: 'Business',
          icon: '💼',
          goal: 'Make a $1,000,000',
          progress: 25,
          timeSpent: 120,
          milestones: 5,
          streak: 12,
          nextSteps: ['Get resort client', 'Find business thesis idea']
        },
        tech: {
            id: 'tech',
            name: 'Tech',
            icon: '⚡',
            progress: 0,
            timeSpent: 0,
            goal: 'Master full-stack development',
            nextSteps: [
              'Develop Fullstack App',
              'Find Full-time Gig',
              'Learn system design',
              'Master TypeScript'
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
              'Increase weekly mileage to 30km',
              'Add strength training 2x/week',
              'Join running club',
              'Focus on nutrition'
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
              'Attend 2 networking events/month',
              'Schedule coffee chats weekly',
              'Join community group',
              'Host a small gathering'
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
              'Practice guitar 3x/week',
              'Start photography course',
              'Read 2 books/month',
              'Write in journal daily'
            ],
            milestones: 0,
            streak: 0,
            synced: true
        }
      };
      localStorage.setItem('dreamBuilderData', JSON.stringify(defaultData));
    }
  },
  
  fetchFields: async () => {
    const stored = localStorage.getItem('dreamBuilderData');
    return stored ? JSON.parse(stored) : {};
  },
  
  updateProgress: async (fieldId, newProgress) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].progress = newProgress;
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },
  
  updateGoal: async (fieldId, newGoal) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].goal = newGoal;
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },
  
  updateNextSteps: async (fieldId, nextSteps) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].nextSteps = nextSteps;
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },
  
  addNextStep: async (fieldId, step) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].nextSteps.push(step);
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },
  
  addTimeSpent: async (fieldId, hours) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].timeSpent += hours;
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },

  // Add these to your apiService object
  updateStreak: async (fieldId, newStreak) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].streak = newStreak;
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },

  updateMilestones: async (fieldId, newMilestones) => {
    const data = JSON.parse(localStorage.getItem('dreamBuilderData'));
    data[fieldId].milestones = newMilestones;
    localStorage.setItem('dreamBuilderData', JSON.stringify(data));
  },
  
  getUnsyncedCount: async () => 0,
  syncOfflineData: async () => {}
};

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

  const updateNextStep = async (index, newValue) => {
    setNextSteps(prev => {
      const updated = [...prev];
      updated[index] = newValue;
      return updated;
    });
    // Add this to persist the change
    try {
      await apiService.updateNextSteps(selectedField, nextSteps.map((step, idx) => 
        idx === index ? newValue : step
      ));
    } catch (error) {
      console.error('Error updating next step:', error);
    }
  };

  const addNextStep = async () => {
    const newStep = "New Step";
    setNextSteps(prev => [...prev, newStep]);
    try {
      await apiService.addNextStep(selectedField, newStep);
      await loadFields();
    } catch (error) {
      console.error('Error adding next step:', error);
    }
  };

  const deleteNextStep = async (indexToDelete) => {
    const updatedSteps = nextSteps.filter((_, idx) => idx !== indexToDelete);
    setNextSteps(updatedSteps);
    
    // Update checked steps - reindex them
    const newCheckedSteps = {};
    Object.keys(checkedSteps).forEach(key => {
      const oldIndex = parseInt(key);
      if (oldIndex < indexToDelete) {
        // Keep same index
        newCheckedSteps[oldIndex] = checkedSteps[key];
      } else if (oldIndex > indexToDelete) {
        // Shift index down by 1
        newCheckedSteps[oldIndex - 1] = checkedSteps[key];
      }
      // Skip the deleted index
    });
    
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
      await loadFields();
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
      await apiService.syncOfflineData();
      await loadFields();
      await checkUnsyncedData();
    } catch (error) {
      console.error('Error syncing data:', error);
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
    saveCheckedSteps: (fieldId, steps) => {
      const allSteps = JSON.parse(localStorage.getItem('checkedSteps') || '{}');
      allSteps[fieldId] = steps;
      localStorage.setItem('checkedSteps', JSON.stringify(allSteps));
    },
    
    loadCheckedSteps: (fieldId) => {
      const allSteps = JSON.parse(localStorage.getItem('checkedSteps') || '{}');
      return allSteps[fieldId] || {};
    },
    
    saveLastCheckDate: (fieldId, date) => {
      const dates = JSON.parse(localStorage.getItem('lastCheckDates') || '{}');
      dates[fieldId] = date;
      localStorage.setItem('lastCheckDates', JSON.stringify(dates));
    },
    
    loadLastCheckDate: (fieldId) => {
      const dates = JSON.parse(localStorage.getItem('lastCheckDates') || '{}');
      return dates[fieldId] || null;
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
  const saveTimerState = (fieldId, seconds, accumulated, running) => {
    const allTimers = JSON.parse(localStorage.getItem('allTimerStates') || '{}');
    allTimers[fieldId] = {
      seconds,
      accumulated,
      running,
      timestamp: Date.now()
    };
    localStorage.setItem('allTimerStates', JSON.stringify(allTimers));
    if (running) {
      localStorage.setItem('activeTimerField', fieldId);
    } else {
      // Clear active timer if this was the running one
      const activeField = localStorage.getItem('activeTimerField');
      if (activeField === fieldId) {
        localStorage.removeItem('activeTimerField');
      }
    }
  };

  const loadTimerState = (fieldId) => {
    const allTimers = JSON.parse(localStorage.getItem('allTimerStates') || '{}');
    const state = allTimers[fieldId];
    const isPageLoad = !window.timerInitialized; // Check if this is initial page load
    
    if (state) {
      if (state.running) {
        const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);
        return {
          seconds: state.seconds + elapsed,
          accumulated: state.accumulated,
          running: isPageLoad ? false : true  // Only pause on page load, not field switch
        };
      }
      return state;
    }
    return { seconds: 0, accumulated: 0, running: false };
  };

  // Update this useEffect
  useEffect(() => {
    if (currentField) {
      setCurrentGoal(currentField.goal || "");
      setNextSteps(currentField.nextSteps || []);
      
      // Load checked steps for this field
      const loadedCheckedSteps = stepStorageService.loadCheckedSteps(selectedField);
      setCheckedSteps(loadedCheckedSteps);
      
      // Load last check date
      const loadedLastCheckDate = stepStorageService.loadLastCheckDate(selectedField);
      setLastCheckDate(loadedLastCheckDate);
      
      // Calculate today's completed count
      const todayCount = countTodayCompleted(loadedCheckedSteps);
      setTodayCompletedCount(todayCount);
      
      // Load timer state for this field
      const savedTimer = loadTimerState(selectedField);
      if (savedTimer) {
        setFieldTimers(prev => ({
          ...prev,
          [selectedField]: savedTimer
        }));
        
        // If timer is running and no interval exists, start it
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
    }
  }, [selectedField, fields, currentField]);

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
  const handleCheckStep = async (stepIndex) => {
    const today = getTodayString();
    const newCheckedSteps = {
      ...checkedSteps,
      [stepIndex]: { checked: true, date: today }
    };
    
    setCheckedSteps(newCheckedSteps);
    stepStorageService.saveCheckedSteps(selectedField, newCheckedSteps);
    
    // Update last check date if this is the first check today
    const wasCheckedToday = Object.values(checkedSteps).some(step => step.date === today);
    if (!wasCheckedToday) {
      stepStorageService.saveLastCheckDate(selectedField, today);
      setLastCheckDate(today);
    }
    
    // Calculate and update streak
    const newStreak = calculateStreak(selectedField, newCheckedSteps);
    await apiService.updateStreak(selectedField, newStreak);
    
    // Update milestones (total completed)
    const completedCount = Object.values(newCheckedSteps).filter(s => s.checked).length;
    await apiService.updateMilestones(selectedField, completedCount);
    
    // Update today's count
    const todayCount = countTodayCompleted(newCheckedSteps);
    setTodayCompletedCount(todayCount);
    
    await loadFields();
  };

  // Handle unchecking a step
  const handleUncheckStep = async (stepIndex) => {
    const today = getTodayString();
    const stepToUncheck = checkedSteps[stepIndex];
    
    // Only allow unchecking if it was checked today
    if (!stepToUncheck || stepToUncheck.date !== today) {
      return;
    }
    
    const newCheckedSteps = { ...checkedSteps };
    delete newCheckedSteps[stepIndex];
    
    setCheckedSteps(newCheckedSteps);
    stepStorageService.saveCheckedSteps(selectedField, newCheckedSteps);
    
    // Recalculate streak (might go to 0 if this was the only check today)
    const newStreak = calculateStreak(selectedField, newCheckedSteps);
    await apiService.updateStreak(selectedField, newStreak);
    
    // Update milestones
    const completedCount = Object.values(newCheckedSteps).filter(s => s.checked).length;
    await apiService.updateMilestones(selectedField, completedCount);
    
    // Update today's count
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
        <div style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '96px', paddingBottom: '48px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
                {/* Overall Stats Summary */}
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
                      paddingRight: '4px' 
                    }}>
                      {nextSteps.map((step, idx) => {
                        const isChecked = checkedSteps[idx]?.checked;
                        const checkDate = checkedSteps[idx]?.date;
                        const today = getTodayString();
                        const canUndo = isChecked && checkDate === today;
                        
                        return (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
                            borderRadius: '12px', 
                            padding: '12px 16px',
                            border: isChecked ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
                            transition: 'all 0.2s'
                          }}>
                            {/* Checkbox */}
                            <button
                              onClick={() => isChecked ? handleUncheckStep(idx) : handleCheckStep(idx)}
                              disabled={isChecked && !canUndo}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
                                border: isChecked ? '2px solid #22c55e' : '2px solid rgba(255, 255, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: (isChecked && !canUndo) ? 'not-allowed' : 'pointer',
                                flexShrink: 0,
                                transition: 'all 0.2s',
                                opacity: (isChecked && !canUndo) ? 0.5 : 1
                              }}
                            >
                              {isChecked && <CheckCircle2 size={16} color="#22c55e" />}
                            </button>
                            
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '6px',
                              backgroundColor: 'rgba(220, 38, 38, 0.2)', 
                              border: '1px solid rgba(220, 38, 38, 0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                            }}>
                              {idx + 1}
                            </div>
                            
                            <div style={{ 
                              flex: 1,
                              textDecoration: isChecked ? 'line-through' : 'none',
                              opacity: isChecked ? 0.6 : 1
                            }}>
                              <EditableText
                                value={step}
                                onSave={(newValue) => updateNextStep(idx, newValue)}
                              />
                            </div>

                            {/* Date badge for completed items from previous days */}
                            {isChecked && !canUndo && (
                              <span style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                {checkDate}
                              </span>
                            )}

                            <button
                              onClick={() => deleteNextStep(idx)}
                              style={{
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                            >
                              <X size={18} />
                            </button>
                          </div>
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