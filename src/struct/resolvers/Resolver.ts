import { GungnirModule } from "../GungnirModule";
import type { Message } from "discord.js";
import type { ResolverHandler } from "./ResolverHandler";

// types

export interface ResolverConstructor<R = any> {
  new (handler: ResolverHandler, name: string): Resolver<R>;
}

export interface ResolverDecorator<R = any> {
  <T extends Function & {prototype: Resolver<R>}>(resolver: T): T;
}

export interface ResolverConstructorDecorator<R = any> {
  <T extends ResolverConstructor<R>>(resolver: T): T;
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

  export function make<R>(resolve: (this: Resolver<R>, str: string, message: Message) => R | null | Promise<R | null>): ResolverConstructor<R> {
    return class extends Resolver<R> {
      public resolve(str: string, msg: Message): any {
        return resolve.call(this, str, msg);
      }
    }
  }
}
