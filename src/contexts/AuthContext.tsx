import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  buyKey: string;
  cancelKey: string;
  refreshKeybinds: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [buyKey, setBuyKey] = useState('Space');
  const [cancelKey, setCancelKey] = useState('Shift');

  const refreshKeybinds = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('buy_key, cancel_key')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching keybinds', error);
      }
      if (data) {
        setBuyKey(data.buy_key || 'Space');
        setCancelKey(data.cancel_key || 'Shift');
      }
    }
  }, [user]);
  
  useEffect(() => {
    setLoading(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      refreshKeybinds();
    }
  }, [user, refreshKeybinds]);

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    logout,
    buyKey,
    cancelKey,
    refreshKeybinds
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 