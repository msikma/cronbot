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
 * Call similar to Promise.all(); takes an array of thunks instead of an array of Promises.
 */
export async function promiseSequential<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];

  for (const task of promises) {
    results.push(await task());
  }

  return results;
}

/**
 * Returns whether two objects serialize to the same JSON data.
 */
export function isSerializedEqual(objA: any, objB: any): boolean {
  const serializedObjA = JSON.stringify(objA)
  const serializedObjB = JSON.stringify(objB)
  return serializedObjA === serializedObjB
}
