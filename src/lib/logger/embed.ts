// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {isPlainObject} from 'lodash-es'
import {EmbedBuilder} from 'discord.js'
import type {APIEmbedField} from 'discord.js'
import {responseObject} from '../util/data.ts'
import {wrapErrorStackEscapeCodes, createMessageContentEmbed, processErrorStack, wrapInMonospace, wrapJsonBlock} from '../util/embed.ts'
import type {LogContent} from '../../types.ts'

/**
 * Merges a content message and an error embed into one single embed.
 */
export function mergeLogContentAndEmbed(message: string, error: EmbedBuilder | null, color: number): EmbedBuilder {
  if (error == null) {
    return createMessageContentEmbed(message, color)
  }
  const data = error.toJSON()
  const merged = new EmbedBuilder(data)
  merged.setTitle(message)
  return merged
}

/**
 * Converts an error object into a string we can log.
 */
export function createErrorMarkdown(error: Error | null | undefined): string | null {
  if (error == null) {
    return null
  }
  return `**${error.name}${error.message ? `: ${error.message}` : ''}**`
}

/**
 * Converts an error object into a message embed.
 */
export function createErrorEmbed(
  error: Error | null | undefined,
  color: number,
  appImportPath: string | null,
  libImportPath: string,
  data?: LogContent['data']
): EmbedBuilder | null {
  if (error == null) {
    return null
  }
  try {
    const name = 'name' in error ? error.name : null
    const message = 'message' in error ? error.message : null
    const code = 'code' in error ? error.code : null
    const stack = 'stack' in error ? error.stack : null
    const cause = 'cause' in error ? error.cause : null

    const fields: APIEmbedField[] = []
    if (data) {
      fields.push({name: 'Data', value: wrapJsonBlock(data, true)})
    }
    if (name && name.toLowerCase() !== 'error') {
      fields.push({name: 'Name', value: `${name}`, inline: true})
    }
    if (code) {
      fields.push({name: 'Code', value: wrapInMonospace(`${String(code).trim()}`), inline: false})
    }
    if (message) {
      fields.push({name: 'Message', value: `${message}`, inline: false})
    }
    if (cause) {
      if (isPlainObject(cause)) {
        fields.push({name: 'Cause', value: wrapJsonBlock(cause, true)})
      }
      else if (cause instanceof Response) {
        fields.push({name: 'Cause', value: wrapJsonBlock(responseObject(cause), true)})
      }
      else {
        fields.push({name: 'Cause', value: `${cause}`})
      }
    }

    const embed = new EmbedBuilder()
    embed.setColor(color)
    embed.addFields(...fields)
    embed.setTimestamp()

    if (stack) {
      embed.setDescription(wrapErrorStackEscapeCodes(processErrorStack(stack, appImportPath, libImportPath)))
    }

    return embed
  }
  catch {
    return null
  }
}
