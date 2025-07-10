import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const UserSettingsPage: React.FC = () => {
  const { user, buyKey: contextBuyKey, cancelKey: contextCancelKey, refreshKeybinds, loading: authLoading } = useAuth();
  
  const [localBuyKey, setLocalBuyKey] = useState(contextBuyKey);
  const [localCancelKey, setLocalCancelKey] = useState(contextCancelKey);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<null | 'buy' | 'cancel'>(null);

  const keyBindingRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLocalBuyKey(contextBuyKey);
    setLocalCancelKey(contextCancelKey);
  }, [contextBuyKey, contextCancelKey]);


  const handleKeyCapture = (keyType: 'buy' | 'cancel') => {
    setIsListening(keyType);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isListening) {
        event.preventDefault();
        
        let newKey: string;
        if (event.key === ' ') {
          newKey = 'Space';
        } else {
          newKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
        }
        
        if (isListening === 'buy') {
          setLocalBuyKey(newKey);
        } else if (isListening === 'cancel') {
          setLocalCancelKey(newKey);
        }
        setIsListening(null);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (isListening && keyBindingRef.current && !keyBindingRef.current.contains(event.target as Node)) {
        setIsListening(null);
      }
    };

    if (isListening) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isListening]);


  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    const { error: keybindUpdateError } = await supabase
        .from('profiles')
        .update({ buy_key: localBuyKey, cancel_key: localCancelKey })
        .eq('id', user.id);
    
    if (keybindUpdateError) {
      setError('Error updating keybinds.');
      console.error('Error updating keybinds:', keybindUpdateError);
    } else {
      setSuccessMessage('Keybinds updated successfully!');
      await refreshKeybinds();
    }

    setSaving(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  if (authLoading) { 
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl text-white">Loading Settings...</div>
        </div>
    );
  }

  const KeybindInput = ({ label, value, onClick, isListening }: { label: string, value: string, onClick: () => void, isListening: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gtl-text mb-1">{label}</label>
      <button
        ref={isListening ? keyBindingRef : null}
        onClick={onClick}
        className="relative block w-full px-3 py-3 text-left border border-gtl-border rounded-md placeholder-gtl-text-dim text-gtl-text bg-gtl-surface-light focus:outline-none focus:ring-2 focus:ring-gtl-primary focus:border-gtl-primary"
      >
        <span className="font-mono text-lg">{isListening ? 'Press a key...' : value}</span>
        {isListening && <span className="absolute inset-0 bg-gtl-primary/20 animate-pulse rounded-md"></span>}
      </button>
      {isListening && <p className="mt-1 text-xs text-gtl-text-dim">Select the key you'd like to bind. Click outside to cancel.</p>}
    </div>
  );


  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-center text-gtl-text mb-6">Control Settings</h1>
            
            {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 mb-4 rounded-md text-center">{error}</div>}
            {successMessage && <div className="bg-green-900/50 border border-green-500 text-green-300 p-3 mb-4 rounded-md text-center">{successMessage}</div>}

            <div className="space-y-6">
              <KeybindInput 
                label="Buy Button" 
                value={localBuyKey} 
                onClick={() => handleKeyCapture('buy')} 
                isListening={isListening === 'buy'}
              />

              <KeybindInput 
                label="Cancel Buy Button" 
                value={localCancelKey} 
                onClick={() => handleKeyCapture('cancel')} 
                isListening={isListening === 'cancel'}
              />

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gtl-primary hover:bg-gtl-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gtl-primary-hover disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage; 