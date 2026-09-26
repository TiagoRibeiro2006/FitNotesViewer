const MAX_FILE_SIZE = 25 * 1024 * 1024

export async function readFitNotesFileBytes(file) {
  // Some document providers cannot supply a usable buffer through Blob.arrayBuffer.
  // Retry through FileReader before passing any content to a format parser.
  try {
    return checkedBytes(await file.arrayBuffer(), file.size)
  } catch {
    try {
      return checkedBytes(await readWithFileReader(file), file.size)
    } catch {
      throw new Error('The selected file could not be read completely. Save it to Downloads on this device, then select it again and retry.')
    }
  }
}

function checkedBytes(buffer, expectedSize) {
  const bytes = new Uint8Array(buffer)
  if (!bytes.length || bytes.length > MAX_FILE_SIZE || (expectedSize > 0 && bytes.length !== expectedSize)) {
    throw new Error('Incomplete file content.')
  }
  return bytes
}

function readWithFileReader(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error ?? new Error('File read failed.'))
    reader.onabort = () => reject(new Error('File read was interrupted.'))
    reader.readAsArrayBuffer(file)
  })
}
