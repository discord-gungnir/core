import { Provider } from "../modules/providers/Provider";
import type { GungnirClient } from "../GungnirClient";
import { Structures } from "discord.js";
import { Command } from "../modules/commands/Command";

declare module "discord.js" {
  interface Guild {
    readonly commandHandler: Command.Handler;
    readonly data: Provider.DataAccessor<Guild>;
  }
}
Structures.extend("Guild", Guild => class extends Guild {
  public readonly client!: GungnirClient;
  public readonly commandHandler: Command.Handler = new Command.Handler(this);
  public readonly data = new Provider.DataAccessor(this, `guild:${this.id}`);
});