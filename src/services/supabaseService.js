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
      console.log('Starting Supabase sync...');
      
      // Sync each area
      for (const [key, areaData] of Object.entries(localData)) {
        if (key === 'overall') continue // Skip overall for now

        console.log(`Syncing ${key}:`, areaData);

        // Check if area exists
        const { data: existingArea } = await supabase
          .from('areas')
          .select('id')
          .eq('user_id', user.id)
          .eq('area_type', key)
          .single()

        if (existingArea) {
          console.log(`Updating existing area: ${key}`);
          
          // Update existing area
          const { error: areaError } = await supabase
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

          if (areaError) {
            console.error(`Error updating area ${key}:`, areaError);
          }

          // Get existing steps to compare
          const { data: existingSteps } = await supabase
            .from('next_steps')
            .select('id, content, completed, subtasks, order_index')
            .eq('area_id', existingArea.id)
            .order('order_index')

          console.log(`Existing steps for ${key}:`, existingSteps);
          console.log(`New steps for ${key}:`, areaData.nextSteps);

          // Build a map of existing steps by their local ID (stored in content or we'll use content as key)
          const existingStepsMap = new Map();
          if (existingSteps) {
            existingSteps.forEach(step => {
              existingStepsMap.set(step.id, step);
            });
          }

          // Process each step
          if (areaData.nextSteps && areaData.nextSteps.length > 0) {
            const stepsToInsert = [];
            const stepsToUpdate = [];
            const existingStepIds = new Set(existingStepsMap.keys());

            for (let index = 0; index < areaData.nextSteps.length; index++) {
              const step = areaData.nextSteps[index];
              const stepObj = typeof step === 'string' 
                ? { text: step, subtasks: [], completed: false, id: `temp-${index}` }
                : step;

              // Try to find matching step by ID (if step.id is a Supabase ID) or by content
              let matchingStep = null;
              
              // Check if step.id matches a Supabase ID
              if (stepObj.id && existingStepsMap.has(stepObj.id)) {
                matchingStep = existingStepsMap.get(stepObj.id);
              } else {
                // Try to find by content match
                for (const [id, existingStep] of existingStepsMap) {
                  if (existingStep.content === stepObj.text) {
                    matchingStep = existingStep;
                    matchingStep.id = id;
                    break;
                  }
                }
              }

              if (matchingStep) {
                // Update existing step
                stepsToUpdate.push({
                  id: matchingStep.id,
                  content: stepObj.text || step,
                  completed: stepObj.completed || false,
                  subtasks: stepObj.subtasks || [],
                  order_index: index
                });
                existingStepIds.delete(matchingStep.id);
              } else {
                // Insert new step
                stepsToInsert.push({
                  area_id: existingArea.id,
                  user_id: user.id,
                  content: stepObj.text || step,
                  completed: stepObj.completed || false,
                  subtasks: stepObj.subtasks || [],
                  order_index: index
                });
              }
            }

            // Delete steps that no longer exist
            if (existingStepIds.size > 0) {
              console.log(`Deleting ${existingStepIds.size} steps from ${key}`);
              const { error: deleteError } = await supabase
                .from('next_steps')
                .delete()
                .in('id', Array.from(existingStepIds));
              
              if (deleteError) {
                console.error(`Error deleting steps:`, deleteError);
              }
            }

            // Update existing steps
            for (const step of stepsToUpdate) {
              console.log(`Updating step ${step.id}:`, step);
              const { error: updateError } = await supabase
                .from('next_steps')
                .update({
                  content: step.content,
                  completed: step.completed,
                  subtasks: step.subtasks,
                  order_index: step.order_index
                })
                .eq('id', step.id);
              
              if (updateError) {
                console.error(`Error updating step:`, updateError);
              }
            }

            // Insert new steps
            if (stepsToInsert.length > 0) {
              console.log(`Inserting ${stepsToInsert.length} new steps for ${key}:`, stepsToInsert);
              const { error: insertError } = await supabase
                .from('next_steps')
                .insert(stepsToInsert);
              
              if (insertError) {
                console.error(`Error inserting steps:`, insertError);
              }
            }
          } else {
            // No steps, delete all existing
            console.log(`No steps for ${key}, deleting all`);
            await supabase
              .from('next_steps')
              .delete()
              .eq('area_id', existingArea.id);
          }
        } else {
          console.log(`Creating new area: ${key}`);
          
          // Create new area
          const { data: newArea, error: createError } = await supabase
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

          if (createError) {
            console.error(`Error creating area ${key}:`, createError);
            continue;
          }

          // Insert next steps with subtasks
          if (newArea && areaData.nextSteps && areaData.nextSteps.length > 0) {
            const nextSteps = areaData.nextSteps.map((step, index) => {
              const stepObj = typeof step === 'string' 
                ? { text: step, subtasks: [], completed: false }
                : step;
              
              return {
                area_id: newArea.id,
                user_id: user.id,
                content: stepObj.text || step,
                completed: stepObj.completed || false,
                subtasks: stepObj.subtasks || [],
                order_index: index
              };
            });

            console.log(`Inserting ${nextSteps.length} steps for new area ${key}`);
            const { error: insertError } = await supabase
              .from('next_steps')
              .insert(nextSteps);
            
            if (insertError) {
              console.error(`Error inserting steps for new area:`, insertError);
            }
          }
        }
      }

      console.log('Supabase sync complete');
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
      console.log('Loading data from Supabase for user:', user.id);
      
      const { data: areas, error } = await supabase
        .from('areas')
        .select(`
          *,
          next_steps (
            id,
            content,
            order_index,
            completed,
            subtasks
          )
        `)
        .eq('user_id', user.id)
        .order('area_type')

      if (error) {
        console.error('Error loading from Supabase:', error);
        return null;
      }

      if (!areas) return null

      console.log('Raw areas data from Supabase:', areas);

      // Convert to your local data format
      const convertedData = {}
      
      areas.forEach(area => {
        console.log(`Processing area: ${area.area_type}`, area.next_steps);
        
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
            .map(step => {
              console.log('Processing step:', step);
              return {
                id: step.id, // Use Supabase ID
                text: step.content,
                subtasks: Array.isArray(step.subtasks) ? step.subtasks : [],
                completed: step.completed || false
              };
            })
        }
        
        console.log(`Converted ${area.area_type}:`, convertedData[area.area_type]);
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

      console.log('Final converted data:', convertedData);
      return convertedData
    } catch (error) {
      console.error('Error loading from Supabase:', error)
      return null
    }
  },
  
  sendFriendRequest: async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) throw error;
    return data;
  }
}