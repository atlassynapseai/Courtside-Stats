import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Printer, Share2, Trophy, Users, Clock3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Game } from '../lib/types';
import { formatPeriodAbbreviation, formatPeriodName, generateBoxScore, generateCSVContent, getTeamScore } from '../lib/gameUtils';
import { downloadElementImage, downloadTextFile } from '../lib/exportUtils';
import BoxScore from './BoxScore';
import AIRecap from './AIRecap';

interface SummaryScreenProps {
  game: Game;
  onBack: () => void;
  onContinueGame?: () => void;
}

export default function SummaryScreen({ game, onBack, onContinueGame }: SummaryScreenProps) {
  const [copied, setCopied] = useState(false);
  const [aiRecap, setAiRecap] = useState<{
    recap: string;
    mvp: string;
    tacticalSuggestion: string;
    opponentAnalysis: string;
    motivation: string;
  } | null>(null);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const boxScoreRef = useRef<HTMLDivElement | null>(null);

  const mukScore = getTeamScore(game.events, 'muk');
  const opponentScore = getTeamScore(game.events, 'opponent');
  const mukBox = generateBoxScore(game.mukRoster, game.events, 'muk');
  const opponentBox = generateBoxScore(game.opponentRoster, game.events, 'opponent');

  const leaders = useMemo(() => {
    const playerPool = [...mukBox.players.map((player) => ({ ...player, team: 'Mukwonago' })), ...opponentBox.players.map((player) => ({ ...player, team: game.opponentTeam }))];
    const topScorer = [...playerPool].sort((a, b) => b.pts - a.pts)[0];
    const topRebounder = [...playerPool].sort((a, b) => b.reb - a.reb)[0];
    const topPlaymaker = [...playerPool].sort((a, b) => b.ast - a.ast)[0];
    return { topScorer, topRebounder, topPlaymaker };
  }, [game.opponentTeam, mukBox.players, opponentBox.players]);

  const periodCount = Math.max(game.totalPeriods, ...game.events.map((event) => event.period), 1);
  const periodBreakdown = Array.from({ length: periodCount }, (_, index) => {
    const period = index + 1;
    const periodEvents = game.events.filter((event) => event.period === period);
    return {
      label: formatPeriodAbbreviation(period, game.periodStructure),
      muk: getTeamScore(periodEvents, 'muk'),
      opponent: getTeamScore(periodEvents, 'opponent'),
    };
  });

  const copyTextSummary = async () => {
    const summary = [
      `CourtSide game summary vs ${game.opponentTeam}`,
      `${game.date} ${game.startTime} at ${game.venue}`,
      `Final score: Mukwonago ${mukScore}, ${game.opponentTeam} ${opponentScore}`,
      `Top scorer: ${leaders.topScorer?.name ?? 'N/A'}`,
    ].join('\n');

    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadCSV = () => {
    downloadTextFile(`CourtSide_${game.opponentTeam.replace(/\s+/g, '_').toLowerCase()}_${game.date}.csv`, generateCSVContent(game), 'text/csv;charset=utf-8');
  };

  const handleShareImage = async () => {
    if (!boxScoreRef.current) {
      return;
    }

    await downloadElementImage(boxScoreRef.current, `CourtSide_${game.opponentTeam.replace(/\s+/g, '_').toLowerCase()}_${game.date}.png`);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const loadAiRecap = async () => {
      setAiLoading(true);
      setAiStatusMessage('');

      try {
        const response = await fetch('/api/ai-recap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game }),
        });

        const payload = await response.json();
        if (!response.ok) {
          setAiStatusMessage(payload.message || 'Configure Gemini API key for AI features');
          setAiRecap(null);
          return;
        }

        setAiRecap(payload.analysis);
      } catch {
        setAiStatusMessage('Configure Gemini API key for AI features');
      } finally {
        setAiLoading(false);
      }
    };

    if (game.status === 'completed' || game.events.length > 0) {
      void loadAiRecap();
    }
  }, [game]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-3 md:px-4 md:py-4">
      <div className="court-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border px-4 py-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-white/80 transition-colors hover:text-brand-gold">
          <ArrowLeft className="h-4 w-4" /> Back to setup
        </button>
        {game.status === 'in-progress' && onContinueGame && (
          <button onClick={onContinueGame} className="court-button inline-flex items-center gap-2 rounded-lg bg-brand-gold px-4 text-sm font-bold text-brand-navy">
            Resume Live Game
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="court-glass overflow-hidden rounded-[28px] border border-brand-border">
        <div className="relative overflow-hidden border-b border-brand-border px-5 py-5 md:px-6 md:py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,151,42,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(45,90,39,0.18),transparent_25%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.28em] text-brand-muted">Game Summary</div>
              <h1 className="court-safe-text mt-2 text-3xl font-black text-brand-white md:text-5xl">Mukwonago vs {game.opponentTeam}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-muted">
                <span>{game.date}</span>
                <span>•</span>
                <span>{game.startTime}</span>
                <span>•</span>
                <span>{game.venue}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-navy/80 px-5 py-4 text-right">
              <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Final score</div>
              <div className="court-score-font mt-1 text-5xl font-black text-brand-gold">{mukScore} - {opponentScore}</div>
              <div className="mt-1 text-sm text-brand-muted">{game.status === 'completed' ? 'Completed' : 'In progress'}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-brand-border px-5 py-4 md:grid-cols-3 md:px-6">
          <MetricCard label="Top Scorer" value={leaders.topScorer ? `${leaders.topScorer.name} (${leaders.topScorer.pts})` : 'N/A'} accent="text-brand-gold" />
          <MetricCard label="Top Rebounder" value={leaders.topRebounder ? `${leaders.topRebounder.name} (${leaders.topRebounder.reb})` : 'N/A'} accent="text-brand-white" />
          <MetricCard label="Top Playmaker" value={leaders.topPlaymaker ? `${leaders.topPlaymaker.name} (${leaders.topPlaymaker.ast})` : 'N/A'} accent="text-brand-bright-gold" />
        </div>

        <div className="grid gap-3 px-5 py-4 md:grid-cols-2 md:px-6">
          <button onClick={copyTextSummary} className="court-button inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">
            <Sparkles className="h-4 w-4 text-brand-bright-gold" /> {copied ? 'Copied text summary' : 'Copy text summary'}
          </button>
          <button onClick={handleDownloadCSV} className="court-button inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">
            <Download className="h-4 w-4 text-brand-bright-gold" /> Download CSV
          </button>
          <button onClick={handleShareImage} className="court-button inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">
            <Share2 className="h-4 w-4 text-brand-bright-gold" /> Share box score image
          </button>
          <button onClick={handlePrint} className="court-button inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-brand-navy px-4 text-sm font-semibold text-brand-white transition-all hover:border-brand-gold">
            <Printer className="h-4 w-4 text-brand-bright-gold" /> Print
          </button>
        </div>
      </motion.div>

      <motion.div ref={boxScoreRef} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.04 }} className="grid gap-3">
        <BoxScore game={game} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08 }} className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="court-glass rounded-3xl border border-brand-border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Period breakdown</div>
              <h3 className="mt-1 text-xl font-black text-brand-white">By quarter or half</h3>
            </div>
            <Clock3 className="h-5 w-5 text-brand-bright-gold" />
          </div>

          <div className="mt-4 space-y-3">
            {periodBreakdown.map((period) => (
              <div key={period.label} className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-white">{period.label}</span>
                  <span className="court-score-font text-lg text-brand-gold">{period.muk} - {period.opponent}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-slate">
                  <div className="h-full rounded-full bg-brand-gold" style={{ width: `${Math.max(10, period.muk * 10)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <AIRecap game={game} recap={aiRecap} loading={aiLoading} statusMessage={aiStatusMessage} />

          <div className="court-glass rounded-3xl border border-brand-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Team comparison</div>
                <h3 className="mt-1 text-xl font-black text-brand-white">Mukwonago vs {game.opponentTeam}</h3>
              </div>
              <Users className="h-5 w-5 text-brand-bright-gold" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ComparisonCard label="Points" muk={mukBox.totals.pts} opponent={opponentBox.totals.pts} />
              <ComparisonCard label="Rebounds" muk={mukBox.totals.reb} opponent={opponentBox.totals.reb} />
              <ComparisonCard label="Assists" muk={mukBox.totals.ast} opponent={opponentBox.totals.ast} />
              <ComparisonCard label="Steals" muk={mukBox.totals.stl} opponent={opponentBox.totals.stl} />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.12 }} className="court-glass rounded-3xl border border-brand-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Play by play</div>
            <h3 className="mt-1 text-xl font-black text-brand-white">Recent events</h3>
          </div>
          <Trophy className="h-5 w-5 text-brand-bright-gold" />
        </div>

        <div className="mt-4 grid gap-2">
          {[...game.events].slice().reverse().slice(0, 20).map((event) => (
            <div key={event.id} className="rounded-2xl border border-brand-border bg-brand-navy/70 px-3 py-3 text-sm text-brand-white">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-brand-gold">{event.team === 'muk' ? 'Muk' : game.opponentTeam}</span>
                  {event.playerName ? <span> • #{event.playerNumber} {event.playerName}</span> : null}
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">{formatPeriodName(event.period, game.periodStructure)}</span>
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-muted">{event.timestamp} • {event.type}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className={`court-safe-text mt-2 text-sm font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function ComparisonCard({ label, muk, opponent }: { label: string; muk: number; opponent: number }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-brand-white">
        <span className="text-brand-gold">{muk}</span>
        <span className="text-brand-muted">vs</span>
        <span>{opponent}</span>
      </div>
    </div>
  );
}
