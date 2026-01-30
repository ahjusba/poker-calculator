'use client';

import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <button 
      onClick={handleRefresh}
      className="btn-secondary w-full sm:w-auto"
    >
      🔄 Refresh Leaderboard
    </button>
  );
}
