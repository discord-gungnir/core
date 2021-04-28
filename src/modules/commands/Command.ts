import type { TextChannel, NewsChannel, GuildMember, PermissionResolvable, DMChannel, User, CommandInteraction, Snowflake,
  ApplicationCommand, ApplicationCommandManager, ApplicationCommandData, ApplicationCommandOptionType } from "discord.js";
import type { Includes, Trim, TrimLeft, TrimRight } from "../../util";
import { MessageEmbed, Message, Guild } from "discord.js";
import type { GungnirClient } from "../../GungnirClient";
import type { Resolvers } from "../resolvers/built-in";
import { GungnirManager } from "../GungnirManager";
import { GungnirError } from "../../GungnirError";
import { GungnirModule } from "../GungnirModule";


const INIT = Symbol("command handler init");

const commands = new Map<string, Command.Constructor>();
const guildCommands = new Map<string, Map<string, Command.Constructor>>();
export abstract class Command<P extends unknown[] = unknown[]> extends GungnirModule {
  public abstract run(context: Command.Context, ...args: P): unknown;
  
  public options: Required<Command.Options>;
  public slashCommand: ApplicationCommand | null = null;
  public constructor(public readonly handler: Command.Manager, name: string, options?: Command.Options) {
    super(handler, name, "command");
    this.options = {
      usage: [],
      group: null,
      description: null,
      ephemeral: false,
      ownerOnly: false,
      adminOnly: false,
      allowBots: false,
      nsfw: false,
      usedIn: "both",
      userPermissions: [],
      clientPermissions: [],
      ...options
    };

    (async () => {
      await this.client.ready;
      if (!this.handler[INIT]) return;

      const commands = this.handler.guild ? this.handler.guild.commands
      : this.client.application?.commands as ApplicationCommandManager;
      this.slashCommand = await commands.create(this.slashCommandData);
    })();
  }

  // usage
  public get usage() {
    return this.options.usage;
  }
  public set usage(usage) {
    this.options.usage = usage;
  }
  public get usageString() {
    return "";
  }
  public set usageString(usage) {
    this.usage = Command.Usage.fromString(usage);
  }

  // group & description
  public get group() {
    return this.options.group;
  }
  public set group(group) {
    this.options.group = group;
  }
  public get description() {
    return this.options.description;
  }
  public set description(description) {
    if (description !== null && description.length > 100)
      throw new GungnirError("a command's description can't be more than a 100 characters long");
    //this.slashCommand?.edit({description: description ?? "No description"});
    this.options.description = description;
  }

  // misc
  public delete() {
    if (this.deleted) return;
    this.slashCommand?.delete();
    super.delete();
  }
  public get slashCommandData(): ApplicationCommandData {
    return {
      name: this.name,
      description: this.description || "No description",
      options: this.usage.map(arg => {
        const resolver = this.client.resolverManager.get(arg.resolver);
        if (!resolver) throw new GungnirError(`unknown resolver ${arg.resolver}`);
        return {
          name: arg.name,
          description: arg.description || "No description",
          required: !arg.optional,
          type: resolver.type == "boolean" ? "BOOLEAN"
          : resolver.type == "channel" ? "CHANNEL"
          : resolver.type == "integer" ? "INTEGER"
          : resolver.type == "role" ? "ROLE"
          : resolver.type == "string"  ? "STRING"
          : "USER"
        };
      })
    };
  }
}
export namespace Command {
  export type Constructor<P extends unknown[] = unknown[]> = new (handler: Manager, name: string, options?: Options) => Command<P>;
  export type AbstractConstructor<P extends unknown[] = unknown[]> = abstract new (handler: Manager, name: string, options?: Options) => Command<P>;
  export type DefineDecorator<P extends unknown[] = unknown[]> = <T extends Constructor<P>>(klass: T) => T;
  export type Decorator<P extends unknown[] = unknown[]> = <T extends AbstractConstructor<P>>(klass: T) => T;
  export type Parameters<C extends Command> = C extends Command<infer P> ? P : never;
  export type FromUsage<S extends string> = Command<Usage.Parse<S>>;

  // define

  export function define(name: string): DefineDecorator {
    name = name.toLowerCase();
    if (!/^[\w-]+$/.test(name))
      throw new GungnirError(`'${name}' is not a valid command name`);
    if (name.length > 32)
      throw new GungnirError(`command names can't be more than 32 characters long`);
    return klass => {
      if (commands.has(name))
        throw new GungnirError(`a command called '${name}' already exists`);
      commands.set(name, klass);
      return klass;
    };
  }

