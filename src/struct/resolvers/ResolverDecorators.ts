import type { Resolver, ResolverDecorator, ResolvesTo } from "./Resolver";
import type { Message } from "discord.js";

export function initResolver<T extends Resolver>(onInit: (resolver: T) => any): ResolverDecorator<T> {
  // @ts-ignore
  return <T extends Function & {prototype: T}>(resolver: T) => class extends resolver {
    public constructor(...args: any[]) {
      super(...args);
      // @ts-ignore
      onInit(this);
    }
  }
}

export function resolve<T extends Resolver>(onResolve: (this: T, str: string, message: Message, resolved: ResolvesTo<T>) => any) {
  return initResolver<T>(resolver => resolver.on("resolve", onResolve.bind(resolver)));
}