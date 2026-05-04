import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ComponentRecord } from '../types';
import { getFactionColor, HOSTILE } from '../data/factions';

// ── 3D projection (mirrors svg_scatterplot.js algorithm) ──────────────────────

function project(
  px: number, py: number, pz: number,
  a1: number, a2: number,
  k: number, far: number,
  W: number, H: number,
): { cx: number; cy: number; r: number } {
  const x = px * Math.cos(a1) + (-pz) * Math.sin(a1);
  const z = (-pz) * Math.cos(a1) - px * Math.sin(a1);
  const y = py * Math.cos(a2) + z * Math.sin(a2);
  const d = z * Math.cos(a2) - py * Math.sin(a2) + far;
  return {
    cx: (k / d) * x + W / 2,
    cy: (k / d) * y + H / 2,
    r:  Math.max(1, (far / d) * 3),
  };
}

/** Scale all coordinates so the maximum absolute value is TARGET. Returns scale factor. */
function normalizeCoords(
  comps: ComponentRecord[],
  target = 600,
): { normalized: ComponentRecord[]; realMax: number } {
  let max = 1;
  for (const c of comps) {
    max = Math.max(max, Math.abs(c.x), Math.abs(c.y), Math.abs(c.z));
  }
  const realMax = max;
  if (max <= target) return { normalized: comps, realMax };
  const s = target / max;
  return {
    normalized: comps.map(c => ({ ...c, x: c.x * s, y: c.y * s, z: c.z * s })),
    realMax,
  };
}

/** Pick a "nice" tick step (in metres) that gives ~5 ticks across realMax. */
function niceTickStepM(realMax: number): number {
  const rawKm = realMax / 1000 / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawKm)));
  const norm = rawKm / mag;
  const niceKm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return niceKm * mag * 1000;
}

// ── Type groups for visibility toggles ────────────────────────────────────────

type TypeGroup = 'stations' | 'ships' | 'gates' | 'datavaults' | 'highways' | 'lockboxes';

function getTypeGroup(c: ComponentRecord): TypeGroup {
  if (c.type === 'station') return 'stations';
  if (c.type === 'datavault') return 'datavaults';
  if (c.type === 'lockbox') return 'lockboxes';
  if (c.type === 'gate') return 'gates';
  if (c.type === 'highwayentrygate' || c.type === 'highwayexitgate') return 'highways';
  return 'ships';
}

const TYPE_GROUPS: { key: TypeGroup; label: string }[] = [
  { key: 'stations',   label: 'Stations' },
  { key: 'ships',      label: 'Ships' },
  { key: 'gates',      label: 'Gates' },
  { key: 'datavaults', label: 'Datavaults' },
  { key: 'highways',   label: 'Highways' },
  { key: 'lockboxes',  label: 'Lockboxes' },
];

function componentColor(c: ComponentRecord): string {
  if (c.owner === 'player') return '#00ff00';
  if (HOSTILE.has(c.owner)) return getFactionColor(c.owner);
  switch (c.type) {
    case 'station':          return '#4466ff';
    case 'datavault':        return '#e200ff';
    case 'lockbox':          return '#ff88ff';
    case 'gate':             return '#ffa600';
    case 'highwayentrygate': return '#00a6ff';
    case 'highwayexitgate':  return '#a6e1fc';
    default:                 return '#ffff00'; // ships
  }
}

