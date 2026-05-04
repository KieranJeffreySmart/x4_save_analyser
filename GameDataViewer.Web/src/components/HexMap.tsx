import React, { useCallback, useMemo, useRef, useState } from 'react';
import { HexCell, SaveData } from '../types';
import { sectorPositions } from '../data/sectorPositions';
import { getFactionColor, HOSTILE } from '../data/factions';

// ── Hex geometry ──────────────────────────────────────────────────────────────

const SQRT3 = Math.sqrt(3);
const BASE_R = 55; // circumradius in SVG units (flat-top hexagons)

/** Pixel centre for a grid cell at (gridX, gridY). Same formula as hexmap.js. */
function hexCenter(gridX: number, gridY: number, r: number): [number, number] {
  const col = 20 + gridX;
  const x = r * col * 1.5;
  const y = r * (10 + gridY) * SQRT3 + (col % 2 === 1 ? (r * SQRT3) / 2 : 0);
  return [x, y];
}

/** Offset from the parent cell centre for a sub-hex at position 2–7. */
function subHexOffset(clusterPos: number, r: number): [number, number] {
  const h = r / 2; // sub-hex radius
  switch (clusterPos) {
    case 2: return [h / 2, -(h * SQRT3) / 2];
    case 3: return [h, 0];
    case 4: return [h / 2, (h * SQRT3) / 2];
    case 5: return [-h / 2, (h * SQRT3) / 2];
    case 6: return [-h, 0];
    case 7: return [-h / 2, -(h * SQRT3) / 2];
    default: return [0, 0];
  }
}

/** SVG path for a flat-top hexagon centred at (cx, cy) with circumradius r. */
function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i; // 0°, 60°, 120°, …
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(' ') + ' Z';
}

/** Top edge midpoints for the datavault indicator line. */
function hexTopLine(cx: number, cy: number, r: number): string {
  const a1 = (Math.PI / 3) * 4; // 240°  (upper-left vertex)
  const a2 = (Math.PI / 3) * 5; // 300°  (upper-right vertex)
  return `${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}`;
}

/** Bottom edge midpoints for the ownerless-ship indicator line. */
function hexBottomLine(cx: number, cy: number, r: number): string {
  const a1 = (Math.PI / 3) * 1; // 60°  (lower-right vertex)
  const a2 = (Math.PI / 3) * 2; // 120° (lower-left vertex)
  return `${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}`;
}

// ── ViewBox pan/zoom ──────────────────────────────────────────────────────────

interface ViewBox { x: number; y: number; w: number; h: number }

// ── Component ─────────────────────────────────────────────────────────────────

interface HexMapProps {
  saveData: SaveData | null;
  selectedMacro: string | null;
  onSectorClick: (macro: string) => void;
  onSectorDoubleClick?: (macro: string) => void;
}

