import type { ClientOptions, ClientEvents, Snowflake, User } from "discord.js";
import type { Provider } from "./modules/providers/Provider";
import { Inhibitor } from "./modules/inhibitors/Inhibitor";
import { Resolver } from "./modules/resolvers/Resolver";
import { Listener } from "./modules/listeners/Listener";
import { Command } from "./modules/commands/Command";
import type { GungnirError } from "./GungnirError";
import { Client, Intents } from "discord.js";
import type { Prefix } from "./types";

export class GungnirClient extends Client {
  public options!: GungnirClient.Options;
  public readonly ready = new Promise<void>(resolve => {
    this.once("ready", resolve);
  });
  
  public provider: Provider | null;
  public readonly commandManager = new Command.Manager(this);
  public readonly listenerManager = new Listener.Manager(this);
  public readonly resolverManager = new Resolver.Manager(this);
  public readonly inhibitorManager = new Inhibitor.Manager(this);
  public constructor(options?: GungnirClient.Options) {
    super({intents: Intents.NON_PRIVILEGED, ...options});
    this.provider = options?.provider?.(this) ?? null;
  }

  // prefix
  public get prefix() {
    return this.options.prefix ?? "/";
  }
  public set prefix(prefix) {
    this.options.prefix = prefix;
  }

  // data
  public get data() {
    return this.user?.data ?? null;
  }

  // events
  public init(): void {}
  public error(error: unknown): void {}
  public commandInhibited(command: Command, context: Command.Context, inhibitors: [Inhibitor, ...Inhibitor[]]) {}
  public prepareCommand(command: Command, context: Command.Context) {}
  public commandSuccess(command: Command, context: Command.Context, result: unknown) {}
  public commandError(command: Command, context: Command.Context, error: unknown) {}
  public unknownCommand(name: string, context: Command.Context) {}

  // owners
  public owners = new Set<User>();
  public isOwner(user: User) {
    return this.owners.has(user);
  }
  public setOwner(user: User, owner: boolean) {
    if (owner) this.owners.add(user);
    else this.owners.delete(user);
  }
  public addOwner(user: User) {
    return this.setOwner(user, true);
  }
  public removeOwner(user: User) {
    return this.setOwner(user, false);
  }
}
export interface GungnirClient extends Client {
  on<E extends keyof GungnirClient.Events>(event: E, listener: (...args: GungnirClient.Events[E]) => void): this;
  on<E extends string | symbol>(event: Exclude<E, keyof GungnirClient.Events>, listener: (...args: unknown[]) => void): this;
  once<E extends keyof GungnirClient.Events>(event: E, listener: (...args: GungnirClient.Events[E]) => void): this;
  once<E extends string | symbol>(event: Exclude<E, keyof GungnirClient>, listener: (...args: unknown[]) => void): this;
  emit<E extends keyof GungnirClient.Events>(event: E, ...args: GungnirClient.Events[E]): boolean;
  emit<E extends string | symbol>(event: Exclude<E, keyof GungnirClient.Events>, ...args: unknown[]): boolean;
  off<E extends keyof GungnirClient.Events>(event: E, listener: (...args: GungnirClient.Events[E]) => void): this;
  off<E extends string | symbol>(event: Exclude<E, keyof GungnirClient.Events>, listener: (...args: unknown[]) => void): this;
}
export namespace GungnirClient {
  export type Constructor = new (options?: Options) => GungnirClient;
  export type AbstractConstructor = abstract new (options?: Options) => GungnirClient;
  export type LoginDecorator = <T extends Constructor>(klass: T) => void;
  export type Decorator = <T extends AbstractConstructor>(klass: T) => T | void;

  // login

  /**
   * Logins the client to the Discord API
   * @param token The Discord token
   */
  export function login(token: string, options?: GungnirClient.Options): LoginDecorator {
    return klass => {
      const client = new klass(options);
      client.login(token);
    };
  }

  // events

  export interface Events extends ClientEvents {
    command: [command: Command, context: Command.Context];
    commandInhibited: [command: Command, context: Command.Context, inhibitors: [Inhibitor, ...Inhibitor[]]];
    commandResolverError: [command: Command, context: Command.Context, error: GungnirError.Resolver];
    prepareCommand: [command: Command, context: Command.Context];
    commandSuccess: [command: Command, context: Command.Context, result: unknown];
    commandError: [command: Command, context: Command.Context, error: unknown];
    unknownCommand: [name: string, context: Command.Context];
  }

  // options

  export interface Options extends ClientOptions {
    provider?: (client: GungnirClient) => Provider;
    useProviderCache?: boolean;
    owners?: Snowflake[];
    prefix?: Prefix;
  }

  /**
   * Sets the client options
   * @param options The options
   */
  export function options(options: Partial<Options>): Decorator {
    // @ts-expect-error
    return klass => class extends klass {
      public constructor(newerOptions: Options) {
        super({...options, ...newerOptions});
      }
    };
  }

  /**
   * Sets the client provider
   * @param provider A function that returns the provider
   * @param cache Whether or not to cache the results returned by the provider, defaults to true
   */
  export function provider(provider: (client: GungnirClient) => Provider, cache = true) {
    return options({provider, useProviderCache: cache});
  }

  /**
   * Sets the owners manually
   * @param owners List of IDs
   */
  export function owners(...owners: Snowflake[]) {
    return options({owners});
  }

  export function prefix(prefix: Prefix) {
    return options({prefix});
  }

  export function perGuildPrefix(defaultPrefix: Prefix = "/") {
    return prefix(async msg => {
      const prefix = await msg.guild?.data.get("prefix");
      if (typeof prefix == "string") return prefix;
      return typeof defaultPrefix == "function" ?
        defaultPrefix(msg) : defaultPrefix;
    });
  }
}