import { Inhibitor } from "../Inhibitor";
import type { Message } from "discord.js";
import type { Command } from "../../commands/Command";
import { defineInhibitor } from "../DefineInhibitor";

@defineInhibitor("dm_only")
export class DMOnlyInhibitor extends Inhibitor {
  public inhibit(msg: Message, command: Command) {
    return command.options.restrictedTo == "dm" && msg.guild !== null;
  }
}