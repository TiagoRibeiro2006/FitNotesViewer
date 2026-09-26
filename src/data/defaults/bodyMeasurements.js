const KG_UNIT_ID = 'default-body-unit-kg'
const CM_UNIT_ID = 'default-body-unit-cm'
const PERCENT_UNIT_ID = 'default-body-unit-percent'

export const DEFAULT_BODY_UNITS = [
  { id: KG_UNIT_ID, type: 1, longName: 'Kilograms', shortName: 'kg' },
  { id: CM_UNIT_ID, type: 2, longName: 'Centimetres', shortName: 'cm' },
  { id: PERCENT_UNIT_ID, type: 3, longName: 'Percent', shortName: '%' },
]

export const DEFAULT_BODY_MEASUREMENTS = [
  createMeasurement('body-weight', 'Bodyweight', KG_UNIT_ID, 0, 0),
  createMeasurement('body-fat', 'Body Fat', PERCENT_UNIT_ID, 1, 0),
  createMeasurement('neck', 'Neck', CM_UNIT_ID, 2, 0),
  createMeasurement('shoulders', 'Shoulders', CM_UNIT_ID, 3, 0),
  createMeasurement('chest', 'Chest', CM_UNIT_ID, 4, 0),
  createMeasurement('waist', 'Waist', CM_UNIT_ID, 5, 0),
  createMeasurement('hips', 'Hips', CM_UNIT_ID, 6, 0),
  createMeasurement('upper-arm-right', 'Upper Arm (Right)', CM_UNIT_ID, 7, 0),
  createMeasurement('upper-arm-left', 'Upper Arm (Left)', CM_UNIT_ID, 8, 0),
  createMeasurement('forearm-right', 'Forearm (Right)', CM_UNIT_ID, 9, 0),
  createMeasurement('forearm-left', 'Forearm (Left)', CM_UNIT_ID, 10, 0),
  createMeasurement('thigh-right', 'Thigh (Right)', CM_UNIT_ID, 11, 0),
  createMeasurement('thigh-left', 'Thigh (Left)', CM_UNIT_ID, 12, 0),
  createMeasurement('calf-right', 'Calf (Right)', CM_UNIT_ID, 13, 0),
  createMeasurement('calf-left', 'Calf (Left)', CM_UNIT_ID, 14, 0),
  createMeasurement('muscle-mass', 'Muscle Mass', KG_UNIT_ID, 15, 1),
  createMeasurement('visceral-fat', 'Visceral Fat', PERCENT_UNIT_ID, 16, 1),
  createMeasurement('bicep-arm-left', 'Bicep Arm (Left)', CM_UNIT_ID, 17, 1),
  createMeasurement('bicep-arm-right', 'Bicep Arm (Right)', CM_UNIT_ID, 18, 1),
  createMeasurement('gluteos', 'Gluteos', CM_UNIT_ID, 19, 1),
  createMeasurement('height', 'Height', CM_UNIT_ID, 20, 1),
  createMeasurement('waist-normal', 'Waist Normal', CM_UNIT_ID, 21, 1),
  createMeasurement('waist-vacuo', 'Waist Vácuo', CM_UNIT_ID, 22, 1),
]

function createMeasurement(localBodyId, name, unitId, sortOrder, custom) {
  return {
    id: 'default-measurement-' + localBodyId,
    localBodyId,
    name,
    unitId,
    goalType: 0,
    goalValue: 0,
    custom,
    enabled: 1,
    sortOrder,
    createdLocally: true,
  }
}
