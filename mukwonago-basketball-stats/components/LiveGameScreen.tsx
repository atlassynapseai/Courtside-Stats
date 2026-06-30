import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Flame, RotateCcw, ShieldAlert, Trophy } from 'lucide-react';
import { Game, Player, StatEvent, StatType } from '../lib/types';
import { formatPeriodName, getTeamPeriodFouls, getTeamScore } from '../lib/gameUtils';
import { playSoundEffect, vibrate } from '../lib/audioUtils';
import Scoreboard from './Scoreboard';
import ShotClock from './ShotClock';
import VoiceStatLogger from './VoiceStatLogger';
import PlayerCard from './PlayerCard';
import SubstitutionModal from './SubstitutionModal';
import PeriodSummaryModal, { PeriodSummaryData } from './PeriodSummaryModal';

interface LiveGameScreenProps {
  game: Game;
  onUpdateGame: (updatedGame: Game) => void;
  onFinishGame: () => void;
  onExitToSetup: () => void;
}

type ToastType = 'success' | 'alert' | 'info';

const QUICK_STATS: StatType[] = ['1PT', '2PT', '3PT', 'REB', 'AST', 'STL', 'FOUL', 'BLK', 'TO', 'DREB', 'OREB', 'CHARGE', 'FLAGRANT', 'TECH'];
const MAX_ACTIVE_PLAYERS = 5;

function createTimestamp() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  hours = hours || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function scoreValue(type: StatType): number {
  if (type === '1PT') return 1;
  if (type === '2PT') return 2;
  if (type === '3PT') return 3;
  return 0;
}

function defaultLineup(roster: Player[]): string[] {
  return roster.slice(0, MAX_ACTIVE_PLAYERS).map((player) => player.id);
}

function getLineup(game: Game, team: 'muk' | 'opponent'): string[] {
  const lineup = game.activePlayerIds?.[team];
  return lineup && lineup.length > 0 ? lineup : defaultLineup(team === 'muk' ? game.mukRoster : game.opponentRoster);
}

function parseVoiceCommand(command: string, roster: Player[]): { player?: Player; stat?: StatType } {
  const text = command.toLowerCase();
  const player = roster.find((entry) => text.includes(entry.name.toLowerCase()))
    ?? roster.find((entry) => new RegExp(`(^|\\D)${entry.number}(\\D|$)`).test(text));

  const statMatchers: Array<[RegExp, StatType]> = [
    [/\b(one|1|free throw|ft)\b/, '1PT'],
    [/\b(two|2|two pointer|two points|basket)\b/, '2PT'],
    [/\b(three|3|three pointer|three points|triple)\b/, '3PT'],
    [/\b(rebound|board)\b/, 'REB'],
    [/\b(assist|dime)\b/, 'AST'],
    [/\b(steal)\b/, 'STL'],
    [/\b(foul)\b/, 'FOUL'],
    [/\b(block)\b/, 'BLK'],
    [/\b(turnover|to)\b/, 'TO'],
    [/\b(defensive rebound|d rebound|dreb)\b/, 'DREB'],
    [/\b(offensive rebound|o rebound|oreb)\b/, 'OREB'],
    [/\b(charge)\b/, 'CHARGE'],
    [/\b(flagrant)\b/, 'FLAGRANT'],
    [/\b(tech|technical)\b/, 'TECH'],
  ];

  const stat = statMatchers.find(([pattern]) => pattern.test(text))?.[1];
  return { player, stat };
}

function buildPlusMinusEvents(game: Game, team: 'muk' | 'opponent', delta: number): StatEvent[] {
  const lineup = getLineup(game, team);
  const roster = team === 'muk' ? game.mukRoster : game.opponentRoster;

  return lineup
    .map((playerId) => roster.find((player) => player.id === playerId))
    .filter((player): player is Player => Boolean(player))
    .map<StatEvent>((player) => ({
      id: `pm_${Date.now()}_${player.id}_${Math.random().toString(36).slice(2, 6)}`,
      type: '+/-',
      team,
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.number,
      period: game.currentPeriod,
      timestamp: createTimestamp(),
      systemTime: Date.now(),
      details: String(delta),
    }));
}

