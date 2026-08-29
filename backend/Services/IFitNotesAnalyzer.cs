using FitNotesViewer.Api.Models;

namespace FitNotesViewer.Api.Services;

public interface IFitNotesAnalyzer
{
    Task<FitNotesSummary> AnalyzeAsync(
        IFormFile file,
        CancellationToken cancellationToken);
}
