namespace FitNotesViewer.Api.Validation;

public sealed class FitNotesFileValidator
{
    private const long MaxFileSize = 25 * 1024 * 1024;
    private static readonly byte[] SqliteHeader = "SQLite format 3\0"u8.ToArray();

    public void ValidateUpload(IFormFile file)
    {
        if (file.Length <= 0)
            throw new InvalidDataException("The file is empty.");

        if (!HasFitNotesExtension(file.FileName))
            throw new InvalidDataException("The file must use the .fitnotes extension.");

        if (file.Length > MaxFileSize)
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

    private static bool HasFitNotesExtension(string fileName)
    {
        return string.Equals(
            Path.GetExtension(fileName),
            ".fitnotes",
            StringComparison.OrdinalIgnoreCase);
    }
}