function componentLabel(c: ComponentRecord): string {
  const displayType = c.stationType || c.type;
  const namepart = c.name ? ` "${c.name}"` : '';
  return `${displayType}${namepart} (${c.code || '—'})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ScatterPlotProps {
  components: ComponentRecord[];
  sectorName: string;
  selectedId?: string | null;
  onSelect?: (c: ComponentRecord | null) => void;
}

const W = 640;
const H = 400;
const FAR = 2400;
const K0 = 900;

export default function ScatterPlot({ components, sectorName, selectedId, onSelect }: ScatterPlotProps) {
  const [angles, setAngles] = useState({ a1: 0, a2: 1.5 });
  const [k, setK] = useState(K0);
  const [showAxes, setShowAxes] = useState(true);
  const [visibleGroups, setVisibleGroups] = useState<Set<TypeGroup>>(
    () => new Set<TypeGroup>(['stations', 'ships', 'gates', 'datavaults', 'highways', 'lockboxes']),
  );
  const [hovered, setHovered] = useState<{ comp: ComponentRecord; x: number; y: number } | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; a1: number; a2: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset view when the sector changes
  useEffect(() => {
    setAngles({ a1: 0, a2: 1.5 });
    setK(K0);
    setHovered(null);
  }, [sectorName]);

  const visibleComponents = useMemo(
    () => components.filter(c => visibleGroups.has(getTypeGroup(c))),
    [components, visibleGroups],
  );

  const normalized = useMemo(() => normalizeCoords(visibleComponents), [visibleComponents]);

  // Keep a map from id → original component so the info box shows real-world coords
  const originalById = useMemo(
    () => new Map(components.map(c => [c.id, c])),
    [components],
  );

  const selected = selectedId != null ? (originalById.get(selectedId) ?? null) : null;

  const groupCounts = useMemo(() => {
    const map = new Map<TypeGroup, number>();
    for (const c of components) {
      const g = getTypeGroup(c);
      map.set(g, (map.get(g) ?? 0) + 1);
    }
    return map;
  }, [components]);

  const getTooltipPos = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const toggleGroup = (key: TypeGroup) => {
    setVisibleGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const resetView = () => {
    setAngles({ a1: 0, a2: 1.5 });
    setK(K0);
  };

  const projected = useMemo(() => {
    return normalized.normalized
      .map(c => ({ c, ...project(c.x, c.y, c.z, angles.a1, angles.a2, k, FAR, W, H) }))
      .sort((a, b) => a.r - b.r); // painter's algorithm: far first
  }, [normalized.normalized, angles, k]);

  /** Axis tick data — projected screen positions + km labels */
  const axisTicks = useMemo(() => {
    const { realMax } = normalized;
    const stepM = niceTickStepM(realMax);                  // step in metres
    const normMax = Math.min(600, realMax);                // normalised max
    const normStep = stepM * (normMax / realMax);          // step in normalised units

    type AxisDef = { color: string; label: string; px: (t: number) => number; py: (t: number) => number; pz: (t: number) => number };
    const axes: AxisDef[] = [
      { color: '#ff6666', label: 'X', px: t => t, py: _ => 0, pz: _ => 0 },
      { color: '#66ff66', label: 'Y', px: _ => 0, py: t => t, pz: _ => 0 },
      { color: '#6688ff', label: 'Z', px: _ => 0, py: _ => 0, pz: t => t },
    ];

    return axes.map(ax => {
      const ticks: { km: number; cx: number; cy: number }[] = [];
      for (let t = normStep; t <= normMax + normStep * 0.01; t += normStep) {
        const pt = project(ax.px(t), ax.py(t), ax.pz(t), angles.a1, angles.a2, k, FAR, W, H);
        const km = (t / normMax) * (realMax / 1000);
        ticks.push({ km, ...pt });
      }
      const end = project(ax.px(normMax), ax.py(normMax), ax.pz(normMax), angles.a1, angles.a2, k, FAR, W, H);
      const origin = project(0, 0, 0, angles.a1, angles.a2, k, FAR, W, H);
      return { ...ax, ticks, end, origin };
    });
  }, [normalized, angles, k]);

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ...angles };
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setAngles({
      a1: d.a1 - (e.clientX - d.sx) / 150,
      a2: d.a2 - (e.clientY - d.sy) / 150,
    });
  };

  const onMouseUp = () => { dragRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setK(prev => Math.max(200, prev * (e.deltaY > 0 ? 0.9 : 1.1)));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Controls row: type toggles + axes + reset */}
      <div className="flex items-center gap-3 flex-wrap">
        {TYPE_GROUPS.filter(g => (groupCounts.get(g.key) ?? 0) > 0).map(g => (
          <label key={g.key} className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visibleGroups.has(g.key)}
              onChange={() => toggleGroup(g.key)}
              className="accent-blue-500"
            />
            {g.label}
            <span className="text-gray-600">({groupCounts.get(g.key)})</span>
          </label>
        ))}
        <div className="flex items-center gap-3 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAxes}
              onChange={e => setShowAxes(e.target.checked)}
              className="accent-blue-500"
            />
            Axes
          </label>
          <button
            onClick={resetView}
            className="text-xs text-gray-500 hover:text-gray-200 transition-colors px-2 py-0.5 rounded border border-gray-700 hover:border-gray-500"
          >
            Reset view
          </button>
        </div>
      </div>

      {/* SVG + tooltip wrapper */}
      <div className="relative" ref={containerRef}>
      <svg
        className="scatter-svg rounded border border-gray-800 w-full"
        viewBox={`0 0 ${W} ${H}`}
        style={{ background: '#050510', display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { onMouseUp(); setHovered(null); }}
        onWheel={onWheel}
      >
        {/* Axes with scale ticks */}
        {showAxes && axisTicks.map(ax => (
          <g key={ax.label} style={{ pointerEvents: 'none' }}>
            {/* Axis line: origin → end */}
            <line
              x1={ax.origin.cx} y1={ax.origin.cy}
              x2={ax.end.cx}    y2={ax.end.cy}
              stroke={ax.color} strokeWidth={1.2} opacity={0.28}
            />
            {/* Axis label at the end */}
            <text
              x={ax.end.cx} y={ax.end.cy - 6}
              textAnchor="middle" fontSize={11}
              fill={ax.color} fillOpacity={0.4}
            >{ax.label}</text>
            {/* Tick marks + labels */}
            {ax.ticks.map(({ km, cx, cy }) => (
              <g key={km}>
                <circle cx={cx} cy={cy} r={2.5} fill={ax.color} opacity={0.3} />
                <text
                  x={cx + 4} y={cy - 4}
                  fontSize={9} fill={ax.color} fillOpacity={0.35}
                >
                  {km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)}km
                </text>
              </g>
            ))}
          </g>
        ))}

        {/* Data points */}
        {projected.map(({ c, cx, cy, r }) => {
          const orig = originalById.get(c.id) ?? c;
          const isSelected = selected?.id === c.id;
          const isHovered = hovered?.comp.id === c.id;
          const color = componentColor(orig);
          return (
            <circle
              key={c.id}
              cx={cx} cy={cy} r={isSelected || isHovered ? r + 2 : r}
              fill={color}
              fillOpacity={orig.state === 'wreck' ? 0.35 : 0.85}
              stroke={isSelected ? 'white' : isHovered ? '#cccccc' : 'none'}
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onClick={e => {
                e.stopPropagation();
                onSelect?.(selectedId === c.id ? null : orig);
              }}
              onMouseEnter={e => {
                setHovered({ comp: orig, ...getTooltipPos(e.clientX, e.clientY) });
              }}
              onMouseMove={e => {
                setHovered(h => h ? { ...h, ...getTooltipPos(e.clientX, e.clientY) } : null);
              }}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 bg-gray-900/95 border border-gray-600 rounded px-2 py-1.5 text-xs shadow-lg"
          style={{
            left: hovered.x + 14,
            top: hovered.y - 8,
            transform: hovered.x > 420 ? 'translateX(-110%)' : undefined,
          }}
        >
          <div className="font-semibold text-white whitespace-nowrap">{componentLabel(hovered.comp)}</div>
          {hovered.comp.owner && (
            <div className="text-gray-400 whitespace-nowrap">owner: <span className="text-gray-200">{hovered.comp.owner}</span></div>
          )}
          {hovered.comp.state === 'wreck' && <div className="text-orange-400">wreck</div>}
          {hovered.comp.knownToPlayer && <div className="text-yellow-400">known to player</div>}
          <div className="text-gray-500 font-mono whitespace-nowrap mt-0.5">
            {(hovered.comp.x / 1000).toFixed(1)} / {(hovered.comp.y / 1000).toFixed(1)} / {(hovered.comp.z / 1000).toFixed(1)} km
          </div>
        </div>
      )}
      </div>

      {/* Selected component info */}
      {selected ? (
        <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm">
          <div className="font-semibold text-white">{componentLabel(selected)}</div>
          <div className="text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
            <span>owner: <span className="text-gray-200">{selected.owner || '—'}</span></span>
            <span>type: <span className="text-gray-200">{selected.type}</span></span>
            {selected.state === 'wreck' && <span className="text-orange-400">wreck</span>}
            {selected.knownToPlayer && <span className="text-yellow-400">known to player</span>}
          </div>
          <div className="text-gray-500 text-xs mt-1 font-mono">
            x: {(selected.x / 1000).toFixed(1)} km &nbsp;
            y: {(selected.y / 1000).toFixed(1)} km &nbsp;
            z: {(selected.z / 1000).toFixed(1)} km
          </div>
          {selected.spawnTime != null && (
            <div className="text-gray-600 text-xs mt-0.5">spawn: {selected.spawnTime.toLocaleString()}s game-time</div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-600 text-center">Click a point to inspect · Hover for details · Drag to rotate · Scroll to zoom</p>
      )}
    </div>
  );
}
