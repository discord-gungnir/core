import { Provider } from "../modules/providers/Provider";
import type { GungnirClient } from "../GungnirClient";
import { Structures } from "discord.js";

declare module "discord.js" {
  interface GuildMember {
    readonly data: Provider.DataAccessor<GuildMember>;
    readonly admin: boolean;  
  }
}
Structures.extend("GuildMember", GuildMember => class extends GuildMember {
  public readonly client!: GungnirClient;
  public readonly data: Provider.DataAccessor<this> = new Provider.DataAccessor(this, `guild:${this.guild.id}/member:${this.id}`);
});