// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Listen for online/offline events
    function handleOnline() {
      console.log('🌐 Back online!')
      setIsOnline(true)
      // Sync when coming back online
      if (user) {
        syncToSupabase(user.id)
      }
    }
    
    function handleOffline() {
      console.log('📴 Offline mode')
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [user])

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // If user is logged in and online, sync their data from Supabase
      if (session?.user && navigator.onLine) {
        syncFromSupabase(session.user.id)
      }
    }).catch(error => {
      console.error('Session check error (possibly offline):', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user && navigator.onLine) {
        syncFromSupabase(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sync localStorage data to Supabase when user is authenticated
  async function syncToSupabase(userId) {
    if (!userId) return
    
    // Check if online
    if (!navigator.onLine) {
      console.log('📴 Offline - sync will happen when back online')
      return
    }

    try {
      // Get all localStorage data
      const cycleData = localStorage.getItem('femwork_cycle')
      const clientsData = localStorage.getItem('femwork_clients')
      const personalTasksData = localStorage.getItem('femwork_personal_tasks')
      const checkInsData = localStorage.getItem('femwork_daily_checkins')
      const groundingData = localStorage.getItem('femwork_grounding')
      const ideasData = localStorage.getItem('femwork_ideas')

      // Upsert user data to Supabase
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
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error syncing to Supabase:', error)
      } else {
        console.log('✅ Data synced to Supabase')
      }
    } catch (e) {
      console.error('Sync error (possibly offline):', e)
    }
  }

  // Load data from Supabase to localStorage
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
          console.log('No user data in Supabase yet')
        } else {
          console.error('Error loading from Supabase:', error)
        }
        return
      }

      if (data) {
        // Load data into localStorage
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
        
        console.log('✅ Data loaded from Supabase')
        window.location.reload()
      }
    } catch (e) {
      console.error('Load error (possibly offline):', e)
    }
  }

  // Auto-sync to Supabase every 30 seconds if user is logged in and online
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncToSupabase(user.id)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user])

  // Sign up with email
  async function signUp(email, password) {
    if (!navigator.onLine) {
      throw new Error('Cannot sign up while offline. Please connect to the internet.')
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) throw error
    
    // Sync current localStorage data after signup
    if (data.user) {
      await syncToSupabase(data.user.id)
    }
    
    return data
  }

  // Sign in with email
  async function signIn(email, password) {
    if (!navigator.onLine) {
      throw new Error('Cannot sign in while offline. Please connect to the internet.')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  // Sign out
  async function signOut() {
    // Sync one last time before signing out (if online)
    if (user && navigator.onLine) {
      await syncToSupabase(user.id)
    }
    
    const { error } = await supabase.auth.signOut()
    if (error && error.message !== 'Failed to fetch') {
      throw error
    }
    
    // Clear localStorage
    localStorage.clear()
  }

  // Manual sync function
  async function manualSync() {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }
    
    if (user) {
      await syncToSupabase(user.id)
    }
  }

  const value = {
    user,
    loading,
    isOnline,
    signUp,
    signIn,
    signOut,
    syncToSupabase: manualSync
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}