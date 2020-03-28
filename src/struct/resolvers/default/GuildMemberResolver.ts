import { Resolver } from "../Resolver";
import type { GuildMember, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("member")
export class GuildMemberResolver extends Resolver<GuildMember> {
  public async resolve(str: string, msg: Message) {
    if (!msg.guild) return null;
    if (/^<@!?\d{18}>$/.test(str)) str = (str.match(/\d{18}/) as RegExpMatchArray)[0];
    return msg.guild.members.resolve(str) ?? msg.guild.members.fetch(str).catch(() => null);
  }
}