import { Structures } from "discord.js";
import { CommandHandler } from "../commands/CommandHandler";

Structures.extend("DMChannel", DMChannel => class extends DMChannel {
  public readonly commands = new CommandHandler(this);
});