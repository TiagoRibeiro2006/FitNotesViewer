namespace FitNotesViewer.Api.Files;

public sealed class TemporaryFitNotesFile : IDisposable
{
    public string Path { get; }

    private TemporaryFitNotesFile(string path)
    {
        Path = path;
    }

    public static async Task<TemporaryFitNotesFile> CreateAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var path = System.IO.Path.Combine(
            System.IO.Path.GetTempPath(),
            $"fitnotes-{Guid.NewGuid():N}.fitnotes");

        try
        {
            await using var output = File.Create(path);
            await file.CopyToAsync(output, cancellationToken);
            return new TemporaryFitNotesFile(path);
        }
        catch
        {
            Delete(path);
            throw;
        }
    }

    public void Dispose()
    {
        Delete(Path);
    }

    private static void Delete(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
