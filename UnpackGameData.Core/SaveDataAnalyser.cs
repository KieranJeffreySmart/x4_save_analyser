using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml.Linq;

namespace X4SaveAnalyser.UnpackGameData;

/// <summary>
/// Analyses an extracted X4 universe XML file and writes structured JSON data files
/// to a specified output directory. Mirrors the data extraction logic in x4_save_file_analysis.js.
/// </summary>
public static class SaveDataAnalyser
{
    private static readonly HashSet<string> ShipClasses = new(StringComparer.OrdinalIgnoreCase)
    {
        "ship_xs", "ship_s", "ship_m", "ship_l", "ship_xl"
    };

    // Matches the JS componentTypes array
    private static readonly HashSet<string> TrackedClasses = new(StringComparer.OrdinalIgnoreCase)
    {
        "station", "datavault", "gate", "highwayentrygate", "highwayexitgate",
        "ship_xs", "ship_s", "ship_m", "ship_l", "ship_xl"
    };

    // Mirrors JS ship filter: notable owners only
    private static readonly HashSet<string> NotableShipOwners = new(StringComparer.OrdinalIgnoreCase)
    {
        "player", "khaak", "yaki", "xenon", "ownerless"
    };

    // Mirrors JS: khaak/yaki/xenon ships only tracked if L or XL
    private static readonly HashSet<string> HostileFactions = new(StringComparer.OrdinalIgnoreCase)
    {
        "khaak", "yaki", "xenon"
    };

