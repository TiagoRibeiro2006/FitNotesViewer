import assert from 'node:assert/strict'
import test from 'node:test'
import { searchSettings } from '../src/features/settings/settingsSearch.js'

const sections = [
  { id: 'management', title: 'Manage items', description: 'Muscles, exercises and body measurements' },
  { id: 'icons', title: 'Icons & visibility', description: 'Muscle icons and where to show them' },
  { id: 'units', title: 'Weight unit', description: 'Choose kilograms or pounds' },
  { id: 'data', title: 'Data & backups', description: 'Import, export or delete your local data' },
  { id: 'appearance', title: 'Theme & colours', description: 'Theme and accent colour' },
  { id: 'home', title: 'Home', description: 'Set progress indicators' },
  { id: 'body', title: 'Body', description: 'Body icon colour' },
]

test('empty searches preserve every settings section in order', verifyEmpty)
function verifyEmpty() {
  assert.equal(searchSettings(sections, ''), sections)
  assert.equal(searchSettings(sections, '   '), sections)
}

test('searches titles, descriptions and options inside sections', verifyMatches)
function verifyMatches() {
  assert.deepEqual(searchSettings(sections, 'KG'), [sections[2]])
  assert.deepEqual(searchSettings(sections, 'export'), [sections[3]])
  assert.deepEqual(searchSettings(sections, 'show body icons'), [sections[1]])
  assert.deepEqual(searchSettings(sections, 'exercises'), [sections[0]])
  assert.deepEqual(searchSettings(sections, '  WEÍGHT   UNIT  '), [sections[2]])
  assert.deepEqual(searchSettings(sections, 'muscle'), [sections[0], sections[1]])
  assert.deepEqual(searchSettings(sections, 'dark'), [sections[4]])
  assert.deepEqual(searchSettings(sections, 'progress'), [sections[5]])
  assert.deepEqual(searchSettings(sections, 'custom'), [sections[6]])
}

test('unmatched searches are empty and do not mutate the source', verifyMissing)
function verifyMissing() {
  assert.deepEqual(searchSettings(sections, 'not-a-setting'), [])
  assert.equal(sections.length, 7)
}
