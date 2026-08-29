import { onBeforeUnmount, ref } from 'vue'

export function useDragList(moveItem, finishDrag) {
  const draggingIndex = ref(-1)
  let pointerId = null
  let currentIndex = -1
  let listElement = null
  let moved = false

  onBeforeUnmount(clearDrag)

  function startDrag(event, index, disabled = false) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return

    clearDrag()
    if (event.cancelable) event.preventDefault()
    pointerId = event.pointerId
    currentIndex = index
    listElement = event.currentTarget.closest('[data-drag-list]')
    draggingIndex.value = index
    moved = false
    document.body.classList.add('drag-active')
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', finishPointer)
    window.addEventListener('pointercancel', finishPointer)
  }

  function handlePointerMove(event) {
    if (event.pointerId !== pointerId) return
    if (event.cancelable) event.preventDefault()

    const nextIndex = findClosestIndex(event.clientY)
    if (nextIndex < 0 || nextIndex === currentIndex) return

    moveItem(currentIndex, nextIndex)
    currentIndex = nextIndex
    draggingIndex.value = nextIndex
    moved = true
  }

  function findClosestIndex(pointerY) {
    const items = [...(listElement?.querySelectorAll('[data-drag-item]') ?? [])]
    if (!items.length) return -1

    return items.reduce((closest, item, index) => {
      const bounds = item.getBoundingClientRect()
      const distance = Math.abs(pointerY - (bounds.top + bounds.height / 2))
      return distance < closest.distance ? { index, distance } : closest
    }, { index: -1, distance: Number.POSITIVE_INFINITY }).index
  }

  function finishPointer(event) {
    if (event.pointerId !== pointerId) return
    const shouldSave = moved
    clearDrag()
    if (shouldSave) finishDrag?.()
  }

  function clearDrag() {
    pointerId = null
    currentIndex = -1
    listElement = null
    moved = false
    draggingIndex.value = -1
    document.body.classList.remove('drag-active')
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', finishPointer)
    window.removeEventListener('pointercancel', finishPointer)
  }

  return {
    draggingIndex,
    startDrag,
  }
}
