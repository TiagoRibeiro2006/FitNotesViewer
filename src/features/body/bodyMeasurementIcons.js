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

const BODY_ICONS = {
  'body fat': 'body-fat',
  'muscle mass': 'muscle-mass',
  bodyweight: 'body-weight',
  'body weight': 'body-weight',
  height: 'height',
  neck: 'neck',
  waist: 'waist-normal',
  'waist normal': 'waist-normal',
  'waist vacuo': 'waist-vacuum',
  'waist vacuum': 'waist-vacuum',
  'visceral fat': 'visceral-fat',
}

export function bodyMeasurementIcon(name) {
  const normalized = String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\((left|right)\)/g, '')
    .trim()
    .replace(/\s+/g, ' ')
  return BODY_ICONS[normalized] ?? resolveMuscleIcon(MEASUREMENT_MUSCLES[normalized] ?? normalized)
}
