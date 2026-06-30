"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Medal, Trophy, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Game, Player } from '../lib/types';
import { downloadTextFile } from '../lib/exportUtils';
import { generateBoxScore, getTeamScore } from '../lib/gameUtils';
import { readStoredValue } from '../lib/storage';

interface SeasonDashboardProps {
  onBack?: () => void;
}

interface SeasonSummary {
  name: string;
  games: Game[];
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  leaderRows: Array<{ id: string; name: string; number: string; pts: number; reb: number; ast: number }>;
}

export default function SeasonDashboard({ onBack }: SeasonDashboardProps) {
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setSavedGames(readStoredValue<Game[]>('muk_saved_games', []));
      setIsHydrated(true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const seasons = useMemo(() => {
    const seasonMap = new Map<string, Game[]>();
    savedGames.forEach((game) => {
      const name = game.seasonName?.trim() || 'Unassigned Season';
      const current = seasonMap.get(name) || [];
      current.push(game);
      seasonMap.set(name, current);
    });

    return Array.from(seasonMap.entries()).map<SeasonSummary>(([name, games]) => {
      const records = games.reduce(
        (accumulator, game) => {
          const mukScore = getTeamScore(game.events, 'muk');
          const opponentScore = getTeamScore(game.events, 'opponent');
          if (mukScore > opponentScore) accumulator.wins += 1;
          else if (mukScore < opponentScore) accumulator.losses += 1;
          else accumulator.ties += 1;
          accumulator.pointsFor += mukScore;
          accumulator.pointsAgainst += opponentScore;
          return accumulator;
        },
        { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 }
      );

      const playerAggregate = new Map<string, { id: string; name: string; number: string; pts: number; reb: number; ast: number }>();
      games.forEach((game) => {
        [...generateBoxScore(game.mukRoster, game.events, 'muk').players, ...generateBoxScore(game.opponentRoster, game.events, 'opponent').players].forEach((player) => {
          const existing = playerAggregate.get(player.id) || { id: player.id, name: player.name, number: player.number, pts: 0, reb: 0, ast: 0 };
          existing.pts += player.pts;
          existing.reb += player.reb;
          existing.ast += player.ast;
          playerAggregate.set(player.id, existing);
        });
      });

      return {
        name,
        games,
        ...records,
        leaderRows: Array.from(playerAggregate.values()).sort((a, b) => b.pts - a.pts).slice(0, 5),
      };
    }).sort((a, b) => b.games.length - a.games.length);
  }, [savedGames]);

  const exportSeasonCsv = (season: SeasonSummary) => {
    const rows = [
      ['Season', season.name],
      ['Record', `${season.wins}-${season.losses}-${season.ties}`],
      ['Points For', String(season.pointsFor)],
      ['Points Against', String(season.pointsAgainst)],
      [],
      ['Game Date', 'Opponent', 'Mukwonago', 'Opponent Score', 'Venue'],
      ...season.games.map((game) => [
        game.date,
        game.opponentTeam,
        String(getTeamScore(game.events, 'muk')),
        String(getTeamScore(game.events, 'opponent')),
        game.venue,
      ]),
    ];

    downloadTextFile(`${season.name.replace(/\s+/g, '_').toLowerCase()}_season.csv`, rows.map((row) => row.join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  return (
    <div className="court-scene mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="court-glass court-ridge court-card-3d rounded-[28px] border border-brand-border p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">League management</div>
            <h1 className="court-safe-text mt-1 text-3xl font-black text-brand-white md:text-5xl">Season Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-muted">Track record, leaders, and game history with a glass-heavy, broadcast-style presentation designed for sideline speed.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HeroChip label="Seasons" value={String(seasons.length)} />
            <HeroChip label="Games" value={String(savedGames.length)} />
            <HeroChip label="Presentation" value="Broadcast" />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
          <svg viewBox="0 0 820 120" className="h-28 w-full" role="img" aria-label="Season overview chart">
            <defs>
              <linearGradient id="seasonBar" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#e8b84b" />
                <stop offset="100%" stopColor="#c8972a" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="820" height="120" rx="18" fill="#0a0f1e" />
            <text x="24" y="18" fill="#94a3b8" fontSize="10" letterSpacing="2">RECENT GAME OUTPUT</text>
            <text x="24" y="34" fill="#ffffff" fontSize="14" fontWeight="700">Bars rise with each game in the season timeline</text>
            <g>
              <line x1="18" y1="100" x2="800" y2="100" stroke="#2a3a5c" strokeWidth="2" />
              <text x="18" y="114" fill="#94a3b8" fontSize="10">START</text>
              <text x="754" y="114" fill="#94a3b8" fontSize="10">LATEST</text>
            </g>
            {seasonBars(savedGames).map((bar, index) => (
              <rect key={`${bar.label}-${index}`} x={24 + index * 84} y={100 - bar.height} width="44" height={bar.height} rx="10" fill="url(#seasonBar)" />
            ))}
          </svg>
        </div>

        {onBack ? (
          <button type="button" onClick={onBack} className="court-button court-glow rounded-xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white">Back</button>
        ) : null}
      </motion.div>

      {!isHydrated ? (
        <div className="court-glass rounded-3xl border border-brand-border p-6 text-center text-brand-muted">Loading season data...</div>
      ) : seasons.length === 0 ? (
        <div className="court-glass rounded-3xl border border-brand-border p-6 text-center text-brand-muted">No saved games yet. Start a game to generate season stats.</div>
      ) : (
        <div className="grid gap-4">
          {seasons.map((season) => (
            <motion.section key={season.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="court-glass court-card-3d rounded-3xl border border-brand-border p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Season</div>
                  <h2 className="court-safe-text mt-1 text-2xl font-black text-brand-white">{season.name}</h2>
                  <div className="mt-1 text-sm text-brand-muted">{season.wins}W • {season.losses}L • {season.ties}T</div>
                </div>
                <button type="button" onClick={() => exportSeasonCsv(season)} className="court-button rounded-xl bg-brand-gold px-4 text-sm font-bold text-brand-navy shadow-[0_10px_24px_rgba(200,151,42,0.28)]">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <MiniStat label="Games" value={String(season.games.length)} />
                <MiniStat label="Points For" value={String(season.pointsFor)} />
                <MiniStat label="Points Against" value={String(season.pointsAgainst)} />
                <MiniStat label="Point Diff" value={String(season.pointsFor - season.pointsAgainst)} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted">
                <span className="rounded-full border border-brand-border bg-brand-slate/70 px-3 py-1 text-brand-white">{season.wins} wins</span>
                <span className="rounded-full border border-brand-border bg-brand-slate/70 px-3 py-1 text-brand-white">{season.losses} losses</span>
                <span className="rounded-full border border-brand-border bg-brand-slate/70 px-3 py-1 text-brand-white">{season.ties} ties</span>
                <span className="rounded-full border border-brand-border bg-brand-slate/70 px-3 py-1 text-brand-bright-gold inline-flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Season momentum</span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted"><Trophy className="h-4 w-4 text-brand-bright-gold" /> Leaders</div>
                  <div className="mt-1 text-sm text-brand-muted">Top scorers for the selected season, ranked by total points.</div>
                  <div className="mt-3 grid gap-2">
                    {season.leaderRows.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between rounded-2xl border border-brand-border bg-brand-slate/70 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-sm font-black text-brand-navy">{index + 1}</div>
                          <div>
                            <div className="court-safe-text font-semibold text-brand-white">{player.name}</div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">#{player.number}</div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-brand-white">
                          <div>{player.pts} pts</div>
                          <div className="text-brand-muted">{player.reb} reb • {player.ast} ast</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted"><Users className="h-4 w-4 text-brand-bright-gold" /> Games</div>
                  <div className="mt-1 text-sm text-brand-muted">Each card shows opponent, date, venue, and final score.</div>
                  <div className="mt-3 space-y-2">
                    {season.games.map((game) => {
                      const mukScore = getTeamScore(game.events, 'muk');
                      const opponentScore = getTeamScore(game.events, 'opponent');

                      return (
                        <div key={game.id} className="rounded-2xl border border-brand-border bg-brand-slate/70 px-3 py-3 text-sm text-brand-white">
                          <div className="court-safe-text font-semibold">vs {game.opponentTeam}</div>
                          <div className="court-safe-text mt-1 text-brand-muted">{game.date} • {game.venue}</div>
                          <div className="mt-2 court-score-font text-2xl font-black text-brand-gold">{mukScore} - {opponentScore}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted"><Medal className="h-4 w-4 text-brand-bright-gold" /> Player profiles</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {season.leaderRows.map((player) => (
                    <Link key={player.id} href={`/player/${player.id}`} className="court-button court-safe-text rounded-full border border-brand-border bg-brand-slate px-3 py-2 text-sm text-brand-white transition-all hover:border-brand-gold hover:text-brand-gold">
                      #{player.number} {player.name}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 px-3 py-3 text-center">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="court-score-font mt-1 text-2xl font-black text-brand-white">{value}</div>
    </div>
  );
}

function seasonBars(games: Game[]) {
  const source: Array<{ opponentTeam: string }> = games.length > 0 ? games : [{ opponentTeam: 'Demo' }];
  return source.slice(0, 8).map((game, index) => ({
    label: game.opponentTeam,
    height: Math.max(18, 28 + index * 6),
  }));
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="court-score-font mt-1 text-2xl font-black text-brand-white">{value}</div>
    </div>
  );
}