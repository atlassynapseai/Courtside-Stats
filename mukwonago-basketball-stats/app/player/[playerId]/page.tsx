import PlayerProfile from '../../../components/PlayerProfile';

interface PlayerPageProps {
  params: Promise<{ playerId: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerId } = await params;
  return <PlayerProfile playerId={playerId} />;
}