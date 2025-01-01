// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {omitBy, isUndefined} from 'lodash-es'

/**
 * Removes undefined values from an object.
 */
export function omitUndefined(obj: object): object {
  return omitBy(obj, isUndefined)
}
