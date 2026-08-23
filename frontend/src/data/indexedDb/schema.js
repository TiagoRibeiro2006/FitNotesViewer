export const DB_NAME = 'fitnotes-viewer'
export const DB_VERSION = 2
export const LEGACY_STORAGE_KEY = 'fitnotes-viewer-data-v2'

export const STORE_DEFINITIONS = {
  metadata: { keyPath: 'key' },
  backups: { keyPath: 'key' },
  exercises: { keyPath: 'id' },
  workoutSets: { keyPath: 'id', indexes: [['date', 'date'], ['exerciseId', 'exerciseId'], ['dateExercise', ['date', 'exerciseId']]] },
  categories: { keyPath: 'id' },
  bodyWeights: { keyPath: 'id', indexes: [['date', 'date']] },
  measurements: { keyPath: 'id' },
  measurementUnits: { keyPath: 'id' },
  measurementRecords: { keyPath: 'id', indexes: [['date', 'date'], ['measurementId', 'measurementId']] },
  workoutTimes: { keyPath: 'id', indexes: [['date', 'date']] },
  workoutComments: { keyPath: 'id', indexes: [['date', 'date']] },
  routines: { keyPath: 'id' },
  routineSections: { keyPath: 'id', indexes: [['routineId', 'routineId']] },
  routineSectionExercises: { keyPath: 'id', indexes: [['routineSectionId', 'routineSectionId'], ['exerciseId', 'exerciseId']] },
  routineSectionExerciseSets: { keyPath: 'id', indexes: [['routineSectionExerciseId', 'routineSectionExerciseId']] },
}
