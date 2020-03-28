import { Inhibitor } from "../Inhibitor";
import type { Message } from "discord.js";
import type { Command } from "../../commands/Command";
import { defineInhibitor } from "../DefineInhibitor";

@defineInhibitor("nsfw")
export class NSFWInhibitor extends Inhibitor {
  public inhibit(msg: Message, command: Command) {
    return command.options.nsfw && "nsfw" in msg.channel && !msg.channel.nsfw;
  }
}