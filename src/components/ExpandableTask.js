import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, X, Play, Pause, Square, Clock, CheckCircle2, Minimize2 } from 'lucide-react';

const theme = {
  bg: '#0b0b0b',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  green: '#22c55e',
  greenSoft: 'rgba(34,197,94,0.12)',
  red: '#dc2626',
  redSoft: 'rgba(220,38,38,0.12)',
  yellow: '#eab308'
};

const ExpandableTask = ({ 
  task, index, onUpdateTask, onDeleteTask, isChecked, onCheck, onUncheck, canUndo, onTimeComplete 
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [taskTimer, setTaskTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(typeof task === 'string' ? task : task.text);

  // FIX: Always sync subtasks and title when task changes
  const [subtasks, setSubtasks] = useState([]);
  
  useEffect(() => {
    // Ensure we're working with the object format
    const taskObj = typeof task === 'string' ? { text: task, subtasks: [] } : task;
    setSubtasks(taskObj.subtasks || []);
    setEditedTitle(taskObj.text || task);
  }, [task]); // This will update whenever task prop changes

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => setTaskTimer(prev => prev + 1), 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [timerRunning]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (editedTitle !== (task.text || task)) {
      onUpdateTask(index, { ...task, text: editedTitle, subtasks });
    }
  };

  const handleStopAndSave = () => {
    const hours = taskTimer / 3600;
    onTimeComplete(hours);
    setTimerRunning(false);
    setTaskTimer(0);
  };

  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const containerStyle = isFullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    background: '#000',
    padding: isMobile ? '20px' : '40px',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } : {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
    borderRadius: '16px',
    border: isChecked
      ? `1px solid rgba(34,197,94,0.35)`
      : `1px solid rgba(255,255,255,0.08)`,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    backdropFilter: 'blur(6px)',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  };

  return (
    <div style={containerStyle}>
      <div style={{ 
        width: '100%', 
        maxWidth: isFullScreen ? '800px' : '100%', 
        display: 'flex', 
        flexDirection: 'column',
        gap: isFullScreen ? '12px' : '0' 
      }}>
        {/* PROGRESS BAR */}
        {isFullScreen && (
          <div style={{ width: '100%', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: '1',
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {completionPercentage}%
              </div>
              <div style={{
                fontSize: '14px',
                color: '#9ca3af',
                fontWeight: 500
              }}>
                complete
              </div>
            </div>

            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: '#1a1a1a', 
              borderRadius: '12px', 
              position: 'relative', 
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                width: `${completionPercentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #dc2626, #991b1b)',
                boxShadow: '0 0 12px rgba(220,38,38,0.4)',
                transition: 'width 0.3s ease' 
              }} />
            </div>
          </div>
        )}

        {/* HEADER SECTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', marginBottom: isFullScreen ? '24px' : '0'}}>
          <button
            onClick={() => {
              if (isChecked) {
                onUncheck(index);
              } else {
                const updated = subtasks.map(st => ({ ...st, completed: true }));
                setSubtasks(updated);
                onUpdateTask(index, { ...task, text: editedTitle, subtasks: updated });
                onCheck(index);
              }
            }}
            style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              backgroundColor: isChecked ? theme.greenSoft : 'transparent',
              border: isChecked
                ? `2px solid ${theme.green}`
                : '2px solid rgba(255,255,255,0.25)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            {isChecked && <CheckCircle2 size={18} color="#22c55e" />}
          </button>

          {isEditingTitle ? (
            <input
              autoFocus
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                borderBottom: '1px solid #dc2626', color: '#fff',
                fontSize: isFullScreen ? '28px' : '16px',
                fontWeight: 'bold', outline: 'none'
              }}
            />
          ) : (
            <div 
              onClick={() => setIsEditingTitle(true)}
              style={{ 
                flex: 1, cursor: 'text',
                fontSize: isFullScreen ? '28px' : '16px', 
                fontWeight: 'bold',
                textDecoration: isChecked ? 'line-through' : 'none',
                opacity: isChecked ? 0.6 : 1,
                color: '#fff'
              }}
            >
              {editedTitle}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isFullScreen ? (
              <button onClick={() => setIsFullScreen(true)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                <Maximize2 size={20} />
              </button>
            ) : (
              <button onClick={() => setIsFullScreen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Minimize2 size={24} />
              </button>
            )}
            
            <button
              onClick={() => { onDeleteTask(index); if(isFullScreen) setIsFullScreen(false); }}
              style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TIMER */}
        {isFullScreen && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ 
              padding: isMobile ? '20px' : '32px', 
              background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(0,0,0,0.6))',
              borderRadius: '24px', 
              border: '1px solid rgba(220,38,38,0.3)', 
              marginBottom: '4px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={24} color="#fca5a5" />
                  <span style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.15em',
                    color: '#fff'
                  }}>
                    {formatTime(taskTimer)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {!timerRunning ? (
                    <button
                      onClick={() => setTimerRunning(true)}
                      style={{
                        background: '#22c55e',
                        border: 'none',
                        color: '#fff',
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Play size={24} fill="white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setTimerRunning(false)}
                      style={{
                        background: '#eab308',
                        border: 'none',
                        color: '#fff',
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Pause size={24} fill="white" />
                    </button>
                  )}

                  <button
                    onClick={handleStopAndSave}
                    disabled={taskTimer === 0}
                    style={{
                      background: '#dc2626',
                      border: 'none',
                      color: '#fff',
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      cursor: taskTimer === 0 ? 'not-allowed' : 'pointer',
                      opacity: taskTimer === 0 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Square size={24} fill="white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTASKS */}
        {isFullScreen && (
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px', fontWeight: '600' }}>
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {subtasks.map((st, i) => (
                <div
                  key={st.id || i}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={st.completed} 
                    onChange={() => {
                      const updated = [...subtasks];
                      updated[i].completed = !updated[i].completed;
                      setSubtasks(updated);
                      onUpdateTask(index, { ...task, text: editedTitle, subtasks: updated });
                    }} 
                    style={{ width: '18px', height: '18px', accentColor: '#22c55e' }} 
                  />

                  <span
                    style={{
                      flex: 1,
                      fontSize: '16px',
                      textDecoration: st.completed ? 'line-through' : 'none',
                      opacity: st.completed ? 0.5 : 1,
                      color: '#fff'
                    }}
                  >
                    {st.text}
                  </span>

                  <button
                    onClick={() => {
                      const updated = subtasks.filter((_, idx) => idx !== i);
                      setSubtasks(updated);
                      onUpdateTask(index, { ...task, text: editedTitle, subtasks: updated });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete mini task"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                value={newSubtaskText} 
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Add a mini-task..." 
                style={{ 
                  flex: 1, background: '#111', border: '1px solid #333', 
                  color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' 
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubtaskText.trim()) {
                    const updated = [...subtasks, { id: Date.now(), text: newSubtaskText, completed: false }];
                    setSubtasks(updated);
                    onUpdateTask(index, { ...task, text: editedTitle, subtasks: updated });
                    setNewSubtaskText('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (newSubtaskText.trim()) {
                    const updated = [...subtasks, { id: Date.now(), text: newSubtaskText, completed: false }];
                    setSubtasks(updated);
                    onUpdateTask(index, { ...task, text: editedTitle, subtasks: updated });
                    setNewSubtaskText('');
                  }
                }} 
                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableTask;