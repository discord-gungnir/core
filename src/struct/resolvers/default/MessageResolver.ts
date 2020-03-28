import { Resolver } from "../Resolver";
import type { Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("message")
export class MessageResolver extends Resolver<Message> {
  public async resolve(str: string, msg: Message) {
    return msg.channel.messages.resolve(str) ?? msg.channel.messages.fetch(str).catch(() => null);
  }
}