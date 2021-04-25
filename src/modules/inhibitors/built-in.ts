import type { GuildMember, TextChannel } from "discord.js";
import type { Command } from "../commands/Command";
import { Inhibitor } from "./Inhibitor";

@Inhibitor.define("owner-only")
export class OwnerOnlyInhibitor extends Inhibitor {
  public inhibit(cmd: Command, ctx: Command.Context) {
    return cmd.options.ownerOnly && !ctx.user.owner;
  }
}

@Inhibitor.define("admin-only")
export class AdminOnlyInhibitor extends Inhibitor {
  public inhibit(cmd: Command, ctx: Command.Context) {
    return cmd.options.adminOnly && !!ctx.member?.admin;
  }
}

@Inhibitor.define("nsfw")
export class NSFWInhibitor extends Inhibitor {
  public inhibit(cmd: Command, ctx: Command.Context) {
    return cmd.options.nsfw && "nsfw" in ctx.channel && !ctx.channel.nsfw;
  }
}

@Inhibitor.define("deny-bots")
export class DenyBotsInhibitor extends Inhibitor {
  public inhibit(cmd: Command, ctx: Command.Context) {
    return !cmd.options.allowBots && ctx.user.bot;
  }
}

@Inhibitor.define("guild-only")
export class GuildOnlyInhibitor extends Inhibitor {
  public inhibit(cmd: Command, ctx: Command.Context) {
    return cmd.options.usedIn == "guild" && ctx.channel.type == "dm";
  }
}

@Inhibitor.define("dm-only")
export class DMOnlyInhibitor extends Inhibitor {
  public inhibit(cmd: Command, ctx: Command.Context) {
    return cmd.options.usedIn == "dm" && ctx.channel.type != "dm";
  }
}

abstract class PermissionsInhibitor extends Inhibitor {
  protected abstract getMember(ctx: Command.Context): GuildMember | null;
  protected abstract readonly permissions: "userPermissions" | "clientPermissions";
  public inhibit(cmd: Command, ctx: Command.Context) {
    const member = this.getMember(ctx);
    if (!member) return false;
    const channel = ctx.channel as TextChannel;
    const permissions = channel.permissionsFor(member) ?? member.permissions;
    return !permissions.has(cmd.options[this.permissions], true);
  }
}

@Inhibitor.define("user-permissions")
export class UserPermissionsInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "userPermissions";
  protected getMember(ctx: Command.Context) {
    return ctx.member;
  }
}

@Inhibitor.define("client-permissions")
export class ClientPermissionsInhibitor extends PermissionsInhibitor {
  protected readonly permissions = "clientPermissions";
  protected getMember(ctx: Command.Context) {
    return ctx.guild?.me ?? null;
  }
}