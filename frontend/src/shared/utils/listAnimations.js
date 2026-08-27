import { nextTick } from 'vue'

const MOVE_DURATION = 180

export function captureItemPositions(listElement) {
  const positions = new Map()
  if (!listElement) return positions

  const items = listElement.querySelectorAll('[data-drag-item]')
  for (const item of items) positions.set(item, item.getBoundingClientRect().top)
  return positions
}

export async function animateItemPositions(positions) {
  await nextTick()

  for (const [item, previousTop] of positions) {
    if (item.classList.contains('is-dragging')) continue

    const offset = previousTop - item.getBoundingClientRect().top
    if (Math.abs(offset) < 1 || !item.animate) continue

    cancelItemAnimations(item)
    item.animate(
      [
        { transform: `translateY(${offset}px)` },
        { transform: 'translateY(0)' },
      ],
      { duration: MOVE_DURATION, easing: 'ease-out' },
    )
  }
}

function cancelItemAnimations(item) {
  for (const animation of item.getAnimations()) animation.cancel()
}
