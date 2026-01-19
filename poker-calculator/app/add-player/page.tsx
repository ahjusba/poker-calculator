'use client';

import { useState } from 'react';

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
    <div>
      <h1>Add New Player</h1>
      
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter player name"
      />
      
      <button onClick={handleSubmit} disabled={isLoading || !playerName.trim()}>
        {isLoading ? 'Creating...' : 'Create Player'}
      </button>

      {message && <div>{message}</div>}
    </div>
  );
}
