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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Try to get profile first, fallback to user metadata
        let profileData = await fetchProfile(session.user.id)
        
        if (!profileData && session.user.user_metadata?.username) {
          // Create profile from user metadata if it doesn't exist
          const { data: insertedProfile } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              username: session.user.user_metadata.username,
              email: session.user.email!
            })
            .select()
            .single()
          
          profileData = insertedProfile
        }
        
        setProfile(profileData || {
          id: session.user.id,
          username: session.user.user_metadata?.username || null,
          email: session.user.email!
        })
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Try to get profile first, fallback to user metadata
        let profileData = await fetchProfile(session.user.id)
        
        if (!profileData && session.user.user_metadata?.username) {
          // Create profile from user metadata if it doesn't exist
          const { data: insertedProfile } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              username: session.user.user_metadata.username,
              email: session.user.email!
            })
            .select()
            .single()
          
          profileData = insertedProfile
        }
        
        setProfile(profileData || {
          id: session.user.id,
          username: session.user.user_metadata?.username || null,
          email: session.user.email!
        })
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
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