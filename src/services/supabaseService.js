import { supabase } from '../lib/supabase.js'

export const supabaseService = {
  // Check if user is authenticated
  isAuthenticated: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Sync local data to Supabase
  syncToSupabase: async (localData) => {
    const user = await supabaseService.getCurrentUser()
    if (!user) return false

    try {
      // Sync each area
      for (const [key, areaData] of Object.entries(localData)) {
        if (key === 'overall') continue // Skip overall for now

        // Check if area exists
        const { data: existingArea } = await supabase
          .from('areas')
          .select('id')
          .eq('user_id', user.id)
          .eq('area_type', key)
          .single()

        if (existingArea) {
          // Update existing area
          await supabase
            .from('areas')
            .update({
              name: areaData.name,
              icon: areaData.icon,
              goal: areaData.goal,
              progress: areaData.progress || 0,
              time_spent: areaData.timeSpent || 0,
              milestones: areaData.milestones || 0,
              streak: areaData.streak || 0,
              last_activity: new Date().toISOString()
            })
            .eq('id', existingArea.id)

          // Sync next steps
          // Delete old steps and insert new ones
          await supabase
            .from('next_steps')
            .delete()
            .eq('area_id', existingArea.id)

          if (areaData.nextSteps && areaData.nextSteps.length > 0) {
            const nextSteps = areaData.nextSteps.map((step, index) => ({
              area_id: existingArea.id,
              user_id: user.id,
              content: typeof step === 'string' ? step : step.content,
              order_index: index
            }))

            await supabase.from('next_steps').insert(nextSteps)
          }
        } else {
          // Create new area
          const { data: newArea } = await supabase
            .from('areas')
            .insert({
              user_id: user.id,
              area_type: key,
              name: areaData.name,
              icon: areaData.icon,
              goal: areaData.goal,
              progress: areaData.progress || 0,
              time_spent: areaData.timeSpent || 0,
              milestones: areaData.milestones || 0,
              streak: areaData.streak || 0,
              last_activity: new Date().toISOString()
            })
            .select()
            .single()

          // Insert next steps
          if (newArea && areaData.nextSteps && areaData.nextSteps.length > 0) {
            const nextSteps = areaData.nextSteps.map((step, index) => ({
              area_id: newArea.id,
              user_id: user.id,
              content: typeof step === 'string' ? step : step.content,
              order_index: index
            }))

            await supabase.from('next_steps').insert(nextSteps)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error syncing to Supabase:', error)
      return false
    }
  },

  // Load data from Supabase
  loadFromSupabase: async () => {
    const user = await supabaseService.getCurrentUser()
    if (!user) return null

    try {
      const { data: areas } = await supabase
        .from('areas')
        .select(`
          *,
          next_steps (
            id,
            content,
            order_index,
            completed
          )
        `)
        .eq('user_id', user.id)
        .order('area_type')

      if (!areas) return null

      // Convert to your local data format
      const convertedData = {}
      
      areas.forEach(area => {
        convertedData[area.area_type] = {
          id: area.area_type,
          name: area.name,
          icon: area.icon,
          goal: area.goal,
          progress: area.progress,
          timeSpent: area.time_spent,
          milestones: area.milestones,
          streak: area.streak,
          nextSteps: area.next_steps
            .sort((a, b) => a.order_index - b.order_index)
            .map(step => step.content)
        }
      })

      // Add overall field
      convertedData.overall = {
        id: 'overall',
        name: 'Overall',
        icon: '🎯',
        goal: 'Become the best version of myself',
        progress: 0,
        timeSpent: 0,
        milestones: 0,
        streak: 0,
        nextSteps: []
      }

      return convertedData
    } catch (error) {
      console.error('Error loading from Supabase:', error)
      return null
    }
  }
}