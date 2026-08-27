import { onBeforeUnmount, ref } from 'vue'
import { animateItemPositions, captureItemPositions } from '../utils/listAnimations'

const SCROLL_EDGE_SIZE = 84
const MAX_SCROLL_SPEED = 4.5

export function useDragList(moveItem, finishDrag) {
  const draggingIndex = ref(-1)
  let pointerId = null
  let currentIndex = -1
  let listElement = null
  let scrollElement = null
  let scrollFrame = null
  let pointerY = 0
  let moved = false

  onBeforeUnmount(clearDrag)

  function startDrag(event, index, disabled = false) {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return

    clearDrag()
    if (event.cancelable) event.preventDefault()
    pointerId = event.pointerId
    currentIndex = index
    listElement = event.currentTarget.closest('[data-drag-list]')
    scrollElement = findScrollElement(listElement)
    pointerY = event.clientY
    draggingIndex.value = index
    moved = false
    document.body.classList.add('drag-active')
    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', finishPointer)
    window.addEventListener('pointercancel', finishPointer)
    scrollFrame = window.requestAnimationFrame(autoScroll)
  }

  function handlePointerMove(event) {
    if (event.pointerId !== pointerId) return
    if (event.cancelable) event.preventDefault()
    pointerY = event.clientY
    moveToPointer()
  }

  function moveToPointer() {
    const nextIndex = findClosestIndex(pointerY)
    if (nextIndex < 0 || nextIndex === currentIndex) return

    const positions = captureItemPositions(listElement)
    moveItem(currentIndex, nextIndex)
    currentIndex = nextIndex
    draggingIndex.value = nextIndex
    moved = true
    void animateItemPositions(positions)
  }

  function autoScroll() {
    if (pointerId === null) return
    const speed = calculateScrollSpeed()
    if (speed !== 0 && scrollBy(speed)) moveToPointer()
    scrollFrame = window.requestAnimationFrame(autoScroll)
  }

  function calculateScrollSpeed() {
    const bounds = scrollElement?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight }
    const topDistance = Math.max(0, pointerY - bounds.top)
    const bottomDistance = Math.max(0, bounds.bottom - pointerY)

    if (topDistance < SCROLL_EDGE_SIZE) {
      return -MAX_SCROLL_SPEED * (1 - topDistance / SCROLL_EDGE_SIZE)
    }
    if (bottomDistance < SCROLL_EDGE_SIZE) {
      return MAX_SCROLL_SPEED * (1 - bottomDistance / SCROLL_EDGE_SIZE)
    }
    return 0
  }

  function scrollBy(amount) {
    if (scrollElement) {
      const previousTop = scrollElement.scrollTop
      scrollElement.scrollTop += amount
      return scrollElement.scrollTop !== previousTop
    }

    const previousTop = window.scrollY
    window.scrollBy(0, amount)
    return window.scrollY !== previousTop
  }

  function findScrollElement(element) {
    let parent = element?.parentElement

    while (parent && parent !== document.body) {
      const overflow = window.getComputedStyle(parent).overflowY
      if (/(auto|scroll)/.test(overflow) && parent.scrollHeight > parent.clientHeight) return parent
      parent = parent.parentElement
    }

    return null
  }

  function findClosestIndex(pointerY) {
    const items = [...(listElement?.querySelectorAll('[data-drag-item]') ?? [])]
    if (!items.length) return -1

    let closestIndex = -1
    let closestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index]
      const bounds = item.getBoundingClientRect()
      const distance = Math.abs(pointerY - (bounds.top + bounds.height / 2))
      if (distance >= closestDistance) continue
      closestIndex = index
      closestDistance = distance
    }

    return closestIndex
  }

  function finishPointer(event) {
    if (event.pointerId !== pointerId) return
    const shouldSave = moved
    clearDrag()
    if (shouldSave) finishDrag?.()
  }

  function clearDrag() {
    if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
    pointerId = null
    currentIndex = -1
    listElement = null
    scrollElement = null
    scrollFrame = null
    pointerY = 0
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
