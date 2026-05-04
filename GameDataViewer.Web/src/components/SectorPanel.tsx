import { useMemo, useState, useEffect } from 'react';
import { ComponentRecord, SaveData } from '../types';
import { getFactionColor, getFactionLabel } from '../data/factions';
import { sectorPositionMap } from '../data/sectorPositions';
import ScatterPlot from './ScatterPlot';

interface SectorPanelProps {
  sectorMacro: string;
  saveData: SaveData;
  onClose: () => void;
}

export default function SectorPanel({ sectorMacro, saveData, onClose }: SectorPanelProps) {
  const pos = sectorPositionMap.get(sectorMacro);
  const sector = saveData.sectors.find(s => s.macro === sectorMacro);

  const components = useMemo<ComponentRecord[]>(() => {
    const stations = saveData.stations.filter(s => s.sectorMacro === sectorMacro);
    const ships    = saveData.ships.filter(s => s.sectorMacro === sectorMacro);
    const gates    = saveData.gates.filter(s => s.sectorMacro === sectorMacro);
    return [...stations, ...ships, ...gates];
  }, [saveData, sectorMacro]);

  // Counts grouped by type
  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of components) map.set(c.type, (map.get(c.type) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [components]);

  // Counts by owner
  const ownerCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of components) {
      if (!c.owner) continue;
      map.set(c.owner, (map.get(c.owner) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [components]);

  const sectorName = pos?.name ?? sectorMacro;
  const ownerColor = getFactionColor(sector?.owner ?? '');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => { setSelectedId(null); }, [sectorMacro]);

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white">{sectorName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: ownerColor }}
            />
            <span className="text-base text-gray-300">
              {getFactionLabel(sector?.owner ?? '') || 'Unknown faction'}
            </span>
            {sector?.code && (
              <span className="text-sm text-gray-500 font-mono">{sector.code}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-200 text-xl leading-none mt-0.5"
          aria-label="Close"
        >×</button>
      </div>

      {/* 3D scatter plot */}
      <div className="px-4 pt-4 pb-2">
        <ScatterPlot
          components={components}
          sectorName={sectorName}
          selectedId={selectedId}
          onSelect={c => setSelectedId(c?.id ?? null)}
        />
      </div>

      {/* Summary counts */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-4">

        {/* By type */}
        <div>
          <h3 className="text-base font-semibold text-gray-300 uppercase tracking-wider mb-2">By type</h3>
          <div className="space-y-2">
            {typeCounts.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: typeColor(type) }}
                />
                <span className="text-base text-gray-200 flex-1 truncate">{type}</span>
                <span className="text-base text-gray-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By owner */}
        <div>
          <h3 className="text-base font-semibold text-gray-300 uppercase tracking-wider mb-2">By owner</h3>
          <div className="space-y-2">
            {ownerCounts.map(([owner, count]) => (
              <div key={owner} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: getFactionColor(owner) }}
                />
                <span className="text-base text-gray-200 flex-1 truncate">
                  {getFactionLabel(owner)}
                </span>
                <span className="text-base text-gray-400 font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All components list */}
      <div className="px-4 pb-6">
        <h3 className="text-base font-semibold text-gray-300 uppercase tracking-wider mb-2">
          All objects ({components.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-base border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-3 font-semibold">Type</th>
                <th className="pb-2 pr-3 font-semibold">Code</th>
                <th className="pb-2 pr-3 font-semibold">Owner</th>
                <th className="pb-2 pr-3 font-semibold text-right">X (km)</th>
                <th className="pb-2 pr-3 font-semibold text-right">Y (km)</th>
                <th className="pb-2 font-semibold text-right">Z (km)</th>
              </tr>
            </thead>
            <tbody>
              {components.map(c => (
                <tr
                  key={c.id}
                  className={`border-b border-gray-800/60 cursor-pointer ${
                    selectedId === c.id
                      ? 'bg-blue-900/40 hover:bg-blue-900/50'
                      : 'hover:bg-gray-800/40'
                  }`}
                  onClick={() => setSelectedId(s => s === c.id ? null : c.id)}
                >
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: typeColor(c.type) }}
                      />
                      <span className="text-gray-200 truncate max-w-[140px]">
                        {c.stationType || c.type}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-3 font-mono text-gray-300">{c.code || '—'}</td>
                  <td className="py-1.5 pr-3">
                    <span style={{ color: getFactionColor(c.owner) }}>
                      {getFactionLabel(c.owner) || '—'}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono text-gray-400">
                    {(c.x / 1000).toFixed(1)}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono text-gray-400">
                    {(c.y / 1000).toFixed(1)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-gray-400">
                    {(c.z / 1000).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function typeColor(type: string): string {
  switch (type) {
    case 'station':          return '#4466ff';
    case 'datavault':        return '#e200ff';
    case 'gate':             return '#ffa600';
    case 'highwayentrygate': return '#00a6ff';
    case 'highwayexitgate':  return '#a6e1fc';
    default:                 return '#ffff00';
  }
}
