"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Medal, Star, Trophy, Users } from 'lucide-react';
import { Game, Player } from '../lib/types';
import { generateBoxScore, getTeamScore } from '../lib/gameUtils';
import { readStoredValue } from '../lib/storage';

interface PlayerProfileProps {
  playerId: string;
}

interface GameContribution {
  gameId: string;
  gameLabel: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  fouls: number;
}

export default function PlayerProfile({ playerId }: PlayerProfileProps) {
  const [savedGames] = useState<Game[]>(() => readStoredValue<Game[]>('muk_saved_games', []));

  const profile = useMemo(() => {
    const contributions: GameContribution[] = [];
    const allPlayers = new Map<string, Player>();
    const leaderboard = new Map<string, { points: number; rebounds: number; assists: number }>();

    savedGames.forEach((game) => {
      const mukPlayers = generateBoxScore(game.mukRoster, game.events, 'muk').players;
      const oppPlayers = generateBoxScore(game.opponentRoster, game.events, 'opponent').players;

      [...game.mukRoster, ...game.opponentRoster].forEach((player) => {
        if (!allPlayers.has(player.id)) {
          allPlayers.set(player.id, player);
        }
      });

      [...mukPlayers, ...oppPlayers].forEach((player) => {
        const existing = leaderboard.get(player.id) || { points: 0, rebounds: 0, assists: 0 };
        existing.points += player.pts;
        existing.rebounds += player.reb;
        existing.assists += player.ast;
        leaderboard.set(player.id, existing);
      });

      const rosterPlayer = [...game.mukRoster, ...game.opponentRoster].find((player) => player.id === playerId);
      const statPlayer = [...mukPlayers, ...oppPlayers].find((player) => player.id === playerId);
      if (rosterPlayer && statPlayer) {
        contributions.push({
          gameId: game.id,
          gameLabel: `${game.date} vs ${game.opponentTeam}`,
          points: statPlayer.pts,
          rebounds: statPlayer.reb,
          assists: statPlayer.ast,
          steals: statPlayer.stl,
          fouls: statPlayer.pf,
        });
      }
    });

    const player = allPlayers.get(playerId) || null;
    const totals = contributions.reduce(
      (sum, entry) => {
        sum.points += entry.points;
        sum.rebounds += entry.rebounds;
        sum.assists += entry.assists;
        sum.steals += entry.steals;
        sum.fouls += entry.fouls;
        return sum;
      },
      { points: 0, rebounds: 0, assists: 0, steals: 0, fouls: 0 }
    );

    const gamesPlayed = contributions.length;
    const averages = gamesPlayed > 0 ? {
      points: totals.points / gamesPlayed,
      rebounds: totals.rebounds / gamesPlayed,
      assists: totals.assists / gamesPlayed,
    } : { points: 0, rebounds: 0, assists: 0 };

    const bestGame = [...contributions].sort((a, b) => b.points + b.rebounds + b.assists - (a.points + a.rebounds + a.assists))[0] || null;
    const lastThree = contributions.slice(-3).map((entry) => entry.points);
    const trend = lastThree.length >= 2 ? lastThree[lastThree.length - 1] - lastThree[0] : 0;
    const starCategories = Array.from(leaderboard.entries()).filter(([, values]) => values.points > 0).sort((a, b) => b[1].points - a[1].points);
    const isStar = starCategories.some(([id]) => id === playerId && starCategories.indexOf(starCategories[0]) === 0);
    const ranking = leaderboard.get(playerId) || { points: 0, rebounds: 0, assists: 0 };

    return {
      player,
      totals,
      averages,
      gamesPlayed,
      bestGame,
      trend,
      ranking,
      isStar,
      contributions,
    };
  }, [playerId, savedGames]);

  if (!profile.player) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
        <Link href="/season" className="inline-flex items-center gap-2 text-brand-white/80 hover:text-brand-gold"><ArrowLeft className="h-4 w-4" /> Back to season</Link>
        <div className="court-glass rounded-3xl border border-brand-border p-6 text-center text-brand-muted">Player not found in saved games.</div>
      </div>
    );
  }

  const player = profile.player;
  const hotCold = profile.trend > 2 ? 'Hot' : profile.trend < -2 ? 'Cold' : 'Stable';

  return (
    <div className="court-scene mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/season" className="inline-flex items-center gap-2 text-brand-white/80 hover:text-brand-gold">
          <ArrowLeft className="h-4 w-4" /> Back to season
        </Link>
        <div className="rounded-full border border-brand-border bg-brand-navy px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-brand-muted">Player profile</div>
      </div>

      <div className="court-glass court-ridge court-card-3d rounded-[28px] border border-brand-border p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Career stats</div>
            <h1 className="mt-2 text-4xl font-black text-brand-white">#{player.number} {player.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-muted">
              {player.position ? <span>{player.position}</span> : null}
              {player.position ? <span>•</span> : null}
              <span>{profile.gamesPlayed} games</span>
              <span>•</span>
              <span>{hotCold} streak</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-slate/70 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Badge</div>
            <div className="mt-1 flex items-center gap-2 text-brand-bright-gold">
              {profile.isStar ? <Star className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
              <span className="font-semibold">{profile.isStar ? 'Star player' : 'Impact player'}</span>
            </div>
            <div className="mt-3 h-24 rounded-2xl border border-brand-border bg-brand-navy/80 p-3">
              <div className="flex h-full items-center justify-center rounded-xl border border-brand-border bg-[radial-gradient(circle_at_top,rgba(200,151,42,0.22),rgba(10,15,30,0.15)_70%)] text-brand-white">
                <div className="text-center">
                  <div className="court-score-font text-4xl font-black text-brand-gold">#{player.number}</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">Jersey</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <StatTile label="PPG" value={profile.averages.points.toFixed(1)} />
          <StatTile label="RPG" value={profile.averages.rebounds.toFixed(1)} />
          <StatTile label="APG" value={profile.averages.assists.toFixed(1)} />
          <StatTile label="Best game" value={profile.bestGame ? `${profile.bestGame.points} pts` : 'N/A'} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="court-glass court-card-3d rounded-3xl border border-brand-border p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted"><Medal className="h-4 w-4 text-brand-bright-gold" /> Career totals</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Points" value={profile.totals.points} />
            <MiniStat label="Rebounds" value={profile.totals.rebounds} />
            <MiniStat label="Assists" value={profile.totals.assists} />
            <MiniStat label="Steals" value={profile.totals.steals} />
          </div>

          <div className="mt-4 rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Trend sparkline</div>
            <svg viewBox="0 0 520 120" className="mt-2 h-24 w-full" role="img" aria-label="Player trend chart">
              <rect width="520" height="120" rx="16" fill="#0a0f1e" />
              <polyline
                fill="none"
                stroke="#e8b84b"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendPolyline(profile.contributions.map((entry) => entry.points))}
              />
              {profile.contributions.slice(-6).map((entry, index) => (
                <circle key={`${entry.gameId}-${index}`} cx={64 + index * 78} cy={trendY(entry.points)} r="5" fill="#c8972a" />
              ))}
            </svg>
          </div>
        </div>

        <div className="court-glass court-card-3d rounded-3xl border border-brand-border p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted"><Trophy className="h-4 w-4 text-brand-bright-gold" /> Trend</div>
          <div className="mt-4 rounded-2xl border border-brand-border bg-brand-navy/70 p-4">
            <div className="court-score-font text-5xl font-black text-brand-gold">{hotCold}</div>
            <p className="mt-2 text-sm text-brand-muted">
              Last three games trend is {profile.trend >= 0 ? 'up' : 'down'} {Math.abs(profile.trend).toFixed(0)} points from the first to the last game in the sample.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-brand-border bg-brand-navy/70 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Best game</div>
            <div className="mt-1 text-lg font-semibold text-brand-white">{profile.bestGame ? profile.bestGame.gameLabel : 'No games yet'}</div>
            <div className="mt-1 text-sm text-brand-muted">
              {profile.bestGame ? `${profile.bestGame.points} pts • ${profile.bestGame.rebounds} reb • ${profile.bestGame.assists} ast` : 'This player has no recorded game yet.'}
            </div>
          </div>
        </div>
      </div>

      <div className="court-glass court-card-3d rounded-3xl border border-brand-border p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted"><Users className="h-4 w-4 text-brand-bright-gold" /> Game log</div>
        <div className="mt-4 space-y-2">
          {profile.contributions.length === 0 ? (
            <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-4 text-sm text-brand-muted">No game contributions recorded yet.</div>
          ) : (
            profile.contributions.slice().reverse().map((entry) => (
              <div key={entry.gameId} className="rounded-2xl border border-brand-border bg-brand-navy/70 p-4 text-sm text-brand-white">
                <div className="font-semibold">{entry.gameLabel}</div>
                <div className="mt-1 text-brand-muted">{entry.points} pts • {entry.rebounds} reb • {entry.assists} ast • {entry.steals} stl</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function trendPolyline(points: number[]) {
  const values = points.length > 0 ? points.slice(-6) : [0];
  return values
    .map((point, index) => `${64 + index * 78},${trendY(point)}`)
    .join(' ');
}

function trendY(points: number) {
  return 90 - Math.min(60, points * 2.5);
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="court-score-font mt-1 text-3xl font-black text-brand-white">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="court-score-font mt-1 text-3xl font-black text-brand-gold">{value}</div>
    </div>
  );
}