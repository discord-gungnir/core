import type { CommandHandler } from "../commands/CommandHandler";
import type { PrefixResolvable } from "../Types";

declare module "discord.js" {
  interface TextBasedChannelFields {
    readonly commands: CommandHandler;
    prefix?: PrefixResolvable;
  }
}