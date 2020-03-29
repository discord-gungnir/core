import { GungnirHandler } from "../GungnirHandler";
import type { Resolver, ResolverConstructor } from "./Resolver";
import { CommandUsage, CommandUsageBuilder } from "../commands/CommandUsage";
import { GungnirError } from "../../util/GungnirError";

const UNKNOWN_RESOLVER = (name: string) => `unknown Resolver '${name}'.`;

export class ResolverHandler extends GungnirHandler<Resolver, ResolverConstructor> {
  public stringToUsage(usage: string): CommandUsage {
    if (usage == "") return [];
    for (let arg of usage.split(/\s+/g)) {
      let rest = arg.startsWith("...");
      if (rest) arg = arg.slice(3);
      let optional = arg.endsWith("?");
      if (optional) arg = arg.slice(0, -1);
      if (arg == "") arg = "string";
      const types = arg.split("|");
      CommandUsageBuilder.argument(...types.map(type => {
        type = type.toLowerCase();
        const resolver = this.get(type);
        if (resolver) return resolver;
        throw new GungnirError(UNKNOWN_RESOLVER(type));
      })).rest(rest).optional(optional);
    }
    return CommandUsageBuilder.build();
  }
  public usageToString(usage: CommandUsage): string {
    const stringify: string[] = [];
    for (const {resolvers, optional, rest} of usage) {
      let str = "";
      if (rest) str += "...";
      str += resolvers.map(resolver => resolver.name).join("|");
      if (optional) str += "?";
      stringify.push(str);
    }
    return stringify.join(" ");
  }
}