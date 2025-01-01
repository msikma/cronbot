// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {EmbedBuilder} from 'discord.js'
import type {PlainValue} from './util.ts'

// Logging functions take three types of objects: a message, data object, and error,
// along with other information such as the channel id.
// All are optional, and we'll log whatever is provided. If nothing is provided, nothing is done.
export type LogContent = {
  message?: string | null,
  data?: {[key: string]: PlainValue} | null,
  error?: Error | null
}

// Logging function that takes any of the aforementioned three items.
export type LogFunction = (
  message?: LogContent['message'],
  data?: LogContent['data'],
  error?: LogContent['error'],
) => Promise<void>

// Logging functions for the system.
// These are in a map per guild id.
export type SystemLoggerFunctions = Map<string, TaskLoggerFunctions>

// Logging functions for a specific task and a specific guild.
// These functions can be called by a task action directly to log to the guild's log channels.
export type TaskLoggerFunctions = {
  logInfo: LogFunction
  logError: LogFunction
}

// The message and embed we'll generate to send to a log channel.
export type DiscordLogData = {
  content?: string
  embeds?: EmbedBuilder[]
}
