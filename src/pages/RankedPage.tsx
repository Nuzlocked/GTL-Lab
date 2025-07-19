import React from 'react';

const RankedPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-8">
        <div className="text-center">
          {/* Coming Soon Icon */}
          <div className="text-6xl mb-6">🚧</div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gtl-text mb-4">Coming Soon</h1>
          
          {/* Description */}
          <p className="text-lg text-gtl-text-dim mb-6">
            Ranked mode is currently under development. This will be where you can compete against other players in official ranked matches to climb the competitive ladder.
          </p>
          
          {/* Features List */}
          <div className="bg-gtl-surface-dark/50 rounded-lg p-4 mb-6">
            <h3 className="text-gtl-text text-lg font-semibold mb-3">Planned Features:</h3>
            <ul className="text-gtl-text-dim space-y-2 text-sm">
              <li>• Competitive ranking system with tiers</li>
              <li>• Season-based competition with rewards</li>
              <li>• Matchmaking based on skill level</li>
              <li>• Official leaderboards and stats tracking</li>
              <li>• Achievement system and unlockables</li>
            </ul>
          </div>
          
          {/* Call to Action */}
          <div className="text-center">
            <p className="text-gtl-text-dim text-sm mb-4">
              In the meantime, practice your skills in Practice Mode or challenge friends in Friendly Matches!
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.href = '/practice'}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Practice Mode
              </button>
              <button
                onClick={() => window.location.href = '/friendly'}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Friendly Matches
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankedPage; 