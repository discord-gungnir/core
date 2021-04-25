import type { Guild, TextChannel, NewsChannel, GuildMember, PermissionResolvable, MessageEmbed, Message, DMChannel, User,
    CommandInteraction, ApplicationCommandManager, ApplicationCommandData, ApplicationCommandOptionType, Snowflake } from "discord.js";
import type { GungnirClient } from "../../GungnirClient";
import type { Resolver } from "../resolvers/Resolver";
import { GungnirHandler } from "../GungnirHandler";
import { GungnirError } from "../../GungnirError";
import { GungnirModule } from "../GungnirModule";

const commands = new Map<string, Command.Constructor>();
const guildCommands = new Map<string, Map<string, Command.Constructor>>();
export abstract class Command<P extends unknown[] = unknown[]> extends GungnirModule {
  public abstract run(context: Command.Context, ...args: P): unknown;
  
  public options: Required<Command.Options>;
  public constructor(public readonly handler: Command.Handler, name: string, options?: Command.Options) {
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

    /*(async () => {
      await this.client.ready;
      const commands = this.handler.guild ? this.handler.guild.commands
      : this.client.application?.commands as ApplicationCommandManager;
      commands.create(this.slashCommandData);
    })();*/
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
  public get usageResolverTypes() {
    return this.usage.map(arg => {
      return arg.resolvers.map(name => {
        const resolver = this.client.resolverHandler.get(name);
        if (!resolver) throw new GungnirError(`unknown resolver '${name}'`)
        return resolver;
      }).reduce((acc, resolver) => {
        if (resolver.type != acc.type)
          throw new GungnirError("resolver must be of the same type within an argument");
        return resolver;
      }).type;
    });
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
    this.options.description = description;
  }

  // slash commands
  public get slashCommandData(): ApplicationCommandData {
    const types = this.usageResolverTypes;
    let i = 0;
    return {
      name: this.name,
      description: this.description ?? "No description",
      options: this.usage.map(arg => ({
        name: arg.name, description: arg.description,
        required: !arg.optional,
        type: ((): ApplicationCommandOptionType => {
          const type = types[i++] as Resolver.Type;
          return type == "boolean" ? "BOOLEAN"
          : type == "channel" ? "CHANNEL"
          : type == "integer" ? "INTEGER"
          : type == "role" ? "ROLE"
          : type == "string"  ? "STRING"
          : "USER"
        })()
      }))
    };
  }
}
export namespace Command {
  export type Constructor<P extends unknown[] = unknown[]> = new (handler: Handler, name: string, options?: Options) => Command<P>;
  export type AbstractConstructor<P extends unknown[] = unknown[]> = abstract new (handler: Handler, name: string, options?: Options) => Command<P>;
  export type DefineDecorator<P extends unknown[] = unknown[]> = <T extends Constructor<P>>(klass: T) => T;
  export type Decorator<P extends unknown[] = unknown[]> = <T extends AbstractConstructor<P>>(klass: T) => T;
  export type Parameters<C extends Command> = C extends Command<infer P> ? P : never;
  //export type FromUsage<S extends string> = Command<Usage.Parse<S>>;

  // define

  export function define(name: string): DefineDecorator {
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
      public constructor(handler: Handler, name: string, newerOptions?: Options) {
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

    public abstract send(content: string, embed?: MessageEmbed): Promise<Message>;
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
    public async send(content: string, embed?: MessageEmbed): Promise<Message> {
      if (this.#sent) {
        const raw = await this.interaction.webhook.send(content, {embeds: embed ? [embed] : undefined});
        return this.channel.messages.add(raw);
      } else {
        const msg = await this.interaction.editReply(content, {embeds: embed ? [embed] : undefined}) as Message;
        this.#sent = true;
        return msg;
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

    public send(content: string, embed?: MessageEmbed) {
      return this.message.channel.send(content, {embed});
    }
  }

  export interface GuildContext extends Context {
    readonly channel: TextChannel | NewsChannel;
    readonly member: GuildMember;
    readonly guild: Guild;
  }

  // handler

  export class Handler extends GungnirHandler<Command> {
    public readonly guild: Guild | null;
    public readonly command: Command | null;
    public constructor(parent: GungnirClient | Guild | Command) {
      super("client" in parent ? parent.client as GungnirClient : parent);
      this.command = parent instanceof Command ? parent : null;
      this.guild = "id" in parent ? parent : null;

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

    private async initSlashCommands() {
      await this.client.ready;

      if (!this.command) {
        const commands = this.guild ? this.guild.commands
        : this.client.application?.commands as ApplicationCommandManager;
        commands.set(this.array.map(command => command.slashCommandData));
      }
    }
  }

  // usage

  export function usage(usage: string | Usage): Decorator {
    if (typeof usage == "string") usage = Usage.fromString(usage);
    return options({usage});
  }

  export type Usage = Usage.Argument[];
  export namespace Usage {
    export interface Argument {
      name: string;
      description: string;
      resolvers: [string, ...string[]];
      optional: boolean;
    }

    // builder

    export class Builder {
      readonly #usage: Usage = [];
      public argument(): Builder.Argument;
      public argument(arg: Usage.Argument): this;
      public argument(arg?: Usage.Argument) {
        if (arg) {
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
        resolvers: string[];
        optional: boolean;
      }

      export class Argument {
        readonly #builder: Builder;
        readonly #arg: WIPArgument = {
          name: null, description: null,
          resolvers: [], optional: false};
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
        public description(description: string) {
          if (description.length > 100)
            throw new GungnirError("an argument's description can't be more than a 100 characters long");
          this.#arg.description = description;
          return this;
        }
        public resolvers(...resolvers: string[]) {
          this.#arg.resolvers.push(...resolvers.map(resolver => {
            if (!/^[\w-]+$/.test(resolver))
              throw new GungnirError(`'${resolver}' is not a valid resolver name`);
            if (resolver.length > 32)
              throw new GungnirError(`resolver names can't be more than 32 characters long`);
            return resolver;
          }));
          return this;
        }
        public optional(optional = true) {
          this.#arg.optional = optional;
          return this;
        }
        public add() {
          if (this.#arg.resolvers.length == 0)
            throw new GungnirError("argument needs at least one resolver");
          this.#builder.argument(this.#arg as Usage.Argument);
          return this.#builder;
        }
      }
    }

    // string to usage

    export type FromString<S extends string> = Usage;

    type ArgMatches = {name: string, description: string, optional?: string, resolvers?: string};
    const regex = /(?<arg>{(?:\s*\[\s*(?<resolvers>(?:[\w]+(?:,\s*|(?=\s*])))+)\s*])?\s*(?<name>[\w-]+)\s*(?<optional>\?)?\s*:(?<description>[^}]+)})|(?<error>[^\s]+)/g;
    export function fromString<S extends string>(usage: S): FromString<S> {
      const builder = new Builder();
      for (const match of usage.matchAll(regex)) {
        if (!match.groups?.["arg"]) throw new GungnirError(`unknown syntax error in the usage string '${usage.trim()}'`);
        const {name, description, optional, resolvers} = match.groups as ArgMatches;
        builder.argument().name(name).description(description).optional(!!optional)
        .resolvers(...(resolvers ? resolvers.split(",").map(r => r.trim()) : [name])).add();
      }
      return builder.build();
    }
  }
}