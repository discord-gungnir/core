import { Inhibitor } from "../Inhibitor";
import type { Message } from "discord.js";
import type { Command } from "../../commands/Command";
import { defineInhibitor } from "../DefineInhibitor";

@defineInhibitor("guild_only")
export class GuildOnlyInhibitor extends Inhibitor {
  public inhibit(msg: Message, command: Command) {
    return command.options.restrictedTo == "guild" && msg.guild === null;
  }
}