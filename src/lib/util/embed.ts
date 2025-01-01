// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {EmbedBuilder} from 'discord.js'
import type {BotTask, FeedItemUpdate} from '../../types.ts'

// Parsed contents of a stack line.
type ErrorStackLineInfo = {
  isErrorMessage: boolean
  isCallLine: boolean
  isNodeInternal: boolean
  isAppFile: boolean
  isLibFile: boolean
  isUnknown: boolean
}

// Colors we can use in Discord ANSI code blocks.
const PLAIN = 15
const GRAY = 30
const RED = 31
const GOLD = 33
const GREEN = 32
const BLUE = 34
const PINK = 35
const TEAL = 36
const WHITE = 37

/**
 * Returns information about a given stack line.
 * 
 * This is used for syntax highlighting.
 */
function getErrorStackLineInfo(line: string, appPath: string | null, libPath: string): ErrorStackLineInfo {
  const isErrorMessage = !line.startsWith(' ')
  const isCallLine = line.startsWith(' ') && line.includes(' at ')
  const isNodeInternal = line.includes('node:internal')
  const isAppFile = isCallLine && (appPath != null ? line.includes(appPath) : false)
  const isLibFile = isCallLine && (line.includes(libPath))
  const isUnknown = !isErrorMessage && !isCallLine && !isNodeInternal
  return {
    isErrorMessage,
    isCallLine,
    isNodeInternal,
    isAppFile,
    isLibFile,
    isUnknown,
  }
}

/**
 * Makes the error stack easier to read and applies syntax highlighting.
 * 
 * Syntax highlighting is applied in the form of of ANSI escape codes,
 * so this needs to be wrapped in an ANSI code block later on.
 * 
 * This is designed specifically to highlight V8 style error stacks.
 */
export function processErrorStack(stack: string, appPath: string | null, libPath: string): string {
  const highlightedLines: string[] = []
  const lines = stack.split('\n')

  for (const line of lines) {
    const cleanLine = resolveErrorStackPaths(line, [[appPath, 'app'], [libPath, 'lib']])
    const lineInfo = getErrorStackLineInfo(line, appPath, libPath)
    if (lineInfo.isErrorMessage) {
      const split = cleanLine.split(': ')
      const errorName = split.slice(0, 1)
      const errorMessage = split.slice(1)
      highlightedLines.push(`[2;${WHITE}m[1;${WHITE}m${errorName}:[0m[2;${WHITE}m [0m${errorMessage}`)
      continue
    }
    if (lineInfo.isCallLine) {
      const matches = cleanLine.match(/^(\s+at) ((async )?([^\s]+)) (.+?)$/)
      if (matches == null) {
        highlightedLines.push(String(cleanLine))
        continue
      }
      const at = matches[1]
      const async = matches[3] || ''
      const fn = matches[4]
      const rest = matches[5]
      const color = lineInfo.isAppFile ? BLUE : lineInfo.isLibFile ? PLAIN : GRAY
      highlightedLines.push(`[2;${color}m${at} [2;${color}m${async}[0m[4;${color}m${fn}[0m[2;${color}m ${rest}[0m`)
      continue
    }
    if (lineInfo.isNodeInternal || lineInfo.isUnknown) {
      const color = GRAY
      highlightedLines.push(`[2;${color}m${cleanLine}[0m`)
      continue
    }
  }

  return highlightedLines.join('\n')
}

/**
 * Takes a Markdown message and wraps it in an embed object.
 */
export function createMessageContentEmbed(message: string, color: number): EmbedBuilder {
  const embed = new EmbedBuilder()
  embed.setDescription(message)
  embed.setColor(color)
  return embed
}

/**
 * Resolves the paths in an error stack to their relative counterparts.
 */
export function resolveErrorStackPaths(stack: string, importPaths: ([string | null, string])[]): string {
  let resolvedStack = stack
  for (const [importPath, replacement] of importPaths) {
    if (importPath == null) {
      continue
    }
    resolvedStack = stack.replaceAll(importPath, replacement)
  }
  return resolvedStack
}

export function wrapErrorStackEscapeCodes(stack: string): string {
  return wrapInCodeBlock(stack, 'ansi')
}

/**
 * Wraps code in a block.
 */
export function wrapInCodeBlock(content: string, language: string = ''): string {
  return `\`\`\`${language}\n${content}\`\`\``
}

/**
 * Wraps a message in a monospace container.
 */
export function wrapInMonospace(message: string): string {
  return `\`${message.replaceAll('`', '\\`')}\``
}

/**
 * Wraps data in a JSON block.
 */
export function wrapJsonBlock(serializable: any, shortenData: boolean = false): string {
  const jsonData = JSON.stringify(serializable, null, 2)
  return wrapInCodeBlock(shortenData ? shortenJsonData(jsonData) : jsonData, 'json')
}

/**
 * Shortens the JSON data a bit for easier display.
 */
export function shortenJsonData(jsonData: string): string {
  const lines = jsonData.split('\n').slice(1, -1)
  if (lines.length === 0) {
    return '{}'
  }
  return lines.map(line => line.slice(2)).join('\n')
}

/**
 * Returns a basic string indicating how many items are about to be posted.
 */
export function logFeedItemUpdates(itemUpdates: FeedItemUpdate[]): string | null {
  if (itemUpdates.length === 0) {
    return null
  }
  const itemsToBePosted = itemUpdates.filter(item => item.action === 'insert')
  const itemsToBeEdited = itemUpdates.filter(item => item.action === 'update')
  const post = `Posting ${itemsToBePosted.length} new item${itemsToBePosted.length === 1 ? '' : 's'}`
  const edit = `editing ${itemsToBeEdited.length} existing item${itemsToBeEdited.length === 1 ? '' : 's'}`
  return `${post}${itemsToBeEdited.length > 0 ? `, ${edit}` : ``}`
}

/**
 * Returns an EmbedBuilder class preloaded with a task's design.
 */
export function createTaskEmbed(task: BotTask): typeof EmbedBuilder {
  return class TaskEmbed extends EmbedBuilder {
    constructor() {
      super()
      this.setAuthor({name: task.name, iconURL: task.design.icon})
      this.setColor(task.design.color)
      this.setTimestamp()
    }
  }
}
