// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import * as fs from 'node:fs'

/**
 * Ensures a given directory path exists.
 */
export function ensureDirectory(filepath: string): void {
  if (!filepath) {
    throw new Error('No filepath provided')
  }
  fs.mkdirSync(filepath, {recursive: true})
}

/**
 * Checks whether a file exists.
 */
export async function checkFileExists(filepath: string): Promise<boolean> {
  try {
    await fs.promises.access(filepath, fs.constants.F_OK)
    return true
  }
  catch {
    return false
  }
}
