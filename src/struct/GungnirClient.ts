import { Client, ClientOptions, User, Message, Snowflake, Collection, GuildMember } from "discord.js";
import { Prefix, PrefixResolvable } from "./Types";
import type { Provider } from "./providers/Provider";
import { ClientEvents } from "discord.js";

import { GungnirHandler } from "./GungnirHandler";

import { Command } from "./commands/Command";
import { CommandHandler } from "./commands/CommandHandler";
import { declaredCommands } from "./commands/DefineCommand";

import type { Inhibitor, InhibitorConstructor } from "./inhibitors/Inhibitor";
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
  public readonly inhibitors = new GungnirHandler<Inhibitor, InhibitorConstructor>(this);
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
      if (!command) return this.emit("notCommand", msg, null);
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
      let split = content.split(/\s+/g).slice(command.depth+1);
      const args = [];
      for (const {resolvers, rest, optional} of command.usage) {
        let resolved;
        const arg = rest ? split.join(" ") : (split[0] ?? "");
        if (!optional && arg.length == 0) {
          this.emit("syntaxError", msg, command, "NOT_ENOUGH_ARGUMENTS");
          return;
        }
        for (const resolver of resolvers) {
          if (resolver.disabled) continue;
          const res = await resolver.resolve(arg, msg);
          if (res !== null) {
            resolved = res;
            break;
          }
        }
        if (resolved) {
          args.push(resolved);
          if (rest) split = [];
          else split.shift();
        } else if (optional) {
          args.push(undefined);
        } else {
          this.emit("syntaxError", msg, command, "MISSING_ARGUMENT");
          return;
        }
      }
      if (split.length > 0) {
        this.emit("syntaxError", msg, command, "TOO_MANY_ARGUMENTS");
        return;
      }
      this.emit("beforeCommand", msg, command, null);
      try {
        const res = await command.run(msg, ...args);
        this.emit("commandRan", msg, command, res);
        command.emit("ran", msg, res);
      } catch(err) {
        this.emit("commandError", msg, command, err);
        command.emit("error", msg, err);
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
  public isOwner(user: User): boolean {
    return this.#owners[user.id] !== undefined;
  }
  public setOwner(user: User, owner: boolean): this {
    if (owner) this.#owners[user.id] = user;
    else delete this.#owners[user.id];
    return this;
  }
  public addOwner(user: User): this {
    return this.setOwner(user, true);
  }
  public removeOwner(user: User): this {
    return this.setOwner(user, false);
  }

  // commands
  public resolvePrefix(message: Message): Prefix {
    const prefix = message.prefix ?? message.guild?.prefix ?? this.prefix;
    return Prefix.resolve(prefix, message);
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
  notCommand: [Message, null];
  commandDisabled: [Message, Command];
  commandInhibited: [Message, Command, Inhibitor];
  beforeCommand: [Message, Command, null];
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