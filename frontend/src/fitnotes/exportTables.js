// Parents precede children so local IDs can be mapped consistently.
export const EXPORT_TABLES = [
  { store: 'categories', table: 'Category', fields: { name: 'name', colour: 'colour', sort_order: 'sortOrder' } },
  { store: 'exercises', table: 'exercise', fields: {
    name: 'name', category_id: 'categoryId', exercise_type_id: 'exerciseTypeId', notes: 'notes',
    weight_increment: 'weightIncrement', default_graph_id: 'defaultGraphId', default_rest_time: 'defaultRestTime',
  }, references: { categoryId: 'categories' } },
  { store: 'routineSectionExercises', table: 'RoutineSectionExercise', fields: {
    routine_section_id: 'routineSectionId', exercise_id: 'exerciseId', sort_order: 'sortOrder', populate_sets_type: 'populateSetsType',
  }, references: { exerciseId: 'exercises' } },
  { store: 'routineSectionExerciseSets', table: 'RoutineSectionExerciseSet', fields: {
    routine_section_exercise_id: 'routineSectionExerciseId', metric_weight: 'weight', reps: 'reps',
    sort_order: 'sortOrder', distance: 'distance', duration_seconds: 'durationSeconds', unit: 'unit',
  }, references: { routineSectionExerciseId: 'routineSectionExercises' } },
  { store: 'workoutSets', table: 'training_log', fields: {
    exercise_id: 'exerciseId', date: 'date', metric_weight: 'weight', reps: 'reps', unit: 'unit',
    routine_section_exercise_set_id: 'routineSectionExerciseSetId', timer_auto_start: 'timerAutoStart',
    is_personal_record: 'isPersonalRecord', is_personal_record_first: 'isPersonalRecordFirst',
    is_complete: 'isComplete', distance: 'distance', duration_seconds: 'durationSeconds',
  }, references: { exerciseId: 'exercises', routineSectionExerciseSetId: 'routineSectionExerciseSets' } },
]
