export function androidColorToCss(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '#7c7c85'
  const rgb = (Number(value) >>> 0) & 0xffffff
  if (rgb === 0x000000) return '#a1a1aa'
  return `#${rgb.toString(16).padStart(6, '0')}`
}
