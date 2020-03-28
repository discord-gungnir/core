import { Resolver } from "../Resolver";
import type { Guild, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("guild")
export class GuildResolver extends Resolver<Guild> {
  public resolve(str: string, msg: Message) {
    return msg.client.guilds.resolve(str);
  }
}