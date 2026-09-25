import { openAppDatabase } from '../indexedDb/database'
import { DB_VERSION, LEGACY_STORAGE_KEY, STORE_DEFINITIONS } from '../indexedDb/schema'
import { putMany, requestResult, transactionComplete } from '../indexedDb/transactions'
import { getSummary } from './summaryRepository'

export async function saveFitNotesImport(parsed, file, bytes) {
  const database = await openAppDatabase()
  const stores = Object.keys(STORE_DEFINITIONS)
  const transaction = database.transaction(stores, 'readwrite')

  for (const storeName of stores) transaction.objectStore(storeName).clear()

  const importedAt = new Date().toISOString()
  const metadataStore = transaction.objectStore('metadata')
  metadataStore.put({ key: 'summary', value: parsed.summary })
  metadataStore.put({ key: 'storageSchemaVersion', value: DB_VERSION })
  metadataStore.put({ key: 'importedAt', value: importedAt })
  metadataStore.put({ key: 'source', value: 'fitnotes-' + (parsed.summary.importFormat ?? 'sqlite') })
  metadataStore.put({ key: 'hasLocalChanges', value: false })

  if (parsed.summary.backupStored) {
    transaction.objectStore('backups').put({
      key: 'current',
      name: file.name,
      size: file.size,
      type: file.type || 'application/vnd.sqlite3',
      lastModified: file.lastModified || null,
      importedAt,
      data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    })
  }

  putMany(transaction.objectStore('exercises'), parsed.exercises)
  putMany(transaction.objectStore('workoutSets'), parsed.workoutSets)
  putMany(transaction.objectStore('categories'), parsed.categories)
  putMany(transaction.objectStore('bodyWeights'), parsed.bodyWeights)
  putMany(transaction.objectStore('measurements'), parsed.measurements)
  putMany(transaction.objectStore('measurementUnits'), parsed.measurementUnits)
  putMany(transaction.objectStore('measurementRecords'), parsed.measurementRecords)
  putMany(transaction.objectStore('workoutTimes'), parsed.workoutTimes)
  putMany(transaction.objectStore('workoutComments'), parsed.workoutComments)
  putMany(transaction.objectStore('routines'), parsed.routines)
  putMany(transaction.objectStore('routineSections'), parsed.routineSections)
  putMany(transaction.objectStore('routineSectionExercises'), parsed.routineSectionExercises)
  putMany(transaction.objectStore('routineSectionExerciseSets'), parsed.routineSectionExerciseSets)
  await transactionComplete(transaction)
}

export async function migrateLegacyLocalStorage() {
  if (await getSummary()) return false

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return false

  const legacy = parseLegacyData(raw)
  if (!Array.isArray(legacy?.workoutSets)) return false

  const parsed = buildLegacyImport(legacy)
  const database = await openAppDatabase()
  const transaction = database.transaction(['metadata', 'exercises', 'workoutSets'], 'readwrite')
  transaction.objectStore('metadata').put({ key: 'summary', value: parsed.summary })
  transaction.objectStore('metadata').put({ key: 'storageSchemaVersion', value: DB_VERSION })
  transaction.objectStore('metadata').put({ key: 'source', value: 'legacy-localStorage' })
  transaction.objectStore('metadata').put({ key: 'hasLocalChanges', value: false })
  putMany(transaction.objectStore('exercises'), parsed.exercises)
  putMany(transaction.objectStore('workoutSets'), parsed.workoutSets)
  await transactionComplete(transaction)

  localStorage.removeItem(LEGACY_STORAGE_KEY)
  return true
}

export async function getFitNotesExportData() {
  const database = await openAppDatabase()
  const storeNames = [
    'backups',
    'workoutSets',
    'bodyWeights',
    'measurements',
    'measurementUnits',
    'measurementRecords',
    'categories',
    'exercises',
    'routineSectionExercises',
    'routineSectionExerciseSets',
  ]
  const transaction = database.transaction(storeNames, 'readonly')
  const done = transactionComplete(transaction)
  const results = await Promise.all([
    requestResult(transaction.objectStore('backups').get('current')),
    requestResult(transaction.objectStore('workoutSets').getAll()),
    requestResult(transaction.objectStore('bodyWeights').getAll()),
    requestResult(transaction.objectStore('measurements').getAll()),
    requestResult(transaction.objectStore('measurementUnits').getAll()),
    requestResult(transaction.objectStore('measurementRecords').getAll()),
    requestResult(transaction.objectStore('categories').getAll()),
    requestResult(transaction.objectStore('exercises').getAll()),
    requestResult(transaction.objectStore('routineSectionExercises').getAll()),
    requestResult(transaction.objectStore('routineSectionExerciseSets').getAll()),
  ])
  await done

  const record = results[0]
  if (!record?.data) return null
  return {
    bytes: new Uint8Array(record.data.slice(0)),
    workoutSets: results[1] ?? [],
    bodyWeights: results[2] ?? [],
    measurements: results[3] ?? [],
    measurementUnits: results[4] ?? [],
    measurementRecords: results[5] ?? [],
    categories: results[6] ?? [],
    exercises: results[7] ?? [],
    routineSectionExercises: results[8] ?? [],
    routineSectionExerciseSets: results[9] ?? [],
  }
}

export async function getFitNotesCsvExportData() {
  const database = await openAppDatabase()
  const storeNames = [
    'workoutSets',
    'exercises',
    'categories',
    'bodyWeights',
    'measurements',
    'measurementUnits',
    'measurementRecords',
  ]
  const transaction = database.transaction(storeNames, 'readonly')
  const done = transactionComplete(transaction)
  const results = await Promise.all(storeNames.map((storeName) => (
    requestResult(transaction.objectStore(storeName).getAll())
  )))
  await done

  return {
    workoutSets: results[0] ?? [],
    exercises: results[1] ?? [],
    categories: results[2] ?? [],
    bodyWeights: results[3] ?? [],
    measurements: results[4] ?? [],
    measurementUnits: results[5] ?? [],
    measurementRecords: results[6] ?? [],
  }
}

export async function clearLocalData() {
  const database = await openAppDatabase()
  const stores = Object.keys(STORE_DEFINITIONS)
  const transaction = database.transaction(stores, 'readwrite')
  for (const storeName of stores) transaction.objectStore(storeName).clear()
  await transactionComplete(transaction)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function parseLegacyData(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return null
  }
}

function buildLegacyImport(legacy) {
  const exercisesById = new Map()
  for (const set of legacy.workoutSets) {
    if (!exercisesById.has(set.exerciseId)) {
      exercisesById.set(set.exerciseId, {
        id: Number(set.exerciseId ?? 0),
        name: String(set.exerciseName ?? ''),
        categoryId: null,
        exerciseTypeId: null,
        notes: null,
      })
    }
  }

  return {
    summary: {
      fileName: legacy.fileName ?? 'Migrated FitNotes data',
      totalSets: Number(legacy.totalSets ?? legacy.workoutSets.length),
      totalExercises: Number(legacy.totalExercises ?? exercisesById.size),
      firstWorkoutDate: legacy.firstWorkoutDate ?? null,
      lastWorkoutDate: legacy.lastWorkoutDate ?? null,
      backupStored: false,
      migratedFromLocalStorage: true,
    },
    exercises: [...exercisesById.values()],
    workoutSets: legacy.workoutSets.map((set) => ({
      ...set,
      id: Number(set.id ?? 0),
      exerciseId: Number(set.exerciseId ?? 0),
      exerciseName: String(set.exerciseName ?? ''),
      date: String(set.date ?? ''),
    })),
  }
}
