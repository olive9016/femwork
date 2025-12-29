import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Load data from Supabase when user logs in
        syncFromSupabase(session.user.id)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        syncFromSupabase(session.user.id)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (!user || !isOnline) return

    const interval = setInterval(() => {
      syncToSupabase(user.id)
    }, 30000)

    return () => clearInterval(interval)
  }, [user, isOnline])

  // CRITICAL FIX: Smart sync from Supabase
  async function syncFromSupabase(userId) {
    if (!userId || !navigator.onLine) return

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No user data in Supabase yet - first time user')
          // Only sync UP if we have local data
          const hasLocalData = checkForLocalData()
          if (hasLocalData) {
            console.log('Found local data, syncing to cloud')
            await syncToSupabase(userId)
          }
        } else {
          console.error('Error loading from Supabase:', error)
        }
        return
      }

      if (data) {
        // Check if cloud data is newer than local
        const cloudUpdated = new Date(data.updated_at)
        const localUpdated = getLocalUpdateTime()
        
        if (!localUpdated || cloudUpdated > localUpdated) {
          // Cloud is newer - use it
          console.log('Cloud data is newer, loading from Supabase')
          
          if (data.cycle_data) {
            localStorage.setItem('femwork_cycle', JSON.stringify(data.cycle_data))
          }
          if (data.clients_data) {
            localStorage.setItem('femwork_clients', JSON.stringify(data.clients_data))
          }
          if (data.personal_tasks_data) {
            localStorage.setItem('femwork_personal_tasks', JSON.stringify(data.personal_tasks_data))
          }
          if (data.check_ins_data) {
            localStorage.setItem('femwork_daily_checkins', JSON.stringify(data.check_ins_data))
          }
          if (data.grounding_data) {
            localStorage.setItem('femwork_grounding', JSON.stringify(data.grounding_data))
          }
          if (data.ideas_data) {
            localStorage.setItem('femwork_ideas', JSON.stringify(data.ideas_data))
          }
          if (data.symptoms_data) {
            localStorage.setItem('femwork_symptoms', JSON.stringify(data.symptoms_data))
          }
          if (data.schedule_data) {
            localStorage.setItem('femwork_daily_schedule', JSON.stringify(data.schedule_data))
          }
          // NEW: Sync grounding history
          if (data.grounding_history) {
            localStorage.setItem('femwork_grounding_history', JSON.stringify(data.grounding_history))
          }
          // NEW: Sync connection history
          if (data.connection_history) {
            localStorage.setItem('femwork_connection_history', JSON.stringify(data.connection_history))
          }
          // NEW: Sync period history
          if (data.period_history) {
            localStorage.setItem('femwork_period_history', JSON.stringify(data.period_history))
          }
          
          // Save sync timestamp
          localStorage.setItem('femwork_last_sync', new Date().toISOString())
          
          console.log('✅ Data loaded from Supabase')
        } else {
          // Local is newer - sync up
          console.log('Local data is newer, syncing to cloud')
          await syncToSupabase(userId)
        }
      }
    } catch (e) {
      console.error('Load error:', e)
    }
  }

  function checkForLocalData() {
    const keys = [
      'femwork_cycle',
      'femwork_clients',
      'femwork_personal_tasks',
      'femwork_daily_checkins',
      'femwork_grounding',
      'femwork_ideas',
      'femwork_symptoms',
      'femwork_daily_schedule'
    ]
    
    return keys.some(key => {
      const data = localStorage.getItem(key)
      return data !== null && data !== '[]' && data !== '{}'
    })
  }

  function getLocalUpdateTime() {
    const timestamp = localStorage.getItem('femwork_last_sync')
    return timestamp ? new Date(timestamp) : null
  }

  async function syncToSupabase(userId) {
    if (!userId || !navigator.onLine) {
      console.log('Cannot sync - offline or no user')
      return
    }

    try {
      const cycleData = localStorage.getItem('femwork_cycle')
      const clientsData = localStorage.getItem('femwork_clients')
      const personalTasksData = localStorage.getItem('femwork_personal_tasks')
      const checkInsData = localStorage.getItem('femwork_daily_checkins')
      const groundingData = localStorage.getItem('femwork_grounding')
      const ideasData = localStorage.getItem('femwork_ideas')
      const symptomsData = localStorage.getItem('femwork_symptoms')
      const scheduleData = localStorage.getItem('femwork_daily_schedule')
      const groundingHistoryData = localStorage.getItem('femwork_grounding_history')
      const connectionHistoryData = localStorage.getItem('femwork_connection_history')
      const periodHistoryData = localStorage.getItem('femwork_period_history')

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          cycle_data: cycleData ? JSON.parse(cycleData) : null,
          clients_data: clientsData ? JSON.parse(clientsData) : null,
          personal_tasks_data: personalTasksData ? JSON.parse(personalTasksData) : null,
          check_ins_data: checkInsData ? JSON.parse(checkInsData) : null,
          grounding_data: groundingData ? JSON.parse(groundingData) : null,
          ideas_data: ideasData ? JSON.parse(ideasData) : null,
          symptoms_data: symptomsData ? JSON.parse(symptomsData) : null,
          schedule_data: scheduleData ? JSON.parse(scheduleData) : null,
          grounding_history: groundingHistoryData ? JSON.parse(groundingHistoryData) : null,
          connection_history: connectionHistoryData ? JSON.parse(connectionHistoryData) : null,
          period_history: periodHistoryData ? JSON.parse(periodHistoryData) : null,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Sync error:', error)
        throw error
      }

      // Update local sync timestamp
      localStorage.setItem('femwork_last_sync', new Date().toISOString())
      console.log('✅ Data synced to Supabase')
    } catch (e) {
      console.error('Sync failed:', e)
      throw e
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      await syncFromSupabase(data.user.id)
    }

    return data
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async function signOut() {
    // Sync one last time before signing out
    if (user) {
      await syncToSupabase(user.id)
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Clear local storage
    localStorage.clear()
    setUser(null)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw error
  }

  async function deleteAccount() {
    if (!user) return

    try {
      // Delete user data from Supabase
      const { error: deleteError } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Delete auth user (requires admin API or RPC function)
      // This part requires a Supabase Edge Function
      // For now, we'll sign out and clear data
      await signOut()

      alert('Account data deleted. Please contact support to fully delete your account.')
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    isOnline,
    signIn,
    signUp,
    signOut,
    resetPassword,
    deleteAccount,
    syncToSupabase: () => user && syncToSupabase(user.id),
    syncFromSupabase: () => user && syncFromSupabase(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}