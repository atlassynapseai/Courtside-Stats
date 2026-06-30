import { Game } from './types';
import { generateBoxScore, getTeamScore } from './gameUtils';

export interface GameAnalysis {
  recap: string;
  mvp: string;
  tacticalSuggestion: string;
  opponentAnalysis: string;
  motivation: string;
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function buildGameAnalysisPrompt(game: Game): string {
  const mukScore = getTeamScore(game.events, 'muk');
  const opponentScore = getTeamScore(game.events, 'opponent');
  const mukPlayers = generateBoxScore(game.mukRoster, game.events, 'muk').players;
  const opponentPlayers = generateBoxScore(game.opponentRoster, game.events, 'opponent').players;

  return [
    `Game result: Mukwonago ${mukScore}, ${game.opponentTeam} ${opponentScore}.`,
    `Muk player stats: ${JSON.stringify(mukPlayers)}`,
    `Opponent player stats: ${JSON.stringify(opponentPlayers)}`,
    'Return JSON with recap, mvp, tacticalSuggestion, opponentAnalysis, motivation.',
  ].join('\n');
}

export function getMissingKeyAnalysis(): GameAnalysis {
  return {
    recap: 'Configure Gemini API key for AI features.',
    mvp: 'AI analysis unavailable until the Gemini key is set.',
    tacticalSuggestion: 'No tactical suggestions until AI is configured.',
    opponentAnalysis: 'No opponent analysis available yet.',
    motivation: 'Add the API key to unlock postgame insights.',
  };
}