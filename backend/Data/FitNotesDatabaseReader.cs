using FitNotesViewer.Api.Models;
using Microsoft.Data.Sqlite;

namespace FitNotesViewer.Api.Data;

public sealed class FitNotesDatabaseReader
{
    private static readonly string[] RequiredTables = ["training_log", "exercise"];

    private const string CountSetsQuery = "SELECT COUNT(*) FROM training_log;";
    private const string CountExercisesQuery = "SELECT COUNT(*) FROM exercise;";
    private const string FirstWorkoutDateQuery = "SELECT MIN(date) FROM training_log;";
    private const string LastWorkoutDateQuery = "SELECT MAX(date) FROM training_log;";

    private const string TopExercisesQuery = """
        SELECT e.name, COUNT(*) AS set_count
        FROM training_log tl
        INNER JOIN exercise e ON e._id = tl.exercise_id
        GROUP BY e._id, e.name
        ORDER BY set_count DESC, e.name ASC
        LIMIT 5;
        """;

    private const string WorkoutSetsQuery = """
        SELECT tl._id, tl.exercise_id, e.name, tl.date, tl.metric_weight, tl.reps
        FROM training_log tl
        INNER JOIN exercise e ON e._id = tl.exercise_id
        ORDER BY tl.date ASC, tl._id ASC;
        """;

    public async Task<FitNotesSummary> ReadAsync(
        string databasePath,
        string fileName,
        CancellationToken cancellationToken)
    {
        await using var connection = CreateConnection(databasePath);
        await connection.OpenAsync(cancellationToken);
        await EnsureRequiredTablesAsync(connection, cancellationToken);

        return new FitNotesSummary
        {
            FileName = Path.GetFileName(fileName),
            TotalSets = await ReadLongAsync(connection, CountSetsQuery, cancellationToken),
            TotalExercises = await ReadLongAsync(connection, CountExercisesQuery, cancellationToken),
            FirstWorkoutDate = NormalizeDate(
                await ReadStringAsync(connection, FirstWorkoutDateQuery, cancellationToken)),
            LastWorkoutDate = NormalizeDate(
                await ReadStringAsync(connection, LastWorkoutDateQuery, cancellationToken)),
            TopExercises = await ReadTopExercisesAsync(connection, cancellationToken),
            WorkoutSets = await ReadWorkoutSetsAsync(connection, cancellationToken)
        };
    }

    private static SqliteConnection CreateConnection(string databasePath)
    {
        var connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = databasePath,
            Mode = SqliteOpenMode.ReadOnly,
            Cache = SqliteCacheMode.Private,
            Pooling = false
        }.ToString();

        return new SqliteConnection(connectionString);
    }

    private static async Task EnsureRequiredTablesAsync(
        SqliteConnection connection,
        CancellationToken cancellationToken)
    {
        foreach (var tableName in RequiredTables)
        {
            if (!await TableExistsAsync(connection, tableName, cancellationToken))
                throw new InvalidDataException(
                    $"The backup does not contain the required table '{tableName}'.");
        }
    }

    private static async Task<bool> TableExistsAsync(
        SqliteConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $name;";
        command.Parameters.AddWithValue("$name", tableName);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(result) > 0;
    }

    private static async Task<long> ReadLongAsync(
        SqliteConnection connection,
        string query,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = query;
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(result);
    }

    private static async Task<string?> ReadStringAsync(
        SqliteConnection connection,
        string query,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = query;
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is null or DBNull ? null : Convert.ToString(result);
    }

    private static async Task<IReadOnlyList<TopExercise>> ReadTopExercisesAsync(
        SqliteConnection connection,
        CancellationToken cancellationToken)
    {
        var exercises = new List<TopExercise>();
        await using var command = connection.CreateCommand();
        command.CommandText = TopExercisesQuery;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            exercises.Add(new TopExercise
            {
                Name = reader.GetString(0),
                Sets = reader.GetInt64(1)
            });
        }

        return exercises;
    }

    private static async Task<IReadOnlyList<WorkoutSet>> ReadWorkoutSetsAsync(
        SqliteConnection connection,
        CancellationToken cancellationToken)
    {
        var sets = new List<WorkoutSet>();
        await using var command = connection.CreateCommand();
        command.CommandText = WorkoutSetsQuery;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            var originalDate = reader.GetString(3);
            sets.Add(new WorkoutSet
            {
                Id = reader.GetInt64(0),
                ExerciseId = reader.GetInt64(1),
                ExerciseName = reader.GetString(2),
                Date = NormalizeDate(originalDate) ?? originalDate,
                Weight = reader.GetDouble(4),
                Reps = reader.GetInt32(5)
            });
        }

        return sets;
    }

    private static string? NormalizeDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (!DateTime.TryParse(value, out var date))
            return value;

        return date.ToString("yyyy-MM-dd");
    }
}
