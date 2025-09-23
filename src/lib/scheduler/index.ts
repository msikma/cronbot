// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {sleep, createTaskEmbed} from '../util/index.ts'
import CronBot from '../../cronbot.ts'
import {runFeedTask, isFeedTask} from '../../index.ts'
import type {BotTask, BotTaskAction, BotTaskActionConfig, TaskActionContext, ScheduledTaskData} from '../../types.ts'

const PAUSE_WAIT = 500
const GUILD_WAIT = 500

/**
 * Task scheduler for the bot.
 * 
 * This takes in tasks and sets the up to be called in an infinite loop.
 * 
 * A task function call is called an "action", and a task action is called once per configured guild.
 * So if a task is configured for two different guilds, it will be called twice on each iteration.
 * Each time a task action is called, it is given a context object containing all required data,
 * such as the task logger functions and other things.
 */
export class BotTaskScheduler {
  // Reference to the bot owning this scheduler.
  private bot: CronBot
  // Tasks that are currently scheduled.
  private tasks: Map<string, ScheduledTaskData> = new Map()
  // Whether the scheduler has started yet.
  private isStarted = false

  constructor(cronBot: CronBot) {
    this.bot = cronBot
  }

  /**
   * Adds a task to the scheduler.
   * 
   * We'll first create a scheduled task object and add it to the tasks list by task id.
   * Once the scheduler starts, it will begin looping forever and calling the task function.
   */
  public addTask(task: BotTask) {
    if (this.tasks.has(task.id)) {
      throw new Error(`Tried to add the same task twice: ${task.id}`)
    }

    // Create the scheduled task object.
    for (const [name, n] of this.unpackTaskActions(task)) {
      const taskId = `${task.id}$${name}`
      this.tasks.set(taskId, this.createScheduledTask(task, n))

      // Normally, the scheduler does not start until the bot is connected.
      // If the scheduler is already running, start this new task immediately.
      // Otherwise, we'll leave it be until the scheduler is started.
      if (this.isStarted) {
        this.startTask(taskId)
      }
    }
  }

  /**
   * Returns the bot's actions and their function names.
   */
  private unpackTaskActions(task: BotTask): [string, number][] {
    return (task.actions || []).map((action, n) => [action.action.name, n])
  }

  /**
   * Creates a scheduled task object out of a task.
   * 
   * This sets the task up to begin execution the scheduler starts.
   */
  private createScheduledTask(task: BotTask, actionN: number): ScheduledTaskData {
    return {
      id: task.id,
      task,
      isStarted: false,
      isPaused: false,
      isCanceled: false,
      // We'll create the action and loop function once the scheduler starts,
      // as we don't have the config loaded at this point yet.
      action: null,
      actionN,
      loop: null,
    }
  }

  /**
   * Returns the full config for a given task.
   * 
   * This config object will contain all configured guilds.
   */
  private getTaskConfig(task: BotTask) {
    return this.bot.getTaskConfig(task.id)
  }

  /**
   * Creates a task's action generator.
   * 
   * This generator loops forever and yields calls to the task's function
   * with the appropriate execution context.
   */
  private async *createTaskAction(task: BotTask, actionN: number): AsyncGenerator<void> {
    const action = task.actions?.[actionN]

    if (action === undefined) {
      throw new Error(`No action defined for task: ${task.id}`)
    }
    
    // Set a minimum of 100ms for the interval.
    const interval = Math.max(action.interval, 100)

    // If the task is deferred, it means we're sleeping once before calling it for the first time.
    // Non-deferred tasks are called immediately. If deferred is not set, we assume it's true.
    if (action.deferred !== false) {
      yield await sleep(interval)
    }

    // Get the task's full config.
    const config = this.getTaskConfig(task)

    // Prepare the task instances; one per guild.
    const instanceClass = action.action
    const instances: Map<string, InstanceType<typeof instanceClass>> = new Map()
    for (const [guildId, taskConfig] of config.guilds.entries()) {
      const subtask = action.action.name
      const context = await this.getTaskActionContext(task, subtask, action, taskConfig, guildId, this.bot)
      const instance = new action.action(context)
      instances.set(guildId, instance)
    }

    // Loop forever and yield task action calls.
    while (true) {
      for (const guildId of config.guilds.keys()) {
        const instance = instances.get(guildId)!
        if (isFeedTask(instance)) {
          const subtask = action.action.name
          await runFeedTask(instance, task, subtask, action, guildId, this.bot)
        }
        else {
          throw new Error('Invalid task type: must subclass FeedTask')
        }
        yield await sleep(GUILD_WAIT)
      }
      yield await sleep(interval)
    }
  }

