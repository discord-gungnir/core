import { Inhibitor } from "../Inhibitor";
import type { Message } from "discord.js";
import type { Command } from "../../commands/Command";
import { defineInhibitor } from "../DefineInhibitor";

@defineInhibitor("deny_bots")
export class DenyBotsInhibitor extends Inhibitor {
  public inhibit(msg: Message, command: Command) {
    return !command.options.allowBots && msg.author.bot;
  }
}