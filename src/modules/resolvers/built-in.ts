import type { GuildChannel, GuildMember, Role, User } from "discord.js";;
import type { Command } from "../commands/Command";
import type { Color } from "../../types";
import { Resolver } from "./Resolver";

// map

export interface Resolvers {
  // primitive
  string: string;
  integer: number;
  unsigned: number;
  natural: number;
  boolean: boolean;

  // misc
  url: string;
  color: Color;

  // discord
  user: User;
  channel: GuildChannel;
  member: GuildMember;
  role: Role;
  
  // unions
  "member-user": GuildMember | User;

  // index
  [key: string]: unknown;
}

// primitive types

@Resolver.define("string")
export class StringResolver extends Resolver {
  public readonly type = "string";
  public resolve(value: string) {
    return value;
  }
}

@Resolver.define("integer")
export class IntegerResolver extends Resolver {
  public readonly type = "integer";
  public resolve(value: number) {
    return value;
  }
}

@Resolver.define("unsigned")
export class UnsignedResolver extends Resolver {
  public readonly type = "integer";
  public resolve(value: number) {
    return value >= 0 ? value : null;
  }
}

@Resolver.define("natural")
export class NaturalResolver extends Resolver {
  public readonly type = "integer";
  public resolve(value: number) {
    return value > 0 ? value : null;
  }
}

@Resolver.define("boolean")
export class BooleanResolver extends Resolver {
  public readonly type = "boolean";
  public resolve(value: boolean) {
    return value;
  }
}

// complex types

@Resolver.define("url")
export class URLResolver extends Resolver {
  public readonly type = "string";
  public async resolve(url: string) {
    const urlRegex = await import("url-regex-safe");
    return urlRegex.default().test(url) ? url : null;
  }
}

@Resolver.define("color")
export class ColorResolver extends Resolver {
  public readonly type = "string";
  public resolve(color: string) {
    if (!/^#?[a-f0-9]{6}$/i.test(color)) return null;
    const colors = color.match(/[a-f0-9]{2}/gi) as [string, string, string];
    return colors.map(color => parseInt(`0x${color}`)) as Color;
  }
}

// Discord types

@Resolver.define("user")
export class UserResolver extends Resolver {
  public readonly type = "user";
  public async resolve(user: User) {
    return user;
  }
}

@Resolver.define("channel")
export class GuildChannelResolver extends Resolver {
  public readonly type = "channel";
  public async resolve(channel: GuildChannel) {
    return channel;
  }
}

@Resolver.define("member")
export class GuildMemberResolver extends Resolver {
  public readonly type = "user";
  public async resolve(user: User, ctx: Command.Context) {
    return ctx.guild ? ctx.guild.members.fetch(user.id) : null;
  }
}

@Resolver.define("role")
export class RoleResolver extends Resolver {
  public readonly type = "role";
  public async resolve(role: Role) {
    return role;
  }
}

@Resolver.define("member-user")
export class MemberUserResolver extends Resolver.union("member", "user") {}