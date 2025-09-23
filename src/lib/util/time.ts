// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {default as _formatDuration} from 'format-duration'

// Time units accepted by scheduleEvery().
export type TimeUnit = 'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours'

// Millisecond durations of each unit.
const unitMilliseconds = new Map([
  ['second', 1000],
  ['minute', 60000],
  ['hour', 3600000],
])

/** Sleeps for a given number of ms and then resolves. */
export const sleep: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Returns a milliseconds value for a given number and time unit.
 */
export function scheduleEvery(n: number, unit: TimeUnit): number {
  const unitSingular = unit.replace(/s$/, '')
  const ms = unitMilliseconds.get(unitSingular)
  if (ms === undefined) {
    throw new Error(`Invalid time unit: ${unit}`)
  }
  return n * ms
}

/**
 * Formats a given number of milliseconds as a string.
 */
export function formatDuration(ms: number): string {
  return _formatDuration(ms, {ms: false})
}
