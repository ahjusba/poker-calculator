import { getAllPlayers } from '@/lib/players';
import { LedgerSubmitForm } from '../components/forms/ledger-submit-form';

export default async function HomePage() {
  // Pre-load players list on the server for faster device linking
  const players = await getAllPlayers();
  
  // Sort alphabetically for better UX
  const sortedPlayers = players
    .map(p => ({ id: p.id, name: p.player_name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <LedgerSubmitForm existingPlayers={sortedPlayers} />;
}
