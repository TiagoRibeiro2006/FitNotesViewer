import { onBeforeUnmount, ref } from 'vue'

const PRESS_DELAY = 320
const MOVE_TOLERANCE = 10
const CLICK_BLOCK_TIME = 500

export function usePressDragList(moveItem, finishDrag) {
  const draggingIndex = ref(-1)
  let pressTimer = null
  let clickTimer = null
  let pointerId = null
  let currentIndex = -1
  let startX = 0
  let startY = 0
  let listElement = null
  let moved = false
  let clickBlocked = false

  onBeforeUnmount(reset)

  function startDrag(event, index, disabled = false) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return

    clearGesture()
    pointerId = event.pointerId
    currentIndex = index
    startX = event.clientX
    startY = event.clientY
    listElement = event.currentTarget.closest('[data-press-drag-list]')
    pressTimer = window.setTimeout(activateDrag, PRESS_DELAY)
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', finishPointer)
    window.addEventListener('pointercancel', finishPointer)
  }

  function handlePointerMove(event) {
    if (event.pointerId !== pointerId) return

    if (draggingIndex.value < 0) {
      const distance = Math.hypot(event.clientX - startX, event.clientY - startY)
      if (distance > MOVE_TOLERANCE) clearGesture()
      return
    }

    if (event.cancelable) event.preventDefault()
    const nextIndex = findClosestIndex(event.clientY)
    if (nextIndex < 0 || nextIndex === currentIndex) return

    moveItem(currentIndex, nextIndex)
    currentIndex = nextIndex
    draggingIndex.value = nextIndex
    moved = true
  }

  function activateDrag() {
    pressTimer = null
    draggingIndex.value = currentIndex
    moved = false
    document.body.classList.add('press-drag-active')
  }

  function findClosestIndex(pointerY) {
    const items = [...(listElement?.querySelectorAll('[data-press-drag-item]') ?? [])]
    if (!items.length) return -1

    return items.reduce((closest, item, index) => {
      const bounds = item.getBoundingClientRect()
      const distance = Math.abs(pointerY - (bounds.top + bounds.height / 2))
      return distance < closest.distance ? { index, distance } : closest
    }, { index: -1, distance: Number.POSITIVE_INFINITY }).index
  }

  function finishPointer(event) {
    if (event.pointerId !== pointerId) return
    const wasDragging = draggingIndex.value >= 0
    const shouldSave = wasDragging && moved
    clearGesture()

    if (wasDragging) blockClick()
    if (shouldSave) finishDrag()
  }

  function consumeClick(event) {
    if (!clickBlocked) return false
    event.preventDefault()
    event.stopPropagation()
    clearClickBlock()
    return true
  }

  function blockClick() {
    clearClickBlock()
    clickBlocked = true
    clickTimer = window.setTimeout(clearClickBlock, CLICK_BLOCK_TIME)
  }

  function clearClickBlock() {
    if (clickTimer !== null) window.clearTimeout(clickTimer)
    clickTimer = null
    clickBlocked = false
  }

  function clearGesture() {
    if (pressTimer !== null) window.clearTimeout(pressTimer)
    pressTimer = null
    pointerId = null
    currentIndex = -1
    listElement = null
    moved = false
    draggingIndex.value = -1
    document.body.classList.remove('press-drag-active')
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', finishPointer)
    window.removeEventListener('pointercancel', finishPointer)
  }

  function reset() {
    clearGesture()
    clearClickBlock()
  }

  return {
    draggingIndex,
    consumeClick,
    startDrag,
  }
}