  /**
   * Loops the task's action generator until the task is paused, canceled or done.
   * 
   * Note that the task will never be done as it loops forever.
   * The value returned by the generator is always void.
   */
  private async loopTaskAction(taskData: ScheduledTaskData): Promise<void> {
    const {action, isCanceled, isPaused} = taskData
    if (action === null) {
      throw new Error(`Task action has not been created yet: ${taskData.id}`)
    }
    while (true) {
      if (isCanceled) {
        break
      }
      if (isPaused) {
        await sleep(PAUSE_WAIT)
        continue
      }
      const {value, done} = await action.next()
      if (done) {
        break
      }
    }
  }

  /**
   * Creates the context object for a single task iteration.
   */
  private async getTaskActionContext(
    task: BotTask,
    subtask: string,
    action: BotTaskAction,
    actionConfig: BotTaskActionConfig,
    guildId: string,
    bot: CronBot
  ): Promise<TaskActionContext> {
    const loggers = this.bot.logger.createTaskLoggers(task, guildId)
    const orm = this.bot.db.getTaskActionDatabaseOrm(task, subtask)
    return {
      task,
      subtask,
      action,
      config: actionConfig,
      guildId,
      client: bot.getClient(),
      bot: bot,
      db: this.bot.db,
      orm,
      log: {
        info: loggers.logInfo,
        error: loggers.logError,
      },
      TaskEmbed: createTaskEmbed(task),
    }
  }

  /**
   * Starts the scheduler's tasks.
   * 
   * All tasks that have been queued will be started at this point.
   * Tasks that are added after the scheduler is started will be started immediately.
   * The scheduler cannot be paused or stopped once it's started.
   */
  public startAllTasks() {
    if (this.isStarted) {
      return
    }
    this.isStarted = true

    for (const [id, task] of this.tasks.entries()) {
      if (!task.isStarted) {
        try {
          this.startTask(id)
        }
        catch (err) {
          console.error(`Failed to start task: ${id}`)
        }
      }
    }
  }

  /**
   * Returns all tasks associated by an id.
   */
  private getTasksById(id: string): string[] {
    const tasks = []
    for (const taskIdString of this.tasks.keys()) {
      const [taskId, taskActionName] = taskIdString.split('$')
      if (taskId === id) {
        tasks.push(taskIdString)
      }
    }
    return tasks
  }

  /**
   * Starts a single task.
   * 
   * This creates a looping function that forever calls the scheduled task's
   * action generator, until the task is paused or canceled.
   */
  private startTask(id: string) {
    if (!this.tasks.has(id)) {
      throw new Error(`Tried to start an invalid task: ${id}`)
    }
    const task = this.tasks.get(id)!
    if (task.isStarted) {
      throw new Error(`Tried to start the same task twice: ${id}`)
    }
    task.isStarted = true
    task.action = this.createTaskAction(task.task, task.actionN)
    task.loop = this.loopTaskAction(task)
  }

  /**
   * Starts all actions for a given task.
   */
  private startAllTaskActions(id: string) {
    const tasksForId = this.getTasksById(id)
    if (tasksForId.length === 0) {
      throw new Error(`Tried to start an invalid task: ${id}`)
    }
    for (const taskId of tasksForId) {
      this.startTask(taskId)
    }
  }

  /**
   * Pauses a task temporarily.
   */
  public pauseTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Invalid task: ${id}`)
    }
    task.isPaused = true
  }

  /**
   * Resumes a paused task.
   */
  public resumeTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Invalid task: ${id}`)
    }
    task.isPaused = false
  }

  /**
   * Cancels a task.
   * 
   * This stops the task and frees its id up to be readded later.
   */
  public cancelTask(id: string): void {
    const task = this.tasks.get(id)
    if (!task) {
      throw new Error(`Invalid task: ${id}`)
    }
    task.isCanceled = true
    this.tasks.delete(id)
  }
}
