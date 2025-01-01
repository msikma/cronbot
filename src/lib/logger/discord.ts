// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {EmbedBuilder} from 'discord.js'
import {compact} from 'lodash-es'
import {dataToMarkdownString, addTaskNameToMessage, addTimestampsToMessage} from './markdown.ts'
import {mergeLogContentAndEmbed, createErrorEmbed, createErrorMarkdown} from './embed.ts'
import type {BotTask, LogContent, DiscordLogData} from '../../types.ts'
import type {LogMode, LogSeverity} from './index.ts'

// Color used by error objects.
const ERROR_COLOR = 0xff034a

/**
 * Returns the message with metadata added to it.
 */
function addMetadataToMessage(logMessageContent: string, task: BotTask): string {
  return addTimestampsToMessage(addTaskNameToMessage(logMessageContent, task))
}

/**
 * Returns the log content with timestamp and task prefix, or undefined if the message is empty.
 * 
 * If the message is empty, Discord expects us to pass the value as undefined.
 */
function prepareLogContent(logMessageContent: string): string | undefined {
  const message = logMessageContent.trim()
  if (message === '') {
    return undefined
  }
  return message
}

/**
 * Returns the embeds as an array, or undefined if none were provided.
 * 
 * If there are no embeds, Discord expects us to pass the value as undefined.
 */
function prepareLogEmbeds(logErrorEmbeds: (EmbedBuilder | null)[]): EmbedBuilder[] | undefined {
  const embeds = compact(logErrorEmbeds)
  if (embeds.length === 0) {
    return undefined
  }
  return embeds
}

/**
 * Returns the Markdown content portion of the log data.
 * 
 * This puts together the user's provided message and the data.
 * 
 * The timestamp and task name are added afterwards.
 */
function createLogMarkdownContent(message: LogContent['message'], data?: LogContent['data'], error?: LogContent['error']): string {
  const dataPart = dataToMarkdownString(data)
  const errorPart = createErrorMarkdown(error)
  const sections = compact([message, dataPart, errorPart])
  return sections.join(' – ').trim()
}

/**
 * Takes a log content object and generates a Markdown message and embed to send to the Discord channel.
 * 
 * The log content will contain potentially three items:
 * 
 *   - a Markdown message
 *   - a data object, which we will convert to Markdown and add to the message
 *   - an error object, which we will convert to an embed
 * 
 * All items are optional, and if nothing has been specified nothing will happen.
 */
export function createDiscordLogPayload(
  logContent: LogContent,
  logMode: LogMode,
  logSeverity: LogSeverity,
  task: BotTask,
  appImportPath: string | null,
  libImportPath: string,
  errorColor: number = ERROR_COLOR,
): DiscordLogData | null {
  const {message, data, error} = logContent
  if (message == null && data == null && error == null) {
    return null
  }

  // We have two modes for logging messages: one which is message based (used for basic logging),
  // and one specifically for errors in which we prefer an embed.

  if (logMode === 'message') {
    const logMessageContent = createLogMarkdownContent(message, data, error)
    const content = prepareLogContent(addMetadataToMessage(logMessageContent, task))
    return {content, embeds: undefined}
  }
  if (logMode === 'embed') {
    const logMessageContent = createLogMarkdownContent(message)
    const logErrorEmbed = createErrorEmbed(error, errorColor, appImportPath, libImportPath, data)
    const logContentAndEmbed = mergeLogContentAndEmbed(logMessageContent, logErrorEmbed, errorColor)
    const embeds = prepareLogEmbeds([logContentAndEmbed])
    return {content: undefined, embeds}
  }
  
  throw new Error(`Invalid log mode: ${logMode}`)
}
