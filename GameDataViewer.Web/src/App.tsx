import { useState } from 'react';
import { SaveData } from './types';
import FilePicker from './components/FilePicker';
import HexMap from './components/HexMap';
import SectorPanel from './components/SectorPanel';
import StatsPanel from './components/StatsPanel';

type Tab = 'map' | 'stats';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('map');
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleLoad = (data: SaveData) => {
    setSaveData(data);
    setError(null);
    setSelectedMacro(null);
    setExpanded(false);
  };

  const handleSectorClick = (macro: string) => {
    setSelectedMacro(prev => (prev === macro ? null : macro));
    setExpanded(false);
  };

  const handleSectorDoubleClick = (macro: string) => {
    setSelectedMacro(macro);
    setExpanded(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 text-gray-100">

      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-gray-800 bg-gray-950 flex-shrink-0">
        <span className="font-bold text-gray-100 text-sm tracking-wide select-none">X4 Save Analyser</span>

        {saveData && (
          <nav className="flex gap-1">
            {(['map', 'stats'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {t === 'map' ? 'Galaxy Map' : 'Statistics'}
              </button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {saveData && (
            <span className="text-xs text-gray-600">
              {saveData.sectors.length} sectors · {saveData.stations.length} stations · {saveData.ships.length} ships · {saveData.lockboxes.length} lockboxes
            </span>
          )}
          <label className="cursor-pointer text-xs text-blue-500 hover:text-blue-400 transition-colors">
            {saveData ? 'Load different save…' : 'Load save'}
            <input
              type="file"
              multiple
              accept=".json"
              className="hidden"
              onChange={e => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const fileMap = new Map<string, File>();
                for (const f of Array.from(files)) fileMap.set(f.name, f);
                const readJson = (name: string): Promise<unknown> => {
                  const f = fileMap.get(name);
                  if (!f) return Promise.reject(new Error(`Missing: ${name}`));
                  return f.text().then(t => JSON.parse(t));
                };
                const readOptionalJson = (name: string): Promise<unknown> => {
                  const f = fileMap.get(name);
                  if (!f) return Promise.resolve([]);
                  return f.text().then(t => JSON.parse(t));
                };
                Promise.all([
                  readJson('sectors.json'),
                  readJson('stations.json'),
                  readJson('ships.json'),
                  readJson('gates.json'),
                  readOptionalJson('lockboxes.json'),
                ])
                  .then(([sectors, stations, ships, gates, lockboxes]) =>
                    handleLoad({
                      sectors: sectors as SaveData['sectors'],
                      stations: stations as SaveData['stations'],
                      ships: ships as SaveData['ships'],
                      gates: gates as SaveData['gates'],
                      lockboxes: lockboxes as SaveData['lockboxes'],
                    })
                  )
                  .catch(err => setError(err instanceof Error ? err.message : String(err)));
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/60 border-b border-red-800 px-4 py-2 text-red-300 text-sm flex items-center gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">×</button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {!saveData ? (
          <div className="h-full flex items-center justify-center">
            <FilePicker onLoad={handleLoad} onError={setError} />
          </div>
        ) : tab === 'map' ? (
          <div className="flex h-full relative">

            {/* HexMap — hidden when expanded, takes remaining width otherwise */}
            {!expanded && (
              <div className="flex-1 min-w-0 h-full">
                <HexMap
                  saveData={saveData}
                  selectedMacro={selectedMacro}
                  onSectorClick={handleSectorClick}
                  onSectorDoubleClick={handleSectorDoubleClick}
                />
              </div>
            )}

            {/* Sector detail panel */}
            {selectedMacro && (
              <div className={`h-full overflow-hidden ${expanded ? 'flex-1' : 'w-[760px] flex-shrink-0'}`}>
                <SectorPanel
                  sectorMacro={selectedMacro}
                  saveData={saveData}
                  expanded={expanded}
                  onToggleExpanded={() => setExpanded(e => !e)}
                  onClose={() => { setSelectedMacro(null); setExpanded(false); }}
                />
              </div>
            )}

            {/* Mini HexMap overlay — visible only in expanded mode */}
            {expanded && (
              <div
                className="absolute bottom-4 left-4 z-10 w-72 h-48 rounded-lg border border-gray-700 overflow-hidden cursor-pointer shadow-2xl group"
                onClick={() => setExpanded(false)}
                title="Click to return to map view"
              >
                <div className="pointer-events-none w-full h-full">
                  <HexMap
                    saveData={saveData}
                    selectedMacro={selectedMacro}
                    onSectorClick={() => {}}
                  />
                </div>
                <div className="absolute inset-0 flex items-end justify-center pb-1.5 group-hover:bg-white/5 transition-colors">
                  <span className="text-xs text-gray-400 bg-black/70 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    return to map
                  </span>
                </div>
              </div>
            )}

          </div>
        ) : (
          <StatsPanel saveData={saveData} />
        )}
      </main>
    </div>
  );
}
