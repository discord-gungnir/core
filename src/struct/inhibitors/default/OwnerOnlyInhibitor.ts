import { Inhibitor } from "../Inhibitor";
import type { Message } from "discord.js";
import type { Command } from "../../commands/Command";
import { defineInhibitor } from "../DefineInhibitor";

@defineInhibitor("owner_only")
export class OwnerOnlyInhibitor extends Inhibitor {
  public inhibit(msg: Message, command: Command) {
    return command.options.ownerOnly && !msg.author.owner;
  }
}