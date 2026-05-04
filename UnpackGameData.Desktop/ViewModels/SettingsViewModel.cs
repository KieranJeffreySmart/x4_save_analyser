using System;
using System.Windows.Input;

namespace X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

public sealed class SettingsViewModel : ViewModelBase
{
    private string _gameFolder = string.Empty;
    private string _saveFolder = string.Empty;
    private string _outputFolder = string.Empty;
    private string _detectedVersion = "\u2014";

    public event EventHandler? SettingsSaved;

    public string GameFolder
    {
        get => _gameFolder;
        set { if (SetField(ref _gameFolder, value)) RefreshVersion(); }
    }

    public string SaveFolder
    {
        get => _saveFolder;
        set => SetField(ref _saveFolder, value);
    }

    public string OutputFolder
    {
        get => _outputFolder;
        set => SetField(ref _outputFolder, value);
    }

    public string DetectedVersion
    {
        get => _detectedVersion;
        private set => SetField(ref _detectedVersion, value);
    }

    private RelayCommand? _saveCommand;
    public ICommand SaveCommand => _saveCommand ??= new RelayCommand(Save);

    public void Load()
    {
        var s = SettingsService.Load();
        GameFolder = s.GameFolder;
        SaveFolder = s.SaveFolder;
        OutputFolder = s.OutputFolder;
    }

    public AppSettings ToAppSettings() => new()
    {
        GameFolder  = GameFolder.Trim(),
        SaveFolder  = SaveFolder.Trim(),
        OutputFolder = OutputFolder.Trim(),
    };

    private void Save()
    {
        var s = ToAppSettings();
        // Reflect trimmed values back.
        GameFolder   = s.GameFolder;
        SaveFolder   = s.SaveFolder;
        OutputFolder = s.OutputFolder;
        SettingsService.Save(s);
        SettingsSaved?.Invoke(this, EventArgs.Empty);
    }

    private void RefreshVersion()
    {
        string? v = SettingsService.GetGameVersion(_gameFolder);
        DetectedVersion = v ?? "\u2014 (version.dat not found)";
    }
}
