namespace FitNotesViewer.Api.Models;

public sealed class WorkoutSet
{
    public long Id { get; init; }
    public long ExerciseId { get; init; }
    public required string ExerciseName { get; init; }
    public required string Date { get; init; }
    public double Weight { get; init; }
    public int Reps { get; init; }
}
