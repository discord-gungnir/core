import { Structures } from "discord.js";
import { CommandHandler } from "../commands/CommandHandler";

declare module "discord.js" {
  interface VoiceChannel {
    readonly commands: CommandHandler;
  }
}

Structures.extend("VoiceChannel", VoiceChannel => class extends VoiceChannel {
  public readonly commands = new CommandHandler(this);
});