import { Structures } from "discord.js";
import { Provided } from "../providers/Provided";
import { CommandHandler } from "../commands/CommandHandler";

declare module "discord.js" {
  interface GuildMember extends Provided {
    readonly commands: CommandHandler;
    readonly admin: boolean;
  }
}

Structures.extend("GuildMember", GuildMember => class extends Provided(GuildMember, "members") {
  public readonly commands = new CommandHandler(this);
  public get providedId() {
    return `${this.guild.id}_${this.id}`;
  }
  public get admin() {
    return this.hasPermission("ADMINISTRATOR");
  }
});