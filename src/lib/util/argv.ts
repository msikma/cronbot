// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import * as process from 'node:process'

/**
 * Returns the requested script name from the command line.
 * 
 * This returns whether the user included --migrate or --dump in the command line arguments.
 */
export function getRequestedScriptName(shouldAlwaysMigrateDb = true) {
  const argv = process.argv
  return {
    shouldMigrateDb: shouldAlwaysMigrateDb || argv.includes('--migrate'),
    shouldDumpDb: argv.includes('--dump'),
  }
}
