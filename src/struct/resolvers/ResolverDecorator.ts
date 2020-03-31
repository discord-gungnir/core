import type { Resolver, ResolverDecorator, ResolverConstructor } from "./Resolver";
import type { Message } from "discord.js";

export function initResolver<R = any>(onInit: (resolver: Resolver<R>) => any): ResolverDecorator {
  // @ts-ignore
  return <T extends ResolverConstructor>(resolver: T) => class extends resolver {
    public constructor(...args: any[]) {
      // @ts-ignore
      super(...args);
      onInit(this);
    }
  }
}

export function resolve<R = any>(onResolve: (this: Resolver<R>, str: string, message: Message, resolved: R) => any) {
  return initResolver<R>(resolver => resolver.on("resolve", onResolve.bind(resolver)));
}