import type { GungnirClient } from "../GungnirClient";
import { Structures } from "discord.js";

declare module "discord.js" {
  interface Message {
    readonly poster: GuildMember | User;
    readonly posterName: string;
  }
}
Structures.extend("Message", Message => class extends Message {
  public constructor(client: GungnirClient, data: any, channel: any) {
    super(client, data, channel);
  }

  // util
  public get poster() {
    return this.member ? this.member : this.author;
  }
  public get posterName() {
    return this.member ? this.member.displayName : this.author.username;
  }
});