    private static readonly HashSet<string> LargeShipClasses = new(StringComparer.OrdinalIgnoreCase)
    {
        "ship_l", "ship_xl"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static async Task AnalyseAsync(
        string universePath,
        string outputDir,
        string? gameDataSectorsDir = null,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default)
    {
        await Task.Run(
            () => Analyse(universePath, outputDir, gameDataSectorsDir, progress, cancellationToken),
            cancellationToken).ConfigureAwait(false);
    }

    private static void Analyse(
        string universePath,
        string outputDir,
        string? gameDataSectorsDir,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        if (!File.Exists(universePath))
            throw new FileNotFoundException($"Universe file not found: {universePath}");

        progress?.Report($"Loading: {Path.GetFileName(universePath)}");

        // Build zone position index from static game-data sector XMLs.
        // This mirrors the JS zonePositionIndex built by initSectorData().
        var zonePositionIndex = BuildZonePositionIndex(gameDataSectorsDir, progress);

        // Build gate position index from static game-data zone XMLs.
        // This mirrors the JS gatePositionIndex built by initZoneData().
        string? gameDataZonesDir = gameDataSectorsDir is null
            ? null
            : Path.Combine(Path.GetDirectoryName(gameDataSectorsDir)!, "zones");
        var gatePositionIndex = BuildGatePositionIndex(gameDataZonesDir, progress);

        var doc = XDocument.Load(universePath);

        // Locate the galaxy component — path is savegame/universe/component[@class='galaxy']
        XElement? galaxy = doc.Root
            ?.Element("universe")
            ?.Elements("component")
            .FirstOrDefault(e => string.Equals(
                e.Attribute("class")?.Value, "galaxy", StringComparison.OrdinalIgnoreCase));

        if (galaxy is null)
            throw new InvalidDataException(
                "Could not find <component class='galaxy'> in the universe file. " +
                "Ensure this is a universe XML produced by the Extract Universe step.");

        progress?.Report("Analysing sectors and components…");

        var sectors       = new List<SectorRecord>();
        var stations      = new List<ComponentRecord>();
        var ships         = new List<ComponentRecord>();
        var gates         = new List<ComponentRecord>();

        // galaxy -> (any depth) sector elements
        foreach (XElement sectorEl in galaxy.Descendants()
                     .Where(e => string.Equals(
                         e.Attribute("class")?.Value, "sector", StringComparison.OrdinalIgnoreCase)))
        {
            cancellationToken.ThrowIfCancellationRequested();

            string sectorId    = sectorEl.Attribute("id")?.Value    ?? string.Empty;
            string sectorMacro = (sectorEl.Attribute("macro")?.Value ?? string.Empty).ToLowerInvariant();
            string sectorCode  = sectorEl.Attribute("code")?.Value  ?? string.Empty;
            string sectorOwner = sectorEl.Attribute("owner")?.Value ?? "ownerless";

            var sectorRecord = new SectorRecord(sectorId, sectorMacro, sectorCode, sectorOwner);
            sectors.Add(sectorRecord);

            // sector -> (any depth) zone elements
            foreach (XElement zoneEl in sectorEl.Descendants()
                         .Where(e => string.Equals(
                             e.Attribute("class")?.Value, "zone", StringComparison.OrdinalIgnoreCase)))
            {

                // Zone position = static game-data base offset (from sector XMLs) +
                //                 save-file runtime offset — mirrors JS appendSectorComponentData logic.
                string zoneMacro = zoneEl.Attribute("macro")?.Value ?? string.Empty;
                zonePositionIndex.TryGetValue(zoneMacro.ToLowerInvariant(), out var staticZonePos);
                var zonePosEl = zoneEl.Element("offset")?.Element("position");
                double zoneX = staticZonePos.x + ParseCoord(zonePosEl?.Attribute("x")?.Value);
                double zoneY = staticZonePos.y + ParseCoord(zonePosEl?.Attribute("y")?.Value);
                double zoneZ = staticZonePos.z + ParseCoord(zonePosEl?.Attribute("z")?.Value);

                // zone -> connections -> connection -> component (the trackedclasses)
                // We use Descendants so we aren't fragile about the exact intermediate element names.
                foreach (XElement compEl in zoneEl.Descendants()
                             .Where(e => TrackedClasses.Contains(e.Attribute("class")?.Value ?? string.Empty)))
                {
                    string compClass = compEl.Attribute("class")?.Value ?? string.Empty;
                    string compId    = compEl.Attribute("id")?.Value    ?? string.Empty;
                    string compMacro = compEl.Attribute("macro")?.Value ?? string.Empty;
                    string compCode  = compEl.Attribute("code")?.Value  ?? string.Empty;
                    string compOwner = compEl.Attribute("owner")?.Value ?? string.Empty;

                    bool isShip = ShipClasses.Contains(compClass);

                    // Mirror the JS ship filter
                    if (isShip)
                    {
                        if (!NotableShipOwners.Contains(compOwner))
                            continue;

                        bool isHostile = HostileFactions.Contains(compOwner);
                        if (isHostile && !LargeShipClasses.Contains(compClass))
                            continue;
                    }

                    double compX = zoneX;
                    double compY = zoneY;
                    double compZ = zoneZ;
                    string connectionName = string.Empty;

                    bool isGate = string.Equals(compClass, "gate", StringComparison.OrdinalIgnoreCase);

                    if (isGate)
                    {
                        // Gate positions come from game data zone XMLs (not in save).
                        // Look up by the parent connection's 'connection' attribute — mirrors gatePositionIndex lookup in JS.
                        connectionName = compEl.Parent?.Attribute("connection")?.Value ?? string.Empty;
                        if (!string.IsNullOrEmpty(connectionName) &&
                            gatePositionIndex.TryGetValue(connectionName.ToLowerInvariant(), out var gatePos))
                        {
                            compX = zoneX + gatePos.x;
                            compY = zoneY + gatePos.y;
                            compZ = zoneZ + gatePos.z;
                        }
                    }
                    else
                    {
                        // Add the component's own offset to the zone position
                        var posEl = compEl.Element("offset")?.Element("position");
                        compX += ParseCoord(posEl?.Attribute("x")?.Value);
                        compY += ParseCoord(posEl?.Attribute("y")?.Value);
                        compZ += ParseCoord(posEl?.Attribute("z")?.Value);
                    }

                    string stationType = string.Empty;
                    if (string.Equals(compClass, "station", StringComparison.OrdinalIgnoreCase))
                        stationType = ResolveStationType(compEl, compMacro);

                    var record = new ComponentRecord(
                        Type:           compClass,
                        Id:             compId,
                        Macro:          compMacro,
                        Code:           compCode,
                        Owner:          compOwner,
                        StationType:    string.IsNullOrEmpty(stationType) ? null : stationType,
                        ConnectionName: string.IsNullOrEmpty(connectionName) ? null : connectionName,
                        SectorMacro:    sectorMacro,
                        X:              compX,
                        Y:              compY,
                        Z:              compZ);

                    sectorRecord.ComponentCount++;

                    if (isShip)
                        ships.Add(record);
                    else if (isGate || string.Equals(compClass, "highwayentrygate", StringComparison.OrdinalIgnoreCase)
                                    || string.Equals(compClass, "highwayexitgate", StringComparison.OrdinalIgnoreCase))
                        gates.Add(record);
                    else
                        stations.Add(record);
                }
            }
        }

        progress?.Report(
            $"Found {sectors.Count} sectors, {stations.Count} stations/vaults, " +
            $"{ships.Count} notable ships, {gates.Count} gates/highways.");

        cancellationToken.ThrowIfCancellationRequested();

        Directory.CreateDirectory(outputDir);

        WriteJson(Path.Combine(outputDir, "sectors.json"),  sectors,  progress, cancellationToken);
        WriteJson(Path.Combine(outputDir, "stations.json"), stations, progress, cancellationToken);
        WriteJson(Path.Combine(outputDir, "ships.json"),    ships,    progress, cancellationToken);
        WriteJson(Path.Combine(outputDir, "gates.json"),    gates,    progress, cancellationToken);

        progress?.Report("Analysis complete.");
    }

    /// <summary>
    /// Builds a map from zone macro name (lowercase) to its static offset within its sector.
    /// Reads all *.xml files in <paramref name="sectorsDir"/> — the game data sectors folder
    /// (e.g. maps/xu_ep2_universe/sectors/) — mirroring JS initSectorData().
    /// Returns an empty dictionary if the directory is null or missing.
    /// </summary>
    private static Dictionary<string, (double x, double y, double z)> BuildZonePositionIndex(
        string? sectorsDir,
        IProgress<string>? progress)
    {
        var index = new Dictionary<string, (double x, double y, double z)>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrEmpty(sectorsDir) || !Directory.Exists(sectorsDir))
            return index;

        foreach (string xmlFile in Directory.GetFiles(sectorsDir, "*.xml", SearchOption.TopDirectoryOnly))
        {
            try
            {
                var doc = XDocument.Load(xmlFile);
                foreach (XElement macroEl in doc.Root?.Elements("macro") ?? Enumerable.Empty<XElement>())
                {
                    foreach (XElement conn in macroEl.Element("connections")?.Elements("connection")
                             ?? Enumerable.Empty<XElement>())
                    {
                        if (!string.Equals(conn.Attribute("ref")?.Value, "zones",
                                StringComparison.OrdinalIgnoreCase))
                            continue;

                        string? zoneRef = conn.Element("macro")?.Attribute("ref")?.Value;
                        if (string.IsNullOrEmpty(zoneRef)) continue;

                        var posEl = conn.Element("offset")?.Element("position");
                        double x = ParseCoord(posEl?.Attribute("x")?.Value);
                        double y = ParseCoord(posEl?.Attribute("y")?.Value);
                        double z = ParseCoord(posEl?.Attribute("z")?.Value);

                        index[zoneRef.ToLowerInvariant()] = (x, y, z);
                    }
                }
            }
            catch { /* skip malformed files */ }
        }

        progress?.Report($"Loaded {index.Count} zone positions from game data ({Path.GetFileName(sectorsDir)}).");
        return index;
    }

