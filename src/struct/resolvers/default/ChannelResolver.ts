import { Resolver, ResolvesTo } from "../Resolver";
import type { GuildChannel, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("channel")
export class ChannelResolver extends Resolver<GuildChannel> {
  public resolve(str: string, msg: Message) {
    if (!msg.guild) return null;
    if (/^<@#\d{18}>$/.test(str)) str = (str.match(/\d{18}/) as RegExpMatchArray)[0];
    return msg.guild.channels.resolve(str);
  }
}