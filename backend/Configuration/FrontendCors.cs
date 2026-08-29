using Microsoft.AspNetCore.Cors.Infrastructure;

namespace FitNotesViewer.Api.Configuration;

public sealed class FrontendCors
{
    public const string PolicyName = "Frontend";

    private static readonly string[] DefaultOrigins = ["http://localhost:5173"];
    private readonly string[] _allowedOrigins;

    public FrontendCors(IConfiguration configuration)
    {
        _allowedOrigins = ReadOrigins(configuration);
    }

    public void AddPolicy(CorsOptions options)
    {
        options.AddPolicy(PolicyName, ConfigurePolicy);
    }

    private void ConfigurePolicy(CorsPolicyBuilder policy)
    {
        policy
            .WithOrigins(_allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    }

    private static string[] ReadOrigins(IConfiguration configuration)
    {
        var configuredOrigins = configuration["ALLOWED_ORIGINS"];
        if (string.IsNullOrWhiteSpace(configuredOrigins))
            return DefaultOrigins;

        return configuredOrigins.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
}
