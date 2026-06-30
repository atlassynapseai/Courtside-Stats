import { Game } from '../lib/types';
import { AlertCircle, Sparkles } from 'lucide-react';

interface AIRecapProps {
  game: Game;
  recap?: {
    recap: string;
    mvp: string;
    tacticalSuggestion: string;
    opponentAnalysis: string;
    motivation: string;
  } | null;
  loading?: boolean;
  statusMessage?: string;
}

export default function AIRecap({ game, recap, loading = false, statusMessage }: AIRecapProps) {
  if (statusMessage && !loading && !recap) {
    return (
      <div className="court-glass rounded-3xl border border-brand-border p-4 text-sm text-brand-muted">
        <div className="flex items-center gap-2 text-brand-bright-gold"><AlertCircle className="h-4 w-4" /> {statusMessage}</div>
        <p className="mt-2">AI recap is ready to summarize {game.opponentTeam} once Gemini is configured on the server.</p>
      </div>
    );
  }

  if (loading || !recap) {
    return (
      <div className="court-glass rounded-3xl border border-brand-border p-4 text-sm text-brand-muted">
        <div className="flex items-center gap-2 text-brand-white"><Sparkles className="h-4 w-4 text-brand-bright-gold" /> Generating AI recap...</div>
      </div>
    );
  }

  return (
    <div className="court-glass rounded-3xl border border-brand-border p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-brand-muted">
        <Sparkles className="h-4 w-4 text-brand-bright-gold" /> AI Game Analysis
      </div>
      <div className="mt-3 grid gap-3 text-sm text-brand-white">
        <p><span className="font-semibold text-brand-bright-gold">Recap:</span> {recap.recap}</p>
        <p><span className="font-semibold text-brand-bright-gold">MVP:</span> {recap.mvp}</p>
        <p><span className="font-semibold text-brand-bright-gold">Coach Tip:</span> {recap.tacticalSuggestion}</p>
        <p><span className="font-semibold text-brand-bright-gold">Opponent:</span> {recap.opponentAnalysis}</p>
        <p><span className="font-semibold text-brand-bright-gold">Message:</span> {recap.motivation}</p>
      </div>
    </div>
  );
}