  export function guild(...guildIDs: Snowflake[]) {
    return {define(name: string): DefineDecorator {
      name = name.toLowerCase();
      if (!/^[\w-]+$/.test(name))
        throw new GungnirError(`'${name}' is not a valid command name`);
      if (name.length > 32)
        throw new GungnirError(`command names can't be more than 32 characters long`);
      return klass => {
        for (const guildID of guildIDs) {
          if (!guildCommands.has(guildID)) guildCommands.set(guildID, new Map());
          const commands = guildCommands.get(guildID) as Map<string, Constructor>;
          if (commands.has(name))
            throw new GungnirError(`a command called '${name}' already exists'`);
          commands.set(name, klass);
        }
        return klass;
      }
    }};
  }

  // make

  /**
   * A utility function to create new commands without needing to extend classes
   * @param usage The usage string
   * @param resolve The resolver resolve method
   * @param options The command options
   */
  export function make<U extends string, R>(usage: U, run: (this: Command.FromUsage<U>, context: Context, ...args: Usage.Parse<U>) => R, options?: Options) {
    return class extends Command<Usage.Parse<U>> {
      public run(context: Context, ...args: Usage.Parse<U>): R {
        return run.call(this, context, ...args);
      }
    }
  }

  // options

  export interface Options {
    usage?: Usage;

    group?: string | null;
    description?: string | null;
    ephemeral?: boolean;
    
    ownerOnly?: boolean;
    adminOnly?: boolean;
    allowBots?: boolean;
    nsfw?: boolean;
    usedIn?: "guild" | "dm" | "both";
    userPermissions?: PermissionResolvable;
    clientPermissions?: PermissionResolvable;

    [key: string]: any;
  }

  export function options(options: Options): Decorator {
    // @ts-expect-error
    return klass => class extends klass {
      public constructor(handler: Manager, name: string, newerOptions?: Options) {
        super(handler, name, {...options, ...newerOptions});
      }
    };
  }

  export function group(group: string | null) {
    return options({group});
  }

  export function description(description: string | null) {
    if (description !== null && description.length > 100)
      throw new GungnirError("a command's description can't be more than a 100 characters long");
    return options({description});
  }

  export function ephemeral(ephemeral = true) {
    return options({ephemeral});
  }

  export function ownerOnly(ownerOnly = true) {
    return options({ownerOnly});
  }

  export function adminOnly(adminOnly = true) {
    return options({adminOnly});
  }

  export function allowBots(allowBots = true) {
    return options({allowBots});
  }

  export function nsfw(nsfw = true) {
    return options({nsfw});
  }

  export function usedIn(usedIn: "guild" | "dm" | "both") {
    return options({usedIn});
  }

  export function guildOnly(guildOnly = true) {
    return usedIn(guildOnly ? "guild" : "both");
  }

  export function dmOnly(dmOnly = true) {
    return usedIn(dmOnly ? "dm" : "both");
  }

  export function userPermissions(userPermissions: PermissionResolvable) {
    return options({userPermissions});
  }

  export function clientPermissions(clientPermissions: PermissionResolvable) {
    return options({clientPermissions});
  }

  export function permissions(permissions: PermissionResolvable) {
    return options({userPermissions: permissions, clientPermissions: permissions});
  }

  // context

  export abstract class Context {
    public abstract readonly client: GungnirClient;
    public abstract readonly user: User;
    public abstract readonly channel: TextChannel | NewsChannel | DMChannel;
    public abstract readonly guild: Guild | null;
    public abstract readonly member: GuildMember | null;

    public abstract isInteraction(): this is InteractionContext;
    public abstract isMessage(): this is MessageContext;

    public abstract send(options: Context.SendOptions): Promise<Message>;
    public abstract send(content: string, options?: Context.SendOptions): Promise<Message>;
    public abstract send(embed: MessageEmbed, options?: Context.SendOptions): Promise<Message>;
  }
  export namespace Context {
    export interface SendOptions {
      content?: string;
      embed?: MessageEmbed;
      ephemeral?: boolean;
      tts?: boolean;
    }
  }

  export class InteractionContext extends Context {
    public readonly client = this.interaction.client as GungnirClient;
    public constructor(
      public readonly interaction: CommandInteraction,
      public readonly user: User,
      public readonly channel: TextChannel | NewsChannel | DMChannel,
      public readonly guild: Guild | null,
      public readonly member: GuildMember | null
    ) {super()}

    public isInteraction(): this is InteractionContext {return true}
    public isMessage(): this is MessageContext {return false}

