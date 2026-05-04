import React, { useState } from 'react';
import { SaveData } from '../types';

interface FilePickerProps {
  onLoad: (data: SaveData) => void;
  onError: (msg: string) => void;
}

export default function FilePicker({ onLoad, onError }: FilePickerProps) {
  const [loading, setLoading] = useState(false);

  const loadViaDirectoryPicker = async () => {
    try {
      // File System Access API — Chrome/Edge
      const dir = await (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
        .showDirectoryPicker?.();
      if (!dir) { onError('Directory picker not supported in this browser.'); return; }

      setLoading(true);
      const readJson = async (name: string) => {
        const fh = await dir.getFileHandle(name);
        const file = await fh.getFile();
        return JSON.parse(await file.text());
      };
      const readOptionalJson = async (name: string) => {
        try {
          const fh = await dir.getFileHandle(name);
          const file = await fh.getFile();
          return JSON.parse(await file.text());
        } catch { return []; }
      };

      const [sectors, stations, ships, gates, lockboxes] = await Promise.all([
        readJson('sectors.json'),
        readJson('stations.json'),
        readJson('ships.json'),
        readJson('gates.json'),
        readOptionalJson('lockboxes.json'),
      ]);

      onLoad({ sectors, stations, ships, gates, lockboxes });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if ((e as { name?: string }).name !== 'AbortError') onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadViaFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);

    const fileMap = new Map<string, File>();
    for (const f of Array.from(files)) fileMap.set(f.name, f);

    const readJson = (name: string): Promise<unknown> => {
      const f = fileMap.get(name);
      if (!f) return Promise.reject(new Error(`Missing file: ${name}`));
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
        onLoad({
          sectors: sectors as SaveData['sectors'],
          stations: stations as SaveData['stations'],
          ships: ships as SaveData['ships'],
          gates: gates as SaveData['gates'],
          lockboxes: lockboxes as SaveData['lockboxes'],
        })
      )
      .catch(err => onError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  const hasDirectoryPicker = typeof (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">X4 Save Analyser</h1>
        <p className="text-gray-400 text-sm max-w-sm">
          Load the JSON files produced by the WPF app's <em>Extract Universe</em> step.
        </p>
      </div>

      {hasDirectoryPicker ? (
        <button
          onClick={loadViaDirectoryPicker}
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-3 transition-colors"
        >
          {loading ? 'Loading…' : 'Open save folder…'}
        </button>
      ) : null}

      <div className={hasDirectoryPicker ? 'text-gray-600 text-xs' : ''}>
        {hasDirectoryPicker && <span>or </span>}
        <label className="cursor-pointer text-blue-400 hover:text-blue-300 underline underline-offset-2 text-sm">
          select the four JSON files manually
          <input
            type="file"
            multiple
            accept=".json"
            className="hidden"
            onChange={loadViaFileInput}
          />
        </label>
      </div>

      <p className="text-gray-700 text-xs max-w-xs">
        Expected files: sectors.json · stations.json · ships.json · gates.json
      </p>
    </div>
  );
}
