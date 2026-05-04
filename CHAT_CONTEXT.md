# Chat Context

This document maintains context across chat sessions for the `x4_save_analyser` project. Sessions are listed most-recent first.

---

## Quick Start for a New Session

**Before doing anything, read this section.**

| Item | Detail |
|---|---|
| Solution file | `c:\Repos\x4_save_analyser\x4_save_analyser.sln` |
| Build command | `dotnet build x4_save_analyser.sln -c Release` |
| .NET SDK on this machine | 7.0.302 and **10.0.203** — all projects target `net10.0` |
| X4 game install | `D:\SteamLibrary\steamapps\common\X4 Foundations` |
| X4 save files | `C:\Users\KieranSmart\OneDrive\Documents\Egosoft\X4\99208493\save` |
| Settings JSON (app) | `%AppData%\X4SaveAnalyser\settings.json` |
| Web app | `c:\Repos\x4_save_analyser\GameDataViewer.Web\` — `npm run dev` to start |

**Current repo state (as of last session):**
- `UnpackGameData.Core/` — `ArchiveExtractor.cs`, `UniverseExtractor.cs`, `SaveDataAnalyser.cs`, `Models.cs`. Builds cleanly.
- `UnpackGameData/` — Console app. Thin wrapper over Core. Builds cleanly.
- `UnpackGameData.Desktop/` — Full WPF MVVM app. Tabs: Unpack Archives, Extract Universe, Settings. Extract Universe runs both `UniverseExtractor` AND `SaveDataAnalyser` in one operation. Builds cleanly.
- `GameDataViewer.Web/` — **React web app** (Vite 5 + React 18 + TypeScript + Tailwind + Recharts + D3 v7). No compile errors.
  - Loads `sectors.json`, `stations.json`, `ships.json`, `gates.json`, `lockboxes.json` (lockboxes optional)
  - `ComponentRecord` carries `name`, `state`, `knownToPlayer`, `spawnTime`
  - All hostile factions use `#ff3333` (red); configurable in `factions.ts`
  - Scatter plot: per-type show/hide toggles, reset-orientation button, hover tooltip, wreck opacity
  - SectorPanel: normal sidebar mode + expanded full-screen mode (double-click hex or ⤢ button)
  - StatsPanel: stat cards for sectors, stations, ships, data vaults, erlking vaults, lockboxes
- Old HTML visualiser (`index.html`, `x4_save_file_analysis.js`, `hexmap.js`, `hexbin.js`, `chrome_start.bat`) — **removed from working tree** (Session 7); recoverable from git history if needed. Had known bugs: `initSectorData` called twice (second call should be `initZoneData`), unused `zoneFilter`/`stationFilter` arrays, commented-out chart blocks.

