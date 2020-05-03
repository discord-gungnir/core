import type { Command, CommandDecorator } from "./Command";
import type { Message } from "discord.js";
import type { Inhibitor } from "../inhibitors/Inhibitor";

/**
 * Define a callback that is called when the command is created
 * @param onInit Called after the command is created
 */
export function initCommand<P extends any[], R = any>(onInit: (command: Command<P, R>) => any): CommandDecorator<P, R> {
  // @ts-ignore
  return <T extends typeof Command>(command: T) => class extends command {
    public constructor(...args: any[]) {
      // @ts-ignore
      super(...args);
      onInit(this);
    }
  }
}

/** 
 * Define a callback that is called after the command ran
 * @param onRun Called after the command ran
*/
export function commandRun<P extends any[], R = any>(onRun: (this: Command<P, R>, message: Message, args: P, result: R) => void) {
  return initCommand<P, R>(command => command.on("run", onRun.bind(command)));
}

/**
 * Define a callback that is called when the command errors
 * @param onError Called when the command errors
 */
export function commandError<P extends any[], R = any>(onError: (this: Command<P, R>, message: Message, args: P, error: Error) => void) {
  return initCommand<P, R>(command => command.on("error", onError.bind(command)));
}

/**
 * Define a callback that is called when the command is inhibited
 * @param onInhibited Called whe the command is inhibited
 */
export function commandInhibited<P extends any[], R = any>(onInhibited: (this: Command<P, R>, message: Message, inhibitor: Inhibitor) => void) {
  return initCommand<P, R>(command => command.on("inhibited", onInhibited.bind(command)));
}

/**
 * Define metadata on the command when it is created using the Reflect API
 * @param key Metadata key
 * @param value Metadata value
 */
export function commandMetadata(metadataKey: string, metadataValue: any) {
  return initCommand(command => Reflect.defineMetadata(metadataKey, metadataValue, command));
}

/**
 * Set the command's description
 * @param value The command's description
 */
export const description = (value: string) => commandMetadata("description", value);

/**
 * Set the command's group
 * @param value The command's group
 */
export const group = (value: string) => commandMetadata("group", value);