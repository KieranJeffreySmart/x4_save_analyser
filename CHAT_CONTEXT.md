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
| Web app | `c:\Repos\x4_save_analyser\webapp\` — `npm run dev` to start |

**Current repo state (as of last session):**
- `UnpackGameData.Core/` — `ArchiveExtractor.cs`, `UniverseExtractor.cs`, `SaveDataAnalyser.cs`, `Models.cs`. Builds cleanly.
- `UnpackGameData/` — Console app. Thin wrapper over Core. Builds cleanly.
- `UnpackGameData.Desktop/` — Full WPF MVVM app. Tabs: Unpack Archives, Extract Universe, Settings. Extract Universe now runs both `UniverseExtractor` AND `SaveDataAnalyser` in one operation. Builds cleanly.
- `webapp/` — **React web app** (Vite 5 + React 18 + TypeScript + Tailwind + Recharts + D3 v7). Replaces the old `index.html` HTML app. No compile errors.
- Old HTML visualiser (`index.html`, `x4_save_file_analysis.js`, `hexmap.js`, etc.) — still present for reference; has known bugs logged in `WIP.md`.

**Recommended next steps:**
1. Re-run Extract Universe on a save file (with game data unpacked first so sector/zone XMLs are present at `{output}\game\{version}\maps\xu_ep2_universe\`) to regenerate JSON with correct zone+gate positions.
2. Load the JSON in `webapp/` and verify scatter plot component positions visually.
3. See `WIP.md` for full To Do list.

---

# Session 3 — Save Data Analysis + React Web App

## What Was Done

### C# — `SaveDataAnalyser` (new file in `UnpackGameData.Core`)
- Mirrors `x4_save_file_analysis.js` logic in C#
- Walks `galaxy → cluster → sector → zone → component` in the extracted universe XML
- Applies the same ship filter as the JS (player/khaak/yaki/xenon/ownerless; hostile factions L/XL only)
- Resolves station type from macro name (factory/headquarters/piratebase/tradestation)
- **Zone position** = static base offset from `sectors/*.xml` (`BuildZonePositionIndex`) + runtime offset from save XML — mirrors JS `zonePositionIndex` / `initSectorData`
- **Gate position** = zone base + static gate offset from `zones/*.xml` (`BuildGatePositionIndex`) — mirrors JS `gatePositionIndex` / `initZoneData` (this was the missing `initZoneData` bug noted in WIP)
- Game data dirs are inferred: `sectorsDir` passed explicitly; `zonesDir` = sibling `zones/` folder
- Writes `sectors.json`, `stations.json`, `ships.json`, `gates.json` to the output dir
- Data records: `SectorRecord` (id, macro, code, owner, componentCount), `ComponentRecord` (type, id, macro, code, owner, stationType, connectionName, sectorMacro, x, y, z)

### C# — `UniverseExtractorViewModel` changes
- Stores `_gameFolder` from `ApplySettings`
- At extraction time resolves `sectorsDir` = `{outputFolder}\game\{version}\maps\xu_ep2_universe\sectors\`
- Calls `SaveDataAnalyser.AnalyseAsync` after `UniverseExtractor.ExtractAsync`; passes `sectorsDir` (or null if not found)

### React Web App (`webapp/`)
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
| `src/App.tsx` | Root — layout, Galaxy Map / Statistics tabs, state, 760px side panel |

**Known issue:** Scatter plot component positions still appear incorrect after the zone/gate offset fixes. Needs re-extraction with game data present and visual verification.

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

