namespace FitNotesViewer.Api.Models;

public sealed class FitNotesSummary
{
    public required string FileName { get; init; }
    public long TotalSets { get; init; }
    public long TotalExercises { get; init; }
    public string? FirstWorkoutDate { get; init; }
    public string? LastWorkoutDate { get; init; }
    public IReadOnlyList<TopExercise> TopExercises { get; init; } = [];
    public IReadOnlyList<WorkoutSet> WorkoutSets { get; init; } = [];
}
