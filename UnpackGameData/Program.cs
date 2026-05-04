using X4SaveAnalyser.UnpackGameData;

if (args.Length == 0 || args.Any(a => a is "-h" or "--help" or "/?"))
{
    PrintUsage();
    return args.Length == 0 ? 1 : 0;
}

if (!TryParseArgs(args, out var options))
    return 1;

var progress = new Progress<ExtractionProgress>(p =>
{
    var writer = p.Type == ProgressMessageType.Error ? Console.Error : Console.Out;
    writer.WriteLine(p.Message);
});

try
{
    var result = await ArchiveExtractor.ExtractAsync(options!, progress);
    Console.WriteLine($"\nDone. Extracted: {result.Extracted:N0}, Skipped: {result.Skipped:N0}");
    return 0;
}
catch (DirectoryNotFoundException ex)
{
    Console.Error.WriteLine($"[ERROR] {ex.Message}");
    return 2;
}
catch (ArgumentException ex)
{
    Console.Error.WriteLine($"[ERROR] {ex.Message}");
    return 3;
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine("[INFO] Cancelled.");
    return 4;
}

static bool TryParseArgs(string[] args, out ExtractionOptions? options)
{
    options = null;
    string? sourceDir = null;
    string? destDir = null;
    string filter = ArchiveExtractor.DefaultFilter;
    var include = new List<string>();

    for (int i = 0; i < args.Length; i++)
    {
        string arg = args[i];

        if (arg is "-f" or "--filter")
        {
            if (i + 1 >= args.Length)
            {
                Console.Error.WriteLine("[ERROR] Missing value for --filter");
                return false;
            }
            filter = args[++i];
        }
        else if (arg is "-i" or "--include")
        {
            while (i + 1 < args.Length && !args[i + 1].StartsWith('-'))
                include.Add(args[++i]);
        }
        else if (sourceDir is null)
        {
            sourceDir = arg;
        }
        else if (destDir is null)
        {
            destDir = arg;
        }
        else
        {
            Console.Error.WriteLine($"[ERROR] Unexpected argument: {arg}");
            PrintUsage();
            return false;
        }
    }

    if (sourceDir is null || destDir is null)
    {
        Console.Error.WriteLine("[ERROR] sourcedir and destdir are required.");
        PrintUsage();
        return false;
    }

    options = new ExtractionOptions(sourceDir, destDir, filter, include);
    return true;
}

static void PrintUsage()
{
    Console.WriteLine("Usage: unpack-game-data <sourcedir> <destdir> [-f <regex>] [-i <file1> <file2> ...]");
    Console.WriteLine();
    Console.WriteLine("Arguments:");
    Console.WriteLine("  sourcedir         Directory containing .cat / .dat archive pairs.");
    Console.WriteLine("  destdir           Directory where extracted files will be written.");
    Console.WriteLine();
    Console.WriteLine("Options:");
    Console.WriteLine($"  -f, --filter      Regex of file paths to extract (default: {ArchiveExtractor.DefaultFilter}).");
    Console.WriteLine("  -i, --include     Specific .cat filenames to process (default: all .cat files).");
    Console.WriteLine("  -h, --help        Show this help message.");
}

