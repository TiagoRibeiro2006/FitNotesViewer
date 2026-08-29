using FitNotesViewer.Api.Configuration;
using FitNotesViewer.Api.Data;
using FitNotesViewer.Api.Services;
using FitNotesViewer.Api.Validation;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<IFitNotesAnalyzer, FitNotesAnalyzer>();
builder.Services.AddSingleton<FitNotesDatabaseReader>();
builder.Services.AddSingleton<FitNotesFileValidator>();

var frontendCors = new FrontendCors(builder.Configuration);
builder.Services.AddCors(frontendCors.AddPolicy);

var app = builder.Build();

app.UseCors(FrontendCors.PolicyName);
app.MapControllers();

Func<IResult> apiStatusHandler = GetApiStatus;
app.MapGet("/", apiStatusHandler);

app.Run();

static IResult GetApiStatus()
{
    return Results.Ok(new
    {
        name = "FitNotes Viewer API",
        status = "ok"
    });
}
