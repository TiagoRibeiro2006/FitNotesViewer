import { openAppDatabase } from '../indexedDb/database'
import { markLocalChanges, requestResult, transactionComplete } from '../indexedDb/transactions'
import { getSummary } from './summaryRepository'

export async function getExerciseCatalog() {
  const database = await openAppDatabase()
  const transaction = database.transaction(['exercises', 'categories', 'workoutSets'], 'readonly')
  const done = transactionComplete(transaction)
  const results = await Promise.all([
    requestResult(transaction.objectStore('exercises').getAll()),
    requestResult(transaction.objectStore('categories').getAll()),
    requestResult(transaction.objectStore('workoutSets').getAll()),
  ])
  await done

  const exercises = results[0] ?? []
  const categories = results[1] ?? []
  const workoutSets = results[2] ?? []
  const categoriesById = new Map()

  for (const category of categories) categoriesById.set(category.id, category)

  const usage = buildExerciseUsage(workoutSets)
  const catalogExercises = []
  for (const exercise of exercises) {
    catalogExercises.push(buildCatalogExercise(exercise, categoriesById, usage))
  }

  catalogExercises.sort(compareExerciseNames)
  categories.sort(compareCategories)
  return { exercises: catalogExercises, categories }
}

export async function updateExerciseDetails(exerciseId, details) {
  const name = normalizeName(details.name)
  const categoryId = details.categoryId
  const database = await openAppDatabase()
  const lookupTransaction = database.transaction(['exercises', 'categories', 'workoutSets'], 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const results = await Promise.all([
    requestResult(lookupTransaction.objectStore('exercises').get(exerciseId)),
    requestResult(lookupTransaction.objectStore('categories').get(categoryId)),
    requestResult(lookupTransaction.objectStore('workoutSets').index('exerciseId').getAll(exerciseId)),
  ])
  await lookupDone

  const exercise = results[0]
  const category = results[1]
  const workoutSets = results[2] ?? []
  if (!exercise) throw new Error('Exercise could not be found.')
  if (!category) throw new Error('Choose a valid muscle.')

  const updatedAt = new Date().toISOString()
  const updatedExercise = {
    ...exercise,
    name,
    categoryId,
    localUpdatedAt: updatedAt,
  }
  const transaction = database.transaction(['exercises', 'workoutSets', 'metadata'], 'readwrite')
  transaction.objectStore('exercises').put(updatedExercise)

  const workoutStore = transaction.objectStore('workoutSets')
  for (const set of workoutSets) {
    workoutStore.put({ ...set, exerciseName: name, localUpdatedAt: updatedAt })
  }

  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)

  const catalog = await getExerciseCatalog()
  return {
    exercise: findExercise(catalog.exercises, exerciseId),
    summary: await getSummary(),
  }
}

function normalizeName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!name) throw new Error('Enter an exercise name.')
  if (name.length > 100) throw new Error('Exercise name must have 100 characters or fewer.')
  if (/[<>]/.test(name)) throw new Error('Exercise name cannot include < or >.')
  return name
}

function findExercise(exercises, exerciseId) {
  for (const exercise of exercises) {
    if (exercise.id === exerciseId) return exercise
  }
  return null
}

function buildExerciseUsage(workoutSets) {
  const usage = new Map()

  for (const set of workoutSets) {
    const stats = usage.get(set.exerciseId) ?? { dates: new Set(), totalSets: 0, lastDate: null }
    if (set.date) stats.dates.add(set.date)
    stats.totalSets += 1
    if (set.date && (!stats.lastDate || set.date > stats.lastDate)) stats.lastDate = set.date
    usage.set(set.exerciseId, stats)
  }

  return usage
}

function buildCatalogExercise(exercise, categoriesById, usage) {
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
}

function compareExerciseNames(first, second) {
  return String(first.name).localeCompare(String(second.name), 'en', { sensitivity: 'base' })
}

function compareCategories(first, second) {
  const firstOrder = Number.isFinite(Number(first.sortOrder)) ? Number(first.sortOrder) : 9999
  const secondOrder = Number.isFinite(Number(second.sortOrder)) ? Number(second.sortOrder) : 9999
  return firstOrder - secondOrder || String(first.name).localeCompare(String(second.name))
}
