const DB_NAME = 'fitnotes-viewer'
const DB_VERSION = 1
const LEGACY_STORAGE_KEY = 'fitnotes-viewer-data-v2'

const STORE_DEFINITIONS = {
  metadata: { keyPath: 'key' },
  backups: { keyPath: 'key' },
  exercises: { keyPath: 'id' },
  workoutSets: { keyPath: 'id', indexes: [['date', 'date'], ['exerciseId', 'exerciseId'], ['dateExercise', ['date', 'exerciseId']]] },
  categories: { keyPath: 'id' },
  bodyWeights: { keyPath: 'id', indexes: [['date', 'date']] },
  measurements: { keyPath: 'id' },
  measurementRecords: { keyPath: 'id', indexes: [['date', 'date'], ['measurementId', 'measurementId']] },
  workoutTimes: { keyPath: 'id', indexes: [['date', 'date']] },
  workoutComments: { keyPath: 'id', indexes: [['date', 'date']] },
  routines: { keyPath: 'id' },
  routineSections: { keyPath: 'id', indexes: [['routineId', 'routineId']] },
  routineSectionExercises: { keyPath: 'id', indexes: [['routineSectionId', 'routineSectionId'], ['exerciseId', 'exerciseId']] },
  routineSectionExerciseSets: { keyPath: 'id', indexes: [['routineSectionExerciseId', 'routineSectionExerciseId']] },
}

let dbPromise

export function openAppDatabase() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result

        for (const [name, definition] of Object.entries(STORE_DEFINITIONS)) {
          let store

          if (!db.objectStoreNames.contains(name)) {
            store = db.createObjectStore(name, { keyPath: definition.keyPath })
          } else {
            store = request.transaction.objectStore(name)
          }

          for (const [indexName, keyPath] of definition.indexes ?? []) {
            if (!store.indexNames.contains(indexName)) {
              store.createIndex(indexName, keyPath, { unique: false })
            }
          }
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'))
      request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another open app window.'))
    })
  }

  return dbPromise
}

