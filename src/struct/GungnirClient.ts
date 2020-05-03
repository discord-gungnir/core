import { Client, ClientOptions, User, Message, Snowflake, Collection } from "discord.js";
import { Prefix, PrefixResolvable } from "./Types";
import type { Provider } from "./providers/Provider";
import { ClientEvents } from "discord.js";

import { Command } from "./commands/Command";
import { CommandHandler } from "./commands/CommandHandler";
import { declaredCommands } from "./commands/DefineCommand";

import { Inhibitor, InhibitorHandler } from "./inhibitors/Inhibitor";
import { declaredInhibitors } from "./inhibitors/DefineInhibitor";
import "./inhibitors/default/AdminOnlyInhibitor";
import "./inhibitors/default/DenyBotsInhibitor";
import "./inhibitors/default/DMOnlyInhibitor";
import "./inhibitors/default/GuildOnlyInhibitor";
import "./inhibitors/default/NSFWInhibitor";
import "./inhibitors/default/OwnerOnlyInhibitor";
import "./inhibitors/default/PermissionsInhibitor";

import { ResolverHandler } from "./resolvers/ResolverHandler";
import { declaredResolvers } from "./resolvers/DefineResolver";
import "./resolvers/default/ChannelResolver";
import "./resolvers/default/CommandResolver";
import "./resolvers/default/GuildMemberResolver";
import "./resolvers/default/GuildResolver";
import "./resolvers/default/IntegerResolver";
import "./resolvers/default/MessageResolver";
import "./resolvers/default/NaturalResolver";
import "./resolvers/default/NumberResolver";
import "./resolvers/default/PercentageResolver";
import "./resolvers/default/RoleResolver";
import "./resolvers/default/StringResolver";
import "./resolvers/default/TextChannelResolver";
import "./resolvers/default/URLResolver";
import "./resolvers/default/UserResolver";
import "./resolvers/default/VoiceChannelResolver";

export interface GungnirClientOptions extends ClientOptions {
  token?: string;
  ready?: string;
  prefix?: PrefixResolvable;
  provider?: Provider;
}

export class GungnirClient extends Client {
  public readonly prefix: PrefixResolvable;
  public readonly provider: Provider | null;

  public readonly commands = new CommandHandler(this);
  public readonly inhibitors = new InhibitorHandler(this);
  public readonly resolvers = new ResolverHandler(this);

  public constructor(options: GungnirClientOptions = {}) {
    super(options);
    this.prefix = options.prefix ?? "/";
    this.provider = options.provider ?? null;

    // declare type resolvers
    for (const {name, resolver} of declaredResolvers)
      this.resolvers.create(name, resolver);

    // declare inhibitors
    for (const {name, inhibitor} of declaredInhibitors)
      this.inhibitors.create(name, inhibitor);

    // declare commands
    for (const {names, command} of declaredCommands)
      this.commands.create(names, command);

    // events
    this.once("ready", async () => {
      if (options.ready) console.log(options.ready);
      const owner = (await this.fetchApplication()).owner;
      if (owner instanceof User) owner.owner = true;
    }).on("message", async msg => {
      const prefix = await this.resolvePrefix(msg);
      const command = await this.resolveCommand(msg, prefix);
      if (!command) return this.emit("notCommand", msg);
      this.emit("command", msg, command);
      if (command.disabled) return this.emit("commandDisabled", msg, command);
      for (const inhibitor of this.inhibitors) {
        if (inhibitor.disabled) continue;
        if (inhibitor.inhibit(msg, command)) {
          this.emit("commandInhibited", msg, command, inhibitor);
          command.emit("inhibited", msg, inhibitor);
          inhibitor.emit("inhibit", msg, command);
          return;
        }
      }
      const content = msg.convertMentions(prefix).replace(prefix, "");
      let args = content.split(/\s+/g).slice(command.depth+1);
      const resolveds: any[] = [];
      for (const {resolvers, optional, type} of command.usage) {
        let resolved;
        const spreads = type == "rest" || type == "list";
        const arg = type == "list" ? args : type == "rest" ? args.join(" ") : (args[0] ?? "");
        if (!optional && arg.length == 0)
          return this.emit("syntaxError", msg, command, "NOT_ENOUGH_ARGUMENTS");
        if (Array.isArray(arg)) {
          resolved = await Promise.all(arg.map(ar => new Promise(async (resolve, reject) => {
            for (const resolver of resolvers) {
              if (resolver.disabled) continue;
              try {
                const res = await resolver.resolve(ar, msg) ?? null;
                if (res) return resolve(res);
              } catch {}
            }
            return reject();
          }))).catch(() => null);
        } else {
          for (const resolver of resolvers) {
            if (resolver.disabled) continue;
            try {
              resolved = await resolver.resolve(arg, msg) ?? null;
            } catch {}
            if (resolved) break;
          }
        }
        if (resolved) {
          resolveds.push(resolved);
          if (spreads) args = [];
          else args.shift();
        } else if (optional)
          resolveds.push(undefined);
        else return this.emit("syntaxError", msg, command, "MISSING_ARGUMENT");
      }
      if (args.length > 0)
        return this.emit("syntaxError", msg, command, "TOO_MANY_ARGUMENTS");
      this.emit("prepareCommand", msg, command);
      command.emit("prepare", msg, resolveds);
      try {
        const res = await command.run(msg, ...resolveds);
        this.emit("commandRan", msg, command, res);
        command.emit("ran", msg, resolveds, res);
      } catch(err) {
        this.emit("commandError", msg, command, err);
        command.emit("error", msg, resolveds, err);
      }
    });
  }

