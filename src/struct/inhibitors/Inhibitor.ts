import { GungnirModule, ModuleConstructor } from "../GungnirModule";
import type { Message } from "discord.js";
import type { Command } from "../commands/Command";
import { GungnirHandler } from "../GungnirHandler";

// types

export interface InhibitorConstructor {
  new (handler: GungnirHandler<Inhibitor>, name: string): Inhibitor;
}

export interface InhibitorDecorator {
  <T extends typeof Inhibitor>(command: T): T | void;
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
    inhibit: (message: Message, command: Command) => any;
  }
}