import { Game, Player, StatEvent, StatType } from './types';

const SCORING_MAP: Partial<Record<StatType, number>> = {
  '1PT': 1,
  '2PT': 2,
  '3PT': 3,
};

const STAT_COUNTERS: Array<Exclude<StatType, '1PT' | '2PT' | '3PT' | '+/-'>> = [
  'REB',
  'AST',
  'STL',
  'FOUL',
  'BLK',
  'TO',
  'DREB',
  'OREB',
  'CHARGE',
  'FLAGRANT',
  'TECH',
];

export function getTeamScore(events: StatEvent[], team: 'muk' | 'opponent'): number {
  return events
    .filter((e) => e.team === team)
    .reduce((sum, e) => {
      return sum + (SCORING_MAP[e.type as StatType] ?? 0);
    }, 0);
}

export function getTeamPeriodFouls(
  events: StatEvent[],
  team: 'muk' | 'opponent',
  period: number
): number {
  return events.filter((e) => e.team === team && e.period === period && e.type === 'FOUL').length;
}

export interface PlayerStats {
  id: string;
  name: string;
  number: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  pf: number;
  blk: number;
  to: number;
  dreb: number;
  oreb: number;
  charge: number;
  flagrant: number;
  tech: number;
  plusMinus: number;
}

export function getPlayerStats(events: StatEvent[], player: Player, team: 'muk' | 'opponent'): PlayerStats {
  const playerEvents = events.filter((e) => e.team === team && e.playerId === player.id);

  let pts = 0;
  let reb = 0;
  let ast = 0;
  let stl = 0;
  let pf = 0;
  let blk = 0;
  let to = 0;
  let dreb = 0;
  let oreb = 0;
  let charge = 0;
  let flagrant = 0;
  let tech = 0;
  let plusMinus = 0;

  playerEvents.forEach((e) => {
    if (e.type === '1PT') pts += 1;
    else if (e.type === '2PT') pts += 2;
    else if (e.type === '3PT') pts += 3;
    else if (e.type === 'REB') reb += 1;
    else if (e.type === 'AST') ast += 1;
    else if (e.type === 'STL') stl += 1;
    else if (e.type === 'FOUL') pf += 1;
    else if (e.type === 'BLK') blk += 1;
    else if (e.type === 'TO') to += 1;
    else if (e.type === 'DREB') dreb += 1;
    else if (e.type === 'OREB') oreb += 1;
    else if (e.type === 'CHARGE') charge += 1;
    else if (e.type === 'FLAGRANT') flagrant += 1;
    else if (e.type === 'TECH') tech += 1;
    else if (e.type === '+/-') {
      const parsedPlusMinus = Number(e.details);
      plusMinus += Number.isFinite(parsedPlusMinus) ? parsedPlusMinus : 0;
    }
  });

  return {
    id: player.id,
    name: player.name,
    number: player.number,
    pts,
    reb,
    ast,
    stl,
    pf,
    blk,
    to,
    dreb,
    oreb,
    charge,
    flagrant,
    tech,
    plusMinus,
  };
}

export function generateBoxScore(
  roster: Player[],
  events: StatEvent[],
  team: 'muk' | 'opponent'
): { players: PlayerStats[]; totals: Omit<PlayerStats, 'id' | 'name' | 'number'> } {
  const players = roster.map((p) => getPlayerStats(events, p, team));

  const totals = players.reduce(
    (sum, p) => {
      sum.pts += p.pts;
      sum.reb += p.reb;
      sum.ast += p.ast;
      sum.stl += p.stl;
      sum.pf += p.pf;
      sum.blk += p.blk;
      sum.to += p.to;
      sum.dreb += p.dreb;
      sum.oreb += p.oreb;
      sum.charge += p.charge;
      sum.flagrant += p.flagrant;
      sum.tech += p.tech;
      sum.plusMinus += p.plusMinus;
      return sum;
    },
    { pts: 0, reb: 0, ast: 0, stl: 0, pf: 0, blk: 0, to: 0, dreb: 0, oreb: 0, charge: 0, flagrant: 0, tech: 0, plusMinus: 0 }
  );

  return { players, totals };
}

export function formatPeriodName(period: number, structure: 'halves' | 'quarters'): string {
  if (structure === 'halves') {
    return period === 1 ? '1st Half' : period === 2 ? '2nd Half' : `OT ${period - 2}`;
  } else {
    if (period <= 4) {
      const suffixes = ['1st', '2nd', '3rd', '4th'];
      return `${suffixes[period - 1]} Quarter`;
    }
    return `OT ${period - 4}`;
  }
}

export function formatPeriodAbbreviation(period: number, structure: 'halves' | 'quarters'): string {
  if (structure === 'halves') {
    return period === 1 ? 'H1' : period === 2 ? 'H2' : `OT${period - 2}`;
  } else {
    return period <= 4 ? `Q${period}` : `OT${period - 4}`;
  }
}

