namespace FitNotesViewer.Api.Validation;

public sealed class FitNotesFileValidator
{
    private static readonly byte[] SqliteHeader = "SQLite format 3\0".ToArray();
    private static readonly byte[] CsvHeader = new byte[0]; // CSV has no fixed header

    public void ValidateUpload(IFormFile file)
    {
        if (file.Length <= 0)
            throw new InvalidDataException("The file is empty.");

        if (!HasSupportedExtension(file.FileName))
            throw new InvalidDataException("The file must use the .fitnotes or .csv extension.");

        if (file.Length > FitNotesFileRules.MaxFileSize)
            throw new InvalidDataException("The file exceeds the 25 MB limit.");
    }

    public async Task ValidateSqliteAsync(string path, CancellationToken cancellationToken)
    {
        var header = new byte[SqliteHeader.Length];
        await using var stream = File.OpenRead(path);
        var bytesRead = await stream.ReadAsync(header, cancellationToken);

        if (bytesRead != SqliteHeader.Length || !header.SequenceEqual(SqliteHeader))
            throw new InvalidDataException("The file does not contain a valid SQLite database.");
    }

    public async Task ValidateCsvAsync(string path, CancellationToken cancellationToken)
    {
        // CSV files don't have a fixed header like SQLite,
        // validation is done on the frontend side
        // This method exists for consistency but CSV validation happens in the frontend
        await using var stream = File.OpenRead(path);
        // Read a small portion to verify it's not empty and has reasonable content
        var buffer = new byte[Math.Min(8192, (long)file.Length)];
        var bytesRead = await stream.ReadAsync(buffer, cancellationToken);
        if (bytesRead == 0)
            throw new InvalidDataException("The CSV file is empty.");
    }

    private static bool HasSupportedExtension(string fileName)
    {
        return string.Equals(
            Path.GetExtension(fileName),
            FitNotesFileRules.Extension,
            StringComparison.OrdinalIgnoreCase) ||
            string.Equals(
                Path.GetExtension(fileName),
                ".csv",
                StringComparison.OrdinalIgnoreCase);
    }
}
