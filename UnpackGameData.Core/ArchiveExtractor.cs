using System.Text.RegularExpressions;

namespace X4SaveAnalyser.UnpackGameData;

/// <summary>
/// Extracts files from X4: Foundations .cat / .dat archive pairs.
/// </summary>
public static class ArchiveExtractor
{
    public const string DefaultFilter = "^.*(xml|xsd|html|js|css|lua)$";

    /// <summary>
    /// Extracts files from all matching archives in <see cref="ExtractionOptions.SourceDir"/>
    /// into <see cref="ExtractionOptions.DestDir"/> asynchronously, reporting progress via
    /// <paramref name="progress"/>.
    /// </summary>
    public static async Task<ExtractionResult> ExtractAsync(
        ExtractionOptions options,
        IProgress<ExtractionProgress>? progress = null,
        CancellationToken cancellationToken = default)
    {
        return await Task.Run(
            () => Extract(options, progress, cancellationToken),
            cancellationToken).ConfigureAwait(false);
    }

    private static ExtractionResult Extract(
        ExtractionOptions options,
        IProgress<ExtractionProgress>? progress,
        CancellationToken cancellationToken)
    {
        if (!Directory.Exists(options.SourceDir))
            throw new DirectoryNotFoundException($"Source directory does not exist: {options.SourceDir}");

        Regex pattern;
        try
        {
            pattern = new Regex(options.Filter, RegexOptions.IgnoreCase | RegexOptions.Compiled);
        }
        catch (ArgumentException ex)
        {
            throw new ArgumentException($"Invalid filter regex: {ex.Message}", nameof(options), ex);
        }

        Directory.CreateDirectory(options.DestDir);

        IEnumerable<string> catFiles = (options.Include is { Count: > 0 })
            ? options.Include.Select(name => Path.Combine(options.SourceDir, name))
            : Directory.EnumerateFiles(options.SourceDir, "*.cat", SearchOption.AllDirectories);

        int totalExtracted = 0;
        int totalSkipped = 0;

        foreach (string catFile in catFiles)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!File.Exists(catFile))
            {
                progress?.Report(new($"Cat file not found, skipping: {Path.GetFileName(catFile)}",
                    ProgressMessageType.Warning));
                continue;
            }

            string datFile = Path.ChangeExtension(catFile, ".dat");
            if (!File.Exists(datFile))
            {
                progress?.Report(new($"Matching .dat not found for {Path.GetFileName(catFile)}, skipping.",
                    ProgressMessageType.Warning));
                continue;
            }

            progress?.Report(new($"Processing: {Path.GetRelativePath(options.SourceDir, catFile)}"));

            string catRelDir = Path.GetRelativePath(options.SourceDir, Path.GetDirectoryName(catFile)!);
            string catOutDir = catRelDir == "." ? options.DestDir : Path.Combine(options.DestDir, catRelDir);

            var (extracted, skipped) = ProcessArchive(
                catFile, datFile, catOutDir, pattern, progress, cancellationToken);

            totalExtracted += extracted;
            totalSkipped += skipped;

            progress?.Report(new(
                $"  \u2192 Extracted: {extracted:N0}, Skipped: {skipped:N0}",
                ProgressMessageType.Info,
                totalExtracted,
                totalSkipped));
        }

        progress?.Report(new(
            $"Done. Total extracted: {totalExtracted:N0}, Total skipped: {totalSkipped:N0}",
            ProgressMessageType.Info,
            totalExtracted,
            totalSkipped));

        return new ExtractionResult(totalExtracted, totalSkipped);
    }

    private static (int extracted, int skipped) ProcessArchive(
        string catFile,
        string datFile,
        string outDir,
        Regex pattern,
        IProgress<ExtractionProgress>? progress,
        CancellationToken cancellationToken)
    {
        int extracted = 0;
        int skipped = 0;

        using FileStream datStream = new(datFile, FileMode.Open, FileAccess.Read, FileShare.Read);
        using StreamReader catReader = new(catFile);

        string? line;
        while ((line = catReader.ReadLine()) != null)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (string.IsNullOrEmpty(line)) continue;

            // Cat line format: "<embedded/path with optional spaces> <size> <modified_epoch> <hash>"
            // The last 3 space-separated tokens are size, epoch, hash. Everything before is the filepath.
            string[] parts = line.Split(' ');
            if (parts.Length < 4)
            {
                progress?.Report(new($"Malformed cat entry, skipping: {line}", ProgressMessageType.Warning));
                continue;
            }

            string embeddedPath = string.Join(' ', parts, 0, parts.Length - 3);
            string sizeText = parts[^3];

            if (!long.TryParse(sizeText, out long size) || size < 0)
            {
                progress?.Report(new(
                    $"Invalid size '{sizeText}' for entry: {embeddedPath}",
                    ProgressMessageType.Warning));
                continue;
            }

            if (pattern.IsMatch(embeddedPath))
            {
                string relDir = (Path.GetDirectoryName(embeddedPath) ?? string.Empty)
                    .Replace('/', Path.DirectorySeparatorChar);
                string outDirFull = Path.Combine(outDir, relDir);
                string outPath = Path.Combine(outDirFull, Path.GetFileName(embeddedPath));

                long posBeforeRead = datStream.Position;

                try
                {
                    Directory.CreateDirectory(outDirFull);
                    using FileStream outStream = new(outPath, FileMode.Create, FileAccess.Write, FileShare.None);
                    CopyExact(datStream, outStream, size);
                    extracted++;
                }
                catch (IOException ex)
                {
                    progress?.Report(new(
                        $"[IOERROR] {outPath}: {ex.Message}",
                        ProgressMessageType.Error));

                    // Seek past this entry to stay aligned with the .dat stream.
                    datStream.Seek(posBeforeRead + size, SeekOrigin.Begin);
                }
            }
            else
            {
                SkipBytes(datStream, size);
                skipped++;
            }
        }

        return (extracted, skipped);
    }

    private static void CopyExact(Stream source, Stream dest, long count)
    {
        byte[] buffer = new byte[81920];
        long remaining = count;
        while (remaining > 0)
        {
            int toRead = (int)Math.Min(buffer.Length, remaining);
            int read = source.Read(buffer, 0, toRead);
            if (read == 0)
                throw new EndOfStreamException("Unexpected end of .dat stream while extracting entry.");
            dest.Write(buffer, 0, read);
            remaining -= read;
        }
    }

    private static void SkipBytes(Stream stream, long count)
    {
        if (stream.CanSeek)
        {
            stream.Seek(count, SeekOrigin.Current);
            return;
        }

        byte[] buffer = new byte[81920];
        long remaining = count;
        while (remaining > 0)
        {
            int toRead = (int)Math.Min(buffer.Length, remaining);
            int read = stream.Read(buffer, 0, toRead);
            if (read == 0)
                throw new EndOfStreamException("Unexpected end of .dat stream while skipping entry.");
            remaining -= read;
        }
    }
}
