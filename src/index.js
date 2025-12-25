// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import DreamBuilderDashboard from './components/DreamBuilderDashboard';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DreamBuilderDashboard />
  </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Service Worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('New content available, please refresh');
    // You can add a notification here to tell users to refresh
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();