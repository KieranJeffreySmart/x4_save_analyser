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

**Current repo state (as of last session):**
- `UnpackGameData.Core/` — Core library. Has `ArchiveExtractor.cs`, `UniverseExtractor.cs`, `Models.cs`. Builds cleanly.
- `UnpackGameData/` — Console app. Thin wrapper over Core. Builds cleanly.
- `UnpackGameData.Desktop/` — Full WPF MVVM app. Has `Views/`, `ViewModels/`, `AppSettings.cs`, `SettingsService.cs`. Builds cleanly. **Not yet tested against real game files.**
- Original Python scripts (`unpack-game-data.py`, `clean-save-file.py`) still present in the root — kept for reference but superseded by the C# port.
- Browser-based visualiser (`index.html`, `x4_save_file_analysis.js`, `hexmap.js`, etc.) is unchanged from the original — has known bugs logged in `WIP.md`.

**Recommended next steps** (see `WIP.md` for full To Do list):
1. Run the desktop app against the real X4 installation and save folder to validate end-to-end.
2. Fix the `initZoneData` bug in `index.html` (currently calls `initSectorData` twice — gate positions not loading).
3. Fix the invisible sector labels (`font-size: 2px`) in `hexmap.js`.

---

# Session 2 — C# Desktop App Build Session (more recent)

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