**Recommended next steps:**
1. Test the web app against real extracted save data.
2. Consider making the ship filter configurable (currently hardcoded to player/Kha'ak/Yaki/Xenon/ownerless).
3. Consider persisting the last-loaded file path in `localStorage`.
4. See `WIP.md` for remaining To Do items.

---

# Session 6 — Web App: New Data Fields, Expanded Plot View, Hostile Colours

## What Was Done

### Web App — New data fields displayed

`types.ts` extended: `ComponentRecord` gains `name?`, `state?`, `knownToPlayer?`, `spawnTime?`; `SaveData` gains `lockboxes`.

`FilePicker.tsx` (both directory-picker and file-input paths) and `App.tsx` now load `lockboxes.json` as an optional file (defaults to `[]` if absent).

`ScatterPlot.tsx` rewritten with:
- **Per-type show/hide toggles** (Stations / Ships / Gates / Datavaults / Highways / Lockboxes) with counts; only groups present in the sector are shown
- **Reset view button** — restores default azimuth + zoom
- **Hover tooltip** — shows type, name, owner, wreck/known-to-player flags, XYZ coords
- Wrecks rendered at 35% opacity; hostile faction dots use faction colour from `factions.ts`
- Lockboxes added as a distinct type (pink, `#ff88ff`)

`SectorPanel.tsx` updated:
- Lockboxes included in component list
- Table column renamed to "Name / Code"; player-assigned names displayed prominently
- Wreck rows dimmed + orange "(wreck)" tag; known-to-player rows show ★
- Erlking Vaults labelled "Erlking Vault" with distinct purple (`#cc44ff`)
- **Expanded mode** added: when `expanded={true}`, scatter plot fills left area, details shift to 400px right panel
- ⤢/⤡ toggle button in panel header

`StatsPanel.tsx`: Erlking Vault and Lockbox stat cards added (shown only when count > 0).

### Web App — Hostile faction colours

`factions.ts`: All factions in the `HOSTILE` set (`khaak`, `xenon`, `yaki`, `scaleplate`, `criminal`, `smuggler`, `buccaneers`) set to `#ff3333`. Other faction colours unchanged. Colours remain configurable.

### Web App — Expanded plot view

`HexMap.tsx`:
- Added `onSectorDoubleClick?` prop
- `onClick` handler now uses `e.detail` to distinguish single click (select sector) from double click (enter expanded mode)

`App.tsx`:
- Added `expanded` state
- `handleSectorDoubleClick` sets `selectedMacro` + `expanded = true`
- In expanded mode: hex map hidden; `SectorPanel` takes full width with `expanded={true}`; mini hex map overlay rendered bottom-left (172×108, `pointer-events-none` inner map, clickable wrapper to collapse)

---

# Session 5 — Additional Data Extraction + WIP Skill

## What Was Done

### C# — `SaveDataAnalyser` extended (based on `X4-Info-Miner/x4-save-miner.py` review)

Reviewed `x4-save-miner.py` to identify data it captures that was missing from `SaveDataAnalyser`. Added:

| Addition | Detail |
|---|---|
| **Lockboxes** | `class="lockbox"` added to `TrackedClasses`; written to new `lockboxes.json` |
| **Erlking vaults** | `class="object"` added to `TrackedClasses`, filtered to macro prefix `landmarks_erlking_vault`; written to `stations.json` with `stationType: "erlking_vault"` and normalised `type: "datavault"` |
| **`name`** | Player-assigned or NPC ship name from `name` attribute |
| **`state`** | `"wreck"` when destroyed; `null` otherwise |
| **`knownToPlayer`** | `true` when `knownto="player"` (datavaults/ships) or `known="1"` (lockboxes) |
| **`spawnTime`** | Game-time in seconds at which ship was spawned |

`ComponentRecord` now has 4 optional trailing parameters (defaulted to `null`) so existing call sites are unaffected.

### Global skill created

`C:\Users\KieranSmart\.copilot\skills\update-wip-docs\SKILL.md` — personal skill available in all workspaces. Invoked by "update the WIP docs" / "update session notes" / etc. Procedure: update WIP.md → update CHAT_CONTEXT.md → consistency review.

---

# Session 4 — Scatter Plot Position Fix

## Problem

Scatter plot component positions were wrong for all DLC sectors (Boron, Split/CoH, Terran, Pirate). Components appeared at the sector origin or completely wrong coordinates.

## Root Cause

The X4 game stores sector/zone position data across **5 separate XML files** — one for the core game and one per DLC — in separate directories after extraction:

| File | Macro count |
|---|---|
| `ego_core/.../sectors.xml` | ~655 |
| `ego_dlc_boron/.../dlc_boron_sectors.xml` | 123 |
| `ego_dlc_split/.../dlc4_sectors.xml` | 202 |
| `ego_dlc_terran/.../dlc_terran_sectors.xml` | 136 |
| `ego_dlc_pirate/.../dlc_pirate_sectors.xml` | 52 |

`SaveDataAnalyser.BuildZonePositionIndex` and `BuildGatePositionIndex` were only reading from a single hardcoded `sectors/` subdirectory, so ~513 DLC zones had zero offsets — all their components landed at the sector origin.

## Fix

**`UnpackGameData.Core/SaveDataAnalyser.cs`** — Both `BuildZonePositionIndex` and `BuildGatePositionIndex` now accept `gameDataRoot` (the extracted game output folder, e.g. `{output}\game\800`) and use `Directory.EnumerateFiles(..., SearchOption.AllDirectories)` filtered to files whose path contains `xu_ep2_universe` and whose filename contains `sectors` / `zones`. This picks up all files regardless of flat or nested layout.

**`UnpackGameData.Desktop/ViewModels/UniverseExtractorViewModel.cs`** — Now passes `gameDataRoot = {output}\game\{version}` to `AnalyseAsync` instead of drilling down to `\maps\xu_ep2_universe\sectors\` (which only existed for the core game).

---

# Session 3 — Save Data Analysis + React Web App

## What Was Done

### C# — `SaveDataAnalyser` (new file in `UnpackGameData.Core`)
- `Mirrors x4_save_file_analysis.js` logic in C#
- Walks `galaxy → cluster → sector → zone → component` in the extracted universe XML
- Applies the same ship filter as the JS (player/khaak/yaki/xenon/ownerless; hostile factions L/XL only)
- Resolves station type from macro name (factory/headquarters/piratebase/tradestation)
- **Zone position** = static base offset from `sectors/*.xml` (`BuildZonePositionIndex`) + runtime offset from save XML — mirrors JS `zonePositionIndex` / `initSectorData`
- **Gate position** = zone base + static gate offset from `zones/*.xml` (`BuildGatePositionIndex`) — mirrors JS `gatePositionIndex` / `initZoneData` (this was the missing `initZoneData` bug noted in WIP)
- Game data dirs are inferred from `gameDataRoot` (passed as `{outputFolder}\game\{version}`); both sectors and zones files are found by recursive search
- Writes `sectors.json`, `stations.json`, `ships.json`, `gates.json`, `lockboxes.json` to the output dir
- Data records: `SectorRecord` (id, macro, code, owner, componentCount), `ComponentRecord` (type, id, macro, code, owner, stationType, connectionName, sectorMacro, x, y, z, name, state, knownToPlayer, spawnTime)

### C# — `UniverseExtractorViewModel` changes
- Stores `_gameFolder` from `ApplySettings`
- At extraction time passes `gameDataRoot = {outputFolder}\game\{version}` to `SaveDataAnalyser.AnalyseAsync`
- Calls `SaveDataAnalyser.AnalyseAsync` after `UniverseExtractor.ExtractAsync`
- *(Note: originally passed a hardcoded `sectors/` subdirectory — corrected in Session 4 to pass the root so all DLC files are found)*

### React Web App (`GameDataViewer.Web/`)
Built from scratch with Vite 5 + React 18 + TypeScript 5.4 + Tailwind CSS 3.4 + Recharts 2.13 + D3 v7.

**Key files:**

| File | Purpose |
|---|---|
| `src/types.ts` | `SectorRecord`, `ComponentRecord`, `SaveData`, `HexCell` |
| `src/data/factions.ts` | All X4 faction colour/label mappings; `getFactionColor`, `getFactionLabel`, `HOSTILE` set |
| `src/data/sectorPositions.ts` | Static hex grid positions for all 151 sectors (name, gridX, gridY, macro, clusterPos) |
| `src/components/FilePicker.tsx` | File System Access API file picker (Chrome/Edge) + manual multi-file fallback |
| `src/components/HexMap.tsx` | SVG hex grid; pan/zoom via viewBox; faction colours; enemy/datavault/ownerless indicators; hover tooltip; click to select; sector labels truncated at 30 chars with dynamic font-size |
| `src/components/ScatterPlot.tsx` | 3D perspective scatter plot; drag-rotate; scroll-zoom; real-world km axis ticks; axis show/hide toggle (halved opacity when visible); selection state lifted to parent (`selectedId` / `onSelect` props) |
| `src/components/SectorPanel.tsx` | Right panel: ScatterPlot + by-type/owner summaries + full component table; clicking a table row highlights the matching dot on the plot (shared `selectedId` state) |
| `src/components/StatsPanel.tsx` | Summary cards + horizontal Recharts bar charts (sectors/stations/ships by faction) |
| `src/App.tsx` | Root — layout, Galaxy Map / Statistics tabs, state; sidebar mode (760px) + expanded full-screen mode with mini map overlay |

**Known issue:** ~~Scatter plot component positions still appear incorrect~~ — **fixed in Session 4** (DLC sector/zone files were not being aggregated; see Session 4 for details).

---

# Session 2 — C# Desktop App Build Session

This document summarises the key decisions, architecture, and implementation details from the session that produced the `UnpackGameData.Desktop` WPF application. Use it to bring a new chat up to speed quickly.

---

## Project Overview

`x4_save_analyser` is a toolset for working with data from the game **X4: Foundations** (Egosoft). It has two main concerns:

1. **Unpacking game archives** — X4 stores game data in `.cat`/`.dat` archive pairs. These need extracting to XML before they can be analysed.
2. **Extracting save data** — X4 save files are gzip-compressed XML (`.xml.gz`). The `<universe>` element inside contains all the live game-world state and needs to be pulled out into a standalone file for analysis.

The original tooling was Python scripts. The session replaced them with a C# WPF desktop app.

---

## Solution Structure

```
x4_save_analyser.sln
├── UnpackGameData.Core/          # Class library — extraction logic only, no UI deps
│   ├── ArchiveExtractor.cs
│   ├── UniverseExtractor.cs
│   └── Models.cs
├── UnpackGameData/               # Console app — thin CLI wrapper over Core (still present, still useful)
│   └── Program.cs
└── UnpackGameData.Desktop/       # WPF application (primary UI)
    ├── App.xaml / App.xaml.cs
    ├── MainWindow.xaml / .cs     # Thin shell — sets DataContext = new MainViewModel()
    ├── AppSettings.cs            # Plain record: GameFolder, SaveFolder, OutputFolder
    ├── SettingsService.cs        # Load/Save JSON, GetGameVersion, GetGameOutputFolder, GetSaveOutputPath
    ├── ViewModels/
    │   ├── ViewModelBase.cs      # INotifyPropertyChanged + SetField
    │   ├── RelayCommand.cs       # ICommand with RaiseCanExecuteChanged
    │   ├── MainViewModel.cs      # Owns the three child VMs, wires SettingsSaved event
    │   ├── SettingsViewModel.cs
    │   ├── ArchiveExtractorViewModel.cs
    │   └── UniverseExtractorViewModel.cs
    └── Views/
        ├── SettingsView.xaml / .cs
        ├── ArchiveExtractorView.xaml / .cs
        └── UniverseExtractorView.xaml / .cs
```

---

## Key Implementation Details

### ArchiveExtractor (Core)

- Reads `.cat` files line by line. Each line format: `<embedded/path> <size> <epoch> <hash>`
- The last 3 space-separated tokens are size/epoch/hash; everything before is the embedded path (which may contain spaces).
- Seeks through the paired `.dat` file using cumulative byte offsets.
- Uses `SearchOption.AllDirectories` — finds `.cat` files recursively under the source folder.
- **Subfolder mirroring**: a `.cat` at `{source}/ego_core/01.cat` extracts into `{dest}/ego_core/`, preserving the relative path from source root.
- Async + `CancellationToken`; progress via `IProgress<ExtractionProgress>`.

### UniverseExtractor (Core)

- Save files are **gzip-compressed** (`.xml.gz`) — detected by magic bytes `1F 8B`, not file extension.
- Streams through the XML using `XmlReader` (memory-efficient for 100MB+ files).
- Finds the first `<universe>` element, reads it as `XElement`, wraps in `<savegame>`, saves to output path.
- Real save files are at: `C:\Users\KieranSmart\OneDrive\Documents\Egosoft\X4\99208493\save`

### SettingsService

- Settings JSON stored at: `%AppData%\X4SaveAnalyser\settings.json`
- `GetGameVersion(gameFolder)` — reads `{gameFolder}\version.dat` (plain integer, e.g. `800`)
- `GetGameOutputFolder(outputRoot, gameFolder)` → `{outputRoot}\game\{version}`
- `GetSaveOutputPath(outputRoot, saveFilePath)` → `{outputRoot}\saves\{yyyy-MM-dd-HH-mm}\{saveName}\universe.xml`
  - Timestamp comes from `File.GetLastWriteTime(saveFilePath)`
  - `{saveName}` strips both `.gz` and `.xml` extensions

### Real Paths (this machine)

| Purpose | Path |
|---|---|
| X4 game installation | `D:\SteamLibrary\steamapps\common\X4 Foundations` |
| X4 save files | `C:\Users\KieranSmart\OneDrive\Documents\Egosoft\X4\99208493\save` |
| Game version file | `D:\SteamLibrary\steamapps\common\X4 Foundations\version.dat` → `800` |

---

## MVVM Architecture

**Pattern used**: standard WPF MVVM without a framework (no CommunityToolkit, no Prism).

- `ViewModelBase` — `INotifyPropertyChanged` with `SetField<T>` helper
- `RelayCommand` — `ICommand` wrapping `Action` + optional `Func<bool>` canExecute, with `RaiseCanExecuteChanged()`
- Commands are `async` via `async () => await DoWorkAsync()` lambdas in the VM constructors
- **Dialogs** (folder browser, file open) live in view code-behind — intentionally pragmatic, no dialog service abstraction
- `MainViewModel` owns `SettingsViewModel`, `ArchiveExtractorViewModel`, `UniverseExtractorViewModel`; subscribes to `SettingsViewModel.SettingsSaved` and calls `ApplySettings(AppSettings)` on both extractor VMs
- `StatusCallback` — each extractor VM has an `Action<string>?` property set by `MainViewModel` to push status text to the window's status bar

### Data flow when settings are saved

```
SettingsView (Browse buttons in code-behind)
  → writes to SettingsViewModel properties
  → SaveCommand calls SettingsService.Save() and raises SettingsSaved
  → MainViewModel.OnSettingsSaved calls ApplySettings on both extractor VMs
  → ArchiveExtractorViewModel.ApplySettings sets SourceDir + DestDir
  → UniverseExtractorViewModel.ApplySettings stores SaveFolder + OutputFolder
     (dest path recalculated when SourceFile changes)
```

---

## UI Design Decisions

- **Paths are display-only**: game folder and output paths shown as `TextBlock` (grey, word-wrapped), not editable `TextBox` — the Settings tab is the single place to configure them.
- **Universe tab**: only a **Select file…** button; no text entry for the source path. Output path auto-derives and displays once a file is chosen.
- **Extract button** on Universe tab is disabled until a valid source file is selected (`CanExtract = !IsBusy && File.Exists(sourceFile) && !string.IsNullOrEmpty(destFile)`).
- **Log output**: bound to a `TextBox` (read-only, Consolas font); `LogUpdated` event on the VM triggers `ScrollToEnd()` in the view code-behind.
- The project uses both `System.Windows.Forms` (folder browser dialog) and WPF — `UserControl` is disambiguated with `using UserControl = System.Windows.Controls.UserControl` in view code-behind files.

---

## Outstanding To-Do (Desktop App)

- [ ] End-to-end test against real game folder and real save files
- [ ] Batch Universe Extract — process all saves in the save folder in one operation
- [ ] Diff/compare view between two extracted universe files
- [ ] Single-file self-contained publish for distribution
- [ ] Progress indicator (spinner / progress bar) for long-running extractions

---

# Session 1 — Foundation & Initial C# Port

This session started from the raw Python scripts and got the project documented, tracked, and migrated to an initial C# structure that Session 2 then extended.

---

## What Was Done

### Documentation
- **README.md** — written from scratch. Covers: project summary, requirements, workflow overview, all scripts (`unpack-game-data.py`, `clean-save-file.py`, `extract.bat`, `extract-save-file.bat`, `chrome_start.bat`), the visualiser (`index.html` + supporting JS), data directory layout, and a getting-started guide.
- **WIP.md** — created as a persistent progress-tracking file with Current Status (feature list), In Progress, To Do (per-feature improvement items), and Done sections.

### Bugs / Issues Identified in Original Code
- `index.html` calls `initSectorData` twice — the second call (for `zones.xml`) should be `initZoneData`. Gate positions likely not loading correctly.
- `inf_data` file handle never closed in `unpack-game-data.py`.
- `zoneFilter` and `stationFilter` arrays defined in `x4_save_file_analysis.js` but never used.
- Sector name labels on the hex map are `font-size: 2px` — invisible.
- `extract.bat` and `extract-save-file.bat` use hardcoded absolute paths.

### C# Projects Created

#### `UnpackGameData.Core` (class library, net10.0)
- `ArchiveExtractor.cs` — all `.cat`/`.dat` extraction logic; fully async with `IProgress<ExtractionProgress>` and `CancellationToken`.
- `Models.cs` — `ExtractionOptions`, `ExtractionResult`, `ExtractionProgress`, `ProgressMessageType`.
- Each line of a `.cat` file: `<embedded/path> <size> <epoch> <hash>` — last 3 tokens are metadata, everything before is the path (may contain spaces).

#### `UnpackGameData` (console app, net10.0)
- Refactored to be a thin CLI wrapper over `ArchiveExtractor.ExtractAsync()`.
- Args: `<sourcedir> <destdir> [-f <regex>] [-i <file1> ...]`
- Default filter: `^.*(xml|xsd|html|js|css|lua)$`

#### `UnpackGameData.Desktop` (WPF app, net10.0-windows)
- Single `MainWindow` with source/dest folder pickers (`FolderBrowserDialog` via `System.Windows.Forms`), regex filter field (pre-filled with default), scrollable log output, Extract and Cancel buttons.
- No MVVM in this version — logic lives in `MainWindow.xaml.cs`.
- Calls `ArchiveExtractor.ExtractAsync()` with live `Progress<T>` callback; `CancellationTokenSource` wired to the Cancel button.
- Both `System.Windows.Forms` and WPF are referenced; `App.xaml.cs` uses fully-qualified `System.Windows.Application` to avoid ambiguity.

#### Solution
- `x4_save_analyser.sln` — all three projects added.

---

## State at End of Session 1

- All three projects built cleanly.
- The desktop app was a **basic single-window app** (no MVVM, no Settings tab, no Universe tab) — logic lived in `MainWindow.xaml.cs`.
- **Session 2 replaced this with the full MVVM version.** The current `UnpackGameData.Desktop` in the repo is Session 2's version.
- `UniverseExtractor` existed only as the Python `clean-save-file.py` at this point — ported to C# in Session 2.
- Neither app had been tested against real game data.

