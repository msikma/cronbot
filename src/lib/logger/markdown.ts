// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {EmbedBuilder} from 'discord.js'
import type {APIEmbedField} from 'discord.js'
import {getDiscordTimestamp} from '../util/index.ts'
import type {BotTask} from '../../types.ts'

const ERROR_COLOR = 0xff034a

/**
 * Converts an object of arbitrary logging data to a Markdown message string.
 */
export function dataToMarkdownString(data?: {[key: string]: any} | null): string | null {
  if (data == null) {
    return null
  }
  const parts = []
  for (const [key, value] of Object.entries(data)) {
    parts.push(`__${key}__: ${JSON.stringify(value)}`)
  }
  return `[${parts.join(', ')}]`
}

/**
 * Adds the task name to a log message.
 */
export function addTaskNameToMessage(message: string, task: BotTask): string {
  return `**${task.name}** – ${message}`
}

/**
 * Adds timestamps to a log message.
 */
export function addTimestampsToMessage(message: string): string {
  const time = Math.floor(Date.now() / 1000)
  const tsDate = getDiscordTimestamp(time, 'd')
  const tsTime = getDiscordTimestamp(time, 't')
  return `${tsDate}${tsTime} ${message}`
}

/**
 * Returns a message embed specific to a given task.
 */
export function createTaskEmbedStub(task: BotTask, embedTitle?: string | null): EmbedBuilder {
  const embed = new EmbedBuilder()
  embed.setColor(task.design.color)
  embed.setAuthor({name: embedTitle ?? task.name, iconURL: task.design.icon})
  return embed
}

/**
 * Wraps a message in an embed.
 */
export function wrapMessageInEmbed(message: string): EmbedBuilder {
  const embed = new EmbedBuilder()
  embed.setDescription(message)
  embed.setColor(ERROR_COLOR)
  return embed
}