export default function LiveGameScreen({ game, onUpdateGame, onFinishGame, onExitToSetup }: LiveGameScreenProps) {
  const [selectedTeam, setSelectedTeam] = useState<'muk' | 'opponent'>('muk');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>('success');
  const [floatingIndicator, setFloatingIndicator] = useState<{ playerId: string; text: string; color: string; key: number } | null>(null);
  const [shotClockSeconds, setShotClockSeconds] = useState<number>(game.shotClockSeconds ?? 24);
  const [shotClockRunning, setShotClockRunning] = useState(false);
  const [gameClockSeconds, setGameClockSeconds] = useState<number>(game.periodLengthSeconds ?? 8 * 60);
  const [gameClockRunning, setGameClockRunning] = useState(false);
  const [substitutionTeam, setSubstitutionTeam] = useState<'muk' | 'opponent' | null>(null);
  const [pendingPeriodSummary, setPendingPeriodSummary] = useState<PeriodSummaryData | null>(null);

  const triggerToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  useEffect(() => {
    if (game.activePlayerIds?.muk?.length && game.activePlayerIds?.opponent?.length) {
      return;
    }

    onUpdateGame({
      ...game,
      activePlayerIds: {
        muk: defaultLineup(game.mukRoster),
        opponent: defaultLineup(game.opponentRoster),
      },
    });
  }, [game, onUpdateGame]);

  useEffect(() => {
    if (!shotClockRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setShotClockSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setShotClockRunning(false);
          playSoundEffect('buzzer');
          vibrate([50, 30, 50]);
          triggerToast('Shot clock violation.', 'alert');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [shotClockRunning]);

  useEffect(() => {
    if (!gameClockRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setGameClockSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setGameClockRunning(false);
          playSoundEffect('buzzer');
          vibrate([80, 40, 80]);
          triggerToast('Period clock ended.', 'info');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gameClockRunning]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const mukScore = getTeamScore(game.events, 'muk');
  const opponentScore = getTeamScore(game.events, 'opponent');
  const mukPeriodFouls = getTeamPeriodFouls(game.events, 'muk', game.currentPeriod);
  const opponentPeriodFouls = getTeamPeriodFouls(game.events, 'opponent', game.currentPeriod);
  const isMukBonus = mukPeriodFouls >= game.bonusThreshold;
  const isOpponentBonus = opponentPeriodFouls >= game.bonusThreshold;

  const activeRoster = selectedTeam === 'muk' ? game.mukRoster : game.opponentRoster;
  const selectedPlayer = activeRoster.find((player) => player.id === selectedPlayerId) ?? activeRoster[0] ?? null;
  const activeLineup = getLineup(game, selectedTeam);

  const handleLogStat = (player: Player, type: StatType) => {
    const scoringDelta = scoreValue(type);
    const baseEvent: StatEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      team: selectedTeam,
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.number,
      period: game.currentPeriod,
      timestamp: createTimestamp(),
      systemTime: Date.now(),
    };

    const nextEvents = [...game.events, baseEvent];
    if (scoringDelta > 0) {
      nextEvents.push(...buildPlusMinusEvents(game, selectedTeam, scoringDelta));
      nextEvents.push(...buildPlusMinusEvents(game, selectedTeam === 'muk' ? 'opponent' : 'muk', -scoringDelta));
      setShotClockSeconds(game.shotClockSeconds ?? 24);
      setShotClockRunning(false);
      playSoundEffect('swish');
    } else if (['FOUL', 'TECH', 'FLAGRANT', 'CHARGE'].includes(type)) {
      playSoundEffect('whistle');
    } else {
      playSoundEffect('tap');
    }

    vibrate(type === 'FOUL' ? [40, 20, 40] : 25);
    setFloatingIndicator({
      playerId: player.id,
      text: `+${type}`,
      color: scoringDelta > 0 ? 'text-brand-bright-gold' : type === 'FOUL' ? 'text-brand-red' : 'text-brand-green',
      key: Date.now(),
    });

    onUpdateGame({
      ...game,
      events: nextEvents,
    });

    triggerToast(`${selectedTeam === 'muk' ? 'Muk' : game.opponentTeam} #${player.number} ${player.name} logged ${type}`, type === 'FOUL' ? 'alert' : 'success');
  };

  const handleVoiceTranscript = (transcript: string) => {
    const parsed = parseVoiceCommand(transcript, activeRoster);
    if (!parsed.player || !parsed.stat) {
      triggerToast(`Could not parse: ${transcript}`, 'info');
      return;
    }

    handleLogStat(parsed.player, parsed.stat);
  };

  const handleTimeoutChange = (team: 'muk' | 'opponent', action: 'use' | 'add') => {
    const isMuk = team === 'muk';
    const currentCount = isMuk ? game.mukTimeoutsRemaining : game.opponentTimeoutsRemaining;

    if (action === 'use') {
      if (currentCount <= 0) {
        triggerToast(`No timeouts remaining for ${isMuk ? 'Muk' : game.opponentTeam}.`, 'alert');
        return;
      }

      const newEvent: StatEvent = {
        id: `timeout_${Date.now()}`,
        type: 'TIMEOUT',
        team,
        playerId: null,
        playerName: null,
        playerNumber: null,
        period: game.currentPeriod,
        timestamp: createTimestamp(),
        systemTime: Date.now(),
      };

      onUpdateGame({
        ...game,
        mukTimeoutsRemaining: isMuk ? currentCount - 1 : game.mukTimeoutsRemaining,
        opponentTimeoutsRemaining: !isMuk ? currentCount - 1 : game.opponentTimeoutsRemaining,
        events: [...game.events, newEvent],
      });

      setShotClockSeconds(game.shotClockSeconds ?? 24);
      setShotClockRunning(false);
      playSoundEffect('whistle');
      triggerToast(`Timeout called by ${isMuk ? 'Muk' : game.opponentTeam}`, 'info');
      return;
    }

    const maxTimeouts = game.timeoutsConfig;
    if (currentCount >= maxTimeouts) {
      return;
    }

    onUpdateGame({
      ...game,
      mukTimeoutsRemaining: isMuk ? currentCount + 1 : game.mukTimeoutsRemaining,
      opponentTimeoutsRemaining: !isMuk ? currentCount + 1 : game.opponentTimeoutsRemaining,
    });

    triggerToast(`Restored one timeout for ${isMuk ? 'Muk' : game.opponentTeam}.`, 'info');
  };

  const handleUndo = () => {
    if (game.events.length === 0) {
      triggerToast('Nothing to undo.', 'info');
      return;
    }

    const eventsCopy = [...game.events];
    const undoneEvent = eventsCopy.pop();
    if (!undoneEvent) {
      return;
    }

    onUpdateGame({
      ...game,
      events: eventsCopy,
    });

    triggerToast(`Undone: ${undoneEvent.type}${undoneEvent.playerName ? ` ${undoneEvent.playerName}` : ''}`, 'info');
  };

  const handleAdvancePeriod = () => {
    const nextPeriod = game.currentPeriod + 1;
    setPendingPeriodSummary({
      periodLabel: formatPeriodName(game.currentPeriod, game.periodStructure),
      homePoints: getTeamScore(game.events.filter((event) => event.period === game.currentPeriod), 'muk'),
      awayPoints: getTeamScore(game.events.filter((event) => event.period === game.currentPeriod), 'opponent'),
      homeFouls: mukPeriodFouls,
      awayFouls: opponentPeriodFouls,
    });

    onUpdateGame({
      ...game,
      currentPeriod: nextPeriod,
      events: [...game.events,
        {
          id: `period_${Date.now()}`,
          type: 'PERIOD_CHANGE',
          team: 'muk',
          playerId: null,
          playerName: null,
          playerNumber: null,
          period: game.currentPeriod,
          timestamp: createTimestamp(),
          systemTime: Date.now(),
          details: `from ${game.currentPeriod} to ${nextPeriod}`,
        },
      ],
    });

    setShotClockSeconds(game.shotClockSeconds ?? 24);
    setShotClockRunning(false);
    setGameClockSeconds(game.periodLengthSeconds ?? 8 * 60);
    setGameClockRunning(false);
    triggerToast(`Advanced to ${formatPeriodName(nextPeriod, game.periodStructure)}.`, 'info');
  };

  const periodClockMinutes = String(Math.floor(gameClockSeconds / 60)).padStart(2, '0');
  const periodClockRemaining = String(gameClockSeconds % 60).padStart(2, '0');

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-3 md:px-4 md:py-4">
      <div className="court-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border px-4 py-3">
        <button type="button" onClick={onExitToSetup} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-white/80 transition-colors hover:text-brand-gold">
          <ArrowLeft className="h-4 w-4" /> Back to setup
        </button>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted">
          <Trophy className="h-4 w-4 text-brand-bright-gold" /> Offline-first sideline tracker
        </div>
        <button type="button" onClick={handleUndo} className="court-button inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold hover:text-brand-gold">
          <RotateCcw className="h-4 w-4" /> Undo
        </button>
      </div>

      <Scoreboard
        homeLabel="Mukwonago"
        awayLabel={game.opponentTeam}
        homeScore={mukScore}
        awayScore={opponentScore}
        periodLabel={formatPeriodName(game.currentPeriod, game.periodStructure)}
        homeFouls={mukPeriodFouls}
        awayFouls={opponentPeriodFouls}
        homeTimeouts={game.mukTimeoutsRemaining}
        awayTimeouts={game.opponentTimeoutsRemaining}
        activeShotClock={shotClockSeconds}
      />

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="court-glass rounded-2xl border border-brand-border p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-brand-muted">
                <span>Game Clock</span>
                <span>{gameClockRunning ? 'Running' : 'Stopped'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="court-score-font text-4xl font-black text-brand-white">{periodClockMinutes}:{periodClockRemaining}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setGameClockRunning((current) => !current)} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">
                    {gameClockRunning ? 'Stop' : 'Start'}
                  </button>
                  <button type="button" onClick={() => { setGameClockSeconds(game.periodLengthSeconds ?? 8 * 60); setGameClockRunning(false); }} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <ShotClock secondsLeft={shotClockSeconds} maxSeconds={game.shotClockSeconds ?? 24} running={shotClockRunning} />
          </div>

          <VoiceStatLogger onTranscript={handleVoiceTranscript} />
        </div>

        <div className="grid gap-3">
          <div className="court-glass rounded-2xl border border-brand-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Possession & lineups</div>
                <div className="mt-1 text-lg font-black text-brand-white">{selectedTeam === 'muk' ? 'Mukwonago' : game.opponentTeam}</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSubstitutionTeam(selectedTeam)} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">Sub</button>
                <button type="button" onClick={() => setShotClockRunning((current) => !current)} className="court-button rounded-lg bg-brand-gold px-3 text-sm font-bold text-brand-navy">{shotClockRunning ? 'Pause Shot' : 'Run Shot'}</button>
                <button type="button" onClick={() => { setShotClockSeconds(game.shotClockSeconds ?? 24); setShotClockRunning(true); }} className="court-button rounded-lg border border-brand-border bg-brand-navy px-3 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">Reset Shot</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeLineup.map((playerId) => {
                const player = activeRoster.find((entry) => entry.id === playerId);
                if (!player) {
                  return null;
                }

                return (
                  <div key={player.id} className="rounded-full border border-brand-border bg-brand-slate px-3 py-1.5 text-[11px] font-semibold text-brand-white">
                    #{player.number} {player.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => handleTimeoutChange('muk', 'use')} className="court-button rounded-2xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">Muk timeout</button>
            <button type="button" onClick={() => handleTimeoutChange('opponent', 'use')} className="court-button rounded-2xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">Opponent timeout</button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="court-glass rounded-3xl border border-brand-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Roster</div>
              <h2 className="mt-1 text-xl font-black text-brand-white">{selectedTeam === 'muk' ? 'Mukwonago' : game.opponentTeam}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setSelectedTeam('muk'); setSelectedPlayerId(null); }} className={`court-button rounded-lg border px-3 text-sm font-semibold transition-all ${selectedTeam === 'muk' ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-navy text-brand-white'}`}>Muk</button>
              <button type="button" onClick={() => { setSelectedTeam('opponent'); setSelectedPlayerId(null); }} className={`court-button rounded-lg border px-3 text-sm font-semibold transition-all ${selectedTeam === 'opponent' ? 'border-brand-gold bg-brand-gold text-brand-navy' : 'border-brand-border bg-brand-navy text-brand-white'}`}>Opp</button>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {activeRoster.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                team={selectedTeam}
                events={game.events}
                active={activeLineup.includes(player.id)}
                onSelect={(entry) => setSelectedPlayerId(entry.id)}
                onToggleActive={(entry) => {
                  const currentlyActive = activeLineup.includes(entry.id);
                  const nextLineup = currentlyActive ? activeLineup.filter((playerId) => playerId !== entry.id) : [...activeLineup, entry.id].slice(0, MAX_ACTIVE_PLAYERS);
                  onUpdateGame({
                    ...game,
                    activePlayerIds: {
                      muk: selectedTeam === 'muk' ? nextLineup : getLineup(game, 'muk'),
                      opponent: selectedTeam === 'opponent' ? nextLineup : getLineup(game, 'opponent'),
                    },
                  });
                }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="court-glass rounded-3xl border border-brand-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Quick stat entry</div>
                <h3 className="mt-1 text-xl font-black text-brand-white">{selectedPlayer ? `${selectedPlayer.number} ${selectedPlayer.name}` : 'Pick a player'}</h3>
              </div>
              <div className="rounded-full border border-brand-border bg-brand-slate px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-muted">{selectedTeam}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_STATS.map((stat) => (
                <button
                  key={stat}
                  type="button"
                  disabled={!selectedPlayer}
                  onClick={() => selectedPlayer && handleLogStat(selectedPlayer, stat)}
                  className={`court-button rounded-2xl border px-3 text-sm font-semibold transition-all ${stat === 'FOUL' || stat === 'FLAGRANT' || stat === 'TECH' ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-brand-border bg-brand-navy text-brand-white hover:border-brand-gold hover:text-brand-gold'} ${!selectedPlayer ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>

          <div className="court-glass rounded-3xl border border-brand-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Recent log</div>
                <h3 className="mt-1 text-xl font-black text-brand-white">Last actions</h3>
              </div>
              <div className="flex items-center gap-1 text-brand-bright-gold"><Flame className="h-4 w-4" /> Live</div>
            </div>

            <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
              {[...game.events].slice().reverse().map((event) => {
                const isMuk = event.team === 'muk';
                const isScore = event.type === '1PT' || event.type === '2PT' || event.type === '3PT';
                const isFoul = event.type === 'FOUL' || event.type === 'TECH' || event.type === 'FLAGRANT';

                return (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border px-3 py-3 text-sm ${isScore ? 'border-brand-gold/30 bg-brand-gold/10' : isFoul ? 'border-brand-red/30 bg-brand-red/10' : 'border-brand-border bg-brand-slate/70'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full border border-brand-border bg-brand-navy px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-brand-muted">{formatPeriodName(event.period, game.periodStructure)}</div>
                      <div className="flex-1">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">{event.timestamp}</div>
                        <div className="mt-1 text-brand-white">
                          <span className={isMuk ? 'font-semibold text-brand-gold' : 'font-semibold text-brand-white'}>{isMuk ? 'Muk' : game.opponentTeam}</span>
                          {event.playerNumber ? <span> #{event.playerNumber}</span> : null}
                          {event.playerName ? <span> {event.playerName}</span> : null}
                          {' '}
                          <span className={isScore ? 'font-semibold text-brand-gold' : isFoul ? 'font-semibold text-brand-red' : 'font-semibold text-brand-bright-gold'}>{event.type}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-slate/70 px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted"><ShieldAlert className="mr-1 inline h-4 w-4 text-brand-bright-gold" /> {game.events.length} logged events</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleAdvancePeriod} className="court-button inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 text-sm font-bold text-brand-navy">Next Period <ChevronRight className="h-4 w-4" /></button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you finished tracking stats? This will save the game report and display the summary box score.')) {
                onFinishGame();
              }
            }}
            className="court-button rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 text-sm font-semibold text-brand-red"
          >
            Finish Game
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className={`fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-semibold shadow-xl ${toastType === 'alert' ? 'border-brand-red/30 bg-brand-red/15 text-brand-red' : toastType === 'info' ? 'border-brand-border bg-brand-slate text-brand-white' : 'border-brand-gold/30 bg-brand-gold/15 text-brand-gold'}`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <SubstitutionModal
        open={Boolean(substitutionTeam)}
        teamName={substitutionTeam === 'muk' ? 'Mukwonago' : game.opponentTeam}
        players={substitutionTeam === 'muk' ? game.mukRoster : game.opponentRoster}
        activePlayerIds={substitutionTeam === 'muk' ? getLineup(game, 'muk') : getLineup(game, 'opponent')}
        onClose={() => setSubstitutionTeam(null)}
        onTogglePlayer={(player) => {
          if (!substitutionTeam) {
            return;
          }

          const currentLineup = getLineup(game, substitutionTeam);
          const nextLineup = currentLineup.includes(player.id) ? currentLineup.filter((playerId) => playerId !== player.id) : [...currentLineup, player.id].slice(0, MAX_ACTIVE_PLAYERS);

          onUpdateGame({
            ...game,
            activePlayerIds: {
              muk: substitutionTeam === 'muk' ? nextLineup : getLineup(game, 'muk'),
              opponent: substitutionTeam === 'opponent' ? nextLineup : getLineup(game, 'opponent'),
            },
          });
        }}
      />

      <PeriodSummaryModal open={Boolean(pendingPeriodSummary)} data={pendingPeriodSummary} onContinue={() => setPendingPeriodSummary(null)} />
    </div>
  );
}
