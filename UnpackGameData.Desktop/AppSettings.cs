namespace X4SaveAnalyser.UnpackGameData.Desktop;

/// <summary>
/// Persistent user-configurable paths for the application.
/// </summary>
public sealed class AppSettings
{
    /// <summary>Root folder of the X4 Foundations installation (contains .cat/.dat files and version.dat).</summary>
    public string GameFolder { get; set; } = string.Empty;

    /// <summary>Folder where X4 save files (.xml.gz) are stored.</summary>
    public string SaveFolder { get; set; } = string.Empty;

    /// <summary>Root output folder. Extractions go into versioned sub-folders beneath this.</summary>
    public string OutputFolder { get; set; } = string.Empty;
}
