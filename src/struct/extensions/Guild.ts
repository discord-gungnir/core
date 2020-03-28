import { Structures } from "discord.js";
import { Provided } from "../providers/Provided";
import type { PrefixResolvable } from "../Types";
import { CommandHandler } from "../commands/CommandHandler";

declare module "discord.js" {
  interface Guild extends Provided {
    readonly commands: CommandHandler;
    prefix?: PrefixResolvable;
  }
}

Structures.extend("Guild", Guild => class extends Provided(Guild, "guilds") {
  public readonly commands = new CommandHandler(this);
});