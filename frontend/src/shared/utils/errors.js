export function friendlyError(error) {
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (message.includes('file is not a database') || message.includes('malformed')) {
    return 'The selected file is not a valid FitNotes database or CSV.'
  }

  if (message.toLowerCase().includes('quota')) {
    return 'The device does not have enough browser storage for this backup.'
  }

  return message || 'Something went wrong.'
}
