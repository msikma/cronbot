// cpl-apollo <https://github.com/msikma/cpl-apollo>
// © MIT license

// Types of timestamps Discord can display.
export type TimestampType = 'd' | 'D' | 't' | 'T' | 'f' | 'F' | 'R'

/**
 * Returns a Discord timestamp or "hammertime".
 */
export function getDiscordTimestamp(unixTime: number, mode: TimestampType) {
  return `<t:${unixTime}:${mode}>`
}

/**
 * Returns a link to a Discord message.
 * 
 * This will show up as a clickable link on Discord.
 */
export function getDiscordMessageLink(messageId: string, channelId: string, guildId: string): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
}
