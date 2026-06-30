import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, History, Import, MapPin, Plus, Play, Settings, ShieldCheck, Sparkles, Star, Zap, Trash2, Users } from 'lucide-react';
import LogoCrest from './LogoCrest';
import { Game, Player } from '../lib/types';

interface SetupScreenProps {
  onStartGame: (game: Game) => void;
  savedRosterMuk: Player[];
  savedRosterOpponent: Player[];
  onSaveRosters: (muk: Player[], opponent: Player[]) => void;
  savedGames: Game[];
  onViewGameSummary: (game: Game) => void;
  onDeleteSavedGame: (id: string) => void;
}

const DEMO_MUK_ROSTER: Player[] = [
  { id: 'm1', name: 'Mason', number: '12', position: 'PG' },
  { id: 'm2', name: 'Jackson', number: '24', position: 'SG' },
  { id: 'm3', name: 'Liam', number: '3', position: 'SF' },
  { id: 'm4', name: 'Carter', number: '15', position: 'PF' },
  { id: 'm5', name: 'Ethan', number: '5', position: 'C' },
  { id: 'm6', name: 'Nolan', number: '44', position: 'PF' },
  { id: 'm7', name: 'Owen', number: '10', position: 'SG' },
];

const DEMO_OPP_ROSTER: Player[] = [
  { id: 'o1', name: 'Player 1', number: '5', position: 'PG' },
  { id: 'o2', name: 'Player 2', number: '11', position: 'SG' },
  { id: 'o3', name: 'Player 3', number: '20', position: 'SF' },
  { id: 'o4', name: 'Player 4', number: '23', position: 'PF' },
  { id: 'o5', name: 'Player 5', number: '35', position: 'C' },
];

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

