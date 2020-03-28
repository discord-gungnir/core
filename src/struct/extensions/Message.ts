import { Structures } from "discord.js";
import { Provided } from "../providers/Provided";
import type { PrefixResolvable } from "../Types";

declare module "discord.js" {
  interface Message {
    prefix?: PrefixResolvable;

    readonly poster: GuildMember | User;
    readonly posterName: string;
    convertMentions(prefix: string): string;
  }
}

Structures.extend("Message", Message => class extends Provided(Message, "messages") {
  public get poster() {
    return this.member ? this.member : this.author;
  }
  public get posterName() {
    return this.member ? this.member.displayName : this.author.username;
  }

  public convertMentions(prefix: string): string {
    let content = this.content;

    return content;
  }
});