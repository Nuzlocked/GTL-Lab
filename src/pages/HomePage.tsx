import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Welcome Section */}
        <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-center text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome to GTL Lab!</h1>
          <p className="text-lg text-gtl-text-dim">
            Here you can test and improve your GTL sniping skills. Practice endlessly, go head to head with other players, and prove that you are the fastest.
          </p>
        </div>

        {/* Page Descriptions Section */}
        <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Explore the Lab</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Practice Page Card */}
            <div className="bg-gtl-secondary p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gtl-text">Practice Mode</h3>
              <p className="text-gtl-text-dim">
                Hone your skills in a stress-free environment. Customize your settings to your liking.
              </p>
            </div>

            {/* Ranked Page Card */}
            <div className="bg-gtl-secondary p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gtl-text">Ranked Mode</h3>
              <p className="text-gtl-text-dim">
                Compete against others in real-time, climb the ranks, and prove you're the best.
              </p>
            </div>

            {/* Friendly Page Card */}
            <div className="bg-gtl-secondary p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gtl-text">Friendly Matches</h3>
              <p className="text-gtl-text-dim">
                Challenge friends to custom, casual matches and see who's faster.
              </p>
            </div>

            {/* Leaderboards Page Card */}
            <div className="bg-gtl-secondary p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gtl-text">Leaderboards</h3>
              <p className="text-gtl-text-dim">
                See where you stand among the global elite and track the top players.
              </p>
            </div>

            {/* Stats Page Card */}
            <div className="bg-gtl-secondary p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gtl-text">Personal Stats</h3>
              <p className="text-gtl-text-dim">
                Track your progress with detailed statistics on your performance and improvement.
              </p>
            </div>

            {/* Settings Page Card */}
            <div className="bg-gtl-secondary p-4 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-gtl-text">Settings</h3>
              <p className="text-gtl-text-dim">
                Customize your experience, including your display name and other preferences.
              </p>
            </div>

          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Features */}
          <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Current Features:</h2>
            <ul className="list-disc list-inside space-y-2 text-gtl-text-dim">
              <li>Endless practice mode to hone your skills at your own pace.</li>
              <li>Competitive ranked mode to test your speed against others.</li>
              <li>Global leaderboards to see how you stack up against the competition.</li>
              <li>Personalized user statistics to track your improvement.</li>
            </ul>
          </div>

          {/* Upcoming Features */}
          <div className="rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Upcoming Features:</h2>
            <ul className="list-disc list-inside space-y-2 text-gtl-text-dim">
              <li>Customizable game settings.</li>
              <li>Team-based sniping challenges.</li>
              <li>Achievements and unlockables.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 