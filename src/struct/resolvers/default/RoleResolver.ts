import { Resolver } from "../Resolver";
import type { Role, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("role")
export class RoleResolver extends Resolver<Role> {
  public async resolve(str: string, msg: Message) {
    if (!msg.guild) return null;
    if (/^<@&\d{18}>$/.test(str)) str = (str.match(/\d{18}/) as RegExpMatchArray)[0];
    return msg.guild.roles.resolve(str) ?? msg.guild.roles.fetch(str).catch(() => null);
  }
}