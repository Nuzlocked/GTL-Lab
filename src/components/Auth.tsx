import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface AuthProps {
  onAuthSuccess?: () => void
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const dummyEmail = `${username.toLowerCase()}@example.com`
        const { error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password,
        })
        if (error) throw error
        setMessage('Successfully signed in!')
        navigate('/')
      } else {
        // Validate username for signup
        const usernameError = validateUsername(username)
        if (usernameError) {
          setMessage(usernameError)
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setMessage('Passwords do not match.')
          setLoading(false)
          return
        }
        
        const dummyEmail = `${username.toLowerCase()}@example.com`
        const { data, error } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            data: {
              username: username // Preserve original casing
            },
            // emailRedirectTo: window.location.origin
          }
        })

        console.log('Signup result:', { data, error })

        if (error) {
          console.error('Auth signup error:', error)
          throw error
        }

        // Profile will be created automatically by database trigger
        // No need to manually create it here

        // Check if email confirmation is required - DISABLED
        /* if (data.user && !data.user.email_confirmed_at) {
          setMessage('Check your email for verification link! Click the link to verify your account and then return to sign in. If you don\'t see it, check your spam folder.')
        } else {
          setMessage('Account created successfully! You can now sign in.')
        } */
        setMessage('Account created successfully! You can now sign in.')
      }
      
      if (onAuthSuccess) {
        onAuthSuccess()
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      console.error('Error details:', error.message, error.status, error.statusText)
      
      // Provide more specific error messages
      if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        setMessage('Username is already taken. Please choose a different one.')
      } else if (error.message?.toLowerCase().includes('email')) {
        setMessage('There was an issue creating the account. Please check the username and try again.')
      } else if (error.message?.includes('Password')) {
        setMessage('Password must be at least 6 characters long.')
      } else if (error.message?.includes('profiles')) {
        setMessage('Error creating user profile. Please try again.')
      } else if (error.message?.includes('function handle_new_user')) {
        setMessage('Database error saving new user. Please try again.')
      } else if (error.message?.includes('Database error saving new user')) {
        setMessage('Database trigger error. Please check your Supabase database setup.')
      } else {
        setMessage(error.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-6">
        {/* Main auth card with GTL theme */}
        <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6">
          <div>
            <div className="flex justify-center mb-4">
              <img 
                src="/gtl-lab_logo.png" 
                alt="GTL Lab Logo" 
                className="w-12 h-12"
              />
            </div>
            <h2 className="mt-4 text-center text-2xl font-extrabold text-gtl-text">
              Welcome to GTL Lab!
            </h2>
            <h3 className="mt-2 text-center text-lg font-bold text-gtl-text">
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
          
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              {!isLogin && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gtl-text mb-1">
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
              
              {isLogin && (
                <div>
                  <label htmlFor="username-login" className="block text-sm font-medium text-gtl-text mb-1">
                    Username
                  </label>
                  <input
                    id="username-login"
                    name="username"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gtl-border rounded-md placeholder-gtl-text-dim text-gtl-text bg-gtl-surface-light focus:outline-none focus:ring-2 focus:ring-gtl-primary focus:border-gtl-primary focus:z-10 sm:text-sm"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gtl-text mb-1">
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

              {!isLogin && (
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gtl-text mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gtl-border rounded-md placeholder-gtl-text-dim text-gtl-text bg-gtl-surface-light focus:outline-none focus:ring-2 focus:ring-gtl-primary focus:border-gtl-primary focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
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

            <div className="pt-2">
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