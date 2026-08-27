using FitNotesViewer.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace FitNotesViewer.Api.Controllers;

[ApiController]
[Route("api/fitnotes")]
public sealed class FitNotesController : ControllerBase
{
    private readonly FitNotesAnalyzerService _analyzer;

    public FitNotesController(FitNotesAnalyzerService analyzer)
    {
        _analyzer = analyzer;
    }

    [HttpPost("analyze")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> Analyze(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null)
            return BadRequest(new { message = "Select a .fitnotes file." });

        try
        {
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
