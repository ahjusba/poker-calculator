import { getAllPlayers } from '@/lib/players';
import { LedgerSubmitForm } from '@/components/forms/ledger-submit-form';

// Cache this page but allow revalidation when players are added
export const revalidate = 60; // Revalidate at most every 60 seconds as fallback

export default async function HomePage() {
  // Pre-load players list on the server for faster device linking
  const players = await getAllPlayers();
  
  // Sort alphabetically for better UX
  const sortedPlayers = players
    .map(p => ({ id: p.id, name: p.player_name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <LedgerSubmitForm existingPlayers={sortedPlayers} />;
}
