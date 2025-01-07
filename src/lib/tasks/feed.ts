// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {Client, DiscordAPIError, type BaseMessageOptions, type Message} from 'discord.js'
import CronBot from '../../cronbot.ts'
import {logFeedItemUpdates, getDiscordMessageLink, sleep} from '../util/index.ts'
import type {FeedItem, FeedItemUpdate, BotTask, BotTaskAction, TaskActionContext} from '../../types.ts'

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
  async reportFeedItems(feedItemUpdates: FeedItemUpdate[]): Promise<void> {
    // If there are items to post, we'll post "posting x new items" to the log.
    await this.context.log.info(logFeedItemUpdates(feedItemUpdates))
  }
  async getFeedItems(): Promise<FeedItem[]> {
    throw new Error('Unimplemented')
  }
  async getFeedItemPayload(feedItem: FeedItem): Promise<BaseMessageOptions> {
    throw new Error('Unimplemented')
  }
}

/**
 * Limits the number of feed update items to a given number.
 * 
 * This actually returns twice as many items as the update limit;
 * the additional items are used in case of errors.
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
  return feedItemUpdates.slice(0, taskUpdateLimit * 2)
}

/**
 * Posts feed item payloads to Discord and returns the message/channel/guild ids.
 * 
 * Either posts a new message, or edits an existing message if the itemUpdate is an update type.
 * 
 * This only succeeds if we have a given channel in the config that is open to receive messages.
 * A number of things can go wrong, in which case this function will throw.
 */
async function postFeedItemPayload(taskInstance: FeedTask, payload: BaseMessageOptions, itemUpdate: FeedItemUpdate, task: BotTask, subtask: string) {
  const {client} = taskInstance
  const {guid, taskConfig} = itemUpdate.data
  const taskName = `**${task.id}.${subtask}**`
  let isRepost = false
  if (taskConfig.channel == null) {
    throw new Error(`Task ${taskName} has no channel configured in the task config`)
  }
  const channel = await client.channels.fetch(taskConfig.channel)
  if (channel == null) {
    throw new Error(`Task ${taskName} channel could not be found: ${taskConfig.channel}`)
  }
  if (!channel.isSendable()) {
    throw new Error(`Task ${taskName} channel is not sendable: ${taskConfig.channel}`)
  }

  // Depending on what type of update we are doing, either post a new message or edit an existing one.
  let msg
  if (itemUpdate.action === 'insert') {
    msg = await channel.send(payload)
  }
  else if (itemUpdate.action === 'update') {
    try {
      msg = await channel.messages.fetch(itemUpdate.messageId)
      await msg.edit(payload)
    }
    catch (err) {
      if (err instanceof DiscordAPIError) {
        // If the post does not exist, we'll handle it by posting it newly.
        // If it's any other error, we'll rethrow the error so it gets logged.
        if (err.code === 10008) {
          msg = await channel.send(payload)
          isRepost = true
        }
        else {
          throw err
        }
      }
      else {
        throw err
      }
    }
  }
  else {
    throw new Error(`Item update has an invalid action type: ${(itemUpdate as FeedItemUpdate).action as string}`)
  }
  if (msg == null) {
    throw new Error(`Could not ${itemUpdate.action} message: guid=${guid}`)
  }
  if (!msg.id) {
    throw new Error(`Task ${taskName} item post did not get a messageId: guid=${guid}`)
  }
  return {
    messageId: msg.id,
    channelId: msg.channelId,
    guildId: msg.guildId || '',
    isRepost,
  }
}

/**
 * Runs a FeedTask type task.
 * 
 * This function is called from the scheduler. It implements the flow described above.
 */
export async function runFeedTask(taskInstance: FeedTask, task: BotTask, subtask: string, action: BotTaskAction, guildId: string, bot: CronBot): Promise<void> {
  const {orm} = taskInstance.context
  try {
    // Request the full list of feed items from the task.
    const feedItems = await taskInstance.getFeedItems()
    // Now we'll remove all items we don't need to post. We'll post only a number of items equal to the task's batch limit.
    // However, we'll actually limit this to *twice* the batch limit; the additional items are normally not posted,
    // but if any items fail we'll try to post an additional item in its stead. This prevents tasks with batchLimit=1
    // from having a single problematic post that blocks the entire pipeline indefinitely.
    const postableItems = limitPostableItems(await orm.filterFeedItems(feedItems), action.batchLimit || null)
    // Ask the task to report on the number of items we're about to post.
    await taskInstance.reportFeedItems(postableItems)

    // We've now got a number of postable items, which we will be posting one by one.
    // Before posting, we'll request the task to produce the payload for this post.
    for (let n = 0, posted = 0; n < postableItems.length; ++n) {
      const postableItem = postableItems[n]
      if (action.batchLimit != null && posted > action.batchLimit) {
        break
      }
      const guid = postableItem.data.guid
      
      // Get the message payload from the task. This can potentially be an expensive call.
      const payload = await taskInstance.getFeedItemPayload(postableItem.data)
      // Post the message to Discord and get the posted message id.
      const msg = await postFeedItemPayload(taskInstance, payload, postableItem, task, subtask)
      // Insert the message id and other metadata into the database.
      await orm.insertFeedItem(guid, task.id, subtask, postableItem.data.data, msg.messageId, msg.guildId, msg.channelId)

      if (msg.isRepost) {
        bot.logInfo(guildId, `Task **${task.id}.${subtask}** reposted a message that appeared to have been deleted: ${getDiscordMessageLink(msg.messageId, msg.channelId, msg.guildId)}`)
      }

      posted += 1
      
      await sleep(FEED_ITEM_INTERVAL)
    }
  }
  catch (err) {
    bot.logError(guildId, `Error running task: **${task.id}.${subtask}**`, {guildId}, err as Error)
  }
}