export function generateTextSummary(game: Game): string {
  const mukScore = getTeamScore(game.events, 'muk');
  const oppScore = getTeamScore(game.events, 'opponent');

  const mukBox = generateBoxScore(game.mukRoster, game.events, 'muk');
  const oppBox = generateBoxScore(game.opponentRoster, game.events, 'opponent');

  let text = `🏀 MUKWONAGO JUNIOR INDIANS GAME SUMMARY 🏀\n`;
  text += `-------------------------------------------\n`;
  text += `Opponent: ${game.opponentTeam}\n`;
  text += `Date: ${game.date} | Time: ${game.startTime}\n`;
  text += `Venue: ${game.venue}\n`;
  text += `-------------------------------------------\n`;
  text += `FINAL SCORE:\n`;
  text += `Mukwonago (Muk): ${mukScore}\n`;
  text += `${game.opponentTeam}: ${oppScore}\n`;
  text += `-------------------------------------------\n`;

  text += `MUKWONAGO BOX SCORE:\n`;
  text += `Num  Name              PTS  REB  AST  STL  PF\n`;
  mukBox.players.forEach((p) => {
    text += `#${p.number.padEnd(3)} ${p.name.padEnd(17)} ${p.pts.toString().padEnd(4)} ${p.reb.toString().padEnd(4)} ${p.ast.toString().padEnd(4)} ${p.stl.toString().padEnd(4)} ${p.pf.toString().padEnd(2)}\n`;
  });
  text += `TOTALS                 ${mukBox.totals.pts.toString().padEnd(4)} ${mukBox.totals.reb.toString().padEnd(4)} ${mukBox.totals.ast.toString().padEnd(4)} ${mukBox.totals.stl.toString().padEnd(4)} ${mukBox.totals.pf.toString().padEnd(2)}\n`;

  text += `-------------------------------------------\n`;
  text += `${game.opponentTeam.toUpperCase()} BOX SCORE:\n`;
  text += `Num  Name              PTS  REB  AST  STL  PF\n`;
  oppBox.players.forEach((p) => {
    text += `#${p.number.padEnd(3)} ${p.name.padEnd(17)} ${p.pts.toString().padEnd(4)} ${p.reb.toString().padEnd(4)} ${p.ast.toString().padEnd(4)} ${p.stl.toString().padEnd(4)} ${p.pf.toString().padEnd(2)}\n`;
  });
  text += `TOTALS                 ${oppBox.totals.pts.toString().padEnd(4)} ${oppBox.totals.reb.toString().padEnd(4)} ${oppBox.totals.ast.toString().padEnd(4)} ${oppBox.totals.stl.toString().padEnd(4)} ${oppBox.totals.pf.toString().padEnd(2)}\n`;

  text += `-------------------------------------------\n`;
  text += `Generated with Mukwonago Basketball Stats Tracker\n`;

  return text;
}

export function generateCSVContent(game: Game): string {
  const mukBox = generateBoxScore(game.mukRoster, game.events, 'muk');
  const oppBox = generateBoxScore(game.opponentRoster, game.events, 'opponent');

  let csv = `Game Date,${game.date}\n`;
  csv += `Time,${game.startTime}\n`;
  csv += `Venue,${game.venue}\n`;
  csv += `Opponent,${game.opponentTeam}\n\n`;

  // MUK Box Score
  csv += `MUKWONAGO JUNIOR INDIANS BOX SCORE\n`;
  csv += `Jersey Number,Player Name,Points,Rebounds,Assists,Steals,Personal Fouls,Blocks,Turnovers,DReb,OReb,Charge,Flagrant,Tech,Plus/Minus\n`;
  mukBox.players.forEach((p) => {
    csv += `"${p.number}","${p.name.replace(/"/g, '""')}",${p.pts},${p.reb},${p.ast},${p.stl},${p.pf},${p.blk},${p.to},${p.dreb},${p.oreb},${p.charge},${p.flagrant},${p.tech},${p.plusMinus}\n`;
  });
  csv += `TOTALS,,${mukBox.totals.pts},${mukBox.totals.reb},${mukBox.totals.ast},${mukBox.totals.stl},${mukBox.totals.pf},${mukBox.totals.blk},${mukBox.totals.to},${mukBox.totals.dreb},${mukBox.totals.oreb},${mukBox.totals.charge},${mukBox.totals.flagrant},${mukBox.totals.tech},${mukBox.totals.plusMinus}\n\n`;

  // Opponent Box Score
  csv += `OPPONENT (${game.opponentTeam}) BOX SCORE\n`;
  csv += `Jersey Number,Player Name,Points,Rebounds,Assists,Steals,Personal Fouls,Blocks,Turnovers,DReb,OReb,Charge,Flagrant,Tech,Plus/Minus\n`;
  oppBox.players.forEach((p) => {
    csv += `"${p.number}","${p.name.replace(/"/g, '""')}",${p.pts},${p.reb},${p.ast},${p.stl},${p.pf},${p.blk},${p.to},${p.dreb},${p.oreb},${p.charge},${p.flagrant},${p.tech},${p.plusMinus}\n`;
  });
  csv += `TOTALS,,${oppBox.totals.pts},${oppBox.totals.reb},${oppBox.totals.ast},${oppBox.totals.stl},${oppBox.totals.pf},${oppBox.totals.blk},${oppBox.totals.to},${oppBox.totals.dreb},${oppBox.totals.oreb},${oppBox.totals.charge},${oppBox.totals.flagrant},${oppBox.totals.tech},${oppBox.totals.plusMinus}\n\n`;

  // Play-by-play events
  csv += `PLAY BY PLAY TIMELINE\n`;
  csv += `Period,Time,Team,Player Number,Player Name,Event Type\n`;
  // Sort events chronologically for spreadsheet view
  const chronologicalEvents = [...game.events].sort((a, b) => a.systemTime - b.systemTime);
  chronologicalEvents.forEach((e) => {
    const teamLabel = e.team === 'muk' ? 'Muk' : game.opponentTeam;
    const num = e.playerNumber || '';
    const name = e.playerName || '';
    const periodLabel = formatPeriodAbbreviation(e.period, game.periodStructure);
    csv += `"${periodLabel}","${e.timestamp}","${teamLabel.replace(/"/g, '""')}","${num}","${name.replace(/"/g, '""')}","${e.type}"\n`;
  });

  return csv;
}
