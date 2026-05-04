using System;

namespace X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

public sealed class MainViewModel : ViewModelBase
{
    private string _statusMessage = "Ready.";

    public SettingsViewModel Settings { get; } = new();
    public ArchiveExtractorViewModel Archives { get; } = new();
    public UniverseExtractorViewModel Universe { get; } = new();

    public string StatusMessage
    {
        get => _statusMessage;
        set => SetField(ref _statusMessage, value);
    }

    public MainViewModel()
    {
        Archives.StatusCallback = msg => StatusMessage = msg;
        Universe.StatusCallback = msg => StatusMessage = msg;

        Settings.SettingsSaved += OnSettingsSaved;

        Settings.Load();
        ApplySettingsToExtractors();
    }

    private void OnSettingsSaved(object? sender, EventArgs e)
    {
        ApplySettingsToExtractors();
        StatusMessage = "Settings saved.";
    }

    private void ApplySettingsToExtractors()
    {
        var s = Settings.ToAppSettings();
        Archives.ApplySettings(s);
        Universe.ApplySettings(s);
    }
}
