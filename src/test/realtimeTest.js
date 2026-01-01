import { supabase } from '../lib/supabase.js'

const testRealtime = () => {
  console.log('Starting realtime subscription...')
  
  const channel = supabase.channel('test-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'areas'
      },
      (payload) => {
        console.log('✅ Real-time update received:', payload)
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status)
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed! Now listening for changes...')
        console.log('👉 Go to Supabase Dashboard > Table Editor > areas and update a row')
      }
    })

  return channel
}

// Run the test
console.log('🚀 Initializing realtime test...')
testRealtime()

// Keep the process running
console.log('⏳ Waiting for updates (Press Ctrl+C to exit)...')