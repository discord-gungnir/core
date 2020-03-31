import type { CommandConstructor, CommandDecorator } from "./Command";

interface CommandToDeclare {
  names: [string, ...string[]];
  command: CommandConstructor;
}

export const declaredCommands: CommandToDeclare[] = [];
const children = new Map<CommandConstructor, CommandToDeclare[]>();
export function getChildren(command: CommandConstructor) {
  if (!children.has(command)) children.set(command, []);
  return children.get(command) as CommandToDeclare[];
}

/**
 * Easily define a new command, this must be called before the client is created
 * @param names The name(s) of the command
 * @param parent The parent command if any
 */
export function defineCommand(name: string, parent?: CommandConstructor): CommandDecorator;
export function defineCommand(names: [string, ...string[]], parent?: CommandConstructor): CommandDecorator;
export function defineCommand(names: string | [string, ...string[]], parent?: CommandConstructor): CommandDecorator {
  return <T extends CommandConstructor>(command: T) => {
    if (!Array.isArray(names)) names = [names];
    const arr = parent ? getChildren(parent) : declaredCommands;
    arr.push({names, command});
    return command;
  }
}