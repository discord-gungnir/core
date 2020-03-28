import { Structures } from "discord.js";
import { Provided } from "../providers/Provided";
import { CommandHandler } from "../commands/CommandHandler";

declare module "discord.js" {
  interface User extends Provided {
    owner: boolean;
    readonly commands: CommandHandler;
  }
}

Structures.extend("User", User => class extends Provided(User, "users") {
  public readonly commands = new CommandHandler(this);
  public get owner(): boolean {
    return this.client.isOwner(this);
  }
  public set owner(owner) {
    this.client.setOwner(this, owner);
  }
});