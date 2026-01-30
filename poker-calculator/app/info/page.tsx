import { PageContainer } from '@/components/layout/page-container';

export default function InfoPage() {
  return (
    <PageContainer title="ℹ️ Information" maxWidth="lg">
      <div className="card space-y-6">
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-poker-light-green mb-4">
            How to Use
          </h2>
          <div className="space-y-3 text-sm md:text-base text-poker-sage">
            <p>
              <strong className="text-white">1. Submit PokerNow Link:</strong> Paste the game lobby URL and submit. You can resubmit the same game to update results.
            </p>
            <p>
              <strong className="text-white">2. Link Devices:</strong> If any devices haven&apos;t been linked to a player, you&apos;ll be prompted to link them manually.
            </p>
            <p>
              <strong className="text-white">3. Copy Payout:</strong> Get the payout plan copied to your clipboard for easy sharing.
            </p>
            <p>
              <strong className="text-white">4. View Leaderboard:</strong> Submitted games are automatically reflected in the leaderboard rankings.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-bold text-poker-coral mb-4">
            Important Notes
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-poker-sage">
            <li><strong className="text-white">New Players:</strong> Add the player first before linking their device ID.</li>
            <li><strong className="text-white">Device Linking:</strong> Be extra cautious when linking device IDs to players - incorrect links affect all historical data.</li>
            <li><strong className="text-white">Live Session:</strong> The live calculator is not linked to the database.</li>
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
