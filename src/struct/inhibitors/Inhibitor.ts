import { GungnirModule } from "../GungnirModule";
import type { Message } from "discord.js";
import type { Command } from "../commands/Command";
import { GungnirHandler } from "../GungnirHandler";

// types

export interface InhibitorConstructor<T extends Inhibitor = Inhibitor> {
  new (handler: InhibitorHandler, name: string): T;
}

export interface InhibitorDecorator<T extends Inhibitor = Inhibitor> {
  <K extends Function & {prototype: T}>(inhibitor: K): K;
}

export interface InhibitorConstructorDecorator<T extends Inhibitor = Inhibitor> {
  <K extends InhibitorConstructor<T>>(inhibitor: K): K;
}

// Inhibitor

export abstract class Inhibitor extends GungnirModule<Inhibitor.Events> {
  public abstract inhibit(message: Message, command: Command): boolean | Promise<boolean>;
  public constructor(handler: GungnirHandler<Inhibitor>, name: string) {
    super(handler, name);
    this.init();
  }
  protected init() {}
}

export namespace Inhibitor {
  export interface Events extends GungnirModule.Events {
    inhibit(message: Message, command: Command): any;
  }

  export function make(inhibit: (this: Inhibitor, message: Message, command: Command) => boolean | Promise<boolean>): InhibitorConstructor {
    return class extends Inhibitor {
      public inhibit(msg: Message, command: Command): boolean | Promise<boolean> {
        return inhibit.call(this, msg, command);
      }
    }
  }
}

export class InhibitorHandler extends GungnirHandler<Inhibitor, InhibitorConstructor> {}