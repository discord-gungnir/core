import { Structures } from "discord.js";
import { Provided } from "../providers/Provided";
import { CommandHandler } from "../commands/CommandHandler";

declare module "discord.js" {
  interface Role extends Provided {
    readonly commands: CommandHandler;
  }
}

Structures.extend("Role", Role => class extends Provided(Role, "roles") {
  public readonly commands = new CommandHandler(this);
});