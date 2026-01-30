import { PageContainer } from '@/components/layout/page-container';

export default function InfoPage() {
  return (
    <PageContainer title="ℹ️ Information" maxWidth="lg">
      <div className="card space-y-6">
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-poker-light-green mb-4">
            How to Use This App
          </h2>
          <div className="space-y-3 text-sm md:text-base text-poker-sage">
            <p>
              1. <strong className="text-white">Add Players:</strong> Go to &quot;Add Player&quot; to register all poker night participants.
            </p>
            <p>
              2. <strong className="text-white">Submit Ledgers:</strong> After each game, paste the PokerNow game URL to process results.
            </p>
            <p>
              3. <strong className="text-white">View Leaderboard:</strong> Check rankings, winnings, and session counts.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-bold text-poker-coral mb-4">
            Tips
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-poker-sage">
            <li>Keep player names consistent across sessions</li>
            <li>Link unknown device IDs when prompted</li>
            <li>Copy payout results to share with players</li>
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
