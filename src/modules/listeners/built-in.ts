import type { Message, Interaction, User, GuildChannel, Role } from "discord.js";
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
        await Promise.all(this.client.options.owners.map(async id => {
          const user = this.client.users.resolve(id) ??
            await this.client.users.fetch(id);
          this.client.addOwner(user);
        }));
      } else {
        if (this.client.application?.owner) {
          if ("members" in this.client.application.owner) {
            for (const {user} of this.client.application.owner.members.values())
              this.client.addOwner(user);
          } else this.client.addOwner(this.client.application.owner);
        }
      }
      this.client.init();
    } catch(err) {
      this.client.emit("error", err);
    }
  }

  @Listener.on("error")
  public onError(error: Error) {
    this.client.error(error);
  }
}

@Listener.define("commands")
export class CommandsListener extends BuiltInListener {

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
        else throw new GungnirError("not enough args");
      }
      for (const resolverName of arg.resolvers) {
        const resolver = this.client.resolverHandler.get(resolverName);
        if (!resolver) throw new GungnirError(`unknown resolver '${resolverName}'`);
        const resolved = await resolver.resolve(value, context);
        if (resolved !== null) return resolved;
      }
      throw new GungnirError("invalid resolver input");
    }));
    if (args.length > 0)
      throw new GungnirError("too many args");
    return resolved;
  }

  @Listener.on("interaction")
  public async onInteraction(intr: Interaction) {
    try {
      if (!this.useInteractions) return;
      if (!intr.isCommand()) return;
      const command = intr.guild?.commandHandler.get(intr.commandName)
      ?? this.client.commandHandler.get(intr.commandName);
      if (command) {
        await intr.defer(command.options.ephemeral);
        const context = new Command.InteractionContext(intr);
        this.client.emit("command", command, context);
        const inhibitors = await this.runInhibitors(command, context);
        if (inhibitors.length > 0)
          this.client.emit("commandInhibited", command, context, inhibitors as [Inhibitor, ...Inhibitor[]]);
        else {
          try {
            const args = await this.runResolvers(command, context, intr.options.map(o => {
              if (o.type == "SUB_COMMAND" || o.type == "SUB_COMMAND_GROUP")
                throw new GungnirError("sub commands are not supported");
              return o.type == "USER" ? o.user as User
              : o.type == "CHANNEL" ? o.channel as GuildChannel
              : o.type == "ROLE" ? o.role as Role
              : o.value as string | number | boolean
            }));
            this.client.emit("prepareCommand", command, context);
            try {
              const res = await command.run(context, ...args);
              this.client.emit("commandSuccess", command, context, res);
            } catch(err) {
              this.client.emit("commandError", command, context, err);
            }
          } catch(err) {
            if (err instanceof GungnirError) {
              console.error(err);
            } else throw err;
          }
        }
      } else {
        this.client.emit("unknownCommand", intr.commandName, intr);
      }
    } catch(err) {
      this.client.emit("error", err);
    }
  }

  @Listener.on("message")
  public async onMessage(msg: Message) {
    if (!this.useMessages) return;
    try {
      // todo: parse message to execute commands
    } catch(err) {
      this.client.emit("error", err);
    }
  }
}