import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthProps {
  onAuthSuccess?: () => void
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Username validation
  const validateUsername = (username: string): string | null => {
    if (!username) return 'Username is required'
    if (username.length > 16) return 'Username must be 16 characters or less'
    if (!/^[a-zA-Z]+$/.test(username)) return 'Username can only contain letters'
    return null
  }

  // Check if username is unique (case-insensitive)
  const checkUsernameUnique = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .limit(1)

      if (error && error.code !== 'PGRST116') { // PGRST116 is "table does not exist"
        console.error('Error checking username:', error)
        return true // Allow if we can't check
      }

      return !data || data.length === 0
    } catch (error) {
      console.error('Error checking username:', error)
      return true // Allow if we can't check
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setMessage('Successfully signed in!')
      } else {
        // Validate username for signup
        const usernameError = validateUsername(username)
        if (usernameError) {
          setMessage(usernameError)
          setLoading(false)
          return
        }

        // Check username uniqueness
        const isUnique = await checkUsernameUnique(username)
        if (!isUnique) {
          setMessage('Username is already taken')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase() // Store as lowercase for consistency
            }
          }
        })

        if (error) throw error

        // Create profile record if signup was successful
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: username.toLowerCase(),
              email: email
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
            // Don't throw here as the user was created successfully
          }
        }

        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setMessage('Check your email for verification link! If you don\'t see it, check your spam folder.')
        } else {
          setMessage('Account created successfully! You can now sign in.')
        }
      }
      
      if (onAuthSuccess) {
        onAuthSuccess()
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Main auth card with GTL theme */}
        <div className="bg-gtl-surface rounded-lg shadow-lg border border-gtl-border p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gtl-text">
              Pokemon GTL Lab
            </h2>
            <h3 className="mt-2 text-center text-xl font-bold text-gtl-text">
              {isLogin ? 'Sign in to your account' : 'Create new account'}
            </h3>
            <p className="mt-2 text-center text-sm text-gtl-text-dim">
              Or{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setMessage('')
                  setUsername('')
                }}
                className="font-medium text-gtl-primary hover:text-gtl-primary-hover transition-colors"
              >
                {isLogin ? 'create a new account' : 'sign in to existing account'}
              </button>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gtl-text mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required={!isLogin}
                    className="appearance-none relative block w-full px-3 py-2 border border-gtl-border rounded-md placeholder-gtl-text-dim text-gtl-text bg-gtl-surface-light focus:outline-none focus:ring-2 focus:ring-gtl-primary focus:border-gtl-primary focus:z-10 sm:text-sm"
                    placeholder="Choose a username (letters only, max 16)"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow letters and limit to 16 characters
                      if (/^[a-zA-Z]*$/.test(value) && value.length <= 16) {
                        setUsername(value)
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gtl-text-dim">
                    Letters only, maximum 16 characters
                  </p>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gtl-text mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gtl-border rounded-md placeholder-gtl-text-dim text-gtl-text bg-gtl-surface-light focus:outline-none focus:ring-2 focus:ring-gtl-primary focus:border-gtl-primary focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gtl-text mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gtl-border rounded-md placeholder-gtl-text-dim text-gtl-text bg-gtl-surface-light focus:outline-none focus:ring-2 focus:ring-gtl-primary focus:border-gtl-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message && (
              <div className={`text-sm text-center p-3 rounded-md ${
                message.includes('Successfully') || message.includes('Check your email')
                  ? 'text-green-300 bg-green-900/20'
                  : 'text-red-300 bg-red-900/20'
              }`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gtl-primary hover:bg-gtl-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gtl-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Create Account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 