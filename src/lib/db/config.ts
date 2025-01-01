// cpl-apollo <https://github.com/msikma/cpl-apollo>
// © MIT license

import * as path from 'node:path'
import type {Config} from 'drizzle-kit'
import * as url from 'node:url'

// Path to the CronBot source root.
const libPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..', '..')

export default {
  schema: `${libPath}/src/lib/db/schema.ts`,
  dialect: 'sqlite',
  // TODO: replace with absolute path when <https://github.com/drizzle-team/drizzle-orm/issues/1583> is fixed.
  out: path.relative(process.cwd(), `${libPath}/migrations`),
} satisfies Config