export async function saveFitNotesImport(parsed, file, bytes) {
  const db = await openAppDatabase()
  const stores = Object.keys(STORE_DEFINITIONS)
  const transaction = db.transaction(stores, 'readwrite')

  for (const storeName of stores) {
    transaction.objectStore(storeName).clear()
  }

  const metadataStore = transaction.objectStore('metadata')
  metadataStore.put({ key: 'summary', value: parsed.summary })
  metadataStore.put({ key: 'storageSchemaVersion', value: DB_VERSION })
  metadataStore.put({ key: 'importedAt', value: new Date().toISOString() })
  metadataStore.put({ key: 'source', value: 'fitnotes' })
  metadataStore.put({ key: 'hasLocalChanges', value: false })

  transaction.objectStore('backups').put({
    key: 'current',
    name: file.name,
    size: file.size,
    type: file.type || 'application/vnd.sqlite3',
    lastModified: file.lastModified || null,
    importedAt: new Date().toISOString(),
    data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  })

  putMany(transaction.objectStore('exercises'), parsed.exercises)
  putMany(transaction.objectStore('workoutSets'), parsed.workoutSets)
  putMany(transaction.objectStore('categories'), parsed.categories)
  putMany(transaction.objectStore('bodyWeights'), parsed.bodyWeights)
  putMany(transaction.objectStore('measurements'), parsed.measurements)
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
  const existingSummary = await getSummary()
  if (existingSummary) return false

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return false

  let legacy
  try {
    legacy = JSON.parse(raw)
  } catch {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return false
  }

  if (!Array.isArray(legacy?.workoutSets)) return false

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

  const parsed = {
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

  const db = await openAppDatabase()
  const transaction = db.transaction(['metadata', 'exercises', 'workoutSets'], 'readwrite')

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

export async function getSummary() {
  const db = await openAppDatabase()
  const transaction = db.transaction('metadata', 'readonly')
  const done = transactionComplete(transaction)
  const record = await requestResult(transaction.objectStore('metadata').get('summary'))
  await done
  return record?.value ?? null
}

export async function getBodyFavorites() {
  const db = await openAppDatabase()
  const transaction = db.transaction(['bodyWeights', 'measurements', 'measurementRecords'], 'readonly')
  const done = transactionComplete(transaction)

  const bodyWeightsRequest = transaction.objectStore('bodyWeights').getAll()
  const measurementsRequest = transaction.objectStore('measurements').getAll()
  const recordsRequest = transaction.objectStore('measurementRecords').getAll()
  const [bodyWeights, measurements, records] = await Promise.all([
    requestResult(bodyWeightsRequest),
    requestResult(measurementsRequest),
    requestResult(recordsRequest),
  ])
  await done

  return [
    buildBodyWeightFavorite('body-fat', 'Body Fat', '%', bodyWeights, 'bodyFat'),
    buildBodyWeightFavorite('body-weight', 'Body Weight', 'kg', bodyWeights, 'bodyWeightMetric'),
    buildMeasurementFavorite('muscle-mass', 'Muscle Mass', 'kg', measurements, records),
    buildMeasurementFavorite('visceral-fat', 'Visceral Fat', '%', measurements, records),
  ]
}

export async function getWorkoutDateSet() {
  const db = await openAppDatabase()
  const transaction = db.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const rows = await requestResult(transaction.objectStore('workoutSets').getAll())
  await done

  return new Set((rows ?? []).map((row) => row.date).filter(Boolean))
}

export async function getWorkoutSetsForDate(date) {
  const db = await openAppDatabase()
  const transaction = db.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const request = transaction.objectStore('workoutSets').index('date').getAll(date)
  const rows = await requestResult(request)
  await done
  return orderWorkoutDayRows(rows ?? [])
}

export async function getWorkoutSetsForDateExercise(date, exerciseId) {
  const db = await openAppDatabase()
  const transaction = db.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const request = transaction.objectStore('workoutSets').index('dateExercise').getAll([date, exerciseId])
  const rows = await requestResult(request)
  await done
  return (rows ?? []).sort(compareSetRows)
}

export async function getPreviousWorkoutSetsForExercise(exerciseId, beforeDate) {
  const db = await openAppDatabase()
  const transaction = db.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const rows = await requestResult(transaction.objectStore('workoutSets').index('exerciseId').getAll(exerciseId))
  await done

  const previousRows = (rows ?? []).filter((row) => row.date && row.date < beforeDate)
  if (!previousRows.length) return { date: null, sets: [] }

  const previousDate = previousRows.reduce((latest, row) => (row.date > latest ? row.date : latest), previousRows[0].date)
  return {
    date: previousDate,
    sets: previousRows.filter((row) => row.date === previousDate).sort(compareSetRows),
  }
}

export async function getExerciseCatalog() {
  const db = await openAppDatabase()
  const transaction = db.transaction(['exercises', 'categories', 'workoutSets'], 'readonly')
  const done = transactionComplete(transaction)

  const exerciseRequest = transaction.objectStore('exercises').getAll()
  const categoryRequest = transaction.objectStore('categories').getAll()
  const setRequest = transaction.objectStore('workoutSets').getAll()

  const [exercises, categories, workoutSets] = await Promise.all([
    requestResult(exerciseRequest),
    requestResult(categoryRequest),
    requestResult(setRequest),
  ])
  await done

  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]))
  const usage = new Map()

  for (const set of workoutSets ?? []) {
    let stats = usage.get(set.exerciseId)
    if (!stats) {
      stats = { dates: new Set(), totalSets: 0, lastDate: null }
      usage.set(set.exerciseId, stats)
    }
    if (set.date) stats.dates.add(set.date)
    stats.totalSets += 1
    if (set.date && (!stats.lastDate || set.date > stats.lastDate)) stats.lastDate = set.date
  }

  const catalog = (exercises ?? []).map((exercise) => {
    const category = categoriesById.get(exercise.categoryId)
    const stats = usage.get(exercise.id)
    return {
      ...exercise,
      categoryName: category?.name ?? 'Other',
      categoryColor: category?.colour ?? null,
      workoutCount: stats?.dates.size ?? 0,
      totalSetCount: stats?.totalSets ?? 0,
      lastWorkoutDate: stats?.lastDate ?? null,
    }
  }).sort((a, b) => String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' }))

  const sortedCategories = [...(categories ?? [])].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 9999
    const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 9999
    return orderA - orderB || String(a.name).localeCompare(String(b.name))
  })

  return { exercises: catalog, categories: sortedCategories }
}

