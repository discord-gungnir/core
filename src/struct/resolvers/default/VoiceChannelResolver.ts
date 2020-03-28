import { ChannelResolver } from "./ChannelResolver";
import { VoiceChannel, Message } from "discord.js";
import { defineResolver } from "../DefineResolver";

@defineResolver("voicechannel")
export class VoiceChannelResolver extends ChannelResolver {
  public resolver(str: string, msg: Message) {
    const channel = super.resolve(str, msg);
    if (!channel) return channel;
    return channel instanceof VoiceChannel ? channel : null;
  }
}