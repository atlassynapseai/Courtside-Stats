export interface Player {
  id: string;
  name: string;
  number: string;
  position?: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  photoUrl?: string;
  isStarter?: boolean;
  isActive?: boolean;
}

export type StatType =
  | '1PT'
  | '2PT'
  | '3PT'
  | 'REB'
  | 'AST'
  | 'STL'
  | 'FOUL'
  | 'BLK'
  | 'TO'
  | 'DREB'
  | 'OREB'
  | 'CHARGE'
  | 'FLAGRANT'
  | 'TECH'
  | '+/-';

export type GameStatus = 'scheduled' | 'in-progress' | 'completed';

export interface Team {
  id: string;
  name: string;
  color?: string;
  jerseyColor?: string;
  roster: Player[];
}

export interface Season {
  id: string;
  name: string;
  createdAt: string;
  teamIds: string[];
  gameIds: string[];
  wins: number;
  losses: number;
  ties: number;
}

export interface LineupState {
  muk: string[];
  opponent: string[];
}

export interface StatEvent {
  id: string;
  type: StatType | 'TIMEOUT' | 'PERIOD_CHANGE' | 'SUB_IN' | 'SUB_OUT';
  team: 'muk' | 'opponent';
  playerId: string | null; // null for team-wide events like timeout
  playerName: string | null;
  playerNumber: string | null;
  period: number; // 1-based index (e.g. 1 for 1st Half/Q1, etc.)
  timestamp: string; // e.g., "6:42 PM"
  systemTime: number; // epoch ms for undos and sorting
  details?: string; // extra info, e.g. which period we advanced to
  attachmentUrl?: string;
  attachmentType?: 'photo' | 'video';
}

export interface Game {
  id: string;
  date: string;
  startTime: string;
  venue: string;
  opponentTeam: string;
  periodStructure: 'halves' | 'quarters';
  totalPeriods: number; // 2 for halves, 4 for quarters
  currentPeriod: number; // 1-based index
  timeoutsConfig: number; // default 3
  bonusThreshold: number; // default 7
  shotClockSeconds?: 24 | 30;
  periodLengthSeconds?: number;
  seasonId?: string;
  seasonName?: string;
  activePlayerIds?: LineupState;
  mukRoster: Player[];
  opponentRoster: Player[];
  mukTimeoutsRemaining: number;
  opponentTimeoutsRemaining: number;
  events: StatEvent[];
  status: GameStatus;
}
