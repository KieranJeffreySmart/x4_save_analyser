# UnpackGameData

C# console app that extracts files from X4: Foundations `.cat` / `.dat` archive pairs.

This is a port of the original `unpack-game-data.py` script.

## Build

Requires the .NET 7 SDK (or later).

```
dotnet build UnpackGameData.csproj -c Release
```

The executable will be produced at `bin/Release/net7.0/unpack-game-data.exe`.

## Run

```
dotnet run --project UnpackGameData.csproj -- <sourcedir> <destdir> [-f <regex>] [-i <file1> <file2> ...]
```

Or run the published executable directly:

```
unpack-game-data.exe <sourcedir> <destdir> [-f <regex>] [-i <file1> <file2> ...]
```

### Arguments

| Argument | Description |
|---|---|
| `sourcedir` | Directory containing `.cat` / `.dat` archive pairs |
| `destdir` | Output directory for extracted files |
| `-f`, `--filter` | Regex of embedded file paths to extract (default: `^.*(xml\|xsd\|html\|js\|css\|lua)$`) |
| `-i`, `--include` | Specific `.cat` filenames to process; if omitted, all `.cat` files in `sourcedir` are processed |
| `-h`, `--help` | Show usage |

### Example

```
unpack-game-data.exe "C:\Repos\x4_save_analyser\game_data\cabs\ego_core" "C:\Repos\x4_save_analyser\game_data\ego_core\unpacked" -f "^.*(xml|xsd|html|js|css)$"
```
