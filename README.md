# x4_save_analyser

A set of Python scripts and a browser-based visualiser for extracting, processing, and analysing game data and save files from **X4: Foundations** (by Egosoft).

The toolset lets you unpack raw game data from the game's `.cat`/`.dat` archives, strip down large save files to just the universe data, and then visualise the game universe — sectors, stations, ships, factions, and gates — in an interactive HTML dashboard.

---

## Requirements

- **Python 3** — for the data extraction and save-cleaning scripts
- **Google Chrome** — for running the visualiser (required to allow local file access)
- No additional Python packages are needed beyond the standard library

---

## Workflow Overview

```
1. Unpack game data  →  extract.bat
2. Clean save file   →  extract-save-file.bat
3. Open visualiser   →  chrome_start.bat  →  index.html
```

---

## Scripts

### `unpack-game-data.py`

Extracts files from X4's proprietary `.cat`/`.dat` archive pairs into a readable directory structure. The `.cat` file is an index listing the embedded file paths and sizes; the `.dat` file holds the raw binary data.

**Usage:**
```
python unpack-game-data.py <sourcedir> <destdir> [-f <regex_filter>]
```

| Argument | Description |
|---|---|
| `sourcedir` | Directory containing `.cat`/`.dat` archive pairs |
| `destdir` | Output directory for extracted files |
| `-f / --filter` | Regex to select which file types to extract (default: `xml`, `xsd`, `html`, `js`, `css`, `lua`) |

Only files whose embedded path matches the filter regex are extracted; all others are skipped. The original directory structure from the archive is preserved in the output.

---

### `clean-save-file.py`

Strips an X4 save file down to just the `<universe>` element and writes it as a standalone XML file. Save files contain a large amount of data beyond the universe state; this script isolates the part needed by the visualiser, keeping file sizes manageable.

**Usage:**
```
python clean-save-file.py <sourcepath> <destpath>
```

| Argument | Description |
|---|---|
| `sourcepath` | Path to the full X4 save file (`.xml`) |
| `destpath` | Path to write the extracted universe XML |

---

### `extract.bat`

Convenience batch script that runs `unpack-game-data.py` for all five game content packages:

- `ego_core` — base game data
- `ego_dlc_pirate` — Tides of Avarice DLC
- `ego_dlc_boron` — Kingdom End DLC
- `ego_dlc_split` — Split Vendetta DLC
- `ego_dlc_terran` — Cradle of Humanity DLC

Extracts `xml`, `xsd`, `html`, `js`, and `css` files from each package into `game_data/<package>/unpacked/`.

---

### `extract-save-file.bat`

Convenience batch script that runs `clean-save-file.py` on a specific save file. Edit this file to point at the save you want to analyse.

---

### `chrome_start.bat`

Launches Google Chrome with the `--allow-file-access-from-files` flag and opens `index.html`. This flag is required because the visualiser loads local XML files via `fetch`/XPath, which is blocked by Chrome's default security policy.

---

## Visualiser — `index.html`

An interactive browser-based dashboard built with [D3.js](https://d3js.org/) and [X3DOM](https://www.x3dom.org/). It loads the cleaned universe XML and game map data to render the X4 universe.

**Supporting scripts:**

| File | Purpose |
|---|---|
| `x4_save_file_analysis.js` | Core analysis logic. Parses the universe save XML using XPath, builds indexed lookups for sectors, zones, clusters, gates, factions, and components. Renders the universe hex map and sector drill-down view. |
| `hexmap.js` | Renders sectors as a hexagonal grid map using D3. Handles hex positioning, cluster sub-positioning, and SVG rendering. |
| `hexbin.js` | D3 hexbin plugin (bundled locally) providing hex geometry and binning utilities used by `hexmap.js`. |
| `svg_scatterplot.js` | Renders an interactive 3D scatter plot of components (stations, ships, gates) within a selected sector, using a perspective projection. |

**What the visualiser shows:**

- **Universe map** — all sectors laid out as a hex grid, coloured by controlling faction
- **Sector detail view** — a 3D scatter plot of every component in the selected sector (stations, ships, gates, data vaults, highways), coloured by type and owner
- **Component info panel** — displays the name, owner faction, station type, and coordinates of a selected component

**Faction colour coding** includes Argon, Paranid, Teladi, Split, Terran, Boron, Xenon, Kha'ak, the player, and many more.

---

## Data Directories

### `game_data/`

Holds X4 game content. Populate this by running `extract.bat`.

| Path | Contents |
|---|---|
| `game_data/cabs/<package>/` | Raw `.cat`/`.dat` archive files copied from the X4 installation |
| `game_data/<package>/unpacked/` | Files extracted by `unpack-game-data.py` |
| `game_data/unpacked/` | Additional unpacked data (e.g. from the core unpack pass) |

Key extracted files used by the visualiser:
- `libraries/mapdefaults.xml` — sector/cluster identification and display names
- `maps/xu_ep2_universe/galaxy.xml` — cluster positions in the universe
- `maps/xu_ep2_universe/sectors.xml` — zone positions within sectors
- `maps/xu_ep2_universe/zones.xml` — gate positions within zones
- `t/0001-l044.xml` (or similar) — localisation strings for sector names

### `save_data/`

X4 save files (`.xml`) exported or copied from the game's save directory. The full save files are large; the `_universe` variants (e.g. `save_008_universe.xml`) are the trimmed outputs from `clean-save-file.py` and are what the visualiser loads.

### `map_data/`

Standalone map definition XML files used as reference or fallback data.

### `tooltip/`

Self-contained tooltip component (`tooltip.html`, `tooltip.css`, `tooltip.js`) used for UI overlays in the visualiser.

---

## Getting Started

1. Copy your X4 `.cat`/`.dat` files into `game_data/cabs/<package>/` for each package you own.
2. Run `extract.bat` to unpack the game data.
3. Copy a save file (`.xml`) from your X4 save directory into `save_data/`.
4. Edit `extract-save-file.bat` to reference your save file, then run it to produce the `_universe.xml`.
5. Run `chrome_start.bat` to open the visualiser and explore your universe.

