import type { Inhibitor, InhibitorDecorator } from "./Inhibitor";
import type { Command } from "../commands/Command";
import type { Message } from "discord.js";

export function initInhibitor<T extends Inhibitor>(onInit: (inhibitor: T) => any): InhibitorDecorator<T> {
  // @ts-ignore
  return <T extends Function & {prototype: T}>(inhibitor: T) => class extends inhibitor {
    public constructor(...args: any[]) {
      super(...args);
      // @ts-ignore
      onInit(this);
    }
  }
}

export function inhibit<T extends Inhibitor>(onInhibit: (this: T, message: Message, command: Command) => void) {
  return initInhibitor<T>(inhibitor => inhibitor.on("inhibit", onInhibit.bind(inhibitor)));
}
