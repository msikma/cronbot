// cpl-apollo <https://github.com/msikma/cpl-apollo>
// © MIT license

// Time units accepted by scheduleEvery().
export type TimeUnit = 'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours'

// Types of timestamps Discord can display.
export type TimestampType = 'd' | 'D' | 't' | 'T' | 'f' | 'F' | 'R'

// Millisecond durations of each unit.
const unitMilliseconds = new Map([
  ['second', 1000],
  ['minute', 60000],
  ['hour', 3600000],
])

/** Sleeps for a given number of ms and then resolves. */
export const sleep: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Returns a Discord timestamp or "hammertime".
 */
export function getDiscordTimestamp(unixTime: number, mode: TimestampType) {
  return `<t:${unixTime}:${mode}>`
}

/**
 * Returns a milliseconds value for a given number and time unit.
 */
export function scheduleEvery(n: number, unit: TimeUnit) {
  const unitSingular = unit.replace(/s$/, '')
  const ms = unitMilliseconds.get(unitSingular)
  if (ms === undefined) {
    throw new Error(`Invalid time unit: ${unit}`)
  }
  return n * ms
}
