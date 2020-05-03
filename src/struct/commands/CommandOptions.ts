import type { Command, CommandDecorator } from "./Command";
import type { CommandUsage } from "./CommandUsage";
import type { PermissionResolvable } from "discord.js";
import type { CommandHandler } from "./CommandHandler";

export interface CommandOptions {
  restrictedTo?: "both" | "guild" | "dm";
  adminOnly?: boolean;
  ownerOnly?: boolean;
  allowBots?: boolean;
  nsfw?: boolean;
  userPermissions?: PermissionResolvable;
  clientPermissions?: PermissionResolvable;
}

function decorateOption<T extends keyof CommandOptions>(key: T): (value: NonNullable<CommandOptions[T]>) => CommandDecorator;
function decorateOption<T extends keyof CommandOptions>(key: T, defaultValue: CommandOptions[T]): (value?: NonNullable<CommandOptions[T]>) => CommandDecorator;
function decorateOption<T extends keyof CommandOptions>(key: T, defaultValue?: CommandOptions[T]): (value?: NonNullable<CommandOptions[T]>) => CommandDecorator {
  // @ts-ignore
  return (value?: NonNullable<CommandOptions[T]>) => {
    // @ts-ignore
    return <T extends typeof Command>(command: T) => class extends command {
      public constructor(handler: CommandHandler, name: string, syntax?: string | CommandUsage, options: CommandOptions = {}) {
        super(handler, name, syntax, {[key]: value ?? defaultValue, ...options});
      }
    }
  };
}

/**
 * Restrict the command to guilds or DMs
 * @param value 'guild' or 'dm' or 'both'
 */
export const restrictedTo = decorateOption("restrictedTo");

/**
 * Restrict this command to guilds
 * @param value Is this command restricted to guilds
 */
export const guildOnly = (value: boolean = true) => restrictedTo(value ? "guild" : "both");

/**
 * Restrict this command to DMs
 * @param value Is this command restricted to DMs
 */
export const dmOnly = (value: boolean = true) => restrictedTo(value ? "dm" : "both");

/**
 * Set the command to owner only
 * @param value Whether or not the command is owner only
 */
export const ownerOnly = decorateOption("ownerOnly", true);

/**
 * Set the command to admin only
 * @param value Whether or not the command is admin only
 */
export const adminOnly = decorateOption("adminOnly", true);

/**
 * Allow bots to use this command (use carefully)
 * @param value Whether or not this command can be used by bots
 */
export const allowBots = decorateOption("allowBots", true);

/**
 * Block this command when used in a channel that isn't NSFW
 * @param value Whether or not this command is NSFW
 */
export const nsfw = decorateOption("nsfw", true);

/**
 * Require permissions from the user to use this command
 * @param value List of required permissions
 */
export const userPermissions = decorateOption("userPermissions");

/**
 * Require permissions from the client to use this command
 * @param value List of required permissions
 */
export const clientPermissions = decorateOption("clientPermissions");

/**
 * Require certain permissions from the client and the user to use this command
 * @param value List of required permissions
 */
export function permissions(value: PermissionResolvable): CommandDecorator {
  // @ts-ignore
  return <T extends typeof Command>(command: T) => {
    command = userPermissions(value)(command);
    command = clientPermissions(value)(command);
    return command;
  }
}