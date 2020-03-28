import type { Command, CommandDecorator } from "./Command";
import type { Message } from "discord.js";
import type { Inhibitor } from "../inhibitors/Inhibitor";

const decorate = (fn: <T extends typeof Command>(command: T) => T): CommandDecorator => fn;

/**
 * Define a callback that is called when the command is created
 * @param onInit Called after the command is created
 */
export function initCommand(onInit: (command: Command) => any) {
  // @ts-ignore
  return decorate(command => class extends command {
    public constructor(...args: any[]) {
      // @ts-ignore
      super(...args);
      onInit(this);
    }
  });
}

/** 
 * Define a callback that is called after the command ran
 * @param onRan Called after the command ran
*/
export function commandRan(onRan: (this: Command, message: Message, res: any) => void) {
  return initCommand(command => command.on("ran", onRan.bind(command)));
}

/**
 * Define a callback that is called when the command errors
 * @param onError Called when the command errors
 */
export function commandError(onError: (this: Command, message: Message, error: Error) => void) {
  return initCommand(command => command.on("error", onError.bind(command)));
}

/**
 * Define a callback that is called when the command is inhibited
 * @param onInhibited Called whe the command is inhibited
 */
export function commandInhibited(onInhibited: (this: Command, message: Message, inhibitor: Inhibitor) => void) {
  return initCommand(command => command.on("inhibited", onInhibited.bind(command)));
}