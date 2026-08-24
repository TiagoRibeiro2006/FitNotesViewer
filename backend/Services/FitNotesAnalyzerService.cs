using FitNotesViewer.Api.Files;
using FitNotesViewer.Api.Models;
using FitNotesViewer.Api.Validation;
using Microsoft.Data.Sqlite;

namespace FitNotesViewer.Api.Services;

public sealed class FitNotesAnalyzerService
{
    private readonly FitNotesFileValidator _fileValidator;

    public FitNotesAnalyzerService(FitNotesFileValidator fileValidator)
    {
        _fileValidator = fileValidator;
    }

    public async Task<FitNotesSummary> AnalyzeAsync(IFormFile file, CancellationToken cancellationToken)
    {
        _fileValidator.ValidateUpload(file);
        using var temporaryFile = await TemporaryFitNotesFile.CreateAsync(file, cancellationToken);
        await _fileValidator.ValidateSqliteAsync(temporaryFile.Path, cancellationToken);

            var connectionString = new SqliteConnectionStringBuilder
            {
                DataSource = temporaryFile.Path,
                Mode = SqliteOpenMode.ReadOnly,
                Cache = SqliteCacheMode.Private,
                Pooling = false
            }.ToString();

            await using var connection = new SqliteConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            await EnsureRequiredTablesAsync(connection, cancellationToken);

            var totalSets = await ExecuteLongAsync(connection,
                "SELECT COUNT(*) FROM training_log;", cancellationToken);

            var totalExercises = await ExecuteLongAsync(connection,
                "SELECT COUNT(*) FROM exercise;", cancellationToken);

            var firstWorkoutDate = await ExecuteNullableStringAsync(connection,
                "SELECT MIN(date) FROM training_log;", cancellationToken);

            var lastWorkoutDate = await ExecuteNullableStringAsync(connection,
                "SELECT MAX(date) FROM training_log;", cancellationToken);

            var topExercises = new List<TopExercise>();

            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT e.name, COUNT(*) AS set_count
                FROM training_log tl
                INNER JOIN exercise e ON e._id = tl.exercise_id
                GROUP BY e._id, e.name
                ORDER BY set_count DESC, e.name ASC
                LIMIT 5;
                """;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                topExercises.Add(new TopExercise
                {
                    Name = reader.GetString(0),
                    Sets = reader.GetInt64(1)
                });
            }

            var workoutSets = new List<WorkoutSet>();

            await using (var workoutCommand = connection.CreateCommand())
            {
                workoutCommand.CommandText = """
                    SELECT tl._id, tl.exercise_id, e.name, tl.date, tl.metric_weight, tl.reps
                    FROM training_log tl
                    INNER JOIN exercise e ON e._id = tl.exercise_id
                    ORDER BY tl.date ASC, tl._id ASC;
                    """;

                await using var workoutReader = await workoutCommand.ExecuteReaderAsync(cancellationToken);
                while (await workoutReader.ReadAsync(cancellationToken))
                {
                    workoutSets.Add(new WorkoutSet
                    {
                        Id = workoutReader.GetInt64(0),
                        ExerciseId = workoutReader.GetInt64(1),
                        ExerciseName = workoutReader.GetString(2),
                        Date = NormalizeDate(workoutReader.GetString(3)) ?? workoutReader.GetString(3),
                        Weight = workoutReader.GetDouble(4),
                        Reps = workoutReader.GetInt32(5)
                    });
                }
            }

        return new FitNotesSummary
            {
                FileName = Path.GetFileName(file.FileName),
                TotalSets = totalSets,
                TotalExercises = totalExercises,
                FirstWorkoutDate = NormalizeDate(firstWorkoutDate),
                LastWorkoutDate = NormalizeDate(lastWorkoutDate),
                TopExercises = topExercises,
                WorkoutSets = workoutSets
            };
    }

    private static async Task EnsureRequiredTablesAsync(SqliteConnection connection, CancellationToken cancellationToken)
    {
        foreach (var tableName in new[] { "training_log", "exercise" })
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $name;";
            command.Parameters.AddWithValue("$name", tableName);

            var exists = Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken)) > 0;
            if (!exists)
                throw new InvalidDataException($"The backup does not contain the required table '{tableName}'.");
        }
    }

    private static async Task<long> ExecuteLongAsync(
        SqliteConnection connection,
        string sql,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
    }

    private static async Task<string?> ExecuteNullableStringAsync(
        SqliteConnection connection,
        string sql,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is null or DBNull ? null : Convert.ToString(result);
    }

    private static string? NormalizeDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return DateTime.TryParse(value, out var date)
            ? date.ToString("yyyy-MM-dd")
            : value;
    }
}
