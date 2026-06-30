import { Game } from '../lib/types';
import { generateBoxScore, formatPeriodAbbreviation } from '../lib/gameUtils';

interface BoxScoreProps {
  game: Game;
}

export default function BoxScore({ game }: BoxScoreProps) {
  const muk = generateBoxScore(game.mukRoster, game.events, 'muk');
  const opponent = generateBoxScore(game.opponentRoster, game.events, 'opponent');

  return (
    <div className="court-glass rounded-3xl border border-brand-border p-4 md:p-5">
      <div className="flex flex-col gap-3 border-b border-brand-border pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Printable Box Score</div>
          <h3 className="mt-1 text-2xl font-black text-brand-white">Mukwonago vs {game.opponentTeam}</h3>
          <div className="mt-1 text-sm text-brand-muted">{game.date} • {game.startTime} • {game.venue}</div>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-navy px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">Final</div>
          <div className="court-score-font text-3xl font-black text-brand-gold">{muk.totals.pts} - {opponent.totals.pts}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TeamTable title="Mukwonago" players={muk.players} totals={muk.totals} accent="text-brand-gold" />
        <TeamTable title={game.opponentTeam} players={opponent.players} totals={opponent.totals} accent="text-brand-white" />
      </div>

      <div className="mt-4 rounded-2xl border border-brand-border bg-brand-slate/70 p-3 text-xs text-brand-muted">
        <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-brand-white">Shot Distribution</div>
        <svg viewBox="0 0 520 120" className="h-32 w-full" role="img" aria-label="Shot distribution chart">
          <rect x="0" y="0" width="520" height="120" rx="16" fill="#0a0f1e" />
          {muk.players.slice(0, 5).map((player, index) => {
            const height = Math.max(18, player.pts * 4);
            const x = 40 + index * 92;
            const y = 96 - height;
            return <rect key={player.id} x={x} y={y} width="40" height={height} rx="8" fill="#c8972a" opacity="0.92" />;
          })}
          <line x1="24" y1="96" x2="500" y2="96" stroke="#2a3a5c" strokeWidth="2" />
        </svg>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SummaryCard label="Periods" value={formatPeriodAbbreviation(game.currentPeriod, game.periodStructure)} />
        <SummaryCard label="Timeouts" value={`${game.mukTimeoutsRemaining} / ${game.opponentTimeoutsRemaining}`} />
        <SummaryCard label="Events" value={String(game.events.length)} />
      </div>
    </div>
  );
}

function TeamTable({
  title,
  players,
  totals,
  accent,
}: {
  title: string;
  players: ReturnType<typeof generateBoxScore>['players'];
  totals: ReturnType<typeof generateBoxScore>['totals'];
  accent: string;
}) {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
      <div className={`mb-3 text-lg font-bold ${accent}`}>{title}</div>
      <div className="overflow-hidden rounded-xl border border-brand-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-slate/90 text-[10px] uppercase tracking-[0.2em] text-brand-muted">
            <tr>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Player</th>
              <th className="px-2 py-2 text-center">PTS</th>
              <th className="px-2 py-2 text-center">REB</th>
              <th className="px-2 py-2 text-center">AST</th>
              <th className="px-2 py-2 text-center">STL</th>
              <th className="px-2 py-2 text-center">PF</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-t border-brand-border/60">
                <td className="px-2 py-2 font-semibold text-brand-gold">#{player.number}</td>
                <td className="px-2 py-2 text-brand-white">{player.name}</td>
                <td className="px-2 py-2 text-center font-semibold text-brand-gold">{player.pts}</td>
                <td className="px-2 py-2 text-center">{player.reb}</td>
                <td className="px-2 py-2 text-center">{player.ast}</td>
                <td className="px-2 py-2 text-center">{player.stl}</td>
                <td className="px-2 py-2 text-center">{player.pf}</td>
              </tr>
            ))}
            <tr className="border-t border-brand-border bg-brand-slate/90 font-bold">
              <td className="px-2 py-2" />
              <td className="px-2 py-2 uppercase text-brand-muted">Totals</td>
              <td className="px-2 py-2 text-center text-brand-gold">{totals.pts}</td>
              <td className="px-2 py-2 text-center">{totals.reb}</td>
              <td className="px-2 py-2 text-center">{totals.ast}</td>
              <td className="px-2 py-2 text-center">{totals.stl}</td>
              <td className="px-2 py-2 text-center">{totals.pf}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-slate/70 px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="mt-1 text-base font-semibold text-brand-white">{value}</div>
    </div>
  );
}