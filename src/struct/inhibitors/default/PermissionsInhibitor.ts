import { Inhibitor } from "../Inhibitor";
import type { GuildMember, Message, TextChannel } from "discord.js";
import type { Command } from "../../commands/Command";
import type { CommandOptions } from "../../commands/CommandOptions";

export abstract class PermissionsInhibitor extends Inhibitor {
  protected abstract getMember(message: Message): GuildMember | null;
  protected abstract readonly permissions: keyof Pick<CommandOptions, "memberPermissions"|"clientPermissions">;
  public inhibit(msg: Message, command: Command) {
    const member = this.getMember(msg);
    if (!member) return false;
    const channel = msg.channel as TextChannel;
    const permissions = channel.permissionsFor(member) ?? member.permissions;
    return !permissions.has(command.options[this.permissions]);
  }
}