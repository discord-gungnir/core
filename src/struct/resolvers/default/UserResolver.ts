import { Resolver } from "../Resolver";
import type { User, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("user")
export class UserResolver extends Resolver<User> {
  public async resolve(str: string, msg: Message) {
    if (/^<@!?\d{18}>$/.test(str)) str = (str.match(/\d{18}/) as RegExpMatchArray)[0];
    return msg.client.users.resolve(str) ?? msg.client.users.fetch(str).catch(() => null);
  }
}