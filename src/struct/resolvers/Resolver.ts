import { GungnirModule } from "../GungnirModule";
import type { Message } from "discord.js";
import { GungnirHandler } from "../GungnirHandler";

// types

export interface ResolverConstructor<T = any> {
  new (handler: GungnirHandler<Resolver<T>>, name: string): Resolver<T>;
}

export interface ResolverDecorator {
  <T extends typeof Resolver>(resolver: T): T;
}

// TypeResolver

export abstract class Resolver<T = any> extends GungnirModule<Resolver.Events> {
  public abstract resolve(str: string, message: Message): T | null | Promise<T | null>;
  public constructor(handler: GungnirHandler<Resolver<T>>, name: string) {
    super(handler, name);
    this.init();
  }
  protected init() {}
}

export namespace Resolver {
  export interface Events extends GungnirModule.Events {

  }

  export function make<T>(resolve: (this: Resolver<T>, str: string, message: Message) => T | null | Promise<T | null>): ResolverConstructor {
    return class extends Resolver<T> {
      public resolve(str: string, msg: Message): T | null | Promise<T | null> {
        return resolve.call(this, str, msg);
      }
    }
  }
}
