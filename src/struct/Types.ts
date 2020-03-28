import type { GungnirClient } from "./GungnirClient";
import type { Message } from "discord.js";

export type ClientOrHasClient = GungnirClient | {client: GungnirClient};

export type Prefix = string | Promise<string>;
export type PrefixResolvable = Prefix | ((message: Message) => Prefix);

export namespace Prefix {
  export function resolve(prefix: PrefixResolvable, message: Message): Prefix {
    if (typeof prefix == "function") prefix = prefix(message);
    return prefix;
  }
}