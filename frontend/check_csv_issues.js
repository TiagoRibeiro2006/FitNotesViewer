import { parseFitNotesCsv } from './src/fitnotes/parseFitNotesCsv.js';
import fs from 'fs';
const csvContent = fs.readFileSync('./FitNotes_Export.csv', 'utf8');
const result = parseFitNotesCsv({ name: 'FitNotes_Export.csv' }, csvContent);

// Check for rows with missing data
const missingData = [];
result.workoutSets.forEach((set, i) => {
  const rowNum = i + 1;
  if (set.weight === 0 && set.reps === 0 && set.distance === 0 && set.durationSeconds === 0) {
    missingData.push('Row ' + rowNum + ': all metrics zero');
  }
  if (!set.exerciseName) {
    missingData.push('Row ' + rowNum + ': no exercise name');
  }
});
console.log('Rows with all zeros metrics:', missingData.length);
console.log('First 5:', missingData.slice(0, 5));

// Check for rows where exercise name might be empty after cleaning
const emptyExercise = [];
result.workoutSets.forEach((set, i) => {
  if (!set.exerciseName || set.exerciseName.trim() === '') {
    emptyExercise.push('Row ' + (i+1) + ': empty exercise');
  }
});
console.log('Rows with empty exercise name:', emptyExercise.length);