export default function HexMap({ saveData, selectedMacro, onSectorClick, onSectorDoubleClick }: HexMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; vb: ViewBox } | null>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, w: 2800, h: 1500 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; cell: HexCell } | null>(null);

  // Build cells once from static positions, enrich with live save data
  const cells = useMemo<HexCell[]>(() => {
    const sectorMap = new Map(saveData?.sectors.map(s => [s.macro, s]) ?? []);
    const shipMap = new Map<string, { ownerless: boolean; enemy: boolean }>();

    for (const ship of saveData?.ships ?? []) {
      const entry = shipMap.get(ship.sectorMacro) ?? { ownerless: false, enemy: false };
      if (ship.owner === 'ownerless') entry.ownerless = true;
      if (HOSTILE.has(ship.owner)) entry.enemy = true;
      shipMap.set(ship.sectorMacro, entry);
    }

    const datavaultSectors = new Set(
      (saveData?.stations ?? []).filter(s => s.type === 'datavault').map(s => s.sectorMacro)
    );

    const hostileStationSectors = new Set(
      (saveData?.stations ?? []).filter(s => HOSTILE.has(s.owner)).map(s => s.sectorMacro)
    );

    return sectorPositions.map(pos => {
      const [parentX, parentY] = hexCenter(pos.gridX, pos.gridY, BASE_R);
      let cx = parentX;
      let cy = parentY;
      let radius = BASE_R;

      if (pos.clusterPos > 1) {
        radius = BASE_R / 2;
        const [ox, oy] = subHexOffset(pos.clusterPos, BASE_R);
        cx += ox;
        cy += oy;
      }

      const sector = sectorMap.get(pos.macro);
      const owner = sector?.owner ?? '';
      const ships = shipMap.get(pos.macro);

      return {
        macro: pos.macro,
        name: pos.name,
        cx,
        cy,
        radius,
        clusterPos: pos.clusterPos,
        owner,
        color: getFactionColor(owner),
        hasDatavault: datavaultSectors.has(pos.macro),
        hasOwnerlessShip: ships?.ownerless ?? false,
        hasEnemy:
          ships?.enemy ??
          hostileStationSectors.has(pos.macro) ??
          (!!owner && HOSTILE.has(owner)),
        componentCount: sector?.componentCount ?? 0,
      } satisfies HexCell;
    });
  }, [saveData]);

  // ── Pan / zoom event handlers ─────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, vb: viewBox };
    e.preventDefault();
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = drag.vb.w / rect.width;
    const scaleY = drag.vb.h / rect.height;
    setViewBox({
      ...drag.vb,
      x: drag.vb.x - (e.clientX - drag.sx) * scaleX,
      y: drag.vb.y - (e.clientY - drag.sy) * scaleY,
    });
  }, []);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
    setViewBox(vb => ({
      x: mx - (mx - vb.x) * factor,
      y: my - (my - vb.y) * factor,
      w: vb.w * factor,
      h: vb.h * factor,
    }));
  }, [viewBox]);

  const handleHexMouseEnter = useCallback((e: React.MouseEvent, cell: HexCell) => {
    setTooltip({ x: e.clientX, y: e.clientY, cell });
  }, []);

  const handleHexMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null);
  }, []);

  const handleHexMouseLeave = useCallback(() => { setTooltip(null); }, []);

  const handleHexClick = useCallback((e: React.MouseEvent, macro: string) => {
    if (e.detail === 2 && onSectorDoubleClick) {
      onSectorDoubleClick(macro);
    } else if (e.detail === 1) {
      onSectorClick(macro);
    }
  }, [onSectorClick, onSectorDoubleClick]);

  const vbStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

  return (
    <div className="relative w-full h-full hex-map-container">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={vbStr}
        preserveAspectRatio="xMidYMid meet"
        style={{ background: '#05050f' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {cells.map(cell => {
          const isSelected = cell.macro === selectedMacro;
          return (
            <g
              key={cell.macro}
              onClick={e => handleHexClick(e, cell.macro)}
              onMouseEnter={e => handleHexMouseEnter(e, cell)}
              onMouseMove={handleHexMouseMove}
              onMouseLeave={handleHexMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              {/* Fill */}
              <path
                d={hexPath(cell.cx, cell.cy, cell.radius)}
                fill={cell.color}
                fillOpacity={saveData ? (cell.owner ? 0.28 : 0.06) : 0.06}
                stroke={isSelected ? 'white' : cell.color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.7}
              />
              {/* Enemy presence: red inner ring */}
              {cell.hasEnemy && (
                <path
                  d={hexPath(cell.cx, cell.cy, cell.radius - 4)}
                  fill="none"
                  stroke="#ff2222"
                  strokeWidth={1.5}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Data vault: purple top edge */}
              {cell.hasDatavault && (
                <polyline
                  points={hexTopLine(cell.cx, cell.cy, cell.radius - 4)}
                  fill="none"
                  stroke="#e200ff"
                  strokeWidth={2}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Ownerless ship: yellow bottom edge */}
              {cell.hasOwnerlessShip && (
                <polyline
                  points={hexBottomLine(cell.cx, cell.cy, cell.radius - 4)}
                  fill="none"
                  stroke="#ffff00"
                  strokeWidth={2}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Sector name label — truncated to 30 chars, font-size shrinks to fit */}
              {(() => {
                const raw = cell.name.length > 30 ? cell.name.slice(0, 29) + '…' : cell.name;
                // Flat-to-flat width of the hex = radius * sqrt(3). Allow 85% of that.
                const maxW = cell.radius * Math.sqrt(3) * 0.85;
                // Estimate: avg char ≈ 0.58× font-size; cap at radius * 0.26 for short names
                const fs = Math.min(cell.radius * 0.26, maxW / (raw.length * 0.58));
                return (
                  <text
                    x={cell.cx}
                    y={cell.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fs}
                    fontWeight="600"
                    fill="white"
                    fillOpacity={0.85}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {raw}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 text-xs text-gray-400 space-y-1 bg-black/60 rounded px-2 py-1.5">
        <div className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-[#ff2222]" /> Enemy presence</div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-[#e200ff]" /> Data vault</div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-[#ffff00]" /> Ownerless ship</div>
        <div className="mt-1 text-gray-500">Scroll to zoom · Drag to pan</div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-sm shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="font-semibold">{tooltip.cell.name}</div>
          <div className="text-gray-400 text-xs mt-0.5">
            <span style={{ color: tooltip.cell.color }}>⬡</span>
            {' '}{tooltip.cell.owner || 'unclaimed'}
            {tooltip.cell.componentCount > 0 && <span className="ml-2">{tooltip.cell.componentCount} components</span>}
          </div>
          {(tooltip.cell.hasDatavault || tooltip.cell.hasOwnerlessShip || tooltip.cell.hasEnemy) && (
            <div className="flex gap-2 mt-1 text-xs">
              {tooltip.cell.hasDatavault && <span className="text-purple-400">◆ vault</span>}
              {tooltip.cell.hasOwnerlessShip && <span className="text-yellow-400">◆ ownerless</span>}
              {tooltip.cell.hasEnemy && <span className="text-red-400">◆ hostile</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
