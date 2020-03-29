import type { GungnirClient } from "./GungnirClient";
import type { GungnirHandler } from "./GungnirHandler";
import { EventEmitter } from "events";
import { GungnirError } from "../util/GungnirError";

export interface ModuleConstructor<M extends GungnirModule = any, H extends GungnirHandler<M> = any> {
  new (handler: H, name: string): M;
}

const INVALID_MODULE_NAME = (name: string) => `${name.toLowerCase()} isn't a valid module name.`;

export abstract class GungnirModule<Events extends GungnirModule.Events = any> extends EventEmitter {
  protected abstract init(): void;

  public readonly name: string;
  public readonly client: GungnirClient;
  public constructor(public readonly handler: GungnirHandler<any>, name: string) {
    super();
    if (!(/^[a-z0-9_-]$/i).test(name))
      throw new GungnirError(INVALID_MODULE_NAME(name));
    this.client = this.handler.client;
    this.name = name.toLowerCase();
  }

  // delete
  public get deleted() {
    return this.handler.get(this.name) != this;
  }
  public delete(): this {
    if (!this.deleted) this.handler.remove(this.name);
    return this;
  }

  // disable
  public disabled = false;
  public get enabled() {
    return !this.disabled;
  }
  public set enabled(enabled) {
    this.disabled = !enabled;
  }
  public disable(): this {
    this.disabled = true;
    return this;
  }
  public enable(): this {
    this.enabled = true;
    return this;
  }
  
}

export interface GungnirModule<Events extends GungnirModule.Events = any> {
  emit<K extends string & keyof Events>(event: K, ...args: Parameters<Events[K]>): boolean;
  on<K extends string & keyof Events>(event: K, listener: Events[K]): this;
  once<K extends string & keyof Events>(event: K, listener: Events[K]): this;
}

export namespace GungnirModule {
  export interface Events {
    [key: string]: (...args: any[]) => void;
    deleted(): void;
  }
}