export default function SetupScreen({
  onStartGame,
  savedRosterMuk,
  savedRosterOpponent,
  onSaveRosters,
  savedGames,
  onViewGameSummary,
  onDeleteSavedGame,
}: SetupScreenProps) {
  const [activeTab, setActiveTab] = useState<'new-game' | 'saved-games'>('new-game');
  const [notice, setNotice] = useState<string | null>(null);
  const [launchPulse, setLaunchPulse] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState<'balanced' | 'high'>('balanced');
  const [opponentTeam, setOpponentTeam] = useState('Opponent Team');
  const [seasonName, setSeasonName] = useState('2026 Winter Season');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venue, setVenue] = useState('Mukwonago High School');
  const [periodStructure, setPeriodStructure] = useState<'halves' | 'quarters'>('halves');
  const [totalPeriods, setTotalPeriods] = useState(2);
  const [timeoutsConfig, setTimeoutsConfig] = useState(3);
  const [bonusThreshold, setBonusThreshold] = useState(7);
  const [shotClockSeconds, setShotClockSeconds] = useState<24 | 30>(24);
  const [periodLengthSeconds, setPeriodLengthSeconds] = useState(8 * 60);
  const [mukRoster, setMukRoster] = useState<Player[]>(savedRosterMuk.length > 0 ? savedRosterMuk : DEMO_MUK_ROSTER);
  const [oppRoster, setOppRoster] = useState<Player[]>(savedRosterOpponent.length > 0 ? savedRosterOpponent : DEMO_OPP_ROSTER);
  const [mukSearch, setMukSearch] = useState('');
  const [oppSearch, setOppSearch] = useState('');
  const [newMukName, setNewMukName] = useState('');
  const [newMukNumber, setNewMukNumber] = useState('');
  const [newMukPosition, setNewMukPosition] = useState<Player['position']>('PG');
  const [newOppName, setNewOppName] = useState('');
  const [newOppNumber, setNewOppNumber] = useState('');
  const [newOppPosition, setNewOppPosition] = useState<Player['position']>('PG');
  const mukCsvRef = useRef<HTMLInputElement | null>(null);
  const oppCsvRef = useRef<HTMLInputElement | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const launchPulseTimerRef = useRef<number | null>(null);
  const setupSectionRef = useRef<HTMLDivElement | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2400);
  };

  React.useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
      if (launchPulseTimerRef.current) {
        window.clearTimeout(launchPulseTimerRef.current);
      }
    };
  }, []);

  const filteredMukRoster = useMemo(() => {
    const query = mukSearch.trim().toLowerCase();
    return mukRoster.filter((player) => !query || player.number.toLowerCase().includes(query) || player.name.toLowerCase().includes(query));
  }, [mukRoster, mukSearch]);

  const filteredOppRoster = useMemo(() => {
    const query = oppSearch.trim().toLowerCase();
    return oppRoster.filter((player) => !query || player.number.toLowerCase().includes(query) || player.name.toLowerCase().includes(query));
  }, [oppRoster, oppSearch]);

  const persistRosters = (nextMuk: Player[], nextOpp: Player[]) => {
    setMukRoster(nextMuk);
    setOppRoster(nextOpp);
    onSaveRosters(nextMuk, nextOpp);
  };

  const addPlayer = (team: 'muk' | 'opp') => {
    if (team === 'muk') {
      if (!newMukName.trim() || !newMukNumber.trim()) {
        return;
      }

      const player: Player = { id: `muk_${Date.now()}`, name: newMukName.trim(), number: newMukNumber.trim(), position: newMukPosition };
      persistRosters([...mukRoster, player], oppRoster);
      setNewMukName('');
      setNewMukNumber('');
      return;
    }

    if (!newOppName.trim() || !newOppNumber.trim()) {
      return;
    }

    const player: Player = { id: `opp_${Date.now()}`, name: newOppName.trim(), number: newOppNumber.trim(), position: newOppPosition };
    persistRosters(mukRoster, [...oppRoster, player]);
    setNewOppName('');
    setNewOppNumber('');
  };

  const updatePlayer = (team: 'muk' | 'opp', playerId: string, updates: Partial<Player>) => {
    if (team === 'muk') {
      persistRosters(mukRoster.map((player) => (player.id === playerId ? { ...player, ...updates } : player)), oppRoster);
      return;
    }

    persistRosters(mukRoster, oppRoster.map((player) => (player.id === playerId ? { ...player, ...updates } : player)));
  };

  const removePlayer = (team: 'muk' | 'opp', playerId: string) => {
    if (team === 'muk') {
      persistRosters(mukRoster.filter((player) => player.id !== playerId), oppRoster);
      return;
    }

    persistRosters(mukRoster, oppRoster.filter((player) => player.id !== playerId));
  };

  const importRosterCsv = async (team: 'muk' | 'opp', file: File | null) => {
    if (!file) {
      return;
    }

    const text = await file.text();
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    const parsedPlayers = rows.map((row, index) => {
      const [name = '', number = '', position = ''] = row.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
      return {
        id: `${team}_csv_${Date.now()}_${index}`,
        name,
        number,
        position: (POSITIONS.includes(position as any) ? position : undefined) as Player['position'],
      } as Player;
    }).filter((player) => player.name && player.number);

    if (team === 'muk') {
      persistRosters(parsedPlayers, oppRoster);
    } else {
      persistRosters(mukRoster, parsedPlayers);
    }
  };

  const loadDemoRosters = () => {
    persistRosters(DEMO_MUK_ROSTER, DEMO_OPP_ROSTER);
    showNotice('Demo rosters loaded.');
  };

  const clearRosters = () => {
    persistRosters([], []);
    showNotice('Rosters cleared.');
  };

  const handleLaunchSetup = () => {
    setActiveTab('new-game');
    setLaunchPulse(true);
    setupSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.location.hash = 'game-setup';
    showNotice('Game setup is ready.');
    if (launchPulseTimerRef.current) {
      window.clearTimeout(launchPulseTimerRef.current);
    }
    launchPulseTimerRef.current = window.setTimeout(() => setLaunchPulse(false), 1600);
  };

  const handleStartGame = () => {
    if (!opponentTeam.trim()) {
      alert('Please enter an opponent team name.');
      return;
    }

    if (mukRoster.length === 0) {
      alert('Please add at least one player to the Mukwonago roster.');
      return;
    }

    const game: Game = {
      id: `game_${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      startTime: startTime || new Date().toTimeString().slice(0, 5),
      venue: venue.trim() || 'Mukwonago Gym',
      opponentTeam: opponentTeam.trim(),
      periodStructure,
      totalPeriods,
      currentPeriod: 1,
      timeoutsConfig,
      bonusThreshold,
      shotClockSeconds,
      periodLengthSeconds,
      seasonName: seasonName.trim(),
      mukRoster,
      opponentRoster: oppRoster.length > 0 ? oppRoster : [{ id: 'opp_default_1', name: 'Team Player', number: '0', position: 'PG' }],
      mukTimeoutsRemaining: timeoutsConfig,
      opponentTimeoutsRemaining: timeoutsConfig,
      activePlayerIds: {
        muk: mukRoster.slice(0, 5).map((player) => player.id),
        opponent: (oppRoster.length > 0 ? oppRoster : [{ id: 'opp_default_1', name: 'Team Player', number: '0' }]).slice(0, 5).map((player) => player.id),
      },
      events: [],
      status: 'in-progress',
    };

    onStartGame(game);
  };

  return (
    <div className="court-scene mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 md:px-4 md:py-6">
      {notice ? (
        <div className="court-glass rounded-full border border-brand-border px-4 py-2 text-center text-sm font-semibold text-brand-white shadow-[0_16px_32px_rgba(0,0,0,0.22)]">
          {notice}
        </div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="court-glass court-spotlight court-ridge court-card-3d rounded-[32px] border border-brand-border p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative z-10 flex min-w-0 flex-col gap-4 text-left">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-brand-muted">
              <StatusPill icon={Zap} label="Live sideline control" accent="text-brand-gold" />
              <StatusPill icon={ShieldCheck} label="Offline ready" accent="text-brand-green" />
              <StatusPill icon={Star} label="AI recap" accent="text-brand-bright-gold" />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 max-w-2xl">
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">CourtSide basketball operations</div>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-brand-white md:text-6xl court-safe-text">Turn every game into a highlight reel of data.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-brand-muted md:text-base">
                  Fast setup, live scoring, season tracking, CSV roster import, and broadcast-style visuals built for coaches and scorekeepers.
                </p>
              </div>

              <div className="w-full max-w-sm rounded-3xl border border-brand-border bg-brand-navy/70 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
                <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">Core controls</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <HeroStat label="Setup" value="60s" />
                  <HeroStat label="Mode" value="Live" />
                  <HeroStat label="Broadcast" value="Ready" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/season" className="court-button inline-flex items-center justify-center rounded-full border border-brand-border bg-brand-navy px-5 py-3 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold hover:text-brand-gold">
                Season Dashboard
              </Link>
              <a href="#game-setup" onClick={handleLaunchSetup} className="court-button inline-flex items-center justify-center rounded-full bg-brand-gold px-5 py-3 text-sm font-black text-brand-navy shadow-[0_10px_30px_rgba(200,151,42,0.28)]">
                Jump to Game Setup
              </a>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <FeaturePill title="Season-aware" copy="Keep every game grouped, exported, and revisit-ready." />
              <FeaturePill title="Live action" copy="Score, foul, sub, and track possessions without slowing down." />
              <FeaturePill title="High contrast" copy="Designed to read fast from the bench or a gym sideline." />
            </div>
          </div>

          <div className="relative z-10 grid min-w-0 gap-3">
            <div className={`rounded-[28px] border p-4 shadow-[0_18px_42px_rgba(0,0,0,0.32)] transition-all ${broadcastMode === 'high' ? 'border-brand-bright-gold/60 bg-[#050811]/95 ring-1 ring-brand-bright-gold/35' : 'border-brand-border bg-brand-slate/70'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-brand-muted">Broadcast board</div>
                  <div className="mt-1 text-2xl font-black text-brand-white">CourtSide</div>
                </div>
                <div className="court-float">
                  <LogoCrest size="sm" />
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className={`rounded-2xl border p-3 transition-all ${broadcastMode === 'high' ? 'border-brand-bright-gold/45 bg-[#03060d]/95' : 'border-brand-border bg-brand-slate/70'}`}>
                  <div className={`text-[10px] uppercase tracking-[0.22em] ${broadcastMode === 'high' ? 'text-brand-bright-gold' : 'text-brand-muted'}`}>Shot clock</div>
                  <div className="mt-2 flex items-end justify-between">
                    <div className={`court-score-font text-3xl font-black ${broadcastMode === 'high' ? 'text-brand-bright-gold' : 'text-brand-gold'}`}>24</div>
                    <div className={`text-right text-xs ${broadcastMode === 'high' ? 'text-brand-white' : 'text-brand-muted'}`}>shot clock seconds</div>
                  </div>
                </div>
                <div className={`rounded-2xl border p-3 transition-all ${broadcastMode === 'high' ? 'border-brand-bright-gold/45 bg-[#03060d]/95' : 'border-brand-border bg-brand-slate/70'}`}>
                  <div className={`text-[10px] uppercase tracking-[0.22em] ${broadcastMode === 'high' ? 'text-brand-bright-gold' : 'text-brand-muted'}`}>Broadcast contrast</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setBroadcastMode('balanced')} className={`court-button rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.14em] ${broadcastMode === 'balanced' ? 'border-brand-gold bg-brand-gold/20 text-brand-white' : 'border-brand-border bg-brand-navy text-brand-muted'}`}>
                      Balanced
                    </button>
                    <button type="button" onClick={() => setBroadcastMode('high')} className={`court-button rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.14em] ${broadcastMode === 'high' ? 'border-brand-bright-gold bg-brand-bright-gold/16 text-brand-white' : 'border-brand-border bg-brand-navy text-brand-muted'}`}>
                      High
                    </button>
                  </div>
                  <div className={`mt-2 text-xs ${broadcastMode === 'high' ? 'text-brand-white' : 'text-brand-muted'}`}>
                    {broadcastMode === 'high' ? 'High contrast mode is live on this board only.' : 'Balanced mode keeps a softer board look.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <HeroStat label="Season" value="2026" />
              <HeroStat label="Game flow" value="Live" />
              <HeroStat label="Exports" value="CSV" />
            </div>
          </div>
        </div>
      </motion.div>

      <div
        id="game-setup"
        ref={setupSectionRef}
        className={`court-target-highlight scroll-mt-8 grid grid-cols-2 gap-2 rounded-2xl border bg-brand-slate/70 p-1 transition-all ${launchPulse ? 'border-brand-bright-gold shadow-[0_0_0_1px_rgba(232,184,75,0.35),0_0_28px_rgba(232,184,75,0.22)]' : 'border-brand-border'}`}
      >
        <button type="button" onClick={() => setActiveTab('new-game')} className={`court-button rounded-xl text-sm font-semibold transition-all ${activeTab === 'new-game' ? 'bg-brand-gold text-brand-navy' : 'text-brand-muted'}`}>
          New Game
        </button>
        <button type="button" onClick={() => setActiveTab('saved-games')} className={`court-button rounded-xl text-sm font-semibold transition-all ${activeTab === 'saved-games' ? 'bg-brand-gold text-brand-navy' : 'text-brand-muted'}`}>
          History ({savedGames.length})
        </button>
      </div>

      {activeTab === 'saved-games' ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="space-y-3">
          <div className="flex items-center gap-2 text-brand-gold">
            <History className="h-5 w-5" />
            <h2 className="text-xl font-black text-brand-white">Saved Games</h2>
          </div>

          {savedGames.length === 0 ? (
            <div className="court-glass rounded-2xl border border-brand-border p-6 text-center text-brand-muted">Completed games will appear here automatically.</div>
          ) : (
            <div className="grid gap-3">
              {savedGames.map((game) => {
                const mukScore = game.events.filter((event) => event.team === 'muk').reduce((sum, event) => sum + (event.type === '1PT' ? 1 : event.type === '2PT' ? 2 : event.type === '3PT' ? 3 : 0), 0);
                const opponentScore = game.events.filter((event) => event.team === 'opponent').reduce((sum, event) => sum + (event.type === '1PT' ? 1 : event.type === '2PT' ? 2 : event.type === '3PT' ? 3 : 0), 0);
                const resultLabel = mukScore > opponentScore ? 'Win' : mukScore < opponentScore ? 'Loss' : 'Tie';
                const resultStyles = mukScore > opponentScore ? 'border-brand-green/30 bg-brand-green/10 text-brand-green' : mukScore < opponentScore ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-brand-border bg-brand-navy text-brand-white';

                return (
                  <div key={game.id} className="court-glass flex flex-col gap-3 rounded-2xl border border-brand-border p-4 md:flex-row md:items-center md:justify-between">
                    <button type="button" onClick={() => onViewGameSummary(game)} className="flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                        <span className={`rounded-full border px-2 py-1 ${resultStyles}`}>{resultLabel}</span>
                        <Calendar className="h-4 w-4 text-brand-bright-gold" /> {game.date}
                        <span>•</span>
                        <MapPin className="h-4 w-4 text-brand-bright-gold" /> {game.venue}
                      </div>
                      <div className="mt-2 text-lg font-black text-brand-white">Mukwonago vs {game.opponentTeam}</div>
                      <div className="mt-2 court-score-font text-3xl font-black text-brand-gold">{mukScore} - {opponentScore}</div>
                      <div className="mt-1 text-sm text-brand-muted">Tap to open the full box score, charts, and recap.</div>
                    </button>

                    <button type="button" onClick={() => onDeleteSavedGame(game.id)} className="court-button inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-red">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="grid gap-4">
          <div className="court-glass rounded-3xl border border-brand-border p-4 md:p-5">
            <div className="flex items-center gap-2 text-brand-gold"><Settings className="h-5 w-5" /> Game setup</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Opponent team">
                <input value={opponentTeam} onChange={(event) => setOpponentTeam(event.target.value)} className="court-button w-full rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" placeholder="Opponent name" />
              </Field>
              <Field label="Season name">
                <input value={seasonName} onChange={(event) => setSeasonName(event.target.value)} className="court-button w-full rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" placeholder="2026 Winter Season" />
              </Field>
              <Field label="Venue">
                <input value={venue} onChange={(event) => setVenue(event.target.value)} className="court-button w-full rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
              </Field>
              <Field label="Date / Time">
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
                </div>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Field label="Structure">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setPeriodStructure('halves'); setTotalPeriods(2); }} className={`court-button rounded-lg border px-3 text-sm font-semibold ${periodStructure === 'halves' ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-navy text-brand-white'}`}>Halves</button>
                  <button type="button" onClick={() => { setPeriodStructure('quarters'); setTotalPeriods(4); }} className={`court-button rounded-lg border px-3 text-sm font-semibold ${periodStructure === 'quarters' ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-navy text-brand-white'}`}>Quarters</button>
                </div>
              </Field>
              <Field label="Shot clock">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setShotClockSeconds(24)} className={`court-button rounded-lg border px-3 text-sm font-semibold ${shotClockSeconds === 24 ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-navy text-brand-white'}`}>24s</button>
                  <button type="button" onClick={() => setShotClockSeconds(30)} className={`court-button rounded-lg border px-3 text-sm font-semibold ${shotClockSeconds === 30 ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-navy text-brand-white'}`}>30s</button>
                </div>
              </Field>
              <Field label="Period length">
                <input type="number" min="60" step="30" value={periodLengthSeconds} onChange={(event) => setPeriodLengthSeconds(Number(event.target.value) || 480)} className="court-button w-full rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
              </Field>
              <Field label="Timeouts / bonus">
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="1" max="10" value={timeoutsConfig} onChange={(event) => setTimeoutsConfig(Math.max(1, Number(event.target.value) || 1))} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
                  <input type="number" min="1" max="15" value={bonusThreshold} onChange={(event) => setBonusThreshold(Math.max(1, Number(event.target.value) || 1))} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
                </div>
              </Field>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RosterPanel
              title="Mukwonago"
              subtitle="Home team"
              search={mukSearch}
              setSearch={setMukSearch}
              roster={filteredMukRoster}
              onImportClick={() => mukCsvRef.current?.click()}
              onAddPlayer={() => addPlayer('muk')}
              onClear={() => persistRosters([], oppRoster)}
              newName={newMukName}
              newNumber={newMukNumber}
              newPosition={newMukPosition}
              setNewName={setNewMukName}
              setNewNumber={setNewMukNumber}
              setNewPosition={setNewMukPosition}
              onUpdatePlayer={(playerId, updates) => updatePlayer('muk', playerId, updates)}
              onRemovePlayer={(playerId) => removePlayer('muk', playerId)}
              csvRef={mukCsvRef}
              onCsvSelected={(file) => importRosterCsv('muk', file)}
            />

            <RosterPanel
              title={opponentTeam || 'Opponent'}
              subtitle="Away team"
              search={oppSearch}
              setSearch={setOppSearch}
              roster={filteredOppRoster}
              onImportClick={() => oppCsvRef.current?.click()}
              onAddPlayer={() => addPlayer('opp')}
              onClear={() => persistRosters(mukRoster, [])}
              newName={newOppName}
              newNumber={newOppNumber}
              newPosition={newOppPosition}
              setNewName={setNewOppName}
              setNewNumber={setNewOppNumber}
              setNewPosition={setNewOppPosition}
              onUpdatePlayer={(playerId, updates) => updatePlayer('opp', playerId, updates)}
              onRemovePlayer={(playerId) => removePlayer('opp', playerId)}
              csvRef={oppCsvRef}
              onCsvSelected={(file) => importRosterCsv('opp', file)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadDemoRosters} className="court-button inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white">
              <Sparkles className="h-4 w-4 text-brand-bright-gold" /> Load demo rosters
            </button>
            <button type="button" onClick={clearRosters} className="court-button inline-flex items-center gap-2 rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 text-sm font-semibold text-brand-red">
              Clear rosters
            </button>
          </div>

          <div className="pt-2">
            <button type="button" onClick={handleStartGame} className="court-button w-full rounded-2xl bg-brand-gold px-5 py-4 text-lg font-black text-brand-navy shadow-[0_12px_30px_rgba(200,151,42,0.25)]">
              <Play className="mr-2 inline h-5 w-5" /> Start Game
            </button>
            <div className="mt-2 text-center text-[11px] text-brand-muted">Offline-first stats, season tracking, and quick roster control.</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      {children}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[88px] flex-col justify-center rounded-2xl border border-brand-border bg-brand-slate/70 p-3 text-center">
      <div className="court-safe-text text-[9px] uppercase leading-tight tracking-[0.16em] text-brand-muted">{label}</div>
      <div className="court-score-font mt-1 text-lg font-black text-brand-white sm:text-xl">{value}</div>
    </div>
  );
}

function FeaturePill({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">{title}</div>
      <div className="mt-1 text-sm leading-6 text-brand-muted">{copy}</div>
    </div>
  );
}

function StatusPill({ icon: Icon, label, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; accent: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-navy/80 px-3 py-1 text-[10px] font-semibold text-brand-white shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
      <Icon className={`h-3.5 w-3.5 ${accent}`} />
      <span className="court-safe-text">{label}</span>
    </span>
  );
}

function RosterPanel({
  title,
  subtitle,
  search,
  setSearch,
  roster,
  onImportClick,
  onAddPlayer,
  onClear,
  newName,
  newNumber,
  newPosition,
  setNewName,
  setNewNumber,
  setNewPosition,
  onUpdatePlayer,
  onRemovePlayer,
  csvRef,
  onCsvSelected,
}: {
  title: string;
  subtitle: string;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  roster: Player[];
  onImportClick: () => void;
  onAddPlayer: () => void;
  onClear: () => void;
  newName: string;
  newNumber: string;
  newPosition: Player['position'];
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  setNewNumber: React.Dispatch<React.SetStateAction<string>>;
  setNewPosition: React.Dispatch<React.SetStateAction<Player['position']>>;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onRemovePlayer: (playerId: string) => void;
  csvRef: React.RefObject<HTMLInputElement | null>;
  onCsvSelected: (file: File | null) => void;
}) {
  return (
    <div className="court-glass rounded-3xl border border-brand-border p-4 md:p-5">
      <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => onCsvSelected(event.target.files?.[0] ?? null)} />

      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">{subtitle}</div>
          <h3 className="mt-1 text-xl font-black text-brand-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onImportClick} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm font-semibold text-brand-white">
            <Import className="mr-1 inline h-4 w-4 text-brand-bright-gold" /> CSV
          </button>
          <button type="button" onClick={onClear} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm font-semibold text-brand-white">
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-brand-border bg-brand-navy/60 p-3 text-sm text-brand-muted">
        CSV import uses one player per line in this order: name, jersey number, position. Example: <span className="text-brand-white">Mason,12,PG</span>.
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-[72px_1fr_100px_92px]">
        <input value={newNumber} onChange={(event) => setNewNumber(event.target.value.replace(/\D/g, ''))} placeholder="#" className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
        <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Player name" className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
        <select value={newPosition ?? ''} onChange={(event) => setNewPosition(event.target.value as Player['position'])} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none">
          <option value="">Pos</option>
          {POSITIONS.map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>
        <button type="button" onClick={onAddPlayer} className="court-button rounded-lg bg-brand-gold px-3 text-sm font-bold text-brand-navy">
          <Plus className="mr-1 inline h-4 w-4" /> Add
        </button>
      </div>

      <div className="mt-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jersey # or name" className="court-button w-full rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
      </div>

      <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
        {roster.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-navy/60 p-4 text-center text-sm text-brand-muted">No players yet. Add one manually or import a CSV roster.</div>
        ) : (
          roster.map((player) => (
            <div key={player.id} className="rounded-2xl border border-brand-border bg-brand-navy/60 p-3">
              <div className="grid gap-2 md:grid-cols-[72px_1fr_100px_92px] md:items-center">
                <input value={player.number} onChange={(event) => onUpdatePlayer(player.id, { number: event.target.value.replace(/\D/g, '') })} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
                <input value={player.name} onChange={(event) => onUpdatePlayer(player.id, { name: event.target.value })} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none" />
                <select value={player.position ?? ''} onChange={(event) => onUpdatePlayer(player.id, { position: event.target.value as Player['position'] })} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm text-brand-white outline-none">
                  <option value="">Pos</option>
                  {POSITIONS.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
                <button type="button" onClick={() => onRemovePlayer(player.id)} className="court-button inline-flex items-center justify-center rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 text-sm font-semibold text-brand-red">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
