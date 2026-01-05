import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

 
  const createDefaultAreas = async (userId) => {
    console.log('Creating default areas for user:', userId)
    
    // Call the database function that bypasses RLS
    const { error } = await supabase.rpc('create_user_default_areas', {
      user_id_param: userId
    })

    if (error) {
      console.error('Error creating default areas:', error)
      throw new Error('Failed to create areas: ' + error.message)
    }

    console.log('Default areas created successfully')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      } else {
        // Sign up
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        })
        
        if (signUpError) throw signUpError
        
        if (authData.user) {
          console.log('User created:', authData.user.id)
          
          // Wait a bit for auth to fully process
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          try {
            // Create profile
            const { error: profileError } = await supabase.from('profiles').insert({
              id: authData.user.id,
              username,
              display_name: username
            })
            
            if (profileError) {
              console.error('Profile error:', profileError)
              throw new Error('Failed to create profile: ' + profileError.message)
            }
            
            console.log('Profile created')
            
            // Create default privacy settings
            const { error: privacyError } = await supabase.from('privacy_settings').insert({
              user_id: authData.user.id
            })
            
            if (privacyError) {
              console.error('Privacy error:', privacyError)
              throw new Error('Failed to create privacy settings: ' + privacyError.message)
            }
            
            console.log('Privacy settings created')

            // Create default areas and next steps
            await createDefaultAreas(authData.user.id)
            
            console.log('Setup complete!')
            
          } catch (setupError) {
            // If setup fails, delete the auth user to allow retry
            console.error('Setup failed, cleaning up:', setupError)
            await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
            throw setupError
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '8px' }}>🎯</h1>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Dream Builder</h2>
          <p style={{ color: '#6b7280' }}>Track your progress toward your dreams</p>
        </div>

        <div style={{ 
          backgroundColor: '#1a1a1a', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '24px', 
          padding: '32px' 
        }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h3>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              color: '#ef4444',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(to right, #dc2626, #e11d48)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '12px' }}>
          <p>Your data works offline and syncs when online</p>
        </div>
      </div>
    </div>
  )
}