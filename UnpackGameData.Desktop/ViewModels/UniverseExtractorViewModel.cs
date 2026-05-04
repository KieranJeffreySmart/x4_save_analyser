using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;

namespace X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

public sealed class UniverseExtractorViewModel : ViewModelBase
{
    private string _sourceFile = string.Empty;
    private string _destFile = string.Empty;
    private string _log = string.Empty;
    private bool _isBusy;
    private string _saveFolder = string.Empty;
    private string _outputFolder = string.Empty;
    private CancellationTokenSource? _cts;
    private readonly StringBuilder _logBuilder = new();

    private RelayCommand? _extractCommand;
    private RelayCommand? _cancelCommand;

    /// <summary>Raised after each log line is appended, so the view can scroll to end.</summary>
    public event EventHandler? LogUpdated;

    /// <summary>Callback set by <see cref="MainViewModel"/> to push status text to the window.</summary>
    public Action<string>? StatusCallback { get; set; }

    // ── Bound properties ─────────────────────────────────────────────────────

    public string SourceFile
    {
        get => _sourceFile;
        set { if (SetField(ref _sourceFile, value)) UpdateDestPath(); }
    }

    public string DestFile
    {
        get => _destFile;
        private set => SetField(ref _destFile, value);
    }

    public string Log
    {
        get => _log;
        private set { SetField(ref _log, value); LogUpdated?.Invoke(this, EventArgs.Empty); }
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetField(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(IsNotBusy));
                OnPropertyChanged(nameof(CanExtract));
                _extractCommand?.RaiseCanExecuteChanged();
                _cancelCommand?.RaiseCanExecuteChanged();
            }
        }
    }

    public bool IsNotBusy => !_isBusy;

    public bool CanExtract => !IsBusy && File.Exists(_sourceFile) && !string.IsNullOrEmpty(_destFile);

    /// <summary>Exposed so the view's file dialog can open in the correct folder.</summary>
    public string SaveFolder => _saveFolder;

    // ── Commands ──────────────────────────────────────────────────────────────

    public ICommand ExtractCommand => _extractCommand ??= new RelayCommand(
        async () => await ExtractAsync(),
        () => CanExtract);

    public ICommand CancelCommand => _cancelCommand ??= new RelayCommand(
        () => _cts?.Cancel(),
        () => IsBusy);

    // ── Called by MainViewModel ───────────────────────────────────────────────

    public void ApplySettings(AppSettings settings)
    {
        _saveFolder   = settings.SaveFolder;
        _outputFolder = settings.OutputFolder;
        OnPropertyChanged(nameof(SaveFolder));
        UpdateDestPath();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void UpdateDestPath()
    {
        DestFile = (File.Exists(_sourceFile) && !string.IsNullOrEmpty(_outputFolder))
            ? SettingsService.GetSaveOutputPath(_outputFolder, _sourceFile)
            : string.Empty;

        OnPropertyChanged(nameof(CanExtract));
        _extractCommand?.RaiseCanExecuteChanged();
    }

    private void AppendLog(string message)
    {
        _logBuilder.AppendLine(message);
        Log = _logBuilder.ToString();
    }

    private async Task ExtractAsync()
    {
        _logBuilder.Clear();
        Log = string.Empty;
        IsBusy = true;
        _cts = new CancellationTokenSource();

        var progress = new Progress<string>(msg => AppendLog(msg));

        try
        {
            await UniverseExtractor.ExtractAsync(_sourceFile, _destFile, progress, _cts.Token);
            StatusCallback?.Invoke($"Done \u2014 universe saved to {Path.GetFileName(_destFile)}.");
        }
        catch (OperationCanceledException)
        {
            StatusCallback?.Invoke("Cancelled.");
            AppendLog("Extraction cancelled by user.");
        }
        catch (Exception ex)
        {
            AppendLog($"[ERROR] {ex.Message}");
            StatusCallback?.Invoke("Error during extraction.");
        }
        finally
        {
            _cts.Dispose();
            _cts = null;
            IsBusy = false;
        }
    }
}
