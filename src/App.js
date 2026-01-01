import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'  // Add .js
import DreamBuilderDashboard from './components/DreamBuilderDashboard.js'
import AuthScreen from './components/AuthScreen.jsx'  // Add .jsx

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return <DreamBuilderDashboard />
}

export default App