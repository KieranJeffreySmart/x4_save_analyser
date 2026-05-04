# WIP — Work In Progress

## Current Status

- **Game data unpacking** — extracts XML/JS/CSS/HTML files from X4 `.cat`/`.dat` archives for the base game and all DLCs
- **Save file cleaning** — strips full save files down to just the `<universe>` element for faster loading
- **Save data analysis (C#)** — `SaveDataAnalyser` walks the extracted universe XML and writes `sectors.json`, `stations.json`, `ships.json`, `gates.json` alongside `universe.xml`; both steps run automatically from the Extract Universe tab
- **React web app** — replaces the old `index.html` D3/HTML app; built with Vite + React + TypeScript + Tailwind CSS + Recharts + D3 v7; located in `webapp/`
  - Galaxy hex map with pan/zoom, faction colours, enemy/datavault/ownerless indicators, hover tooltip, click to select sector
  - Sector detail panel: 3D scatter plot, by-type/by-owner summary, full component table with click-to-highlight linkage to the plot
  - Statistics tab: summary cards, horizontal bar charts for sectors/stations/ships by faction
  - File System Access API file picker (Chrome/Edge) with manual fallback
- **Universe hex map** (old `index.html`) — still present for reference; has known bugs (see below)
- **Multi-sector support** — clusters with multiple sectors rendered as sub-hexes in both the old and new hex maps


## In Progress

*Nothing actively in progress — pick from To Do below.*

## To Do

### Web App (React — `webapp/`)
- [ ] **Scatter plot positions still look incorrect** — zone offsets (static game-data base + runtime save offset) and gate positions (from zones XMLs) are now wired in the C# extractor; needs re-extraction and visual verification after re-running Extract Universe with game data configured
- [ ] Add show/hide toggles per component type (stations, ships, gates, datavaults, highways) on the scatter plot
- [ ] Add a reset-orientation button to the 3D scatter plot
- [ ] Add a hover tooltip on scatter plot dots (currently only click-to-select works)
- [ ] Ships are filtered to player/Kha'ak/Yaki/Xenon/ownerless — consider making this configurable
- [ ] Statistics tab: differentiate hostile factions (Kha'ak/Xenon/Yaki/criminal/etc.) with distinct colour shades rather than all sharing red
- [ ] Consider persisting the last-loaded file path in `localStorage` so reopening the app reloads automatically

### C# Desktop App (`UnpackGameData.Desktop`)
- [ ] Test against the real X4 installation at `D:\SteamLibrary\steamapps\common\X4 Foundations`
- [ ] Test universe extraction + analysis against real gzip saves
- [ ] Verify scatter plot coordinates are correct after re-extraction with game data sector/zone XMLs loaded
- [ ] Consider a **Batch Universe Extract** mode — extract all saves in one go
- [ ] Package as a single-file self-contained executable

### Game data unpacking (Python scripts)
> **Note:** The C# `ArchiveExtractor` in `UnpackGameData.Core` has already addressed progress output, file handle safety, and `.dat` validation.
- [ ] `extract.bat` has hardcoded absolute paths — make them relative
- [x] ~~Add progress output~~ — done in C# port
- [x] ~~Fix unclosed file handle~~ — done in C# port
- [x] ~~Add .dat validation~~ — done in C# port

### Save file cleaning (Python scripts)
> **Note:** The C# `UniverseExtractor` in `UnpackGameData.Core` has addressed all of the items below.
- [ ] `extract-save-file.bat` has hardcoded absolute paths — make them relative
- [x] ~~Add pretty-print option~~ — done in C# port
- [x] ~~Add source file validation~~ — done in C# port

### Old HTML visualiser (`index.html`)
> The React web app (`webapp/`) is the active replacement. These remain for reference.
- [ ] `initSectorData` is called twice in `index.html` — the second call (for `zones.xml`) should call `initZoneData`; gate positions not loading correctly
- [ ] `zoneFilter` and `stationFilter` arrays in `x4_save_file_analysis.js` appear unused
- [ ] Several commented-out bar/list chart blocks remain in `index.html`


## Done

- Updated README with full project summary, script descriptions, data directory layout, and getting started guide
- Created `WIP.md` and `CHAT_CONTEXT.md` for cross-session continuity
- **C# solution** (`x4_save_analyser.sln`) with three projects: `UnpackGameData.Core`, `UnpackGameData` (console), `UnpackGameData.Desktop` (WPF MVVM)
- Full MVVM desktop app: Settings tab, Unpack Archives tab, Extract Universe tab
- Settings persistence to `%AppData%\X4SaveAnalyser\settings.json`
- **`SaveDataAnalyser.cs`** added to `UnpackGameData.Core`:
  - Mirrors `x4_save_file_analysis.js` logic in C# — walks galaxy→cluster→sector→zone→component
  - Writes `sectors.json`, `stations.json`, `ships.json`, `gates.json`
  - Ship filter mirrors JS: player/khaak/yaki/xenon/ownerless; hostile factions L/XL only
  - Zone position = static game-data offset (from `sectors/*.xml`) + runtime save-file offset — mirrors JS `zonePositionIndex`
  - Gate position = zone base + static gate offset (from `zones/*.xml`) — mirrors JS `gatePositionIndex` / `initZoneData`
  - Accepts optional `gameDataSectorsDir`; zones dir is inferred as sibling `zones/` folder
- **Extract Universe tab merged** — single operation now runs `UniverseExtractor` then `SaveDataAnalyser`; outputs `universe.xml` + JSON files to same folder
- **React web app scaffolded and implemented** (`webapp/` — Vite 5 + React 18 + TypeScript 5.4 + Tailwind CSS 3.4 + Recharts 2.13 + D3 v7):
  - `FilePicker.tsx` — File System Access API + manual fallback
  - `HexMap.tsx` — SVG hex grid, pan/zoom, faction colours, indicators, tooltip; sector labels truncate at 30 chars with dynamic font-size
  - `ScatterPlot.tsx` — 3D perspective plot, drag-rotate, scroll-zoom, real-world km axis ticks, axis show/hide toggle; selection state lifted to parent
  - `SectorPanel.tsx` — detail panel with scatter plot, by-type/owner summaries, full component table; click table row to highlight dot on plot
  - `StatsPanel.tsx` — summary cards + horizontal Recharts bar charts by faction
  - `factions.ts` — all X4 faction colour/label mappings
  - `sectorPositions.ts` — static hex grid positions for all 151 sectors
  - All TypeScript compile errors resolved

---

## C# Desktop App — `UnpackGameData.Desktop`

A WPF desktop application replacing the Python scripts for game data extraction and save file processing.

### Completed

- **`UnpackGameData.Core` — `ArchiveExtractor`**
  - Extracts files from X4 `.cat`/`.dat` archive pairs into a destination directory
  - Supports regex filtering (default: `xml|xsd|html|js|css|lua`)
  - Recursively searches subdirectories for `.cat` files (`SearchOption.AllDirectories`)
  - Mirrors the subfolder structure of the source into the output
  - Progress reporting with extracted/skipped counts per archive; async with cancellation

- **`UnpackGameData.Core` — `UniverseExtractor`**
  - Streams through an X4 save file to find and extract the `<universe>` element
  - Detects gzip compression via magic bytes (`1F 8B`)
  - Wraps output in `<savegame>` and writes to a specified output path

- **`UnpackGameData.Core` — `SaveDataAnalyser`**
  - Accepts `universePath`, `outputDir`, optional `gameDataSectorsDir`
  - Builds `zonePositionIndex` from `sectors/*.xml` (static zone offsets within sectors)
  - Builds `gatePositionIndex` from `zones/*.xml` (static gate offsets within zones)
  - Final component position = static zone offset + runtime zone offset + component own offset (or gate offset)
  - Writes `sectors.json`, `stations.json`, `ships.json`, `gates.json`

- **`UnpackGameData.Desktop` — WPF UI (MVVM)**
  - **Settings tab**: configure game folder, save folder, output folder; persists to `%AppData%\X4SaveAnalyser\settings.json`
  - **Unpack Archives tab**: progress log, Cancel button
  - **Extract Universe tab**: file picker → auto-derived output path → runs UniverseExtractor + SaveDataAnalyser in sequence
  - Game data sectors dir resolved from settings at extraction time: `{outputFolder}\game\{version}\maps\xu_ep2_universe\sectors\`

### To Do — Desktop App

- [ ] Test against real game installation and saves
- [ ] Verify scatter plot positions after re-extraction
- [ ] Batch extract mode
- [ ] Single-file self-contained publish

  - Progress reporting with extracted/skipped counts per archive
  - Async with cancellation support

- **`UnpackGameData.Core` — `UniverseExtractor`**
  - Streams through an X4 save file to find and extract the `<universe>` element
  - Detects gzip compression via magic bytes (`1F 8B`) — handles both `.xml.gz` and plain `.xml` saves without relying on file extension
  - Wraps output in `<savegame>` and writes to a specified output path
  - Progress reporting; async with cancellation support

- **`UnpackGameData.Desktop` — WPF UI (MVVM)**
  - **Settings tab**: configure game folder, save folder, and root output folder; persists to `%AppData%\X4SaveAnalyser\settings.json`; auto-detects and displays game version from `version.dat`
  - **Unpack Archives tab**: shows game folder and auto-derived output path (`{output}/game/{version}`) as read-only display labels; regex filter in Advanced options; scrollable log; Cancel button
  - **Extract Universe tab**: single **Select file…** button opening in the configured save folder; auto-derived output path displayed as a read-only label; Extract enabled only once a valid file is chosen
  - **MVVM architecture**: `ViewModelBase`, `RelayCommand`, `SettingsViewModel`, `ArchiveExtractorViewModel`, `UniverseExtractorViewModel`, `MainViewModel`; each tab is a separate `UserControl` in `Views/`; `MainWindow` is a 10-line shell; dialogs handled in view code-behind (pragmatic MVVM)
  - Settings saved event propagates to both extractor VMs via `MainViewModel`

### To Do — Desktop App

- [ ] Test against the real X4 installation at `D:\SteamLibrary\steamapps\common\X4 Foundations`
- [ ] Test universe extraction against real gzip saves in `C:\Users\KieranSmart\OneDrive\Documents\Egosoft\X4\99208493\save`
- [ ] Consider a **Batch Universe Extract** mode — extract universe from all saves in the save folder in one go
- [ ] Add a **diff / compare** view between two extracted universe files to show what changed between saves
- [ ] Package as a single-file self-contained executable for distribution
- [ ] Add `IsBusy` indicator (spinner or progress bar) to the tab header or status bar so long operations are visually obvious
- [ ] Disable tab switching while an extraction is running (currently the tab control is disabled wholesale — consider only disabling the other tabs)
