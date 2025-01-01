// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import CronBot from '../../cronbot.ts'
import {createDiscordLogPayload} from './discord.ts'
import {systemTask} from '../tasks/index.ts'
import type {BotSystemConfig, BotTask, LogContent, LogFunction, TaskLoggerFunctions, SystemLoggerFunctions} from '../../types.ts'

// The log mode: whether we're logging as a short, plain message, or as a larger embed.
export type LogMode = 'message' | 'embed'
// Log severity. Only two types, sent to separate channels.
export type LogSeverity = 'info' | 'error'

export class BotLogger {
  // Reference to the bot owning this logger.
  private bot: CronBot
  // Paths used for highlighting stack traces.
  private appPath: string | null
  private libPath: string
  // Logging channels per guild.
  private systemLogChannels: Map<string, {info: string, error: string}> = new Map()

  constructor(cronBot: CronBot, appPath: string | null, libPath: string) {
    this.bot = cronBot
    this.appPath = appPath
    this.libPath = libPath
  }

  /**
   * Sets system logging channels for all configured guilds.
   * 
   * Each guild will have an info logging channel and error logging channel configured.
   * These are used by system messages, such as errors running a particular task.
   */
  public setSystemLogChannels(systemConfig: BotSystemConfig) {
    for (const [guildId, guildConfig] of systemConfig.guilds.entries()) {
      this.systemLogChannels.set(guildId, {
        info: guildConfig.log.infoChannel,
        error: guildConfig.log.errorChannel
      })
    }
  }

  /**
   * Creates info and error loggers for the system.
   */
  public createSystemLoggers(): SystemLoggerFunctions {
    const systemConfig = this.bot.getSystemConfig()
    if (systemConfig == null) {
      throw new Error('System config not loaded')
    }
    // The system log functions will be placed in a Map per guild id.
    const systemLogFunctions = new Map()

    for (const guildId of systemConfig.guilds.keys()) {
      const guildLogChannels = this.systemLogChannels.get(guildId)
      if (guildLogChannels == null) {
        throw new Error('Guild log channels not yet set')
      }
      const guildLoggers = this.createTaskLoggers(systemTask, guildId)
      systemLogFunctions.set(guildId, guildLoggers)
    }

    return systemLogFunctions
  }

  /**
   * Creates info and error loggers for a specific task and guild.
   */
  public createTaskLoggers(task: BotTask, guildId: string): TaskLoggerFunctions {
    const logChannels = this.systemLogChannels.get(guildId)
    if (logChannels === undefined) {
      throw new Error(`Logging channels have not been set for this guild: ${guildId} (task=${task.id})`)
    }
    return {
      logInfo: this.createTaskActionLogger(task, guildId, logChannels.info, 'message', 'info'),
      logError: this.createTaskActionLogger(task, guildId, logChannels.error, 'embed', 'error'),
    }
  }

  /**
   * Creates a single logging function usable by a task action.
   */
  public createTaskActionLogger(task: BotTask, guildId: string, channelId: string, logMode: LogMode, logSeverity: LogSeverity): LogFunction {
    return async (message, data, error) => {
      return await this.log(task, guildId, channelId, logMode, logSeverity, {message, data, error})
    }
  }

  /**
   * Logs content to a guild's logging channel.
   */
  public async log(task: BotTask, guildId: string, channelId: string, logMode: LogMode, logSeverity: LogSeverity, logContent: LogContent): Promise<void> {
    if (!channelId) {
      throw new Error(`Logging channel is not set: guildId=${guildId}`)
    }
    const client = this.bot.getClient()
    const channel = await client.channels.fetch(channelId)
    if (!channel) {
      throw new Error(`Logging channel was not found: ${channelId}`)
    }
    if (!channel.isSendable()) {
      throw new Error(`Logging channel cannot receive messages: ${channelId}`)
    }

    // The logging channel has been found and is sendable.
    // We'll generate the content to send to the channel (a message and array of embeds).
    const logPayload = createDiscordLogPayload(logContent, logMode, logSeverity, task, this.appPath, this.libPath)
    if (logPayload === null) {
      return
    }

    // Send the data.
    await channel.send(logPayload)
  }
}
