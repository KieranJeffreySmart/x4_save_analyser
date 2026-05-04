import React, { useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SaveData } from '../types';
import { factions, getFactionColor, getFactionLabel } from '../data/factions';

interface StatsPanelProps { saveData: SaveData }

export default function StatsPanel({ saveData }: StatsPanelProps) {
  const { sectorsByFaction, stationsByFaction, shipsByOwner, shipsByClass } = useMemo(() => {
    // Sector ownership
    const sectorOwner = new Map<string, number>();
    for (const s of saveData.sectors) {
      const k = s.owner || 'ownerless';
      sectorOwner.set(k, (sectorOwner.get(k) ?? 0) + 1);
    }

    // Stations by owner
    const stationOwner = new Map<string, number>();
    for (const s of saveData.stations) {
      if (s.type === 'station') {
        const k = s.owner || 'ownerless';
        stationOwner.set(k, (stationOwner.get(k) ?? 0) + 1);
      }
    }

    // Ships by owner
    const shipOwner = new Map<string, number>();
    for (const s of saveData.ships) {
      const k = s.owner || 'ownerless';
      shipOwner.set(k, (shipOwner.get(k) ?? 0) + 1);
    }

    // Ships by class
    const shipClass = new Map<string, number>();
    for (const s of saveData.ships) {
      shipClass.set(s.type, (shipClass.get(s.type) ?? 0) + 1);
    }

    const toChartData = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([key, value]) => ({
          key,
          name: getFactionLabel(key),
          value,
          color: getFactionColor(key),
        }))
        .sort((a, b) => b.value - a.value);

    return {
      sectorsByFaction:  toChartData(sectorOwner),
      stationsByFaction: toChartData(stationOwner),
      shipsByOwner:      toChartData(shipOwner),
      shipsByClass: [...shipClass.entries()]
        .map(([key, value]) => ({ key, name: key.replace('ship_', ''), value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [saveData]);

  const dataVaultCount = saveData.stations.filter(s => s.type === 'datavault').length;
  const lockboxCount   = (saveData.lockboxes ?? []).length;
  const erlkingCount   = saveData.stations.filter(s => s.stationType === 'erlking_vault').length;

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Sectors" value={saveData.sectors.length} />
        <StatCard label="Stations" value={saveData.stations.filter(s => s.type === 'station').length} />
        <StatCard label="Notable ships" value={saveData.ships.length} />
        <StatCard label="Data vaults" value={dataVaultCount} />
        {erlkingCount > 0 && <StatCard label="Erlking vaults" value={erlkingCount} />}
        {lockboxCount > 0 && <StatCard label="Lockboxes" value={lockboxCount} />}
      </div>

      {/* Sector ownership */}
      <ChartSection title="Sectors by faction">
        <FactionBarChart data={sectorsByFaction} />
      </ChartSection>

      {/* Stations by owner */}
      <ChartSection title="Stations by owner">
        <FactionBarChart data={stationsByFaction} />
      </ChartSection>

      {/* Two columns: ships by owner + by class */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartSection title="Notable ships by owner">
          <FactionBarChart data={shipsByOwner} />
        </ChartSection>

        <ChartSection title="Notable ships by class">
          <SimpleBarChart
            data={shipsByClass.map(d => ({ name: d.name.toUpperCase(), value: d.value }))}
            color="#ffff44"
          />
        </ChartSection>
      </div>

      {/* Faction colour legend */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Faction colours</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {factions
            .filter(f => f.color !== '#5b5b5b')
            .map(f => (
              <div key={f.key} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: f.color }} />
                <span className="text-gray-300">{f.label}</span>
              </div>
            ))
          }
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
      <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </section>
  );
}

interface FactionEntry { key: string; name: string; value: number; color: string }

function FactionBarChart({ data }: { data: FactionEntry[] }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ left: 140, right: 40, top: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={135}
        />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color: '#9ca3af' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>
          {data.map(d => <Cell key={d.key} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SimpleBarChart({ data, color }: { data: { name: string; value: number }[]; color: string }) {
  if (data.length === 0) return <p className="text-gray-600 text-sm">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ left: 60, right: 40, top: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color: '#9ca3af' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
