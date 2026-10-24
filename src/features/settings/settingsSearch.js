const SECTION_KEYWORDS = {
  management: 'edit rename add remove muscles exercises colours colors',
  appearance: 'theme dark light soft pastel accent colours colors buttons switches favourites selections',
  icons: 'muscle icons colours colors show on home show body icons charts exercise lists enable disable',
  home: 'sets progress indicators stars log edit exercise history show hide',
  body: 'body icons colour color accent custom manage items measurements rename add remove',
  units: 'weight unit kg kilograms lb lbs pounds',
  data: 'import export delete replace backup csv fitnotes file download storage',
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function searchSettings(sections, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (!words.length) return sections
  const results = []
  for (const section of sections) {
    const text = normalize(`${section.title} ${section.description} ${SECTION_KEYWORDS[section.id] ?? ''}`)
    let matches = true
    for (const word of words) {
      if (!text.includes(word)) {
        matches = false
        break
      }
    }
    if (matches) results.push(section)
  }
  return results
}
