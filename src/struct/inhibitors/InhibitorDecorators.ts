import type { Inhibitor, InhibitorDecorator } from "./Inhibitor";
import type { Command } from "../commands/Command";
import type { Message } from "discord.js";

const decorate = (fn: <T extends typeof Inhibitor>(command: T) => T | void): InhibitorDecorator => fn;

export function initInhibtor(onInit: (inhibitor: Inhibitor) => any) {
  // @ts-ignore
  return decorate(inhibitor => class extends inhibitor {
    public constructor(...args: any[]) {
      // @ts-ignore
      super(...args);
      onInit(this);
    }
  });
}

export function inhibit(onInhibit: (this: Inhibitor, message: Message, command: Command) => void) {
  return initInhibtor(inhibitor => inhibitor.on("inhibit", onInhibit.bind(inhibitor)));
}
