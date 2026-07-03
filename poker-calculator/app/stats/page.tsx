import { PageContainer } from '@/components/layout/page-container';
import { NetWinningsChart } from '@/components/stats/net-winnings-chart';
import { getPlayerSessionResults } from '@/lib/stats';

// Revalidate only when explicitly triggered (consistent with the leaderboard).
export const revalidate = false;

export default async function StatsPage() {
  const rows = await getPlayerSessionResults();

  return (
    <PageContainer title="📊 Net Winnings" maxWidth="full">
      <p className="mb-6 text-center text-sm text-poker-sage">
        Cumulative winnings (€) over time. The top 5 players are shown by default —
        toggle players and adjust the date range below.
      </p>
      <NetWinningsChart rows={rows} />
    </PageContainer>
  );
}
