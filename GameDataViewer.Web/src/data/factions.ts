export interface FactionInfo {
  key: string;
  color: string;
  label: string;
}

export const factions: FactionInfo[] = [
  { key: 'khaak',            color: '#ff3333', label: "Kha'ak" },
  { key: 'court',            color: '#5b5b5b', label: 'Court of Curbs' },
  { key: 'civilian',         color: '#5b5b5b', label: 'Civilian' },
  { key: 'criminal',         color: '#ff3333', label: 'Criminal' },
  { key: 'argon',            color: '#0079a5', label: 'Argon Republic' },
  { key: 'visitor',          color: '#5b5b5b', label: 'Visitor' },
  { key: 'scavenger',        color: '#005986', label: 'Scavenger' },
  { key: 'antigone',         color: '#00A6ff', label: 'Antigone Republic' },
  { key: 'fallensplit',      color: '#c530c5', label: 'Fallen Families' },
  { key: 'pioneers',         color: '#00c1d5', label: 'Pioneers' },
  { key: 'freesplit',        color: '#d58100', label: 'Free Families' },
  { key: 'holyorderfanatic', color: '#e89be8', label: 'Holy Order Fanatic' },
  { key: 'player',           color: '#00ff00', label: 'Player' },
  { key: 'smuggler',         color: '#ff3333', label: 'Smuggler' },
  { key: 'split',            color: '#d58100', label: 'Split Families' },
  { key: 'alliance',         color: '#c530c5', label: 'Alliance of Words' },
  { key: 'holyorder',        color: '#e89be8', label: 'Holy Order' },
  { key: 'scaleplate',       color: '#ff3333', label: 'Scaleplate' },
  { key: 'xenon',            color: '#ff3333', label: 'Xenon' },
  { key: 'ministry',         color: '#c5c500', label: 'Ministry of Finance' },
  { key: 'loanshark',        color: '#b5a750', label: 'Loan Shark' },
  { key: 'boron',            color: '#4cc6ff', label: 'Boron Kingdom' },
  { key: 'trinity',          color: '#c530c5', label: 'Trinity' },
  { key: 'ownerless',        color: '#5b5b5b', label: 'Ownerless' },
  { key: 'paranid',          color: '#c530c5', label: 'Paranid' },
  { key: 'yaki',             color: '#ff3333', label: 'Yaki' },
  { key: 'buccaneers',       color: '#ff3333', label: 'Buccaneers' },
  { key: 'terran',           color: '#aad8ff', label: 'Terran Protectorate' },
  { key: 'teladi',           color: '#c5c500', label: 'Teladi Company' },
  { key: 'hatikvah',         color: '#50ffff', label: "Hatikvah's Free League" },
];

export const factionMap = new Map<string, FactionInfo>(factions.map(f => [f.key, f]));

export function getFactionColor(key: string): string {
  return factionMap.get(key)?.color ?? '#5b5b5b';
}

export function getFactionLabel(key: string): string {
  return factionMap.get(key)?.label ?? key;
}

export const HOSTILE = new Set(['khaak', 'xenon', 'yaki', 'scaleplate', 'criminal', 'smuggler', 'buccaneers']);
