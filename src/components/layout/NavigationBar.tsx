import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GearIcon } from '@radix-ui/react-icons';

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
}

interface NavigationBarProps {
  profile: UserProfile | null;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ profile }) => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gtl-header shadow-lg border-b border-gtl-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img 
                src="/favicon.png" 
                alt="GTL Lab Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-gtl-text">
                GTL Lab
              </h1>
            </div>
            <nav className="flex items-center space-x-6">
              <NavLink to="/" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>Home</NavLink>
              <NavLink to="/practice" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>Practice</NavLink>
              <NavLink to="/friendly" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>Friendly</NavLink>
              <NavLink to="/ranked" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>Ranked</NavLink>
              <NavLink to="/leaderboards" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>Leaderboards</NavLink>
              <NavLink to="/stats" className={({ isActive }) => `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-gtl-text' : 'text-gray-400 hover:text-gtl-text'}`}>Stats</NavLink>
            </nav>
          </div>
          {user && (
            <div className="flex items-center space-x-6">
              <span className="text-gtl-text font-medium text-sm">
                {profile?.username || '\u00A0'}
              </span>
              <NavLink to="/settings" className="text-gray-400 hover:text-gtl-text">
                <GearIcon />
              </NavLink>
              <div className="w-px h-8 bg-gtl-border"></div>
              <button
                onClick={logout}
                className="bg-gtl-surface-light hover:bg-red-600 text-gtl-text hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavigationBar; 