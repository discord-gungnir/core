import type { Message, Interaction, User, GuildChannel, Role, TextChannel, NewsChannel, CommandInteraction } from "discord.js";
import type { Inhibitor } from "../inhibitors/Inhibitor";
import { GungnirError } from "../../GungnirError";
import { Command } from "../commands/Command";
import { Listener } from "./Listener";

class BuiltInListener extends Listener {
  public delete(): never {
    throw new GungnirError("you can't delete this listener");
  }
}

@Listener.define("lifecycle")
export class LifecycleListener extends BuiltInListener {

  @Listener.once("ready")
  public async onReady() {
    try {
      if (this.client.options.owners) {
        await Promise.allSettled(this.client.options.owners.map(async id => {
          const user = this.client.users.resolve(id) ?? await this.client.users.fetch(id);
          this.client.addOwner(user);
        }));
      } else if (this.client.application?.owner) {
        if ("members" in this.client.application.owner) {
          for (const {user} of this.client.application.owner.members.values())
            this.client.addOwner(user);
        } else this.client.addOwner(this.client.application.owner);
      }
      this.client.init();
    } catch(err) {
      this.client.emit("error", err);
    }
  }

  @Listener.on("error")
  public onError(error: unknown) {
    this.client.error(error);
  }
}

@Listener.define("commands")
export class CommandsListener extends BuiltInListener {

  // util

  public useInteractions = true;
  public useMessages = false;

  private async runInhibitors(command: Command, context: Command.Context) {
    return (await Promise.all(this.client.inhibitorHandler.array.map(async inhibitor => {
      const inhibit = await inhibitor.inhibit(command, context);
      return inhibit ? inhibitor : null;
    }))).filter(i => i !== null) as Inhibitor[];
  }

  private async runResolvers(command: Command, context: Command.Context, args: (string | number | boolean | User | GuildChannel | Role)[]) {
    const resolved: any[] = await Promise.all(command.usage.map(async arg => {
      const value = args.shift();
      if (value === undefined) {
        if (arg.optional) return undefined;
        else throw new GungnirError.Resolver(`argument '${arg.name}' is not optional`);
      }
      const resolver = this.client.resolverHandler.get(arg.resolver);
      if (!resolver) throw new GungnirError(`unknown resolver '${arg.resolver}'`);
      const resolved = await resolver.resolve(value, context);
      if (resolved !== null) return resolved;
      throw new GungnirError.Resolver(`argument '${arg.name}' could not be resolved`);
    }));
    if (args.length > 0)
      throw new GungnirError.Resolver("too many arguments");
    return resolved;
  }

  // events

  @Listener.on("commandInhibited")
  public async onCommandInhibited(command: Command, context: Command.Context, inhibitors: [Inhibitor, ...Inhibitor[]]) {
    this.client.commandInhibited(command, context, inhibitors);
  }

  @Listener.on("prepareCommand")
  public async onPrepareCommand(command: Command, context: Command.Context) {
    this.client.prepareCommand(command, context);
  }

  @Listener.on("commandSuccess")
  public async onCommandSuccess(command: Command, context: Command.Context, result: unknown) {
    this.client.commandSuccess(command, context, result);
  }

  @Listener.on("commandError")
  public async onCommandError(command: Command, context: Command.Context, error: unknown) {
    this.client.commandError(command, context, error);
  }

  @Listener.on("unknownCommand")
  public async onUnknownCommand(name: string, context: Command.Context) {
    this.client.unknownCommand(name, context);
  }

  // run commands

  @Listener.on("interaction")
  public async onInteraction(interaction: Interaction) {
    try {
      if (!this.useInteractions) return;
      if (!interaction.isCommand()) return;
      const user = interaction.user;
      const guild = interaction.guild;
      const channel = interaction.channelID ?
        (interaction.client.channels.resolve(interaction.channelID)
        ?? await interaction.client.channels.fetch(interaction.channelID)
        ) as TextChannel | NewsChannel : await user.createDM();
      const member = guild?.members.resolve(user.id) ?? await guild?.members.fetch(user.id) ?? null;
      const context = new Command.InteractionContext(interaction, user, channel, guild, member);
      const command = interaction.guild?.commandHandler.get(interaction.commandName)
      ?? this.client.commandHandler.get(interaction.commandName);
      if (command) {
        await interaction.defer(command.options.ephemeral);
        this.client.emit("command", command, context);
        const inhibitors = await this.runInhibitors(command, context);
        if (inhibitors.length > 0) {
          this.client.emit("commandInhibited", command, context, inhibitors as [Inhibitor, ...Inhibitor[]]);
        } else {
          try {
            const args = await this.runResolvers(command, context, interaction.options.map(o => {
              if (o.type == "SUB_COMMAND" || o.type == "SUB_COMMAND_GROUP")
                throw new GungnirError("sub commands are not currently supported");
              return o.type == "USER" ? o.user as User
              : o.type == "CHANNEL" ? o.channel as GuildChannel
              : o.type == "ROLE" ? o.role as Role
              : o.value as string | number | boolean;
            }));
            this.client.emit("prepareCommand", command, context);
            try {
              const res = await command.run(context, ...args);
              this.client.emit("commandSuccess", command, context, res);
            } catch(err) {
              this.client.emit("commandError", command, context, err);
            }
          } catch(err) {
            if (err instanceof GungnirError.Resolver) {
              this.client.emit("commandResolverError", command, context, err);
            } else throw err;
          }
        }
      } else {
        this.client.emit("unknownCommand", interaction.commandName, context);
      }
    } catch(err) {
      this.client.emit("error", err);
    }
  }

  @Listener.on("message")
  public async onMessage(msg: Message) {
    try {
      if (!this.useMessages) return;
      const prefix = await (typeof this.client.prefix == "function" ?
        this.client.prefix(msg) : this.client.prefix);
      // todo: parse message to execute commands
    } catch(err) {
      this.client.emit("error", err);
    }
  }
}

const parseArgs = /(?:(?:"(?<double>[^"]+)")|(?:'(?<simple>[^']+)')|(?:`(?<backticks>[^`]+)`))(?=\s|$)|[^\s]+/g;