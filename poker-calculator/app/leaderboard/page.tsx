import { getAllPlayerStats } from '@/lib/players';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export default async function LeaderboardPage() {
  // Fetch data directly on the server
  const players = await getAllPlayerStats();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Leaderboard</h1>
      
      {players.length === 0 ? (
        <p>No players found. Add players and submit sessions to see the leaderboard.</p>
      ) : (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px 1fr 150px 100px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            borderBottom: '2px solid #ddd'
          }}>
            <div>#</div>
            <div>Player</div>
            <div style={{ textAlign: 'right' }}>Net Winnings</div>
            <div style={{ textAlign: 'right' }}>Sessions</div>
          </div>

          {/* Player rows */}
          {players.map((player, index) => (
            <div
              key={player.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 150px 100px',
                padding: '15px',
                borderBottom: index < players.length - 1 ? '1px solid #eee' : 'none',
                backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#666' }}>
                {index + 1}
              </div>
              <div style={{ fontWeight: '500' }}>
                {player.player_name}
              </div>
              <div 
                style={{ 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: player.net_winnings > 0 ? '#22c55e' : player.net_winnings < 0 ? '#ef4444' : '#666'
                }}
              >
                {formatCurrency(player.net_winnings)}
              </div>
              <div style={{ textAlign: 'right', color: '#666' }}>
                {player.sessions}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
