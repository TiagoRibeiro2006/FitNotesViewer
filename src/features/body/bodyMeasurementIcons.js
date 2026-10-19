import { resolveMuscleIcon } from '../../shared/models/muscleIcons.js'

const MEASUREMENT_MUSCLES = {
  bicep: 'biceps',
  'bicep arm': 'biceps',
  'biceps arm': 'biceps',
  'upper arm': 'biceps',
  calf: 'calfs',
  calves: 'calfs',
  gluteos: 'glutes',
  shoulders: 'side-delts',
  thigh: 'quads',
}

export function bodyMeasurementIcon(name) {
  const normalized = String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\((left|right)\)/g, '')
    .trim()
    .replace(/\s+/g, ' ')
  return resolveMuscleIcon(MEASUREMENT_MUSCLES[normalized] ?? normalized)
}
