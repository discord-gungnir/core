import { GungnirError } from "../../util/GungnirError";
import type { CommandHandler } from "./CommandHandler";
import type { CommandOptions } from "./CommandOptions";
import type { CommandDecorator, CommandConstructor } from "./Command";
import type { Resolver } from "../resolvers/Resolver";

// types

export interface CommandArgument {
  resolvers: Resolver<any>[];
  type: "normal" | "rest" | "list";
  optional: boolean;
}

export type CommandUsage = CommandArgument[];

// decorators

/**
 * Set a command's usage, if given a string, will convert it
 * @param usage The command's usage
 */
export function usage(usage: string | CommandUsage): CommandDecorator {
  // @ts-ignore
  return <T extends CommandConstructor>(command: T) => class extends command {
    public constructor(handler: CommandHandler, name: string, oldUsage?: string | CommandUsage, options?: CommandOptions) {
      // @ts-ignore
      super(handler, name, oldUsage ? oldUsage : usage, options);
    }
  }
}

// CommandUsageBuilder

export namespace CommandUsageBuilder {
  let building: CommandUsage = [];

  const NO_ARGUMENTS = "no CommandArguments declared.";
  const SPREAD_LAST_ARG = "there cannot be any CommandArgument after a rest or list CommandArgument.";

  function lastArg() {
    if (building.length == 0)
      throw new GungnirError(NO_ARGUMENTS);
    return building[building.length-1];
  }

  export function argument(...resolvers: Resolver<any>[]) {
    if (building.length > 0 && lastArg().type != "normal") {
      building = [];
      throw new GungnirError(SPREAD_LAST_ARG);
    } else {
      building.push({resolvers, type: "normal", optional: false});
      return CommandUsageBuilder;
    }
  }
  export function type(type: CommandArgument["type"]) {
    lastArg().type = type;
    return CommandUsageBuilder;
  }
  export function rest(rest = true) {
    const arg = lastArg();
    arg.type = rest ? "rest" : arg.type == "rest" ? "normal" : arg.type;
    return CommandUsageBuilder;
  }
  export function list(list = true) {
    const arg = lastArg();
    arg.type = list ? "list" : arg.type == "list" ? "normal" : arg.type;
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

