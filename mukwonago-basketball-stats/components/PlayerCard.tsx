import { motion } from 'framer-motion';
import { Player } from '../lib/types';
import { getPlayerStats } from '../lib/gameUtils';

interface PlayerCardProps {
  player: Player;
  team: 'muk' | 'opponent';
  events: Parameters<typeof getPlayerStats>[0];
  active?: boolean;
  onSelect?: (player: Player) => void;
  onToggleActive?: (player: Player) => void;
}

export default function PlayerCard({ player, team, events, active = false, onSelect, onToggleActive }: PlayerCardProps) {
  const stats = getPlayerStats(events, player, team);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(player)}
      whileTap={{ scale: 0.985 }}
      className={`court-glass court-button flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${active ? 'border-brand-gold shadow-[0_0_0_1px_rgba(200,151,42,0.6),0_0_24px_rgba(200,151,42,0.15)]' : 'border-brand-border'
        }`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-black ${active ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-slate text-brand-white'}`}>
        {player.number}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-semibold text-brand-white">{player.name}</div>
          {player.position && <div className="rounded-full border border-brand-border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-brand-muted">{player.position}</div>}
        </div>
        <div className="mt-1 grid grid-cols-4 gap-2 text-[11px] text-brand-muted">
          <span><b className="text-brand-gold">{stats.pts}</b> PTS</span>
          <span><b className="text-brand-white">{stats.reb}</b> REB</span>
          <span><b className="text-brand-white">{stats.ast}</b> AST</span>
          <span><b className={`${stats.pf > 3 ? 'text-brand-red' : 'text-brand-white'}`}>{stats.pf}</b> PF</span>
        </div>
      </div>

      {onToggleActive && (
        <div
          onClick={(event) => {
            event.stopPropagation();
            onToggleActive(player);
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-[10px] font-bold uppercase tracking-[0.18em] ${active ? 'border-brand-green bg-brand-green/15 text-brand-green' : 'border-brand-border bg-brand-navy text-brand-muted'}`}
        >
          {active ? 'In' : 'Out'}
        </div>
      )}
    </motion.button>
  );
}