    #sent = false;
    public send(options: Context.SendOptions): Promise<Message>;
    public send(content: string, options?: Context.SendOptions): Promise<Message>;
    public send(embed: MessageEmbed, options?: Context.SendOptions): Promise<Message>;
    public async send(arg: string | MessageEmbed | Context.SendOptions, options?: Context.SendOptions): Promise<Message> {
      if (typeof arg == "string") return this.send({...options, content: arg});
      else if (arg instanceof MessageEmbed) return this.send({...options, embed: arg});
      else {
        const {content, embed, ephemeral, tts} = arg;
        if (this.#sent) {
          const raw = await this.interaction.webhook.send(content, {embeds: embed ? [embed] : undefined, tts});
          return this.channel.messages.add(raw);
        } else if (this.interaction.deferred) {
          const msg = await this.interaction.editReply({content: content ?? null, embeds: embed ? [embed] : undefined}) as Message;
          this.#sent = true;
          return msg;
        } else {
          await this.interaction.reply({content, embed, ephemeral, tts});
          const res = await this.interaction.fetchReply();
          return res instanceof Message ? res : this.channel.messages.add(res);
        }
      }
    }
  }

  export class MessageContext extends Context {
    public readonly client = this.message.client as GungnirClient;
    public readonly user = this.message.author;
    public readonly channel = this.message.channel;
    public readonly guild = this.message.guild;
    public readonly member = this.message.member;
    public constructor(public readonly message: Message) {super()}

    public isInteraction(): this is InteractionContext {return false}
    public isMessage(): this is MessageContext {return true}

    public send(options: Context.SendOptions): Promise<Message>;
    public send(content: string, options?: Context.SendOptions): Promise<Message>;
    public send(embed: MessageEmbed, options?: Context.SendOptions): Promise<Message>;
    public async send(arg: string | MessageEmbed | Context.SendOptions, options?: Context.SendOptions): Promise<Message> {
      if (typeof arg == "string") return this.send({...options, content: arg});
      else if (arg instanceof MessageEmbed) return this.send({...options, embed: arg});
      const {content, embed, tts} = arg;
      return this.message.channel.send({content, embed, tts});
    }
  }

  export interface GuildContext extends Context {
    readonly channel: TextChannel | NewsChannel;
    readonly member: GuildMember;
    readonly guild: Guild;
  }

  // handler

  export class Manager extends GungnirManager<Command> {
    public readonly guild: Guild | null;
    public readonly command: Command | null;
    public constructor(parent: GungnirClient | Guild | Command) {
      super("client" in parent ? parent.client as GungnirClient : parent);
      this.command = parent instanceof Command ? parent : null;
      this.guild = parent instanceof Guild ? parent : null;

      if (this.command) {
        
      } else if (this.guild) {
        const commands = guildCommands.get(this.guild.id);
        if (commands) for (const [name, klass] of commands) {
          const command = new klass(this, name);

        }
      } else for (const [name, klass] of commands) {
        const command = new klass(this, name);

      }

      this.initSlashCommands();
    }

    private [INIT] = false;
    private async initSlashCommands() {
      await this.client.ready;

      if (!this.command) {
        const commands = this.guild ? this.guild.commands
        : this.client.application?.commands as ApplicationCommandManager;

        this[INIT] = true;
        const appCommands = await commands.set(this.array.map(command => command.slashCommandData));
        for (const appCommand of appCommands.values()) {
          const command = this.get(appCommand.name);
          if (command) command.slashCommand = appCommand;
        }
      }
    }
  }

  // usage

  export function usage<U extends string>(usage: U): Decorator<Usage.Parse<U>> {
    return options({usage: Usage.fromString(usage)});
  }

  export type Usage = Usage.Argument[];
  export namespace Usage {
    export interface Argument {
      name: string;
      description: string | null;
      resolver: string;
      optional: boolean;
    }

    // builder

    export class Builder {
      readonly #usage: Usage = [];
      #optional = false;

      public argument(): Builder.Argument;
      public argument(arg: Usage.Argument): this;
      public argument(arg?: Usage.Argument) {
        if (arg) {
          if (this.#optional)
            throw new GungnirError("there cannot be any arguments after an optional argument");
          if (arg.optional) this.#optional = true;
          this.#usage.push(arg);
          return this;
        } else {
          return new Builder.Argument(this);
        }
      }
      public build() {
        return this.#usage;
      }
    }
    export namespace Builder {
      interface WIPArgument {
        name: string | null;
        description: string | null;
        resolver: string | null;
        optional: boolean;
      }

