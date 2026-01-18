// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {omitBy, isUndefined} from 'lodash-es'
import type {PlainValue} from '../../types.ts'

/**
 * Removes undefined values from an object.
 */
export function omitUndefined(obj: object): object {
  return omitBy(obj, isUndefined)
}

/**
 * Wraps an item in an array if it isn't already one.
 */
export function arrayWrap<T = any>(item: T | T[]): T[] {
  return Array.isArray(item) ? item : [item]
}

/**
 * Converts a fetch response object into a plain object.
 * 
 * Omits things we can't serialize.
 */
export function responseObject(res: Response) {
  const obj: {[key: string]: PlainValue} = {}
  obj.url = res.url
  obj.redirected = res.redirected
  obj.status = res.status
  obj.ok = res.ok
  obj.headers = Object.fromEntries(res.headers.entries())
  obj.bodyUsed = res.bodyUsed
  obj.type = res.type
  return obj
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
