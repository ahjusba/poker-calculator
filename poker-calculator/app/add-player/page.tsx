'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';

export default function AddPlayerPage() {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      setMessage('Please enter a player name');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create player');
      }

      setMessage(`Player "${data.player.player_name}" created successfully!`);
      setPlayerName('');
    } catch (error) {
      console.error('Failed to create player:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to create player');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer title="Add New Player" maxWidth="sm">
      <div className="card space-y-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter player name"
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        
        <button 
          onClick={handleSubmit} 
          disabled={isLoading || !playerName.trim()}
          className="btn-primary w-full"
        >
          {isLoading ? 'Creating...' : 'Create Player'}
        </button>

        {message && (
          <div className={`p-3 md:p-4 rounded-lg text-sm md:text-base ${
            message.includes('successfully') 
              ? 'bg-poker-light-green/20 border-l-4 border-poker-light-green text-white'
              : 'bg-poker-coral/20 border-l-4 border-poker-coral text-white'
          }`}>
            {message}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
