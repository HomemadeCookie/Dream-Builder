import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import DreamBuilderDashboard from './components/DreamBuilderDashboard.js'
import AuthScreen from './components/AuthScreen.jsx'
import FriendsFeed from './components/FriendsFeed.jsx'
import { Users } from 'lucide-react'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'friends'

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000' }}>
      {/* Navigation */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: '12px 24px',
            background: currentView === 'dashboard' 
              ? 'linear-gradient(to right, #dc2626, #e11d48)' 
              : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          My Progress
        </button>
        
        <button
          onClick={() => setCurrentView('friends')}
          style={{
            padding: '12px 24px',
            background: currentView === 'friends' 
              ? 'linear-gradient(to right, #dc2626, #e11d48)' 
              : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} />
          Friends
        </button>
      </div>

      {/* Content */}
      
      {/* Keep both mounted, just hide one */}
      <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }}>
        <DreamBuilderDashboard />
      </div>
      <div style={{ display: currentView === 'friends' ? 'block' : 'none' }}>
        <FriendsFeed />
      </div>
    </div>
  )
}

export default App