import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PersonalBestRow {
  category: string;
  snipes: number;
  attempts: number;
  avg_reaction: number;
}

const CATEGORIES = ['Normal', 'Busy', 'Dump'];

const StatsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [bests, setBests] = useState<Record<string, PersonalBestRow | null>>({
    'Normal': null,
    'Busy': null,
    'Dump': null,
  });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchBests = async () => {
      if (!user) {
        setFetching(false);
        return;
      }
      const { data, error } = await supabase
        .from('personal_bests')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching personal bests', error);
      }

      const map: Record<string, PersonalBestRow | null> = { ...bests };
      if (data) {
        data.forEach((row: any) => {
          map[row.category] = row as PersonalBestRow;
        });
      }
      setBests(map);
      setFetching(false);
    };

    if (!loading) {
      fetchBests();
    }
  }, [loading, user]);

  if (loading || fetching) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="h-screen flex items-center justify-center">Please log in to view your statistics.</div>;
  }

  const renderRow = (cat: string) => {
    const best = bests[cat];
    return (
      <tr key={cat} className="border-b border-gtl-border">
        <td className="py-2 px-4 font-semibold text-gtl-text">{cat}</td>
        <td className="py-2 px-4 text-center text-gtl-text">
          {best ? best.snipes : '—'}
        </td>
        <td className="py-2 px-4 text-center text-gtl-text">
          {best ? (best.attempts === 0 ? '0%' : ((best.snipes / best.attempts) * 100).toFixed(1) + '%') : '—'}
        </td>
        <td className="py-2 px-4 text-center text-gtl-text">
          {best ? best.avg_reaction.toFixed(0) + 'ms' : '—'}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl bg-gtl-surface-glass backdrop-blur-xl border border-white/20 shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-center text-gtl-text mb-6">📊 Personal Bests</h1>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gtl-border text-gtl-text-dim text-sm">
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4">Snipes</th>
              <th className="py-2 px-4">Accuracy</th>
              <th className="py-2 px-4">Avg Reaction</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsPage; 