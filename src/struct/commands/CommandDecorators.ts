import type { Command, CommandDecorator, CommandParameters, CommandReturnType } from "./Command";
import type { Message } from "discord.js";
import type { Inhibitor } from "../inhibitors/Inhibitor";

/**
 * Define a callback that is called when the command is created
 * @param onInit Called after the command is created
 */
export function initCommand<T extends Command>(onInit: (command: T) => any): CommandDecorator<T> {
  // @ts-ignore
  return <T extends Function & {prototype: T}>(command: T) => class extends command {
    public constructor(...args: any[]) {
      super(...args);
      // @ts-ignore
      onInit(this);
    }
  }
}

/**
 * Define a callback that is called before the command runs
 * @param onPrepare Called before the command runs
*/
export function prepare<T extends Command>(onPrepare: (this: T, message: Message, args: CommandParameters<T>) => void) {
  return initCommand<T>(command => command.on("prepare", onPrepare.bind(command)));
}

/**
 * Define a callback that is called after the command ran
 * @param onRan Called after the command ran
*/
export function ran<T extends Command>(onRan: (this: T, message: Message, args: CommandParameters<T>, result: CommandReturnType<T>) => void) {
  return initCommand<T>(command => command.on("ran", onRan.bind(command)));
}

/**
 * Define a callback that is called when the command errors
 * @param onError Called when the command errors
 */
export function error<T extends Command>(onError: (this: T, message: Message, args: CommandParameters<T>, error: Error) => void) {
  return initCommand<T>(command => command.on("error", onError.bind(command)));
}

/**
 * Define a callback that is called when the command is inhibited
 * @param onInhibited Called when the command is inhibited
 */
export function inhibited<T extends Command>(onInhibited: (this: T, message: Message, inhibitor: Inhibitor) => void) {
  return initCommand<T>(command => command.on("inhibited", onInhibited.bind(command)));
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