  // login
  public async login(token: string | undefined = this.options.token) {
    return super.login(token as string);
  }

  // owners
  readonly #owners: {[key in Snowflake]: User} = {};
  public get owners(): Collection<Snowflake, User> {
    return new Collection(Object.entries(this.#owners));
  }
  public isOwner(user: Snowflake | User): boolean {
    return this.#owners[typeof user == "string" ? user : user.id] !== undefined;
  }
  public async setOwner(user: Snowflake | User, owner: boolean): Promise<User | null> {
    if (typeof user == "string") {
      const resolved = await (this.users.resolve(user) ?? this.users.fetch(user as string).catch(() => null));
      if (resolved) user = resolved;
      else return null;
    }
    if (owner) this.#owners[user.id] = user;
    else delete this.#owners[user.id];
    return user;
  }
  public addOwner(user: Parameters<GungnirClient["setOwner"]>[0]) {
    return this.setOwner(user, true);
  }
  public removeOwner(user: Parameters<GungnirClient["setOwner"]>[0]) {
    return this.setOwner(user, false);
  }

  // commands
  public resolvePrefix(message: Message): Prefix {
    return Prefix.resolve(message.prefix ?? message.channel.prefix ?? message.guild?.prefix ?? this.prefix, message);
  }
  public resolveCommand(message: Message, prefix = this.resolvePrefix(message)): Command|null | Promise<Command|null> {
    if (prefix instanceof Promise)
      return prefix.then(prefix => this.resolveCommand(message, prefix));
    const content = message.convertMentions(prefix);
    if (!content.startsWith(prefix)) return null;
    const names = content.replace(prefix, "").split(/\s+/g);
    return Command.resolve(names as [string, ...string[]], message);
  }
}

export interface GungnirClient extends Client {
  readonly options: Readonly<GungnirClientOptions>;
  emit<K extends keyof GungnirClientEvents>(event: K, ...args: GungnirClientEvents[K]): boolean;
  on<K extends keyof GungnirClientEvents>(event: K, listener: (...args: GungnirClientEvents[K]) => void): this;
  once<K extends keyof GungnirClientEvents>(event: K, listener: (...args: GungnirClientEvents[K]) => void): this;
}

export interface GungnirClientEvents extends ClientEvents {
  command: [Message, Command];
  notCommand: [Message];
  commandDisabled: [Message, Command];
  commandInhibited: [Message, Command, Inhibitor];
  prepareCommand: [Message, Command];
  commandRan: [Message, Command, any];
  commandError: [Message, Command, Error];
  syntaxError: [Message, Command, "NOT_ENOUGH_ARGUMENTS" | "MISSING_ARGUMENT" | "TOO_MANY_ARGUMENTS"];
}

declare module "discord.js" {
  //interface Base {readonly client: GungnirClient}
  //interface BaseManager {readonly client: GungnirClient}
  interface CategoryChannel {readonly client: GungnirClient}
  interface Channel {readonly client: GungnirClient}
  interface ChannelManager {readonly client: GungnirClient}
  interface ClientApplication {readonly client: GungnirClient}
  interface ClientUser {readonly client: GungnirClient}
  //interface ClientVoiceManager {readonly client: GungnirClient}
  //interface Collector {readonly client: GungnirClient}
  interface DMChannel {readonly client: GungnirClient}
  interface Emoji {readonly client: GungnirClient}
  interface Guild {readonly client: GungnirClient}
  interface GuildChannel {readonly client: GungnirClient}
  interface GuildChannelManager {readonly client: GungnirClient}
  interface GuildEmoji {readonly client: GungnirClient}
  interface GuildEmojiManager {readonly client: GungnirClient}
  interface GuildManager {readonly client: GungnirClient}
  interface GuildMember {readonly client: GungnirClient}
  interface GuildMemberManager {readonly client: GungnirClient}
  interface Invite {readonly client: GungnirClient}
  interface Message {readonly client: GungnirClient}
  interface MessageCollector {readonly client: GungnirClient}
  interface MessageManager {readonly client: GungnirClient}
  interface MessageReaction {readonly client: GungnirClient}
  interface NewsChannel {readonly client: GungnirClient}
  interface PartialGroupDMChannel {readonly client: GungnirClient}
  interface Presence {readonly client: GungnirClient}
  interface Presence {readonly client: GungnirClient}
  interface PresenceManager {readonly client: GungnirClient}
  interface ReactionCollector {readonly client: GungnirClient}
  interface ReactionEmoji {readonly client: GungnirClient}
  interface ReactionManager {readonly client: GungnirClient}
  interface ReactionUserManager {readonly client: GungnirClient}
  interface Role {readonly client: GungnirClient}
  interface RoleManager {readonly client: GungnirClient}
  //interface ShardClientUtil {readonly client: GungnirClient}
  interface StoreChannel {readonly client: GungnirClient}
  interface Team {readonly client: GungnirClient}
  interface TeamMember {readonly client: GungnirClient}
  interface TextChannel {readonly client: GungnirClient}
  interface User {readonly client: GungnirClient}
  interface UserManager {readonly client: GungnirClient}
  //interface VoiceBroadcast {readonly client: GungnirClient}
  interface VoiceChannel {readonly client: GungnirClient}
  //interface VoiceConnection {readonly client: GungnirClient}
  interface VoiceStateManager {readonly client: GungnirClient}
  //interface Webhook {readonly client: GungnirClient}
  //interface WebSocketManager {readonly client: GungnirClient}
}