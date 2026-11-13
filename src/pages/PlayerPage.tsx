import { useState } from 'react';
import { startPlayer, stopPlayer, getPlayerStats } from '@/api/client';
import { Icon } from '../components/ui/Icon';

export default function PlayerPage() {
  const [stats, setStats] = useState<any>(null);
  const [contentUrl, setContentUrl] = useState('https://uq.test/content/1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    try {
      await startPlayer({ itemId: contentUrl });
      setIsPlaying(true);
      setMessage('▶️ Lecture démarrée');
    } catch (err) {
      setMessage('❌ Erreur de démarrage');
    }
  };

  const handleStop = async () => {
    try {
      const resp = await stopPlayer();
      setIsPlaying(false);
      setMessage('⏹️ Total payé : ' + resp.total_points_paid + ' points');
      const stats = await getPlayerStats();
      setStats(stats);
    } catch (err) {
      setMessage('❌ Erreur d"arrêt"');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold"><Icon name="music" size={24} tone="info" /> LECTEUR UQ</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white/5 rounded-3xl p-6 text-center">
          <input
            type="text"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            className="w-full bg-white/10 rounded-xl px-4 py-3 text-white"
          />
          
          <div className="mt-4 flex gap-3 justify-center">
            {!isPlaying ? (
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-purple-600 rounded-xl font-semibold"
              >
                ▶️ START
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-8 py-3 bg-red-600 rounded-xl font-semibold"
              >
                <Icon name="square" size={20} /> STOP
              </button>
            )}
          </div>
          
          {message && <p className="mt-4 text-lg">{message}</p>}
        </div>

        {stats && (
          <div className="bg-purple-900/30 rounded-3xl p-6">
            <h2 className="text-lg text-purple-300"><Icon name="chart" size={18} tone="info" /> STATISTIQUES</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Sessions</p>
                <p className="text-2xl font-bold">{stats.total_sessions}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Secondes</p>
                <p className="text-2xl font-bold">{stats.total_seconds}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total payé</p>
                <p className="text-2xl font-bold">{stats.total_paid} pts</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">En cache</p>
                <p className="text-2xl font-bold">{stats.cached_contents}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


