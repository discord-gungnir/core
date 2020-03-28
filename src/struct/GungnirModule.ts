import type { GungnirClient } from "./GungnirClient";
import type { GungnirHandler } from "./GungnirHandler";
import { EventEmitter } from "events";

export interface ModuleConstructor<M extends GungnirModule = any, H extends GungnirHandler<M> = any> {
  new (handler: H, name: string): M;
}

// @ts-ignore
export abstract class GungnirModule<Events extends GungnirModule.Events = any> extends EventEmitter {
  protected abstract init(): void;

  public readonly name: string;
  public readonly client: GungnirClient;
  public constructor(public readonly handler: GungnirHandler<any>, name: string) {
    super();
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

// @ts-ignore
export interface GungnirModule<Events extends GungnirModule.Events = any> {
  // @ts-ignore
  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): this;
  on<K extends keyof Events>(event: K, listener: Events[K]): boolean;
  once<K extends keyof Events>(event: K, listener: Events[K]): boolean;
}

export namespace GungnirModule {
  export interface Events {
    deleted: () => any;
  }
}