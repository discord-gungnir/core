import { Resolver } from "../Resolver";
import { Command } from "../../commands/Command";
import type { Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("command")
export class CommandResolver extends Resolver<Command> {
  public resolve(str: string, msg: Message) {
    return Command.resolve(str.split(/\s+/g) as [string, ...string[]], msg);
  }
}