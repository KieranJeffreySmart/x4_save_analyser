namespace X4SaveAnalyser.UnpackGameData;

/// <summary>Options passed to <see cref="ArchiveExtractor.ExtractAsync"/>.</summary>
public sealed record ExtractionOptions(
    string SourceDir,
    string DestDir,
    string Filter = ArchiveExtractor.DefaultFilter,
    IReadOnlyList<string>? Include = null);

/// <summary>Severity of a progress message reported during extraction.</summary>
public enum ProgressMessageType { Info, Warning, Error }

/// <summary>A single progress update reported during extraction.</summary>
public sealed record ExtractionProgress(
    string Message,
    ProgressMessageType Type = ProgressMessageType.Info,
    int ExtractedCount = 0,
    int SkippedCount = 0);

/// <summary>Final result returned by <see cref="ArchiveExtractor.ExtractAsync"/>.</summary>
public sealed record ExtractionResult(int Extracted, int Skipped);
