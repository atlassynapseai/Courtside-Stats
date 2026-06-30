import { motion, AnimatePresence } from 'framer-motion';

export interface PeriodSummaryData {
  periodLabel: string;
  homePoints: number;
  awayPoints: number;
  homeFouls: number;
  awayFouls: number;
}

interface PeriodSummaryModalProps {
  open: boolean;
  data: PeriodSummaryData | null;
  onContinue: () => void;
}

export default function PeriodSummaryModal({ open, data, onContinue }: PeriodSummaryModalProps) {
  return (
    <AnimatePresence>
      {open && data && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="court-glass w-full max-w-lg rounded-[24px] border border-brand-border p-4 shadow-2xl"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Period complete</div>
            <h3 className="mt-1 text-2xl font-black text-brand-white">{data.periodLabel}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryStat label="Mukwonago" value={data.homePoints} sub={`${data.homeFouls} fouls`} accent="text-brand-gold" />
              <SummaryStat label="Opponent" value={data.awayPoints} sub={`${data.awayFouls} fouls`} accent="text-brand-white" />
            </div>

            <button type="button" onClick={onContinue} className="court-button mt-4 w-full rounded-xl bg-brand-gold px-4 font-bold text-brand-navy">Advance Period</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SummaryStat({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-navy/70 p-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">{label}</div>
      <div className={`court-score-font mt-1 text-4xl font-black ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-brand-muted">{sub}</div>
    </div>
  );
}