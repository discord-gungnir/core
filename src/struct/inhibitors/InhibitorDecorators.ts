import type { Inhibitor, InhibitorDecorator } from "./Inhibitor";
import type { Command } from "../commands/Command";
import type { Message } from "discord.js";

export function initInhibitor(onInit: (inhibitor: Inhibitor) => any): InhibitorDecorator {
  // @ts-ignore
  return <T extends typeof Inhibitor>(inhibitor: T) => class extends inhibitor {
    public constructor(...args: any[]) {
      // @ts-ignore
      super(...args);
      onInit(this);
    }
  }
}

export function inhibit(onInhibit: (this: Inhibitor, message: Message, command: Command) => void) {
  return initInhibitor(inhibitor => inhibitor.on("inhibit", onInhibit.bind(inhibitor)));
}
