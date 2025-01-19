[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/) [![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/@dada78641%2Fcronbot.svg)](https://badge.fury.io/js/@dada78641%2Fcronbot)

# @dada78641/cronbot

**CronBot** is a lightweight and straightforward Discord bot framework built with TypeScript and powered by [discord.js](https://discord.js.org/).

It is designed specifically for scheduling and running **periodic tasks** that push information to Discord channels.

> [!WARNING]  
> I wrote this purely for personal use, so there isn't much documentation. Feel free to use it if you want to but don't expect much in terms of support or documentation.

## Usage

### Creating a bot

```bash
npm i @dada78641/cronbot
```

```ts
import CronBot from '@dada78641/cronbot'

const callistoBot = new CronBot({
  id: 'callisto',
  name: 'Callisto',
  path: import.meta.dirname,
  tasks: [
    myTask,
  ],
  clientOptions: {intents: requiredBotIntents}
})
```

### Application

You'll need to set up a **bot application** on the [Discord Developer Portal](https://discord.com/developers/).

1. Create a new application. Copy the **client id** (or **application id**) for use in the installation link in a moment.
2. Go to the Bot section and click **Reset Token**. Copy the **token** over to the [config file](/resources/config-example.js). Check **Server Members Intent** and **Message Content Intent**.
3. Go to Installation and uncheck **User Install**. Set the **Install Link** to **None**.
4. Invite your bot to a server using the following link (copy in your own client id from before):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=2147593280&scope=bot%20applications.commands
```

The bot will now be present on your server, and when you connect it will have permission to start posting there. Note that you don't have to keep the client id handy after this—just the bot token is needed to connect.

### Config

The bot is configured with a single `config.js` file.

Config files must have two exports: `systemConfig` and `taskConfig`.

The config file will be imported from `~/.config/BOT_ID/config.js`, where `BOT_ID` is whatever you've passed in the CronBot constructor.

### Tasks

A task must subclass FeedTask. After a task has been added to the bot, it will automatically be scheduled and periodically called.

The flow for a FeedTask works like this:

* We call a task instance's getFeedItems() and get a list of items that may or may not have been posted to Discord yet. Each item has a unique `guid` value.
* The framework filters out the items that are already posted and don't need to be updated.
* The task instance's getFeedItemPayload() method is called to get a payload for each item that needs to be posted.
* The framework then posts those and saves them to the database so we know they've been posted.

From the task creator's perspective, only getFeedItems() and getFeedItemPayload() need to be implemented with the proper interface. Various other methods are available as well.

## External links

* [Discord.js guide - Creating your bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)

## License

MIT licensed.
