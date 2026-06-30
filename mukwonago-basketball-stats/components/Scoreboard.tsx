import { motion, AnimatePresence } from 'framer-motion';
import { Clock3, TimerReset, ShieldAlert } from 'lucide-react';

interface ScoreboardProps {
  homeLabel: string;
  awayLabel: string;
  homeScore: number;
  awayScore: number;
  periodLabel: string;
  homeFouls: number;
  awayFouls: number;
  homeTimeouts: number;
  awayTimeouts: number;
  activeShotClock?: number | null;
}

export default function Scoreboard({
  homeLabel,
  awayLabel,
  homeScore,
  awayScore,
  periodLabel,
  homeFouls,
  awayFouls,
  homeTimeouts,
  awayTimeouts,
  activeShotClock,
}: ScoreboardProps) {
  return (
    <div className="court-glass rounded-[18px] border border-brand-border/80 p-3 md:p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamScoreBlock
          label={homeLabel}
          score={homeScore}
          fouls={homeFouls}
          timeouts={homeTimeouts}
          accent="text-brand-gold"
        />

        <div className="flex flex-col items-center justify-center gap-2 px-1">
          <motion.div
            key={periodLabel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-brand-border bg-brand-slate px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted"
          >
            {periodLabel}
          </motion.div>
          <AnimatePresence mode="wait">
            {typeof activeShotClock === 'number' ? (
              <motion.div
                key={activeShotClock}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-xl font-black shadow-lg ${activeShotClock <= 5
                    ? 'border-brand-red bg-brand-red/15 text-brand-red'
                    : 'border-brand-gold bg-brand-navy text-brand-white'
                  }`}
              >
                <span className="court-score-font">{activeShotClock}</span>
              </motion.div>
            ) : (
              <motion.div
                key="shot-clock-off"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-border bg-brand-navy text-brand-muted"
              >
                <Clock3 className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-brand-muted">
            <TimerReset className="h-3.5 w-3.5 text-brand-bright-gold" />
            Live
          </div>
        </div>

        <TeamScoreBlock
          label={awayLabel}
          score={awayScore}
          fouls={awayFouls}
          timeouts={awayTimeouts}
          accent="text-white"
          alignRight
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-brand-muted sm:grid-cols-4">
        <StatusPill label="Home Fouls" value={homeFouls} danger={homeFouls >= 7} />
        <StatusPill label="Away Fouls" value={awayFouls} danger={awayFouls >= 7} />
        <StatusPill label="Home TOs" value={homeTimeouts} />
        <StatusPill label="Away TOs" value={awayTimeouts} />
      </div>
    </div>
  );
}

function TeamScoreBlock({
  label,
  score,
  fouls,
  timeouts,
  accent,
  alignRight = false,
}: {
  label: string;
  score: number;
  fouls: number;
  timeouts: number;
  accent: string;
  alignRight?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-[16px] border border-brand-border bg-brand-slate/70 px-3 py-3 ${alignRight ? 'text-right' : ''}`}>
      <div className={`court-safe-text text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-muted ${alignRight ? 'text-right' : ''}`}>
        {label}
      </div>
      <motion.div
        key={score}
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        className={`mt-1 text-5xl font-black leading-none md:text-6xl ${accent}`}
      >
        <span className="court-score-font">{score}</span>
      </motion.div>
      <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] text-brand-muted ${alignRight ? 'justify-end' : ''}`}>
        <ShieldAlert className="h-3.5 w-3.5 text-brand-red" />
        {fouls} fouls
        <span className="h-1 w-1 rounded-full bg-brand-border" />
        {timeouts} TOs
      </div>
    </div>
  );
}

function StatusPill({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`min-w-0 rounded-lg border px-2 py-1.5 ${danger ? 'border-brand-red/40 bg-brand-red/10 text-brand-red' : 'border-brand-border bg-brand-navy text-brand-muted'}`}>
      <div className="court-safe-text text-[10px] uppercase tracking-[0.22em]">{label}</div>
      <div className="court-score-font mt-0.5 text-sm font-semibold text-brand-white">{value}</div>
    </div>
  );
}