    /// <summary>
    /// Builds a map from gate connection name (lowercase) to its static position within its zone.
    /// Reads all *.xml files in <paramref name="zonesDir"/> — the game data zones folder
    /// (e.g. maps/xu_ep2_universe/zones/) — mirroring JS initZoneData().
    /// Returns an empty dictionary if the directory is null or missing.
    /// </summary>
    private static Dictionary<string, (double x, double y, double z)> BuildGatePositionIndex(
        string? zonesDir,
        IProgress<string>? progress)
    {
        var index = new Dictionary<string, (double x, double y, double z)>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrEmpty(zonesDir) || !Directory.Exists(zonesDir))
            return index;

        foreach (string xmlFile in Directory.GetFiles(zonesDir, "*.xml", SearchOption.TopDirectoryOnly))
        {
            try
            {
                var doc = XDocument.Load(xmlFile);
                foreach (XElement macroEl in doc.Root?.Elements("macro") ?? Enumerable.Empty<XElement>())
                {
                    foreach (XElement conn in macroEl.Element("connections")?.Elements("connection")
                             ?? Enumerable.Empty<XElement>())
                    {
                        if (!string.Equals(conn.Attribute("ref")?.Value, "gates",
                                StringComparison.OrdinalIgnoreCase))
                            continue;

                        string? name = conn.Attribute("name")?.Value;
                        if (string.IsNullOrEmpty(name)) continue;

                        var posEl = conn.Element("offset")?.Element("position");
                        double x = ParseCoord(posEl?.Attribute("x")?.Value);
                        double y = ParseCoord(posEl?.Attribute("y")?.Value);
                        double z = ParseCoord(posEl?.Attribute("z")?.Value);

                        index[name.ToLowerInvariant()] = (x, y, z);
                    }
                }
            }
            catch { /* skip malformed files */ }
        }

