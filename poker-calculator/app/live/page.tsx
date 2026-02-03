'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/page-container';

interface Player {
  id: number;
  name: string;
  buyins: number[];
  net: number;
}

export default function LiveSessionPage() {
  const [history, setHistory] = useState<Player[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [payoutStrings, setPayoutStrings] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Load players and history from local storage when the component mounts
    const storedPlayers = localStorage.getItem('live-players');
    const storedHistory = localStorage.getItem('live-history');

    if (storedPlayers) {
      //React doesn't like setting state inside useEffect due to performance reasons
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPlayers(JSON.parse(storedPlayers) as Player[]);
    }

    if (storedHistory) {
      setHistory(JSON.parse(storedHistory) as Player[][]);
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Only save after initial load to prevent overwriting stored data
    if (isLoaded) {
      localStorage.setItem('live-players', JSON.stringify(players));
      localStorage.setItem('live-history', JSON.stringify(history));
    }
  }, [players, history, isLoaded]);

  const handleAddPlayer = () => {
    const playerName = prompt('Enter the name of the player:');
    if (playerName && playerName.trim()) {
      const playerId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;

      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim(),
        buyins: [],
        net: 0,
      };

      setHistory([...history, players]);
      setPlayers([...players, newPlayer]);
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setPlayers(previousState);
      setHistory(history.slice(0, -1));
    }
  };

  const handleReset = () => {
    const userConfirmed = window.confirm('Are you sure you want to RESET everything?');
    if (userConfirmed) {
      setPlayers([]);
      setHistory([]);
      setPayoutStrings([]);
    }
  };

  const handleAddBuyin = (player: Player) => {
    const buyinAmountString = prompt(`Buy-in/out for ${player.name}:`);
    if (buyinAmountString) {
      const sanitizedBuyinAmountString = buyinAmountString.replace(/,/g, '.');
      const buyinAmount = parseFloat(sanitizedBuyinAmountString);
      if (!isNaN(buyinAmount)) {
        const updatedPlayer: Player = {
          ...player,
          buyins: [...player.buyins, Number(buyinAmount.toFixed(2))],
          net: player.net - Number(buyinAmount.toFixed(2)),
        };
        const playerIndex = players.findIndex((p) => p.id === player.id);

        setHistory([...history, players]);
        setPlayers([
          ...players.slice(0, playerIndex),
          updatedPlayer,
          ...players.slice(playerIndex + 1),
        ]);
      }
    }
  };

  const handlePayout = () => {
    const totalNetAmount = Number(players.reduce((acc, player) => acc + player.net, 0).toFixed(2));

    let mysteryMoney: Player | null = null;
    if (totalNetAmount !== 0) {
      alert(
        `The Net Sum (Buy-ins + Buy-outs) is not zero but instead ${totalNetAmount} €. Have you marked all the buy-outs as negative? Each player still having chips should be bought out with a negative sum corresponding to the chips.`
      );
      mysteryMoney = {
        name: 'GHOST',
        id: -1,
        buyins: [],
        net: -1 * totalNetAmount,
      };
    }

    const winners = players
      .filter((player) => player.net > 0)
      .sort((a, b) => b.net - a.net)
      .map((player) => ({ ...player }));
    const losers = players
      .filter((player) => player.net < 0)
      .sort((a, b) => a.net - b.net)
      .map((player) => ({ ...player }));

    if (mysteryMoney) {
      if (mysteryMoney.net < 0) {
        losers.push(mysteryMoney);
      } else {
        winners.push(mysteryMoney);
      }
    }

    const payoutStrings: string[] = [];
    payoutStrings.push('Live Payout by Perkins:');
    for (const loser of losers) {
      let remainingDebt = Math.abs(loser.net);

      for (const winner of winners) {
        if (remainingDebt > 0 && winner.net > 0) {
          const amountToPay = Math.min(remainingDebt, winner.net);
          winner.net -= amountToPay;
          remainingDebt -= amountToPay;

          const newPayoutString = `${loser.name} ${Number(amountToPay.toFixed(2))} € → ${winner.name}`;
          payoutStrings.push(newPayoutString);
        }
      }
    }

    setPayoutStrings(payoutStrings);
  };

  const handleCopyToClipboard = () => {
    const textToCopy = payoutStrings.join('\n');

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert('Copied to clipboard:\n' + textToCopy);
      })
      .catch(() => {
        alert('Failed to copy to clipboard');
      });
  };

  return (
    <PageContainer title="🎮 Live Session" maxWidth="2xl">
      <div className="space-y-3">
        {/* Players List */}
        <div className="card p-3">
          {players.length === 0 ? (
            <p className="text-center text-poker-sage text-sm">No players added yet.</p>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm truncate">
                        {player.name}
                      </span>
                      <span
                        className={`font-bold text-xs ${
                          player.net >= 0 ? 'text-poker-light-green' : 'text-poker-coral'
                        }`}
                      >
                        {player.net >= 0 ? `(+${Number(player.net.toFixed(2))})` : `(${Number(player.net.toFixed(2))})`}
                      </span>
                    </div>
                    {player.buyins.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-xs text-white">
                        {player.buyins.map((buyin, index) => (
                          <span key={index}>
                            {buyin >= 0 ? `${buyin}` : `${buyin}`}
                            {index < player.buyins.length - 1 && ','}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAddBuyin(player)} 
                    className="px-2 py-1 bg-poker-coral text-white rounded hover:bg-poker-coral/90 transition-all text-lg shrink-0"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Section */}
        {payoutStrings.length > 0 && (
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-poker-light-green">Payout</h3>
              <button onClick={handleCopyToClipboard} className="px-2 py-1 bg-poker-coral text-white rounded hover:bg-poker-coral/90 transition-all text-sm">
                📋
              </button>
            </div>
            <div className="text-sm text-white whitespace-pre-line">
              {payoutStrings.join('\n')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={handleAddPlayer} className="px-2 py-3 bg-poker-coral text-white rounded hover:bg-poker-light-green/90 transition-all text-xs font-semibold">
            Add player
          </button>
          <button onClick={handlePayout} className="px-2 py-3 bg-poker-coral text-white rounded hover:bg-poker-coral/90 transition-all text-xs font-semibold">
            Payout
          </button>
          <button 
            onClick={handleUndo} 
            disabled={history.length === 0} 
            className={`px-2 py-3 text-white rounded transition-all text-xs font-semibold ${
              history.length === 0 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-poker-coral hover:bg-poker-coral/90'
            }`}
          >
            Undo
          </button>
          <button onClick={handleReset} className="px-2 py-3 bg-poker-watermelon text-white rounded hover:bg-poker-watermelon/90 transition-all text-xs font-semibold">
            Reset
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
