import { GungnirModule } from "../GungnirModule";
import { CommandHandler } from "./CommandHandler";
import { CommandUsage } from "./CommandUsage";
import type { CommandOptions } from "./CommandOptions";
import type { Message } from "discord.js";
import type { Inhibitor } from "../inhibitors/Inhibitor";
import { aliasesIndex } from "./CommandAliases";
import { getChildren } from "./DefineCommand";

// types

export interface CommandConstructor<P extends any[] = any[], R = any> {
  new (handler: CommandHandler, name: string): Command<P, R>;
}

export interface CommandDecorator<P extends any[] = any[], R = any> {
  <T extends Function & {prototype: Command<P, R>}>(command: T): T;
}

export interface CommandConstructorDecorator<P extends any[] = any[], R = any> {
  <T extends CommandConstructor<P, R>>(command: T): T;
}

export type CommandParameters<T extends Command> = T extends Command<infer P, any> ? P : never;
export type CommandReturnType<T extends Command> = T extends Command<any, infer R> ? R : never;

export type InferCommandTypes<T extends Command> = Command<CommandParameters<T>, CommandReturnType<T>>;

// Command

/**
 * The base Command to extend to create new commands
 */
export abstract class Command<P extends any[] = any[], R = any> extends GungnirModule<Command.Events<P, R>> {
  public abstract run(message: Message, ...args: P): R;

  declare public readonly handler: CommandHandler;
  public readonly parent: Command | null;
  public readonly depth: number;
  public readonly usage: CommandUsage;
  public readonly options: Readonly<Required<CommandOptions>>;
  public readonly subcommands = new CommandHandler(this);
  public constructor(handler: CommandHandler, name: string, usage: string | CommandUsage = [], options: CommandOptions = {}) {
    super(handler, name);
    this.parent = handler.linkedTo instanceof Command ? handler.linkedTo : null;
    this.depth = this.parent ? this.parent.depth+1 : 0;
    this.usage = typeof usage == "string" ? this.client.resolvers.stringToUsage(usage) : usage;
    this.options = {
      restrictedTo: "both",
      adminOnly: false,
      ownerOnly: false,
      allowBots: false,
      nsfw: false,
      userPermissions: [],
      clientPermissions: [],
      ...options
    };

    // declare children
    for (const {names, command} of getChildren(this.constructor as CommandConstructor))
      this.subcommands.create(names, command);

    // init
    this.init();
  }
  protected init() {}

  // names

  public get names() {
    return [this.name, ...this.aliases];
  }
  public get aliases() {
    const aliases: string[] = [];
    const index = aliasesIndex(this.handler);
    for (const [alias, command] of index.entries())
      if (command == this) aliases.push(alias);
    return aliases;
  }
  public bindAliases(...aliases: string[]): this {
    if (this.deleted) return this;
    const index = aliasesIndex(this.handler);
    aliases.map(alias => alias.toLowerCase())
      .forEach(alias => index.set(alias, this));
    return this;
  }
  public unbindAliases(...aliases: string[]): this {
    const index = aliasesIndex(this.handler);
    for (const alias of aliases) {
      if (this.isAliasBound(alias))
        index.delete(alias.toLowerCase());
    }
    return this;
  }
  public isAliasBound(alias: string): boolean {
    const index = aliasesIndex(this.handler);
    return index.get(alias.toLowerCase()) == this;
  }
  public unbindAllAliases(): this {
    return this.unbindAliases(...this.aliases);
  }

  // misc

  public get description(): string {
    return Reflect.getMetadata("description", this) ?? "";
  }
  public get group(): string | null {
    return Reflect.getMetadata("group", this) ?? this.parent?.group ?? null;
  }
  public get usageString(): string {
    return this.client.resolvers.usageToString(this.usage);
  }
}

export namespace Command {
  export interface Events<P, R> extends GungnirModule.Events {
    prepare(message: Message, args: P): any;
    run(message: Message, args: P, result: R): any;
    error(message: Message, args: P, error: Error): any;
    inhibited(message: Message, inhibitor: Inhibitor): any;
  }

  export function make<P extends any[], R>(usage: string | CommandUsage = [], run: (this: Command, message: Message, ...args: P) => R, options?: CommandOptions): CommandConstructor<P, R> {
    return class extends Command {
      public constructor(handler: CommandHandler, name: string) {
        super(handler, name, usage, options);
      }
      public run(msg: Message, ...args: P): R {
        // @ts-ignore
        return run.call(this, msg, ...args);
      }
    }
  }
  export function reflect<T extends any[]>(usage: string | CommandUsage = [], options?: CommandOptions) {
    return Command.make<T, [Message, T]>(usage, (msg: Message, ...args: T) => ([msg, args]), options);
  }

  export function resolve(names: [string, ...string[]], message: Message): Command | null {
    names = [...names] as [string, ...string[]];
    const name = names.shift() as string;
    let command =
      message.author.commands.get(name) ??
      message.member?.commands.get(name) ??
      message.channel.commands.get(name) ??
      message.member?.voice.channel?.commands.get(name) ??
      message.guild?.commands.get(name) ??
      message.client.commands.get(name);
    if (!command) return null;
    while (true) {
      const nextName = names.shift();
      if (!nextName) return command;
      if (command.subcommands.has(nextName))
        command = command.subcommands.get(nextName) as Command;
      else return command;
    }
  }
}