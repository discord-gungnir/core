import { Provider } from "../modules/providers/Provider";
import type { GungnirClient } from "../GungnirClient";
import { Structures } from "discord.js";

declare module "discord.js" {
  interface User {
    readonly data: Provider.DataAccessor<User>;
    owner: boolean;
  }
}
Structures.extend("User", User => class extends User {
  public readonly client!: GungnirClient;
  public readonly data: Provider.DataAccessor<this> = new Provider.DataAccessor(this, `user:${this.id}`);
  public get owner(): boolean {
    return this.client.isOwner(this);
  }
  public set owner(owner) {
    this.client.setOwner(this, owner);
  }
});