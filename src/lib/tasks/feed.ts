// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {Client} from 'discord.js'
import CronBot from '../../cronbot.ts'
import {logFeedItemUpdates, sleep} from '../util/index.ts'
import type {FeedItem, FeedItemUpdate, FeedItemUpdateResult, BotTask, BotTaskAction, TaskActionContext} from '../../types.ts'

// Amount of time we sleep while posting multiple feed items.
const FEED_ITEM_INTERVAL = 5000

/**
 * FeedTask type task that posts entries to Discord periodically.
 * 
 * The flow for a FeedTask works like this:
 * 
 *   - We call a task's getFeedItems() and get a list of items that may or may not
 *     have been posted to Discord yet.
 *   - We filter out the items that are already posted and don't need to be updated.
 *   - We call postFeedItem() for all new items that should be posted.
 *     The items are posted or edited and it returns an object containing the message id.
 *   - The bot then maps these message ids to the item guid and saves that to the database.
 * 
 * From the task creator's perspective, getFeedItems() and postFeedItem() need to be implemented.
 */
export class FeedTask<Config = any> {
  public context: TaskActionContext & {config: Config}
  public client: Client
  public task: BotTask
  public taskConfig: Config
  constructor(context: TaskActionContext & {config: Config}) {
    this.context = context
    this.client = context.client
    this.task = context.task
    this.taskConfig = context.config
  }
  async getFeedItems(): Promise<FeedItem[]> {
    throw new Error('Unimplemented')
  }
  async reportFeedItems(itemUpdates: FeedItemUpdate[]): Promise<void> {
    // If there are items to post, we'll post "posting x new items" to the log.
    await this.context.log.info(logFeedItemUpdates(itemUpdates))
  }
  async postFeedItem(itemUpdate: FeedItemUpdate): Promise<FeedItemUpdateResult> {
    throw new Error('Unimplemented')
  }
}

/**
 * Limits the number of feed update items to a given number.
 * 
 * This is used for tasks that don't want to post too many items at once.
 * For example, if a task's getFeedItems() returns 50 items, and its limit is set to 5,
 * it will only post 5 items for now and get to the remaining 45 in subsequent calls.
 * 
 * This is useful for tasks that have a very expensive payload function, or tasks
 * that need to be wary of rate limits.
 */
function limitPostableItems(feedItemUpdates: FeedItemUpdate[], taskUpdateLimit: number | null): FeedItemUpdate[] {
  if (taskUpdateLimit === null) {
    return feedItemUpdates
  }
  return feedItemUpdates.slice(0, taskUpdateLimit)
}

/**
 * Runs a FeedTask type task.
 * 
 * This function is called from the scheduler. It implements the flow described above.
 */
export async function runFeedTask(taskInstance: FeedTask, task: BotTask, subtask: string, action: BotTaskAction, guildId: string, bot: CronBot): Promise<void> {
  const {orm} = taskInstance.context
  try {
    const feedItems = await taskInstance.getFeedItems()
    const postableItems = limitPostableItems(await orm.filterFeedItems(feedItems), action.batchLimit || null)
    await taskInstance.reportFeedItems(postableItems)
    for (const postableItem of postableItems) {
      const guid = postableItem.data.guid
      const msg = await taskInstance.postFeedItem(postableItem)
      if (!msg.messageId) {
        bot.logError(guildId, `Task **${task.id}.${subtask}** did not return messageId`, {guid})
        continue
      }
      await orm.insertFeedItem(guid, task.id, subtask, postableItem.data.data, msg.messageId, msg.guildId, msg.channelId)
      await sleep(FEED_ITEM_INTERVAL)
    }
  }
  catch (err) {
    bot.logError(guildId, `Error running task: **${task.id}.${subtask}**`, {guildId}, err as Error)
  }
}
