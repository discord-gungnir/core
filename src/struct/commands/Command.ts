import { GungnirModule } from "../GungnirModule";
import { CommandHandler } from "./CommandHandler";
import { CommandUsage } from "./CommandUsage";
import type { CommandOptions } from "./CommandOptions";
import type { Message } from "discord.js";
import type { Inhibitor } from "../inhibitors/Inhibitor";
import { aliasesIndex } from "./CommandAliases";
import { getChildren } from "./DefineCommand";

// types

export interface CommandConstructor {
  new (handler: CommandHandler, name: string): Command;
}

export interface CommandDecorator {
  <T extends typeof Command>(command: T): T;
}

// Command

/**
 * The base Command to extend to create new commands
 */
export abstract class Command extends GungnirModule<Command.Events> {
  public abstract run(message: Message, ...args: any[]): any;

  declare public readonly handler: CommandHandler;
  public readonly parent: Command | null;
  public readonly depth: number;
  public readonly usage: CommandUsage
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
      memberPermissions: [],
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

  public get names() {
    return [this.name, ...this.aliases];
  }
  public get aliases() {
    if (this.deleted) return [];
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
    if (this.deleted) return this;
    const index = aliasesIndex(this.handler);
    for (const alias of aliases) {
      if (this.isAliasBound(alias))
        index.delete(alias.toLowerCase());
    }
    return this;
  }
  public isAliasBound(alias: string): boolean {
    if (this.deleted) return false;
    const index = aliasesIndex(this.handler);
    return index.get(alias.toLowerCase()) == this;
  }
  public unbindAllAliases(): this {
    return this.unbindAliases(...this.aliases);
  }

  public static resolve(names: [string, ...string[]], message: Message): Command | null {
    names = [...names] as [string, ...string[]];
    const name = names.shift() as string;
    let command =
      message.author.commands.get(name) ??
      message.member?.commands.get(name) ??
      message.channel.commands.get(name) ??
      message.member?.voice.channel?.commands.get(name) ??
      message.member?.roles?.highest.commands.get(name) ??
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

export namespace Command {
  export interface Events extends GungnirModule.Events {
    ran: (message: Message, res: any) => any;
    error: (message: Message, error: Error) => any;
    inhibited:(message: Message, inhibitor: Inhibitor) => any;
  }
}