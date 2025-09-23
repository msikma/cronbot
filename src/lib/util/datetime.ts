// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

/**
 * Applies the current time to a date.
 * 
 * Used for when we have only a date, but we want to show a "real" time anyway.
 */
export function applyCurrentTime(date: Date): Date {
  const now = new Date()
  const newDate = new Date(date)
  newDate.setUTCHours(now.getUTCHours())
  newDate.setUTCMinutes(now.getUTCMinutes())
  newDate.setUTCSeconds(now.getUTCSeconds())
  newDate.setUTCMilliseconds(now.getUTCMilliseconds())
  return newDate
}
