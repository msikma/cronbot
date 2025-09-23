// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import {PermissionsBitField, GatewayIntentBits} from 'discord.js'

/** Permissions needed by the bot to function. */
export const requiredBotPermissions = new PermissionsBitField([
  // Numeric value:
  // 583127978863824

  // General permissions
  PermissionsBitField.Flags.ViewAuditLog,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.ManageEvents,
  PermissionsBitField.Flags.CreateEvents,
  PermissionsBitField.Flags.ViewGuildInsights,
  PermissionsBitField.Flags.ViewCreatorMonetizationAnalytics,

  // Text permissions
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.SendMessagesInThreads,
  PermissionsBitField.Flags.CreatePublicThreads,
  PermissionsBitField.Flags.CreatePrivateThreads,
  PermissionsBitField.Flags.ManageMessages,
  PermissionsBitField.Flags.EmbedLinks,
  PermissionsBitField.Flags.AttachFiles,
  PermissionsBitField.Flags.ReadMessageHistory,
  PermissionsBitField.Flags.AddReactions,
  PermissionsBitField.Flags.SendPolls,

  // Voice permissions
  // none.
])

/** Intents required by the bot. */
export const requiredBotIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
]
