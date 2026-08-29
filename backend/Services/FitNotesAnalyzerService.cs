using FitNotesViewer.Api.Data;
using FitNotesViewer.Api.Files;
using FitNotesViewer.Api.Models;
using FitNotesViewer.Api.Validation;

namespace FitNotesViewer.Api.Services;

public sealed class FitNotesAnalyzerService
{
    private readonly FitNotesFileValidator _fileValidator;
    private readonly FitNotesDatabaseReader _databaseReader;

    public FitNotesAnalyzerService(
        FitNotesFileValidator fileValidator,
        FitNotesDatabaseReader databaseReader)
    {
        _fileValidator = fileValidator;
        _databaseReader = databaseReader;
    }

    public async Task<FitNotesSummary> AnalyzeAsync(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        _fileValidator.ValidateUpload(file);

        using var temporaryFile = await TemporaryFitNotesFile.CreateAsync(
            file,
            cancellationToken);

        await _fileValidator.ValidateSqliteAsync(
            temporaryFile.Path,
            cancellationToken);

        return await _databaseReader.ReadAsync(
            temporaryFile.Path,
            file.FileName,
            cancellationToken);
    }
}
