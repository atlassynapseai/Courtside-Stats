'use client';

import React, { useState, useEffect } from 'react';
import { Player, Game } from '../lib/types';
import SetupScreen from '../components/SetupScreen';
import LiveGameScreen from '../components/LiveGameScreen';
import SummaryScreen from '../components/SummaryScreen';
import LogoCrest from '../components/LogoCrest';
import { History, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(12);

  // Core App States
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'live-game' | 'summary'>('setup');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  const [viewingGameSummary, setViewingGameSummary] = useState<Game | null>(null);

  // Remembered rosters
  const [savedRosterMuk, setSavedRosterMuk] = useState<Player[]>([]);
  const [savedRosterOpponent, setSavedRosterOpponent] = useState<Player[]>([]);

  // Load state on mount (from localStorage)
  useEffect(() => {
    const startedAt = Date.now();
    let releaseTimer: number | null = null;
    const progressTimer = window.setInterval(() => {
      setLoadingProgress((current) => (current >= 92 ? current : current + Math.max(2, Math.round((100 - current) / 8))));
    }, 120);

    const timer = setTimeout(() => {
      // Load saved games list
      const storedSavedGames = localStorage.getItem('muk_saved_games');
      if (storedSavedGames) {
        try {
          setSavedGames(JSON.parse(storedSavedGames));
        } catch (e) {
          console.error('Error parsing stored games', e);
        }
      }

      // Load active in-progress game
      const storedActiveGame = localStorage.getItem('muk_active_game');
      if (storedActiveGame) {
        try {
          const game: Game = JSON.parse(storedActiveGame);
          setActiveGame(game);
          // If there was an active game, direct them straight back into it or let them resume
          setCurrentScreen('live-game');
        } catch (e) {
          console.error('Error parsing stored active game', e);
        }
      }

      // Load saved rosters
      const storedRosterMuk = localStorage.getItem('muk_saved_roster_muk');
      if (storedRosterMuk) {
        try {
          setSavedRosterMuk(JSON.parse(storedRosterMuk));
        } catch (e) {
          console.error('Error parsing Muk roster', e);
        }
      }

      const storedRosterOpp = localStorage.getItem('muk_saved_roster_opp');
      if (storedRosterOpp) {
        try {
          setSavedRosterOpponent(JSON.parse(storedRosterOpp));
        } catch (e) {
          console.error('Error parsing opponent roster', e);
        }
      }

      setLoadingProgress(100);
      const elapsed = Date.now() - startedAt;
      if (elapsed < 950) {
        releaseTimer = window.setTimeout(() => setMounted(true), 950 - elapsed);
        return;
      }

      setMounted(true);
    }, 0);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('Service worker registration failed', error);
        });
      }, { once: true });
    }

    return () => {
      clearTimeout(timer);
      if (releaseTimer) {
        window.clearTimeout(releaseTimer);
      }
      window.clearInterval(progressTimer);
    };
  }, []);

  // Save active game to localStorage on change
  const handleUpdateGame = (updatedGame: Game) => {
    setActiveGame(updatedGame);
    localStorage.setItem('muk_active_game', JSON.stringify(updatedGame));
  };

  // Start new game
  const handleStartGame = (newGame: Game) => {
    setActiveGame(newGame);
    setCurrentScreen('live-game');

    // Persist rosters for next time pre-fills
    localStorage.setItem('muk_saved_roster_muk', JSON.stringify(newGame.mukRoster));
    localStorage.setItem('muk_saved_roster_opp', JSON.stringify(newGame.opponentRoster));
    setSavedRosterMuk(newGame.mukRoster);
    setSavedRosterOpponent(newGame.opponentRoster);

    // Save active game to storage
    localStorage.setItem('muk_active_game', JSON.stringify(newGame));
  };

  // Complete game and move to history
  const handleFinishGame = () => {
    if (!activeGame) return;

    const completedGame: Game = {
      ...activeGame,
      status: 'completed',
    };

    const updatedSavedGames = [completedGame, ...savedGames];
    setSavedGames(updatedSavedGames);
    localStorage.setItem('muk_saved_games', JSON.stringify(updatedSavedGames));

    // Clear active game
    setActiveGame(null);
    localStorage.removeItem('muk_active_game');

    // Go to summary screen of this completed game
    setViewingGameSummary(completedGame);
    setCurrentScreen('summary');
  };

  // Save current rosters manually during setup
  const handleSaveRosters = (muk: Player[], opponent: Player[]) => {
    setSavedRosterMuk(muk);
    setSavedRosterOpponent(opponent);
    localStorage.setItem('muk_saved_roster_muk', JSON.stringify(muk));
    localStorage.setItem('muk_saved_roster_opp', JSON.stringify(opponent));
  };

  // View Summary of past game
  const handleViewGameSummary = (game: Game) => {
    setViewingGameSummary(game);
    setCurrentScreen('summary');
  };

  // Delete past game from history
  const handleDeleteSavedGame = (id: string) => {
    const updated = savedGames.filter((g) => g.id !== id);
    setSavedGames(updated);
    localStorage.setItem('muk_saved_games', JSON.stringify(updated));
  };

  // Cancel an active in-progress game
  const handleCancelActiveGame = () => {
    if (confirm('Are you sure you want to discard this in-progress game? This will wipe all current stats for this match.')) {
      setActiveGame(null);
      localStorage.removeItem('muk_active_game');
      setCurrentScreen('setup');
    }
  };

  if (!mounted) {
    return (
      <div id="loading-spinner" className="court-scene flex min-h-screen flex-col items-center justify-center bg-brand-navy text-brand-white px-4">
        <div className="court-glass court-spotlight court-card-3d court-ridge rounded-[32px] border border-brand-border px-8 py-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <LogoCrest size="md" className="mx-auto court-float" />
          <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-brand-gold">CourtSide is powering up</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-brand-muted">Loading live scoring, season history, and the broadcast-style dashboard.</p>
          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-brand-slate">
            <div className="court-loading-bar h-full rounded-full bg-gradient-to-r from-brand-gold via-brand-bright-gold to-brand-blue" style={{ width: `${loadingProgress}%` }} />
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.24em] text-brand-white/55">Loading {loadingProgress}%</div>
        </div>
      </div>
    );
  }

  return (
    <main id="app-root-main" className="min-h-screen bg-brand-navy text-brand-white relative overflow-x-hidden">

      {/* Sideline In-Progress Banner (If they exited back to Setup tab but have a live game running) */}
      {currentScreen === 'setup' && activeGame && (
        <div id="active-game-banner" className="bg-[#112B4F] border-b-2 border-brand-gold py-2 px-4 flex items-center justify-between text-xs md:text-sm font-semibold text-brand-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-gold rounded-full animate-ping"></span>
            <span>
              ⚡ Live Game In Progress vs <span className="text-brand-gold font-bold">{activeGame.opponentTeam}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('live-game')}
              className="bg-brand-blue hover:bg-brand-bright-gold hover:text-brand-navy text-brand-white font-extrabold py-1.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Resume Game
            </button>
            <button
              onClick={handleCancelActiveGame}
              className="text-[10px] text-brand-red/70 hover:text-brand-red font-medium py-1 px-2 cursor-pointer"
              title="Discard Match"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Primary Screen Coordinator */}
      <AnimatePresence mode="wait">
        {currentScreen === 'setup' && (
          <motion.div
            key="setup-screen-animate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SetupScreen
              onStartGame={handleStartGame}
              savedRosterMuk={savedRosterMuk}
              savedRosterOpponent={savedRosterOpponent}
              onSaveRosters={handleSaveRosters}
              savedGames={savedGames}
              onViewGameSummary={handleViewGameSummary}
              onDeleteSavedGame={handleDeleteSavedGame}
            />
          </motion.div>
        )}

        {currentScreen === 'live-game' && activeGame && (
          <motion.div
            key="live-game-screen-animate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <LiveGameScreen
              game={activeGame}
              onUpdateGame={handleUpdateGame}
              onFinishGame={handleFinishGame}
              onExitToSetup={() => setCurrentScreen('setup')}
            />
          </motion.div>
        )}

        {currentScreen === 'summary' && viewingGameSummary && (
          <motion.div
            key="summary-screen-animate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SummaryScreen
              game={viewingGameSummary}
              onBack={() => {
                setViewingGameSummary(null);
                setCurrentScreen('setup');
              }}
              onContinueGame={
                viewingGameSummary.status === 'in-progress'
                  ? () => {
                    setActiveGame(viewingGameSummary);
                    setCurrentScreen('live-game');
                  }
                  : undefined
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal humble footer */}
      <footer className="text-center py-6 text-[10px] text-brand-white/20 font-mono tracking-wider border-t border-brand-blue/5 mt-10">
        CourtSide • Sideline Scoreboard • Offline-Ready
      </footer>
    </main>
  );
}
