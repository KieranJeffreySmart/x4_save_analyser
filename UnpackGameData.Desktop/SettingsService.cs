using System.IO;
using System.Text.Json;

namespace X4SaveAnalyser.UnpackGameData.Desktop;

public static class SettingsService
{
    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "X4SaveAnalyser",
        "settings.json");

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(SettingsPath))
            {
                string json = File.ReadAllText(SettingsPath);
                return JsonSerializer.Deserialize<AppSettings>(json, JsonOptions) ?? new AppSettings();
            }
        }
        catch { /* return defaults on any read/parse failure */ }

        return new AppSettings();
    }

    public static void Save(AppSettings settings)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(SettingsPath)!);
        File.WriteAllText(SettingsPath, JsonSerializer.Serialize(settings, JsonOptions));
    }

    /// <summary>
    /// Reads the game version from &lt;gameFolder&gt;\version.dat.
    /// Returns null if the file does not exist or cannot be read.
    /// </summary>
    public static string? GetGameVersion(string gameFolder)
    {
        if (string.IsNullOrWhiteSpace(gameFolder)) return null;

        string versionFile = Path.Combine(gameFolder, "version.dat");
        if (!File.Exists(versionFile)) return null;

        string version = File.ReadAllText(versionFile).Trim();
        return string.IsNullOrEmpty(version) ? null : version;
    }

    /// <summary>
    /// Returns the versioned output sub-folder for game archive extraction:
    /// <c>{outputRoot}/game/{gameVersion}</c>.
    /// </summary>
    public static string GetGameOutputFolder(string outputRoot, string gameFolder)
    {
        string version = GetGameVersion(gameFolder) ?? "unknown";
        return Path.Combine(outputRoot, "game", version);
    }

    /// <summary>
    /// Returns the versioned output file path for a universe extraction:
    /// <c>{outputRoot}/saves/{yyyy-MM-dd-HH-mm}/universe.xml</c>
    /// where the timestamp comes from the save file's last-write time.
    /// </summary>
    public static string GetSaveOutputPath(string outputRoot, string saveFilePath)
    {
        DateTime modified = File.GetLastWriteTime(saveFilePath);
        string timestamp = modified.ToString("yyyy-MM-dd-HH-mm");
        string saveNameWithoutExt = Path.GetFileNameWithoutExtension(
            saveFilePath.EndsWith(".gz", StringComparison.OrdinalIgnoreCase)
                ? Path.GetFileNameWithoutExtension(saveFilePath)
                : saveFilePath);
        return Path.Combine(outputRoot, "saves", timestamp, saveNameWithoutExt, "universe.xml");
    }
}
