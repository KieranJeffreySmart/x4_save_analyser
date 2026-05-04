# WIP — Work In Progress

## Current Status

- **Game data unpacking** — extracts XML/JS/CSS/HTML files from X4 `.cat`/`.dat` archives for the base game and all DLCs
- **Save file cleaning** — strips full save files down to just the `<universe>` element for faster loading
- **Save data analysis (C#)** — `SaveDataAnalyser` walks the extracted universe XML and writes `sectors.json`, `stations.json`, `ships.json`, `gates.json`, `lockboxes.json` alongside `universe.xml`; sector/zone/gate position data aggregated across core game + all 4 DLCs; captures `name`, `state`, `knownToPlayer`, `spawnTime` on all components; both steps run automatically from the Extract Universe tab
- **React web app** — built with Vite + React + TypeScript + Tailwind CSS + Recharts + D3 v7; located in `GameDataViewer.Web/`
  - Galaxy hex map with pan/zoom, faction colours, enemy/datavault/ownerless indicators, hover tooltip, single-click to select sector, double-click to enter expanded plot view
  - Sector detail panel: 3D scatter plot with per-type show/hide toggles, reset-orientation button, hover tooltip; by-type/by-owner summary; full component table with click-to-highlight linkage to the plot; name/wreck/known-to-player display
  - **Expanded plot view** — double-clicking a hex (or pressing ⤢) fills the screen with the scatter plot; details shift to a right panel; hex map shrinks to a mini overlay in the bottom-left corner; clicking the overlay returns to normal mode
  - Statistics tab: summary cards (sectors, stations, ships, data vaults, erlking vaults, lockboxes), horizontal bar charts for sectors/stations/ships by faction
  - File System Access API file picker (Chrome/Edge) with manual fallback; loads `sectors.json`, `stations.json`, `ships.json`, `gates.json`, `lockboxes.json` (lockboxes optional)
  - All hostile factions use red (`#ff3333`); colours configurable in `factions.ts`
- **Multi-sector support** — clusters with multiple sectors rendered as sub-hexes in the hex map


## In Progress

*Nothing actively in progress — pick from To Do below.*

## To Do

### Web App (React — `GameDataViewer.Web/`)
- [ ] Ships are filtered to player/Kha'ak/Yaki/Xenon/ownerless — consider making this configurable
- [ ] Consider persisting the last-loaded file path in `localStorage` so reopening the app reloads automatically

### C# Desktop App (`UnpackGameData.Desktop`)
- [ ] Test against the real X4 installation at `D:\SteamLibrary\steamapps\common\X4 Foundations`
- [ ] Test universe extraction + analysis against real gzip saves
- [x] ~~Verify scatter plot coordinates are correct~~ — fixed; `SaveDataAnalyser` now aggregates core + all DLC sector/zone files
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

## Done

- Updated README with full project summary, script descriptions, data directory layout, and getting started guide
- Created `WIP.md` and `CHAT_CONTEXT.md` for cross-session continuity
- **Global `update-wip-docs` skill** created at `C:\Users\KieranSmart\.copilot\skills\update-wip-docs\SKILL.md` — personal skill available in all workspaces; procedure: update WIP.md → update CHAT_CONTEXT.md → consistency review
- **Web app new-data fields displayed** (Session 6) — `types.ts` extended with `name`, `state`, `knownToPlayer`, `spawnTime` on `ComponentRecord` and `lockboxes` on `SaveData`; all 5 JSON files loaded; `ScatterPlot.tsx` shows per-type toggles, reset-orientation button, hover tooltip, wreck opacity, hostile faction colors; `SectorPanel.tsx` includes lockboxes, name/wreck/known-to-player display, Erlking Vault labelling; `StatsPanel.tsx` adds lockbox + erlking vault stat cards
- **Expanded plot view** (Session 6) — double-clicking a hex enters full-screen scatter plot mode; sector details shift to a right-side panel; hex map becomes a mini overlay (bottom-left); clicking overlay returns to normal; ⤢/⤡ toggle button in SectorPanel header
- **Hostile faction colours unified to red** (Session 6) — all factions in the `HOSTILE` set (`khaak`, `xenon`, `yaki`, `scaleplate`, `criminal`, `smuggler`, `buccaneers`) use `#ff3333`; colours remain configurable in `factions.ts`
- **Scatter plot positions fixed** — `SaveDataAnalyser` now recursively searches the full game data output root for all `*sectors*.xml` and `*zones*.xml` files under any `xu_ep2_universe` path, aggregating core game + all 4 DLC files (Boron, Split/CoH, Terran, Pirate); previously only the core `sectors/` subdirectory was searched, so all DLC-sector components had zero zone offsets and appeared at wrong positions
- **C# solution** (`x4_save_analyser.sln`) with three projects: `UnpackGameData.Core`, `UnpackGameData` (console), `UnpackGameData.Desktop` (WPF MVVM)
- Full MVVM desktop app: Settings tab, Unpack Archives tab, Extract Universe tab
- Settings persistence to `%AppData%\X4SaveAnalyser\settings.json`
- **`SaveDataAnalyser.cs`** added to `UnpackGameData.Core`:
  - Mirrors `x4_save_file_analysis.js` / `x4-save-miner.py` logic in C# — walks galaxy→cluster→sector→zone→component
  - Writes `sectors.json`, `stations.json`, `ships.json`, `gates.json`, `lockboxes.json`
  - Ship filter mirrors JS: player/khaak/yaki/xenon/ownerless; hostile factions L/XL only
  - Zone position = static game-data offset (from `sectors/*.xml`) + runtime save-file offset — mirrors JS `zonePositionIndex`
  - Gate position = zone base + static gate offset (from `zones/*.xml`) — mirrors JS `gatePositionIndex` / `initZoneData`
  - Accepts optional `gameDataRoot`; recursively searches all `*sectors*.xml` / `*zones*.xml` under `xu_ep2_universe` in any DLC subfolder
  - `ComponentRecord` fields: `type`, `id`, `macro`, `code`, `owner`, `stationType`, `connectionName`, `sectorMacro`, `x`, `y`, `z`, `name`, `state`, `knownToPlayer`, `spawnTime`
  - Lockboxes tracked as `class="lockbox"` → `lockboxes.json`
  - Erlking vaults tracked as `class="object"` with macro prefix `landmarks_erlking_vault` → `stations.json` with `stationType: "erlking_vault"`
- **Extract Universe tab merged** — single operation now runs `UniverseExtractor` then `SaveDataAnalyser`; outputs `universe.xml` + JSON files to same folder
- **React web app scaffolded and implemented** (`GameDataViewer.Web/` — Vite 5 + React 18 + TypeScript 5.4 + Tailwind CSS 3.4 + Recharts 2.13 + D3 v7):
  - `FilePicker.tsx` — File System Access API + manual fallback; loads all 5 JSON files (lockboxes optional)
  - `HexMap.tsx` — SVG hex grid, pan/zoom, faction colours, indicators, tooltip; single-click selects sector, double-click triggers expanded plot view
  - `ScatterPlot.tsx` — 3D perspective plot, drag-rotate, scroll-zoom, real-world km axis ticks; per-type show/hide toggles with counts; reset-orientation button; hover tooltip (name, owner, wreck/known flags, coords); wrecks rendered at 35% opacity
  - `SectorPanel.tsx` — detail panel with scatter plot, by-type/owner summaries, full component table; supports normal sidebar mode and expanded full-screen mode (⤢/⤡ toggle); lockboxes included; shows name, wreck state, known-to-player; Erlking Vaults labelled and coloured distinctly
  - `StatsPanel.tsx` — summary cards (sectors, stations, ships, data vaults, erlking vaults, lockboxes when > 0) + horizontal Recharts bar charts by faction
  - `factions.ts` — all X4 faction colour/label mappings; all HOSTILE factions use red (`#ff3333`)
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
  - Detects gzip compression via magic bytes (`1F 8B`) — handles both `.xml.gz` and plain `.xml` saves
  - Wraps output in `<savegame>` and writes to a specified output path
  - Progress reporting; async with cancellation support

- **`UnpackGameData.Core` — `SaveDataAnalyser`**
  - Accepts `universePath`, `outputDir`, optional `gameDataRoot`
  - Recursively finds all `*sectors*.xml` / `*zones*.xml` under any `xu_ep2_universe` path within `gameDataRoot`, aggregating core + all DLC data
  - Builds `zonePositionIndex` and `gatePositionIndex` from those files
  - Final component position = static zone offset + runtime zone offset + component own offset (or gate offset)
  - Writes `sectors.json`, `stations.json`, `ships.json`, `gates.json`, `lockboxes.json`
  - `ComponentRecord` carries: `name`, `state`, `knownToPlayer`, `spawnTime` in addition to position/type fields
  - Lockboxes → `lockboxes.json`; erlking vaults → `stations.json` with `stationType: "erlking_vault"`

- **`UnpackGameData.Desktop` — WPF UI (MVVM)**
  - **Settings tab**: configure game folder, save folder, output folder; persists to `%AppData%\X4SaveAnalyser\settings.json`; auto-detects game version from `version.dat`
  - **Unpack Archives tab**: progress log, Cancel button; regex filter in Advanced options
  - **Extract Universe tab**: file picker → auto-derived output path → runs UniverseExtractor + SaveDataAnalyser in sequence
  - **MVVM architecture**: `ViewModelBase`, `RelayCommand`, `SettingsViewModel`, `ArchiveExtractorViewModel`, `UniverseExtractorViewModel`, `MainViewModel`; each tab is a separate `UserControl`; dialogs handled in view code-behind
  - Game data root passed to `SaveDataAnalyser` at extraction time: `{outputFolder}\game\{version}`

### To Do — Desktop App

- [ ] Test against the real X4 installation at `D:\SteamLibrary\steamapps\common\X4 Foundations`
- [ ] Test universe extraction + analysis against real gzip saves in `C:\Users\KieranSmart\OneDrive\Documents\Egosoft\X4\99208493\save`
- [x] ~~Verify scatter plot positions after re-extraction~~ — fixed in Session 4
- [ ] Consider a **Batch Universe Extract** mode — extract universe from all saves in one go
- [ ] Package as a single-file self-contained executable for distribution
