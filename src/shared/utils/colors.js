export function androidColorToCss(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '#7c7c85'
  const rgb = (Number(value) >>> 0) & 0xffffff
  if (rgb === 0x000000) return '#a1a1aa'
  return `#${rgb.toString(16).padStart(6, '0')}`
}

export function cssColorToAndroid(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value ?? ''))
  if (!match) throw new Error('Choose a valid muscle colour.')
  const rgb = Number.parseInt(match[1], 16)
  return (0xff000000 | rgb) >> 0
}
