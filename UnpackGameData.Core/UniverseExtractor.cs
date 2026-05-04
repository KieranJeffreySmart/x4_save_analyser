using System.IO.Compression;
using System.Xml;
using System.Xml.Linq;

namespace X4SaveAnalyser.UnpackGameData;

/// <summary>
/// Extracts the &lt;universe&gt; element from an X4 save file into a
/// standalone &lt;savegame&gt; XML document.
/// </summary>
public static class UniverseExtractor
{
    public static async Task ExtractAsync(
        string sourcePath,
        string destPath,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default)
    {
        await Task.Run(
            () => Extract(sourcePath, destPath, progress, cancellationToken),
            cancellationToken).ConfigureAwait(false);
    }

    private static void Extract(
        string sourcePath,
        string destPath,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        if (!File.Exists(sourcePath))
            throw new FileNotFoundException($"Save file not found: {sourcePath}");

        progress?.Report($"Loading: {Path.GetFileName(sourcePath)}");

        bool isGzip = IsGzipFile(sourcePath);
        if (isGzip)
            progress?.Report("Detected gzip-compressed save file, decompressing…");

        XElement? universeEl = null;

        var readerSettings = new XmlReaderSettings { DtdProcessing = DtdProcessing.Ignore };

        using FileStream fileStream = new(sourcePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        Stream readStream = isGzip ? new GZipStream(fileStream, CompressionMode.Decompress) : fileStream;

        try
        {
            using XmlReader reader = XmlReader.Create(readStream, readerSettings);
            while (reader.Read())
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (reader.NodeType == XmlNodeType.Element && reader.LocalName == "universe")
                {
                    universeEl = (XElement)XNode.ReadFrom(reader);
                    break;
                }
            }
        }
        finally
        {
            if (isGzip) readStream.Dispose();
        }

        if (universeEl is null)
            throw new InvalidDataException("No <universe> element found in save file.");

        progress?.Report("Extracting universe element…");

        cancellationToken.ThrowIfCancellationRequested();

        string? destDir = Path.GetDirectoryName(destPath);
        if (!string.IsNullOrEmpty(destDir))
            Directory.CreateDirectory(destDir);

        var output = new XDocument(new XElement("savegame", universeEl));
        output.Save(destPath);

        progress?.Report($"Saved to: {destPath}");
    }

    /// <summary>
    /// Detects gzip by magic bytes (1F 8B) rather than file extension,
    /// so both .xml.gz and .xml files that happen to be gzip-compressed are handled.
    /// </summary>
    private static bool IsGzipFile(string path)
    {
        Span<byte> header = stackalloc byte[2];
        using FileStream fs = new(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return fs.Read(header) == 2 && header[0] == 0x1F && header[1] == 0x8B;
    }
}
