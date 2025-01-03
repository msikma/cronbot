// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import * as path from 'node:path'
import {ClientOptions, Client, Events} from 'discord.js'
import {createEnvPaths, type EnvPaths} from '@dada78641/env-paths'
import {getBotConfig} from './lib/config.ts'
import {BotTaskScheduler} from './lib/scheduler/index.ts'
import {BotLogger} from './lib/logger/index.ts'
import {BotDatabase} from './lib/db/index.ts'
import {getRequestedScriptName} from './lib/util/argv.ts'
import type {BotConfig, BotSystemConfig, BotTask, BotTaskGuildConfig, TaskLoggerFunctions, SystemLoggerFunctions, LogContent} from './types.ts'

// Options passed on to CronBot during creation. CronBot must have an id and name for identification,
// and to know where to get its config files from. The clientOptions are passed directly to discord.js.
export interface CronBotOptions {
  id: string
  name: string
  path?: string
  tasks?: BotTask[]
  clientOptions: ClientOptions
}

/**
 * CronBot main class.
 * 
 * This is a Discord bot framework that's designed to be given tasks to run.
 * After initializing, run addBotTask() and then init() to start the bot.
 */
class CronBot {
  public id: string
  private client: Client
  private config: BotConfig | null
  private appPath: string | null
  private libPath: string
  private envPaths: EnvPaths

  private scheduler: BotTaskScheduler
  public logger: BotLogger
  public db: BotDatabase

  // Whether the bot has been connected.
  private isInitialized = false
  // Logging functions per guild.
  private guildLoggers: SystemLoggerFunctions = new Map()

  constructor(options: CronBotOptions) {
    // Unique identifier for this bot.
    this.id = options.id

    this.client = new Client(options.clientOptions)
    this.config = null
    this.envPaths = createEnvPaths(options.id)

    // Store the library consumer's path (appPath) and the library's path (libPath).
    // This is used to highlight stack traces so it's easy to see where an error originated.
    this.appPath = options.path || null
    this.libPath = path.join(import.meta.dirname ?? '', '..')

    // Initialize the main bot services.
    this.scheduler = new BotTaskScheduler(this)
    this.logger = new BotLogger(this, this.appPath, this.libPath)
    this.db = new BotDatabase(this, this.envPaths.cache)

    // Add any tasks we want queued.
    for (const task of options.tasks || []) {
      this.scheduler.addTask(task)
    }
  }

  /**
   * Returns the authenticated Discord API client.
   */
  public getClient(): Client {
    return this.client
  }

  /**
   * Returns the complete bot config.
   */
  public getConfig(): BotConfig | null {
    return this.config
  }

  /**
   * Returns the bot system config.
   */
  public getSystemConfig(): BotSystemConfig | null {
    return this.config?.systemConfig || null
  }

  /**
   * Returns the bot config.
   */
  public getTaskConfig(taskId: string): BotTaskGuildConfig {
    if (this.config === null || this.config?.taskConfig === null) {
      throw new Error('Task config not loaded')
    }
    const config = this.config.taskConfig.get(taskId)
    if (config === undefined) {
      throw new Error(`Task config not found for task: ${taskId}`)
    }
    return config
  }

  /**
   * Adds a task to the bot to start executing after connecting.
   */
  public addBotTask(botTask: BotTask) {
    this.scheduler.addTask(botTask)
  }

  /**
   * Starts running scheduled tasks.
   * 
   * This runs after the bot has connected.
   */
  private startTaskScheduler() {
    if (!this.isInitialized) {
      throw new Error('Bot has not initialized yet')
    }
    this.scheduler.startAllTasks()
  }

  /**
   * Sends the configured logging channels over to the logging class.
   * 
   * This is done once, and once we've done it we can freely log from anywhere in the app.
   */
  private setLogChannels() {
    if (!this.isInitialized || this.config === null) {
      throw new Error('Bot does not have valid config loaded or is not initialized yet')
    }
    this.logger.setSystemLogChannels(this.config.systemConfig)
  }

  /**
   * Creates system logging channels.
   * 
   * This allows CronBot itself to log messages to the log channels if needed.
   * The system logging channels are packaged as a map by guild id.
   */
  private setSystemLoggers() {
    if (!this.isInitialized || this.config === null) {
      throw new Error('Bot does not have valid config loaded or is not initialized yet')
    }
    this.guildLoggers = this.logger.createSystemLoggers()
  }

  /**
   * Returns the system loggers for a particular guild.
   */
  private getSystemLoggers(guildId: string): TaskLoggerFunctions {
    const loggers = this.guildLoggers.get(guildId)
    if (loggers === undefined) {
      throw new Error(`Loggers not configured for this guild: ${guildId}`)
    }
    return loggers
  }

  /**
   * Shortcut to log to a guild's info logging channel.
   */
  public logInfo(guildId: string, message?: LogContent['message'], data?: LogContent['data'], error?: LogContent['error']) {
    return this.getSystemLoggers(guildId).logInfo(message, data, error)
  }

  /**
   * Shortcut to log to a guild's error logging channel.
   */
  public logError(guildId: string, message?: LogContent['message'], data?: LogContent['data'], error?: LogContent['error']) {
    return this.getSystemLoggers(guildId).logError(message, data, error)
  }

  /**
   * Runs scripts if requested via the command line, e.g. the migrate script.
   */
  private async runScripts(): Promise<void> {
    const scripts = getRequestedScriptName()
    if (scripts.shouldMigrateDb) {
      await this.db.migrateDatabase(this.libPath, this.envPaths.cache)
    }
    if (scripts.shouldDumpDb) {
      await this.db.dumpDatabase(this.envPaths.cache)
    }
  }

  /**
   * Connects the bot to the server.
   * 
   * If the bot is already connected, this does nothing.
   */
  private async connect(): Promise<void> {
    if (this.isInitialized) {
      return
    }
    await new Promise(resolve => {
      const systemConfig = this.getSystemConfig()!
      this.client.once(Events.ClientReady, () => resolve(null))
      this.client.login(systemConfig.BOT_TOKEN)
      systemConfig.BOT_TOKEN = '<private>'
    })
    this.isInitialized = true
  }

  /**
   * Loads the config.
   */
  private async loadConfig() {
    this.config = await getBotConfig(this.envPaths)
  }

  /**
   * Returns the database config for use in external programs.
   */
  public getDatabaseConfig() {
    return this.db.getDatabaseConfig(this.envPaths)
  }

  /**
   * Initializes the bot and starts performing tasks.
   */
  async init() {
    // Run scripts if requested via command line.
    await this.runScripts()

    // From here on the config is needed for everything else.
    await this.loadConfig()

    // Connect to the server. Once connected, start all the bot services.
    await this.connect()

    this.setLogChannels()
    this.setSystemLoggers()
    this.startTaskScheduler()
  }
}

export default CronBot