export async function saveWorkoutExercise(date, exercise, sets) {
  const cleanedSets = sets
    .map((set) => ({
      weight: normalizeNonNegativeNumber(set.weight),
      reps: normalizePositiveInteger(set.reps),
    }))
    .filter((set) => set.weight !== null && set.reps !== null)

  if (!cleanedSets.length) throw new Error('Add at least one complete set before saving.')

  const db = await openAppDatabase()

  const lookupTransaction = db.transaction('workoutSets', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const dayRows = await requestResult(lookupTransaction.objectStore('workoutSets').index('date').getAll(date))
  await lookupDone

  const exerciseIds = [...new Set(orderWorkoutDayRows(dayRows ?? []).map((row) => row.exerciseId))]
  const existingOrder = exerciseIds.indexOf(exercise.id)
  const exerciseOrder = existingOrder >= 0 ? existingOrder : exerciseIds.length
  const exerciseOrders = new Map(exerciseIds.map((exerciseId, indexValue) => [exerciseId, indexValue]))

  const transaction = db.transaction(['workoutSets', 'metadata'], 'readwrite')
  const store = transaction.objectStore('workoutSets')
  const updatedAt = new Date().toISOString()

  for (const row of dayRows ?? []) {
    if (row.exerciseId === exercise.id) {
      store.delete(row.id)
      continue
    }

    const dayExerciseOrder = exerciseOrders.get(row.exerciseId)
    if (row.dayExerciseOrder !== dayExerciseOrder) {
      store.put({ ...row, dayExerciseOrder })
    }
  }

  cleanedSets.forEach((set, indexValue) => {
    store.put({
      id: createLocalSetId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      date,
      weight: set.weight,
      reps: set.reps,
      unit: 0,
      routineSectionExerciseSetId: 0,
      timerAutoStart: 0,
      isPersonalRecord: 0,
      isPersonalRecordFirst: 0,
      isComplete: 1,
      distance: 0,
      durationSeconds: 0,
      dayExerciseOrder: exerciseOrder,
      localSetOrder: indexValue,
      createdLocally: true,
      localUpdatedAt: updatedAt,
    })
  })

  transaction.objectStore('metadata').put({ key: 'hasLocalChanges', value: true })
  transaction.objectStore('metadata').put({ key: 'lastLocalChangeAt', value: new Date().toISOString() })
  await transactionComplete(transaction)

  return refreshSummary()
}

export async function deleteWorkoutExercise(date, exerciseId) {
  const db = await openAppDatabase()

  const lookupTransaction = db.transaction('workoutSets', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const keys = await requestResult(lookupTransaction.objectStore('workoutSets').index('dateExercise').getAllKeys([date, exerciseId]))
  await lookupDone

  if (!keys?.length) return getSummary()

  const transaction = db.transaction(['workoutSets', 'metadata'], 'readwrite')
  const store = transaction.objectStore('workoutSets')
  for (const key of keys) store.delete(key)

  transaction.objectStore('metadata').put({ key: 'hasLocalChanges', value: true })
  transaction.objectStore('metadata').put({ key: 'lastLocalChangeAt', value: new Date().toISOString() })
  await transactionComplete(transaction)

  return refreshSummary()
}

export async function getStoredBackup() {
  const db = await openAppDatabase()
  const transaction = db.transaction('backups', 'readonly')
  const done = transactionComplete(transaction)
  const record = await requestResult(transaction.objectStore('backups').get('current'))
  await done

  if (!record?.data) return null

  return {
    name: record.name,
    size: record.size,
    importedAt: record.importedAt,
    blob: new Blob([record.data], { type: record.type || 'application/vnd.sqlite3' }),
  }
}

export async function clearLocalData() {
  const db = await openAppDatabase()
  const stores = Object.keys(STORE_DEFINITIONS)
  const transaction = db.transaction(stores, 'readwrite')
  for (const storeName of stores) transaction.objectStore(storeName).clear()
  await transactionComplete(transaction)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false

  try {
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return null

  try {
    return await navigator.storage.estimate()
  } catch {
    return null
  }
}

async function refreshSummary() {
  const db = await openAppDatabase()
  const readTransaction = db.transaction(['metadata', 'workoutSets', 'exercises'], 'readonly')
  const done = transactionComplete(readTransaction)
  const summaryRequest = readTransaction.objectStore('metadata').get('summary')
  const setsRequest = readTransaction.objectStore('workoutSets').getAll()
  const exercisesRequest = readTransaction.objectStore('exercises').count()

  const [summaryRecord, workoutSets, exerciseCount] = await Promise.all([
    requestResult(summaryRequest),
    requestResult(setsRequest),
    requestResult(exercisesRequest),
  ])
  await done

  const dates = (workoutSets ?? []).map((set) => set.date).filter(Boolean).sort()
  const nextSummary = {
    ...(summaryRecord?.value ?? {}),
    totalSets: workoutSets?.length ?? 0,
    totalExercises: exerciseCount ?? 0,
    firstWorkoutDate: dates[0] ?? null,
    lastWorkoutDate: dates.at(-1) ?? null,
    hasLocalChanges: true,
  }

  const writeTransaction = db.transaction('metadata', 'readwrite')
  writeTransaction.objectStore('metadata').put({ key: 'summary', value: nextSummary })
  await transactionComplete(writeTransaction)
  return nextSummary
}

function normalizeNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(String(value).replace(',', '.'))
  return Number.isFinite(number) && number >= 0 ? number : null
}

function normalizePositiveInteger(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function createLocalSetId() {
  if (globalThis.crypto?.randomUUID) return `local-${crypto.randomUUID()}`
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function compareSetRows(a, b) {
  const orderA = Number.isFinite(Number(a.localSetOrder)) ? Number(a.localSetOrder) : Number.MAX_SAFE_INTEGER
  const orderB = Number.isFinite(Number(b.localSetOrder)) ? Number(b.localSetOrder) : Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB

  const idA = typeof a.id === 'number' ? a.id : Number.MAX_SAFE_INTEGER
  const idB = typeof b.id === 'number' ? b.id : Number.MAX_SAFE_INTEGER
  if (idA !== idB) return idA - idB
  return String(a.id).localeCompare(String(b.id))
}

function orderWorkoutDayRows(rows) {
  const groups = new Map()
  const sourceRows = [...rows].sort(compareSourceRows)

  for (const row of sourceRows) {
    if (!groups.has(row.exerciseId)) {
      groups.set(row.exerciseId, {
        rows: [],
        sourceOrder: groups.size,
        savedOrder: null,
      })
    }

    const group = groups.get(row.exerciseId)
    group.rows.push(row)

    const savedOrder = Number(row.dayExerciseOrder)
    if (row.dayExerciseOrder !== null && row.dayExerciseOrder !== undefined && Number.isInteger(savedOrder) && savedOrder >= 0) {
      group.savedOrder = savedOrder
    }
  }

  return [...groups.values()]
    .sort((a, b) => (a.savedOrder ?? a.sourceOrder) - (b.savedOrder ?? b.sourceOrder) || a.sourceOrder - b.sourceOrder)
    .flatMap((group) => group.rows.sort(compareSetRows))
}

function compareSourceRows(a, b) {
  const idA = typeof a.id === 'number' ? a.id : Number.MAX_SAFE_INTEGER
  const idB = typeof b.id === 'number' ? b.id : Number.MAX_SAFE_INTEGER
  if (idA !== idB) return idA - idB

  const updatedAtComparison = String(a.localUpdatedAt ?? '').localeCompare(String(b.localUpdatedAt ?? ''))
  if (updatedAtComparison !== 0) return updatedAtComparison
  return String(a.id).localeCompare(String(b.id))
}

function buildBodyWeightFavorite(id, name, unit, rows = [], field) {
  const entries = rows
    .filter((row) => row[field] !== null && row[field] !== undefined && Number.isFinite(Number(row[field])))
    .sort(compareBodyEntries)

  return buildBodyFavorite(id, name, unit, entries, (entry) => entry[field])
}

function buildMeasurementFavorite(id, name, unit, measurements = [], records = []) {
  const measurement = measurements.find((item) => String(item.name).trim().toLowerCase() === name.toLowerCase())
  const entries = measurement
    ? records
      .filter((record) => record.measurementId === measurement.id && Number.isFinite(Number(record.value)))
      .sort(compareBodyEntries)
    : []

  return buildBodyFavorite(id, name, unit, entries, (entry) => entry.value)
}

function buildBodyFavorite(id, name, unit, entries, getValue) {
  const latest = entries.at(-1)
  const previous = entries.at(-2)
  const value = latest ? Number(getValue(latest)) : null
  const previousValue = previous ? Number(getValue(previous)) : null

  return {
    id,
    name,
    unit,
    value,
    change: value !== null && previousValue !== null ? value - previousValue : null,
    date: latest?.date ?? null,
    time: latest?.time ?? null,
  }
}

function compareBodyEntries(a, b) {
  const dateComparison = String(a.date ?? '').localeCompare(String(b.date ?? ''))
  if (dateComparison !== 0) return dateComparison

  const timeComparison = String(a.time ?? '').localeCompare(String(b.time ?? ''))
  if (timeComparison !== 0) return timeComparison

  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB
  return String(a.id).localeCompare(String(b.id))
}

function putMany(store, rows = []) {
  for (const row of rows) store.put(row)
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'))
  })
}
