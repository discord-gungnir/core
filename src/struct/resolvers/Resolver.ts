import { GungnirModule } from "../GungnirModule";
import type { Message } from "discord.js";
import type { ResolverHandler } from "./ResolverHandler";

// types

export interface ResolverConstructor<T extends Resolver = Resolver> {
  new (handler: ResolverHandler, name: string): T;
}

export interface ResolverDecorator<T extends Resolver = Resolver> {
  <K extends Function & {prototype: T}>(resolver: K): K;
}

export interface ResolverConstructorDecorator<T extends Resolver = Resolver> {
  <K extends ResolverConstructor<T>>(resolver: K): K;
}

export type ResolvesTo<T extends Resolver> = T extends Resolver<infer R> ? R : never;

// TypeResolver

export abstract class Resolver<R = any> extends GungnirModule<Resolver.Events<R>> {
  public abstract resolve(str: string, message: Message): R | null | Promise<R | null>;
  public constructor(handler: ResolverHandler, name: string) {
    super(handler, name);
    this.init();
  }
  protected init() {}
}

export namespace Resolver {
  export interface Events<R> extends GungnirModule.Events {
    resolve(str: string, message: Message, resolved: R): any;
  }

  export function make<R>(resolve: (this: Resolver<R>, str: string, message: Message) => R | null | Promise<R | null>): ResolverConstructor<Resolver<R>> {
    return class extends Resolver<R> {
      public resolve(str: string, msg: Message): any {
        return resolve.call(this, str, msg);
      }
    }
  }
}
