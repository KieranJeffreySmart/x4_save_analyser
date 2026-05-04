export interface SectorRecord {
  id: string;
  macro: string;
  code: string;
  owner: string;
  componentCount: number;
}

export interface ComponentRecord {
  type: string;
  id: string;
  macro: string;
  code: string;
  owner: string;
  stationType?: string;
  connectionName?: string;
  sectorMacro: string;
  x: number;
  y: number;
  z: number;
  name?: string;
  state?: string;
  knownToPlayer?: boolean;
  spawnTime?: number;
}

export interface SaveData {
  sectors: SectorRecord[];
  stations: ComponentRecord[];
  ships: ComponentRecord[];
  gates: ComponentRecord[];
  lockboxes: ComponentRecord[];
}

export interface HexCell {
  macro: string;
  name: string;
  cx: number;
  cy: number;
  radius: number;
  clusterPos: number;
  // enriched from save data
  owner: string;
  color: string;
  hasDatavault: boolean;
  hasOwnerlessShip: boolean;
  hasEnemy: boolean;
  componentCount: number;
}
