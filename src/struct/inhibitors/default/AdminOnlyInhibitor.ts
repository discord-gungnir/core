import { Inhibitor } from "../Inhibitor";
import type { Message } from "discord.js";
import type { Command } from "../../commands/Command";
import { defineInhibitor } from "../DefineInhibitor";

@defineInhibitor("admin_only")
export class AdminOnlyInhibitor extends Inhibitor {
  public inhibit(msg: Message, command: Command) {
    return command.options.adminOnly && msg.member !== null && msg.member.admin;
  }
}