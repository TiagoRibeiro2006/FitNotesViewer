using FitNotesViewer.Api.Models;
using FitNotesViewer.Api.Services;
using FitNotesViewer.Api.Validation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace FitNotesViewer.Api.Controllers;

[ApiController]
[Route("api/fitnotes")]
public sealed class FitNotesController : ControllerBase
{
    private readonly IFitNotesAnalyzer _analyzer;

    public FitNotesController(IFitNotesAnalyzer analyzer)
    {
        _analyzer = analyzer;
    }

    [HttpPost("analyze")]
    [RequestSizeLimit(FitNotesFileRules.MaxFileSize)]
    public async Task<ActionResult<FitNotesSummary>> Analyze(
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null)
            return BadRequest(new { message = "Select a .fitnotes or .csv file." });

        try
        {
            if (file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                // CSV import is handled on the frontend
                // The frontend parseFitNotesFile function handles CSV parsing
                return Ok(new { message = "CSV file received. Use the web interface to import this file.", type = "csv" });
            }

            var summary = await _analyzer.AnalyzeAsync(file, cancellationToken);
            return Ok(summary);
        }
        catch (InvalidDataException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (SqliteException)
        {
            return BadRequest(new { message = "This FitNotes backup could not be read." });
        }
    }
}
