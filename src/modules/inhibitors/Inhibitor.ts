import type { GungnirClient } from "../../GungnirClient";
import type { Command } from "../commands/Command";
import { GungnirHandler } from "../GungnirHandler";
import type { OptionalPromise } from "../../util";
import { GungnirError } from "../../GungnirError";
import { GungnirModule } from "../GungnirModule";

const inhibitors = new Map<string, Inhibitor.Constructor>();
export abstract class Inhibitor extends GungnirModule {
  public abstract inhibit(command: Command, context: Command.Context): OptionalPromise<boolean>;
  public constructor(public readonly handler: Inhibitor.Handler, name: string) {
    super(handler, name, "inhibitor");
  }
}
export namespace Inhibitor {
  export type Constructor = new (handler: Handler, name: string) => Inhibitor;
  export type AbstractConstructor = abstract new (handler: Handler, name: string) => Inhibitor;
  export type DefineDecorator = <T extends Constructor>(klass: T) => T;
  export type Decorator = <T extends AbstractConstructor>(klass: T) => T;

  // decorators

  export function define(name: string): DefineDecorator {
    name = name.toLowerCase();
    if (!/^[\w-]+$/.test(name))
      throw new GungnirError(`'${name}' is not a valid inhibitor name`);
    if (name.length > 32)
      throw new GungnirError(`inhibitor names can't be more than 32 characters long`);
    return klass => {
      if (inhibitors.has(name))
        throw new GungnirError(`an inhibitor called '${name}' already exists`);
      inhibitors.set(name, klass);
      return klass;
    };
  }

  // make

  /**
   * A utility function to create new inhibitors without needing to extend classes
   * @param inhibit The inhibitor inhibit method
   */
  export function make(inhibit: (this: Inhibitor, command: Command, context: Command.Context) => OptionalPromise<boolean>) {
    return class extends Inhibitor {
      public inhibit(command: Command, context: Command.Context): OptionalPromise<boolean> {
        return inhibit.call(this, command, context);
      }
    }
  }

  // handler

  export class Handler extends GungnirHandler<Inhibitor> {
    public constructor(client: GungnirClient) {
      super(client);
      for (const [name, klass] of inhibitors) {
        const inhibitor = new klass(this, name);
        
      }
    }
  }
}