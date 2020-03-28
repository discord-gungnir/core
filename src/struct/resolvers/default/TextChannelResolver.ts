import { ChannelResolver } from "./ChannelResolver";
import { TextChannel, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("textchannel")
export class TextChannelResolver extends ChannelResolver {
  public resolver(str: string, msg: Message) {
    const channel = super.resolve(str, msg);
    if (!channel) return channel;
    return channel instanceof TextChannel ? channel : null;
  }
}