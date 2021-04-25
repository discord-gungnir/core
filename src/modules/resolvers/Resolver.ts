import type { User, GuildChannel, Role } from "discord.js";
import type { GungnirClient } from "../../GungnirClient";
import { GungnirHandler } from "../GungnirHandler";
import type { Command } from "../commands/Command";
import type { OptionalPromise } from "../../util";
import { GungnirError } from "../../GungnirError";
import { GungnirModule } from "../GungnirModule";
import type { Resolvers } from "./built-in";

const resolvers = new Map<string, Resolver.Constructor>();
export abstract class Resolver<T extends Resolver.Type = Resolver.Type, R = unknown> extends GungnirModule {
  public abstract type: T;
  public abstract resolve(value: Resolver.Value<T>, context: Command.Context): OptionalPromise<R | null>;
  public constructor(public readonly handler: Resolver.Handler, name: string) {
    super(handler, name, "resolver");
  }
}
export namespace Resolver {
  export type Constructor<I extends Type = Type, R = unknown> = new (handler: Handler, name: string) => Resolver<I, R>;
  export type AbstractConstructor<I extends Type = Type, R = unknown> = abstract new (handler: Handler, name: string) => Resolver<I, R>;
  export type DefineDecorator<I extends Type = Type, R = unknown> = <Y extends Constructor<I, R>>(klass: Y) => Y;
  export type Decorator<I extends Type = Type, R = unknown> = <Y extends AbstractConstructor<I, R>>(klass: Y) => Y;
  export type ResolvesTo<R extends Resolver> = R extends Resolver<any, infer T> ? T : never;
  export type InferInput<R extends Resolver> = R extends Resolver<infer I> ? I : never;

  export type Type = "string" | "integer" | "boolean" | "user" | "channel" | "role";
  export type Value<I extends Type> =
    I extends "string" ? string
    : I extends "integer" ? number
    : I extends "boolean" ? boolean
    : I extends "user" ? User
    : I extends "channel" ? GuildChannel
    : I extends "role" ? Role
    : never;

  // decorators

  export function define<R extends string>(name: R): DefineDecorator<Type, Resolvers[R]> {
    name = name.toLowerCase() as R;
    if (!/^[\w-]+$/.test(name))
      throw new GungnirError(`'${name}' is not a valid resolver name`);
    if (name.length > 32)
      throw new GungnirError(`resolver names can't be more than 32 characters long`);
    return klass => {
      if (resolvers.has(name))
        throw new GungnirError(`a resolver called '${name}' already exists`);
      resolvers.set(name, klass);
      return klass;
    };
  }

  // make

  /**
   * A utility function to create new resolvers without needing to extend classes
   * @param resolve The resolver resolve method
   */
  export function make<T extends Type, R>(type: T, resolve: (this: Resolver<T, R>, value: Value<T>, context: Command.Context) => OptionalPromise<R | null>) {
    return class extends Resolver<T, R> {
      public readonly type = type;
      public resolve(value: Value<T>, context: Command.Context): OptionalPromise<R | null> {
        return resolve.call(this, value, context);
      }
    }
  }

  /**
   * Create a new resolver that is the union of two or more resolvers
   * @param resolvers The name of the resolvers to use
   */
  export function union<R extends string>(...resolvers: R[]) {
    return class extends Resolver<Type, Resolvers[R]> {
      public get resolvers() {
        return resolvers.map(name => {
          const resolver = this.client.resolverHandler.get(name);
          if (!resolver) throw new GungnirError(`unknown resolver '${name}'`);
          else return resolver;
        });
      }
      public get type() {
        return this.resolvers.reduce((resolver1, resolver2) => {
          if (resolver1.type != resolver2.type)
            throw new GungnirError(`all resolvers need to be of the same type in an union`);
          return resolver2;
        }).type;
      }
      public async resolve(value: Value<Type>, context: Command.Context): Promise<Resolvers[R]> {
        for (const resolver of this.resolvers) {
          const res = await resolver.resolve(value, context);
          if (res !== null) return res;
        }
        return null;
      }
    }
  }

  // handler

  export class Handler extends GungnirHandler<Resolver> {
    public constructor(client: GungnirClient) {
      super(client);
      for (const [name, klass] of resolvers) {
        const resolver = new klass(this, name);
        
      }
    }
  }
}