import type { Message } from "discord.js";

export type Color = [red: number, green: number, blue: number];

export type SyncPrefix = string | ((message: Message) => string);
export type AsyncPrefix = Promise<string> | ((message: Message) => Promise<string>);
export type Prefix = SyncPrefix | AsyncPrefix;

export interface Disableable {
  disabled: boolean;
  enabled: boolean;
  enable(): void;
  disable(): void;
}