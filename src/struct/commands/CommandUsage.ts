import { GungnirError } from "../../util/GungnirError";
import type { CommandHandler } from "./CommandHandler";
import type { CommandOptions } from "./CommandOptions";
import type { CommandDecorator, CommandConstructor } from "./Command";
import type { Resolver } from "../resolvers/Resolver";

// types
interface CommandArgument {
  resolvers: Resolver<any>[];
  optional?: boolean;
  rest?: boolean;
}

export type CommandUsage = readonly Readonly<CommandArgument>[];

// decorators

/**
 * Set a command's usage, if given a string, will convert it
 * @param usage The command's usage
 */
export function usage(usage: string | CommandUsage): CommandDecorator {
  // @ts-ignore
  return <T extends CommandConstructor>(command: T) => class extends command {
    public constructor(handler: CommandHandler, name: string, oldUsage: CommandUsage, options?: CommandOptions) {
      // @ts-ignore
      super(handler, name, usage, options);
    }
  }
}

// CommandUsageBuilder

export namespace CommandUsageBuilder {
  let building: CommandArgument[] = [];

  const NO_ARGUMENTS = "no CommandArguments declared.";
  const SPREAD_LAST_ARG = "there cannot be any CommandArgument after a rest CommandArgument.";

  function lastArg() {
    if (building.length == 0)
      throw new GungnirError(NO_ARGUMENTS);
    return building[building.length-1];
  }

  export function argument(...resolvers: Resolver<any>[]) {
    if (building.length > 0 && lastArg().rest) {
      building = [];
      throw new GungnirError(SPREAD_LAST_ARG);
    } else {
      building.push({resolvers, rest: false, optional: false});
      return CommandUsageBuilder;
    }
  }
  export function rest(rest = true) {
    lastArg().rest = rest;
    return CommandUsageBuilder;
  }
  export function optional(optional = true) {
    lastArg().optional = optional;
    return CommandUsageBuilder;
  }

  export function build(): CommandUsage {
    const syntax = building;
    building = [];
    return syntax;
  }
}