      export class Argument {
        readonly #builder: Builder;
        readonly #arg: WIPArgument = {
          name: null, description: null,
          resolver: null, optional: false};
        public constructor(builder: Builder) {
          this.#builder = builder;
        }
        public name(name: string) {
          if (!/^[\w-]+$/.test(name))
            throw new GungnirError(`'${name}' is not a valid argument name`);
          if (name.length > 32)
            throw new GungnirError(`argument names can't be more than 32 characters long`);
          this.#arg.name = name;
          return this;
        }
        public description(description: string | null) {
          if (description !== null && description.length > 100)
            throw new GungnirError("an argument's description can't be more than a 100 characters long");
          this.#arg.description = description;
          return this;
        }
        public resolver(resolver: string) {
          if (!/^[\w-]+$/.test(resolver))
            throw new GungnirError(`'${resolver}' is not a valid resolver name`);
          if (resolver.length > 32)
            throw new GungnirError(`resolver names can't be more than 32 characters long`);
          this.#arg.resolver = resolver;
          return this;
        }
        public optional(optional = true) {
          this.#arg.optional = optional;
          return this;
        }
        public add() {
          if (this.#arg.name === null) throw new GungnirError("argument has no name");
          if (this.#arg.resolver === null) throw new GungnirError("argument has no resolver");
          this.#builder.argument(this.#arg as Usage.Argument);
          return this.#builder;
        }
      }
    }

    // string to usage

    type FromStringArgumentToObject<N extends string, R extends string, D extends string | null, O extends boolean> =
      N extends "" ? never : D extends "" ? never : R extends "" ? never
      : Includes<N, " "> extends true ? never : Includes<R, " "> extends true ? never
      : {name: N, description: D, resolver: R, optional: O};

    type FromStringArgument<S extends string> =
      TrimRight<S> extends `{${infer N}:${infer R}|${infer D}}` ?
        Trim<N> extends `${infer M}?` ? FromStringArgumentToObject<TrimRight<M>, Trim<R>, Trim<D>, true>
        : FromStringArgumentToObject<Trim<N>, Trim<R>, Trim<D>, false>
      : TrimRight<S> extends `{${infer N}|${infer D}}` ?
        Trim<N> extends `${infer M}?` ? FromStringArgumentToObject<TrimRight<M>, TrimRight<M>, Trim<D>, true>
        : FromStringArgumentToObject<Trim<N>, Trim<N>, Trim<D>, false>
      : TrimRight<S> extends `{${infer N}:${infer R}}` ?
        Trim<N> extends `${infer M}?` ? FromStringArgumentToObject<TrimRight<M>, Trim<R>, null, true>
        : FromStringArgumentToObject<Trim<N>, Trim<R>, null, false>
      : TrimRight<S> extends `{${infer N}}` ?
        Trim<N> extends `${infer M}?` ? FromStringArgumentToObject<TrimRight<M>, TrimRight<M>, null, true>
        : FromStringArgumentToObject<Trim<N>, Trim<N>, null, false>
      : never;

    export type FromString<U extends string> =
      U extends `${infer S}` ?
        TrimLeft<S> extends `{${infer L}}${infer R}` ? [FromStringArgument<`{${L}}`>, ...FromString<R>]
        : Trim<S> extends "" ? [] : never
      : Usage;

    type ToSignatureArgument<A extends Argument> =
      A["optional"] extends false ? Resolvers[Lowercase<A["resolver"]>]
      : Resolvers[Lowercase<A["resolver"]>] | undefined;

    export type ToSignature<U extends Argument[]> =
      U extends [] ? []
      : U extends [infer L, ...infer R] ?
        L extends Argument ? R extends Argument[] ?
          [ToSignatureArgument<L>, ...ToSignature<R>]
          : never : never : never;

    export type Parse<S extends string> = ToSignature<FromString<S>>;

    type ArgMatches = {name: string, description?: string, resolver?: string, optional?: string};
    const regex = /(?<arg>{(?<name>[^?:}]+)(?<optional>\?)?(?::(?<resolver>[^}|]+))?(?:\|(?<description>[^}]+))?})|(?<error>\S+)/g;
    export function fromString<S extends string>(usage: S) {
      const builder = new Builder();
      for (const match of usage.matchAll(regex)) {
        if (!match.groups?.["arg"]) throw new GungnirError(`unknown syntax error in the usage string '${usage.trim()}'`);
        const {name, description, resolver, optional} = match.groups as ArgMatches;
        builder.argument().name(name.trim())
        .description(description?.trim() ?? null)
        .resolver(resolver?.trim() ?? name?.trim())
        .optional(!!optional).add();
      }
      return builder.build() as FromString<S>;
    }

    export function toString<U extends Usage>(usage: U) {
      return usage.map(arg => {
        let str = `{${arg.name}`;
        if (arg.optional) str += "?";
        if (arg.name != arg.resolver) str += `: ${arg.resolver}`;
        if (arg.description) str += ` | ${arg.description}`;
        return str + "}";
      }).join(" ");
    }
  }
}