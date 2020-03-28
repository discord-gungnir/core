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
  memberPermissions?: PermissionResolvable;
  clientPermissions?: PermissionResolvable;
}

const decorate = (fn: <T extends typeof Command>(command: T) => T): CommandDecorator => fn;

function decorateOption<T extends keyof CommandOptions>(key: T): (value: NonNullable<CommandOptions[T]>) => CommandDecorator;
function decorateOption<T extends keyof CommandOptions>(key: T, defaultValue: CommandOptions[T]): (value?: NonNullable<CommandOptions[T]>) => CommandDecorator;
function decorateOption<T extends keyof CommandOptions>(key: T, defaultValue?: CommandOptions[T]) {
  return (value?: NonNullable<CommandOptions[T]>) => {
    // @ts-ignore
    return decorate(command => class extends command {
      public constructor(handler: CommandHandler, name: string, syntax: CommandUsage, options: CommandOptions = {}) {
        super(handler, name, syntax, {...options, [key]: value ?? defaultValue});
      }
    });
  }
}

/**
 * Restrict the command to guilds or DMs
 * @param value 'guild' or 'dm' or 'both'
 */
export const restrictedTo = decorateOption("restrictedTo");

/**
 * Set the command to owner only
 * @param value Whether or not the command is owner only (defaults to true)
 */
export const ownerOnly = decorateOption("ownerOnly", true);

/**
 * Set the command to admin only
 * @param value Whether or not the command is admin only (defaults to true)
 */
export const adminOnly = decorateOption("adminOnly", true);

/**
 * Allow bots to use this command (use carefully)
 * @param value Whether or not this command can be used by bots (defaults to true)
 */
export const allowBots = decorateOption("allowBots", true);

/**
 * Block this command when used in a channel that isn't NSFW
 * @param value Whether or not this command is (defaults to true)
 */
export const nsfw = decorateOption("nsfw", true);

/**
 * Require permissions from the user to use this command
 * @param value List of required permissions
 */
export const memberPermissions = decorateOption("memberPermissions");

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
  return <T extends typeof Command>(command: T) => {
    command = memberPermissions(value)(command);
    command = clientPermissions(value)(command);
    return command;
  }
}

/**
 * Restrict this command to guilds
 */
export const guildOnly = () => restrictedTo("guild");

/**
 * Restrict this command to DMs
 */
export const dmOnly = () => restrictedTo("dm");