        progress?.Report($"Loaded {index.Count} gate positions from game data ({Path.GetFileName(zonesDir)}).");
        return index;
    }

    private static string ResolveStationType(XElement stationEl, string macro)
    {
        if (macro.Contains("factory", StringComparison.OrdinalIgnoreCase))
        {
            string stationType = "factory";
            string? entry = stationEl.Element("source")?.Attribute("entry")?.Value;
            if (!string.IsNullOrEmpty(entry))
            {
                string[] parts = entry.Split('_');
                if (parts.Length > 1) stationType = parts[1];
            }
            return stationType;
        }

        if (macro.Contains("headquarters",  StringComparison.OrdinalIgnoreCase)) return "Player HQ";
        if (macro.Contains("piratebase",     StringComparison.OrdinalIgnoreCase)) return "Pirate HQ";
        if (macro.Contains("tradestation",   StringComparison.OrdinalIgnoreCase)) return "Trade Station";

        return string.Empty;
    }

    private static double ParseCoord(string? value)
        => double.TryParse(value, System.Globalization.NumberStyles.Any,
                           System.Globalization.CultureInfo.InvariantCulture, out double d)
            ? d : 0.0;

    private static void WriteJson<T>(
        string path, T data,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        File.WriteAllText(path, JsonSerializer.Serialize(data, JsonOptions));
        progress?.Report($"Saved: {Path.GetFileName(path)}");
    }
}

// ── Data records ─────────────────────────────────────────────────────────────

/// <summary>One sector from the universe, with a count of its tracked components.</summary>
public sealed class SectorRecord
{
    [JsonPropertyName("id")]
    public string Id { get; }

    [JsonPropertyName("macro")]
    public string Macro { get; }

    [JsonPropertyName("code")]
    public string Code { get; }

    [JsonPropertyName("owner")]
    public string Owner { get; }

    [JsonPropertyName("componentCount")]
    public int ComponentCount { get; set; }

    public SectorRecord(string id, string macro, string code, string owner)
    {
        Id = id; Macro = macro; Code = code; Owner = owner;
    }
}

/// <summary>
/// A single tracked component (station, data vault, ship, gate, or highway gate).
/// </summary>
public sealed record ComponentRecord(
    [property: JsonPropertyName("type")]           string  Type,
    [property: JsonPropertyName("id")]             string  Id,
    [property: JsonPropertyName("macro")]          string  Macro,
    [property: JsonPropertyName("code")]           string  Code,
    [property: JsonPropertyName("owner")]          string  Owner,
    [property: JsonPropertyName("stationType")]    string? StationType,
    [property: JsonPropertyName("connectionName")] string? ConnectionName,
    [property: JsonPropertyName("sectorMacro")]    string  SectorMacro,
    [property: JsonPropertyName("x")]              double  X,
    [property: JsonPropertyName("y")]              double  Y,
    [property: JsonPropertyName("z")]              double  Z);
