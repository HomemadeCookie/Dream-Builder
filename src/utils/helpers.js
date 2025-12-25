// src/utils/helpers.js

/**
 * Format hours to a readable string
 */
export const formatTimeSpent = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 100) {
    return `${hours.toFixed(1)}h`;
  }
  return `${Math.round(hours)}h`;
};

/**
 * Calculate percentage completion
 */
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Get color based on progress
 */
export const getProgressColor = (progress) => {
  if (progress >= 75) return '#22c55e'; // green
  if (progress >= 50) return '#eab308'; // yellow
  if (progress >= 25) return '#f97316'; // orange
  return '#dc2626'; // red
};

/**
 * Format date to relative time
 */
export const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

/**
 * Validate field data
 */
export const validateField = (field) => {
  const errors = [];
  
  if (!field.id) errors.push('Field must have an id');
  if (!field.name) errors.push('Field must have a name');
  if (typeof field.progress !== 'number' || field.progress < 0 || field.progress > 100) {
    errors.push('Progress must be a number between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate streak days
 */
export const calculateStreak = (lastActivityDate) => {
  if (!lastActivityDate) return 0;
  
  const now = new Date();
  const last = new Date(lastActivityDate);
  
  // Reset to start of day for comparison
  now.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  
  const diffTime = now - last;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get motivational message based on progress
 */
export const getMotivationalMessage = (progress, fieldName) => {
  if (progress === 0) {
    return `Ready to start your ${fieldName} journey? 🚀`;
  }
  if (progress < 25) {
    return `Great start on ${fieldName}! Keep going! 💪`;
  }
  if (progress < 50) {
    return `You're making solid progress in ${fieldName}! 🌟`;
  }
  if (progress < 75) {
    return `Over halfway there in ${fieldName}! Amazing work! 🎯`;
  }
  if (progress < 100) {
    return `Almost there with ${fieldName}! Final push! 🔥`;
  }
  return `${fieldName} mastered! Incredible achievement! 🏆`;
};

/**
 * Export data as JSON
 */
export const exportData = (data) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `dream-builder-backup-${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Debounce function for performance
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};