import { Inhibitor } from "../Inhibitor";
import { defineInhibitor } from "../DefineInhibitor";
import type { GuildMember, Message, TextChannel } from "discord.js";
import type { Command } from "../../commands/Command";
import type { CommandOptions } from "../../commands/CommandOptions";

abstract class PermissionsInhibitor extends Inhibitor {
  protected abstract getMember(message: Message): GuildMember | null;
  protected abstract readonly permissions: keyof Pick<CommandOptions, "userPermissions"|"clientPermissions">;
  public inhibit(msg: Message, command: Command) {
    const member = this.getMember(msg);
    if (!member) return false;
    const channel = msg.channel as TextChannel;
    const permissions = channel.permissionsFor(member) ?? member.permissions;
    return !permissions.has(command.options[this.permissions]);
  }
}

@defineInhibitor("user_permissions")
export class UserPermissionsInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "userPermissions";
  protected getMember(message: Message) {
    return message.member;
  }
}

@defineInhibitor("client_permissions")
export class ClientPermissionsInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "clientPermissions";
  protected getMember(message: Message) {
    return message.guild?.me ?? null;
  }
}