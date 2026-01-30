import { getAllPlayerStats } from '@/lib/players';
import { PageContainer } from '@/components/layout/page-container';
import { RefreshButton } from '@/components/leaderboard/refresh-button';

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
    <PageContainer title="🏆 Leaderboard" maxWidth="2xl">
      {players.length === 0 ? (
        <div className="card text-center">
          <p className="text-poker-sage text-lg">
            No players found. Add players and submit sessions to see the leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_100px_70px] md:grid-cols-[50px_1fr_140px_90px] gap-2 md:gap-4 p-2 md:p-4 bg-poker-light-green/20 border-b-2 border-poker-light-green">
              <div className="font-bold text-base md:text-lg text-center">#️⃣</div>
              <div className="font-bold text-base md:text-lg">👤</div>
              <div className="font-bold text-base md:text-lg text-right">💰</div>
              <div className="font-bold text-base md:text-lg text-right">🎮</div>
            </div>

            {/* Player rows */}
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`grid grid-cols-[40px_1fr_100px_70px] md:grid-cols-[50px_1fr_140px_90px] gap-2 md:gap-4 p-2 md:p-4 ${
                  index < players.length - 1 ? 'border-b border-white/10' : ''
                } ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/2'} hover:bg-white/10 transition-colors`}
              >
                <div className="font-bold text-poker-sage text-xs md:text-base text-center flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="font-medium text-xs md:text-base truncate flex items-center">
                  {player.player_name}
                </div>
                <div 
                  className={`text-right font-bold text-xs md:text-base flex items-center justify-end ${
                    player.net_winnings > 0 
                      ? 'text-poker-light-green' 
                      : player.net_winnings < 0 
                      ? 'text-poker-coral' 
                      : 'text-poker-sage'
                  }`}
                >
                  {formatCurrency(player.net_winnings)}
                </div>
                <div className="text-right text-poker-sage text-xs md:text-base flex items-center justify-end">
                  {player.sessions}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <RefreshButton />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
