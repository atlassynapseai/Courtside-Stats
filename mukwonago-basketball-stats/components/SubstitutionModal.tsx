import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '../lib/types';

interface SubstitutionModalProps {
  open: boolean;
  teamName: string;
  players: Player[];
  activePlayerIds: string[];
  onClose: () => void;
  onTogglePlayer: (player: Player) => void;
}

export default function SubstitutionModal({ open, teamName, players, activePlayerIds, onClose, onTogglePlayer }: SubstitutionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="court-glass w-full max-w-2xl rounded-[24px] border border-brand-border p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-brand-border pb-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-brand-muted">Quick Substitution</div>
                <h3 className="mt-1 text-xl font-black text-brand-white">{teamName}</h3>
              </div>
              <button type="button" onClick={onClose} className="court-button rounded-lg border border-brand-border px-4 text-sm font-semibold text-brand-white">Close</button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 max-h-[60vh] overflow-auto pr-1">
              {players.map((player) => {
                const active = activePlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => onTogglePlayer(player)}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all ${active ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-brand-border bg-brand-navy text-brand-white'}`}
                  >
                    <div>
                      <div className="font-semibold">#{player.number} {player.name}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-muted">{active ? 'On court' : 'Bench'}</div>
                    </div>
                    <div className="rounded-full border border-current px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">{active ? 'In' : 'Out'}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}