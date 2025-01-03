// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {omitBy, isUndefined} from 'lodash-es'

/**
 * Removes undefined values from an object.
 */
export function omitUndefined(obj: object): object {
  return omitBy(obj, isUndefined)
}

/**
 * Runs promises sequentially.
 * 
 * Call like Promise.all().
 */
export function promiseSequential<T>(promises: Promise<T>[]): Promise<T[]> {
  return promises.reduce(
    async (chain, current) => {
      const results = await chain
      const result = await current
      return [...results, result]
    },
    Promise.resolve([] as T[])
  )
}

/**
 * Returns whether two objects serialize to the same JSON data.
 */
export function isSerializedEqual(objA: any, objB: any): boolean {
  const serializedObjA = JSON.stringify(objA)
  const serializedObjB = JSON.stringify(objB)
  return serializedObjA === serializedObjB
}
