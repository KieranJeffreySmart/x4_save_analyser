using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;

namespace X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

public sealed class ArchiveExtractorViewModel : ViewModelBase
{
    private string _sourceDir = string.Empty;
    private string _destDir = string.Empty;
    private string _filter = ArchiveExtractor.DefaultFilter;
    private string _log = string.Empty;
    private bool _isBusy;
    private CancellationTokenSource? _cts;
    private readonly StringBuilder _logBuilder = new();

    private RelayCommand? _extractCommand;
    private RelayCommand? _cancelCommand;

    /// <summary>Raised after each log line is appended, so the view can scroll to end.</summary>
    public event EventHandler? LogUpdated;

    /// <summary>Callback set by <see cref="MainViewModel"/> to push status text to the window.</summary>
    public Action<string>? StatusCallback { get; set; }

    // ── Bound properties ─────────────────────────────────────────────────────

    public string SourceDir
    {
        get => _sourceDir;
        private set => SetField(ref _sourceDir, value);
    }

    public string DestDir
    {
        get => _destDir;
        private set => SetField(ref _destDir, value);
    }

    public string Filter
    {
        get => _filter;
        set => SetField(ref _filter, value);
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
                _extractCommand?.RaiseCanExecuteChanged();
                _cancelCommand?.RaiseCanExecuteChanged();
            }
        }
    }

    public bool IsNotBusy => !_isBusy;

    // ── Commands ──────────────────────────────────────────────────────────────

    public ICommand ExtractCommand => _extractCommand ??= new RelayCommand(
        async () => await ExtractAsync(),
        () => !IsBusy && !string.IsNullOrEmpty(SourceDir) && !string.IsNullOrEmpty(DestDir));

    public ICommand CancelCommand => _cancelCommand ??= new RelayCommand(
        () => _cts?.Cancel(),
        () => IsBusy);

    // ── Called by MainViewModel ───────────────────────────────────────────────

    public void ApplySettings(AppSettings settings)
    {
        SourceDir = settings.GameFolder;
        DestDir   = (!string.IsNullOrEmpty(settings.OutputFolder) && !string.IsNullOrEmpty(settings.GameFolder))
            ? SettingsService.GetGameOutputFolder(settings.OutputFolder, settings.GameFolder)
            : string.Empty;
        _extractCommand?.RaiseCanExecuteChanged();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

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

        var options = new ExtractionOptions(SourceDir, DestDir, Filter.Trim());

        var progress = new Progress<ExtractionProgress>(p =>
        {
            string prefix = p.Type switch
            {
                ProgressMessageType.Warning => "[WARN] ",
                ProgressMessageType.Error   => "[ERROR] ",
                _                           => ""
            };
            AppendLog(prefix + p.Message);
        });

        try
        {
            var result = await ArchiveExtractor.ExtractAsync(options, progress, _cts.Token);
            StatusCallback?.Invoke($"Done \u2014 extracted {result.Extracted:N0} files, skipped {result.Skipped:N0}.");
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
