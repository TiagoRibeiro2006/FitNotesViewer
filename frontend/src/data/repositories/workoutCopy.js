export function createWorkoutDayCopies(orderedRows, targetDate, updatedAt, createId) {
  const copies = []
  const exerciseOrders = new Map()
  const setOrders = new Map()

  for (const row of orderedRows) {
    const exerciseKey = String(row.exerciseId)
    const exerciseOrder = readExerciseOrder(exerciseOrders, exerciseKey)
    const setOrder = readSetOrder(setOrders, exerciseKey)

    copies.push({
      ...row,
      id: createId(),
      date: targetDate,
      dayExerciseOrder: exerciseOrder,
      localSetOrder: setOrder,
      routineSectionExerciseSetId: 0,
      createdLocally: true,
      localUpdatedAt: updatedAt,
    })
  }

  return copies
}

function readExerciseOrder(exerciseOrders, exerciseKey) {
  if (!exerciseOrders.has(exerciseKey)) {
    exerciseOrders.set(exerciseKey, exerciseOrders.size)
  }
  return exerciseOrders.get(exerciseKey)
}

function readSetOrder(setOrders, exerciseKey) {
  const setOrder = setOrders.get(exerciseKey) ?? 0
  setOrders.set(exerciseKey, setOrder + 1)
  return setOrder
}
