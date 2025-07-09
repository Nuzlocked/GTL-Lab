import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  username: string | null
  email: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    console.log('AuthContext: fetchProfile called for userId:', userId)
    try {
      console.log('AuthContext: Querying profiles table')
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('id', userId)
        .single()

      console.log('AuthContext: Profile query result:', { data, error })

      if (error && error.code !== 'PGRST116') {
        console.error('AuthContext: Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('AuthContext: Catch block - Error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    console.log('AuthContext: Starting initialization')
    console.log('AuthContext: Supabase URL:', process.env.REACT_APP_SUPABASE_URL)
    console.log('AuthContext: Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY)
    console.log('AuthContext: Supabase Key length:', process.env.REACT_APP_SUPABASE_ANON_KEY?.length)
    
    // Add a timeout as a fallback in case Supabase hangs
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: Timeout reached, setting loading to false and assuming no user')
      setUser(null)
      setProfile(null)
      setSession(null)
      setLoading(false)
    }, 3000) // 3 second timeout
    
    // Test basic connectivity first
    console.log('AuthContext: Testing Supabase connection...')
    
    // Try a simple health check first
    fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || ''}`,
      },
    }).then(response => {
      console.log('AuthContext: Basic connectivity test result:', response.status, response.statusText)
    }).catch(error => {
      console.error('AuthContext: Basic connectivity test failed:', error)
    })
    
    // Get initial session with timeout protection
    console.log('AuthContext: Calling supabase.auth.getSession()')
    
    // Use Promise.race to add timeout protection
    Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout')), 2000)
      )
    ]).then(async (result: any) => {
      const { data: { session } } = result
      console.log('AuthContext: Got session:', session)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('AuthContext: User exists, fetching profile')
        // Try to get profile, fallback to user metadata if profile doesn't exist yet
        try {
          const profileData = await fetchProfile(session.user.id)
          console.log('AuthContext: Profile data:', profileData)
          
          setProfile(profileData || {
            id: session.user.id,
            username: session.user.user_metadata?.username || null,
            email: session.user.email!
          })
        } catch (error) {
          console.error('AuthContext: Error fetching profile:', error)
          setProfile({
            id: session.user.id,
            username: session.user.user_metadata?.username || null,
            email: session.user.email!
          })
        }
      } else {
        console.log('AuthContext: No user session')
        setProfile(null)
      }
      
      console.log('AuthContext: Setting loading to false')
      clearTimeout(timeoutId)
      setLoading(false)
    }).catch(error => {
      console.error('AuthContext: Error getting session (will try auth listener):', error)
      // Don't set loading to false here - let the auth listener handle it
      // or let the timeout handle it
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('AuthContext: User exists in auth change, fetching profile')
        // Try to get profile, fallback to user metadata if profile doesn't exist yet
        try {
          const profileData = await fetchProfile(session.user.id)
          console.log('AuthContext: Profile data from auth change:', profileData)
          
          setProfile(profileData || {
            id: session.user.id,
            username: session.user.user_metadata?.username || null,
            email: session.user.email!
          })
        } catch (error) {
          console.error('AuthContext: Error fetching profile in auth change:', error)
          setProfile({
            id: session.user.id,
            username: session.user.user_metadata?.username || null,
            email: session.user.email!
          })
        }
      } else {
        console.log('AuthContext: No user in auth change')
        setProfile(null)
      }
      
      console.log('AuthContext: Setting loading to false from auth change')
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 