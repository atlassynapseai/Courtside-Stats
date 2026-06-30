import { motion } from 'framer-motion';

interface ShotClockProps {
  secondsLeft: number;
  maxSeconds: 24 | 30;
  running: boolean;
}

export default function ShotClock({ secondsLeft, maxSeconds, running }: ShotClockProps) {
  const percentage = Math.max(0, Math.min(100, (secondsLeft / maxSeconds) * 100));
  const danger = secondsLeft <= 5;

  return (
    <div className="court-glass rounded-2xl border border-brand-border p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-brand-muted">
        <span>Shot Clock</span>
        <span>{running ? 'Running' : 'Stopped'}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${danger ? 'border-brand-red bg-brand-red/15 text-brand-red' : 'border-brand-gold bg-brand-navy text-brand-white'}`}>
          <motion.span
            key={secondsLeft}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="court-score-font text-2xl font-bold"
          >
            {secondsLeft}
          </motion.span>
        </div>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-brand-navy/80 border border-brand-border">
            <motion.div
              className={`h-full rounded-full ${danger ? 'bg-brand-red' : 'bg-brand-gold'}`}
              initial={false}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
          <div className="mt-2 text-[11px] text-brand-muted">24 / 30 second countdown with built-in buzzer support.</div>
        </div>
      </div>
    </div>
  );
}