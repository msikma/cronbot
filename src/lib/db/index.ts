// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import * as path from 'node:path'
import BetterSqlite3 from 'better-sqlite3'
import type {EnvPaths} from '@dada78641/env-paths'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import {drizzle, type BetterSQLite3Database} from 'drizzle-orm/better-sqlite3'
import CronBot from '../../cronbot.ts'
import {upsertCache, upsertMessage, connectCacheAndMessage, filterFeedItems, markFeedItemStatus, insertFeedItem} from './orm.ts'
import * as schema from './schema.ts'
import type {BotTask, FeedItem, TaskActionDatabaseFunctions} from '../../types.ts'
import {ensureDirectory} from '../util/index.ts'

// Type of the Drizzle client.
export type DrizzleClient = BetterSQLite3Database<typeof schema>

export class BotDatabase {
  // Reference to the bot owning this database.
  private bot: CronBot
  
  // Path to the database file.
  private dbPath: string

  // References to the database connection.
  public sqlite: BetterSqlite3.Database
  public client: DrizzleClient

  constructor(cronBot: CronBot, cachePath: string) {
    this.bot = cronBot

    this.dbPath = this.getDatabasePath(cachePath)
    this.ensureCachePath()
    this.sqlite = new BetterSqlite3(this.dbPath)
    this.client = drizzle({client: this.sqlite, schema})
  }

  private ensureCachePath() {
    ensureDirectory(path.dirname(this.dbPath))
  }

  /**
   * Runs migrations.
   */
  public async migrateDatabase(libPath: string, cachePath: string) {
    await migrate(this.client, {
      migrationsFolder: path.relative(process.cwd(), `${libPath}/migrations`),
    })
  }

  /**
   * Dumps database.
   */
  public async dumpDatabase(cachePath: string) {
    // todo: to be implemented
  }

  /**
   * Returns the path to the database file.
   */
  public getDatabasePath(cachePath: string) {
    return path.join(cachePath, 'db.sqlite3')
  }

  /**
   * Returns configuration for the database for external programs to connect.
   */
  public getDatabaseConfig(envPaths: EnvPaths) {
    return {
      // Note: we must use __dirname here to accomodate Drizzle Studio's runtime.
      schema: `${path.join(__dirname, '..', 'dist', 'index.js')}`,
      dialect: 'sqlite',
      dbCredentials: {
        url: `${path.join(envPaths.cache, 'db.sqlite3')}`
      }
    }
  }

  /**
   * Returns decorated ORM functions for a task action.
   * 
   * This provides a number of convenience functions that allow a task to save things to the database.
   * This is used for caching items and figuring out which items need to be posted or updated.
   */
  public getTaskActionDatabaseOrm(task: BotTask, subtask: string): TaskActionDatabaseFunctions {
    return {
      markFeedItemStatus: async (status: string, guid: string, taskId: string, subtask: string) =>
        markFeedItemStatus(this.client, status, guid, taskId, subtask),
      upsertCache: async (guid: string, taskId: string, subtask: string, data: any) =>
        upsertCache(this.client, guid, taskId, subtask, data),
      upsertMessage: async (messageId: string, guildId: string, channelId: string) =>
        upsertMessage(this.client, messageId, guildId, channelId),
      connectCacheAndMessage: async (guid: string, taskId: string, messageId: string) =>
        connectCacheAndMessage(this.client, guid, taskId, messageId),
      filterFeedItems: async (items: FeedItem[]) =>
        filterFeedItems(this.client, task.id, subtask, items),
      insertFeedItem: async (guid: string, taskId: string, subtask: string, data: any, messageId: string, guildId: string, channelId: string) =>
        insertFeedItem(this.client, guid, taskId, subtask, data, messageId, guildId, channelId),
    }
  }
}
