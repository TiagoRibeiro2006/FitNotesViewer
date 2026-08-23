import { openAppDatabase } from '../indexedDb/database'
import { requestResult, transactionComplete } from '../indexedDb/transactions'

export async function getSummary() {
  const database = await openAppDatabase()
  const transaction = database.transaction('metadata', 'readonly')
  const done = transactionComplete(transaction)
  const record = await requestResult(transaction.objectStore('metadata').get('summary'))
  await done
  return record?.value ?? null
}

export async function refreshSummary() {
  const database = await openAppDatabase()
  const transaction = database.transaction(['metadata', 'workoutSets', 'exercises'], 'readonly')
  const done = transactionComplete(transaction)
  const [summaryRecord, workoutSets, exerciseCount] = await Promise.all([
    requestResult(transaction.objectStore('metadata').get('summary')),
    requestResult(transaction.objectStore('workoutSets').getAll()),
    requestResult(transaction.objectStore('exercises').count()),
  ])
  await done

  const dates = (workoutSets ?? []).map((set) => set.date).filter(Boolean).sort()
  const summary = {
    ...(summaryRecord?.value ?? {}),
    totalSets: workoutSets?.length ?? 0,
    totalExercises: exerciseCount ?? 0,
    firstWorkoutDate: dates[0] ?? null,
    lastWorkoutDate: dates.at(-1) ?? null,
    hasLocalChanges: true,
  }

  const writeTransaction = database.transaction('metadata', 'readwrite')
  writeTransaction.objectStore('metadata').put({ key: 'summary', value: summary })
  await transactionComplete(writeTransaction)
  return summary
}
