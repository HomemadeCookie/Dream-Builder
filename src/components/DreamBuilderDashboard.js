// src/components/DreamBuilderDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock, TrendingUp, CheckCircle2, Menu, X, Flame, Calendar, Wifi, WifiOff, RefreshCw, Play, Pause, Square } from 'lucide-react';
import { apiService } from '../services/api';

const DreamBuilderDashboard = () => {
  const isMobile = window.innerWidth < 768;
  const timerAtBottom = true;
  const timerShouldStick = isMobile && !timerAtBottom; 
  // true = mobile layout puts timer at bottom
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


  const [selectedField, setSelectedField] = useState('business');
  const [menuOpen, setMenuOpen] = useState(false);
  const [fields, setFields] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [accumulatedHours, setAccumulatedHours] = useState(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    initializeApp();
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for unsynced data periodically
    const syncInterval = setInterval(checkUnsyncedData, 10000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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

  const updateProgress = async (fieldId, newProgress) => {
    try {
      await apiService.updateProgress(fieldId, newProgress);
      await loadFields();
      await checkUnsyncedData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const startTimer = () => {
    setTimerRunning(true);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopTimer = async () => {
    pauseTimer();
    
    // Calculate total hours (including accumulated + current session)
    const currentSessionHours = timerSeconds / 3600;
    const totalHours = accumulatedHours + currentSessionHours;
    
    // Only increment if we have at least 1 hour
    if (totalHours >= 1) {
      const hoursToAdd = Math.floor(totalHours);
      try {
        await apiService.addTimeSpent(selectedField, hoursToAdd);
        await loadFields();
        await checkUnsyncedData();
        
        // Keep the fractional hours for next session
        setAccumulatedHours(totalHours - hoursToAdd);
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
    } else {
      // Save accumulated time for next session
      setAccumulatedHours(totalHours);
    }
    
    setTimerSeconds(0);
  };

  const formatTimerDisplay = () => {
    const totalSeconds = timerSeconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getAccumulatedDisplay = () => {
    const totalHours = accumulatedHours + (timerSeconds / 3600);
    return totalHours.toFixed(2);
  };

  const currentField = fields[selectedField];

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
        {/* Sync Status */}
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

            {/* Bento Grid */}
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

              {/* Timer Card - Spans 2 rows */}
              <div style={
                // gridColumn: isMobile ? 'span 1' : 'span 4', gridRow: isMobile ? 'span 1' : 'span 2',
                // background: 'linear-gradient(to bottom right, rgba(220, 38, 38, 0.2), rgba(225, 29, 72, 0.2))',
                // border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '24px', padding: '24px',
                // display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                // top: isMobile ? '12px' : '24px',
                // right: isMobile ? '12px' : '24px',
                // gap: '16px',
                // position: isMobile ? 'sticky' : 'relative',
                // bottom: isMobile ? '12px' : 'auto',
                // zIndex: 20,
                timerCardStyle

              }>
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

                    {!timerRunning ? (
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
                      disabled={timerSeconds === 0}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px',
                        background: timerSeconds === 0 ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(to right, #dc2626, #e11d48)',
                        border: 'none', borderRadius: '12px',
                        color: '#fff', cursor: timerSeconds === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px', fontWeight: 600,
                        opacity: timerSeconds === 0 ? 0.5 : 1,
                        width: isMobile ? '100%' : 'auto'

                      }}
                    >
                      <Square size={20} />
                      Stop & Save
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle2 size={16} color="#dc2626" />
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Done</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{currentField.milestones}</div>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Flame size={16} color="#dc2626" />
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Streak</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{currentField.streak}</div>
              </div>

              <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={16} color="#dc2626" />
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Week</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>5d</div>
              </div>

              {/* Goal Card - Moved to accommodate timer */}
              <div style={{
                gridColumn: isMobile ? 'span 1' : 'span 4', gridRow: isMobile ? 'span 1' : 'span 1',
                background: 'linear-gradient(to bottom right, rgba(220, 38, 38, 0.15), rgba(225, 29, 72, 0.15))',
                border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '24px', padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Target size={20} color="#fca5a5" />
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>Current Goal</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentField.goal}</div>
              </div>

              {/* Next Steps */}
              <div style={{ gridColumn: isMobile ? 'span 1':'span 8', gridRow: isMobile ? 'span 1' : 'span 3', backgroundColor: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <TrendingUp size={20} color="#fca5a5" />
                  <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Next Steps</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                top: isMobile ? '12px' : '24px',
                right: isMobile ? '12px' : '24px', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
                  {currentField.nextSteps && currentField.nextSteps.length > 0 ? (
                    currentField.nextSteps.map((step, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px'
                      }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          backgroundColor: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ color: '#d1d5db', flex: 1 }}>
                          {typeof step === 'string' ? step : step.text}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '32px' }}>
                      No next steps yet
                    </div>
                  )}
                </div>
              </div>
            </div>
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