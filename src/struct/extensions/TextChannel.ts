import { Structures } from "discord.js";
import { CommandHandler } from "../commands/CommandHandler";

Structures.extend("TextChannel", TextChannel => class extends TextChannel {
  public readonly commands = new CommandHandler(this);
});