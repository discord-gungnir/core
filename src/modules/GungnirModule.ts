import { GungnirHandler, getModules } from "./GungnirHandler";
import type { GungnirClient } from "../GungnirClient";
import { GungnirError } from "../GungnirError";
import type { Disableable } from "../types";

export abstract class GungnirModule implements Disableable {
  readonly #modules = getModules(this.handler);

  public readonly name: string;
  public readonly client: GungnirClient;
  public constructor(public readonly handler: GungnirHandler<GungnirModule>, name: string, type: string) {
    this.name = name.toLowerCase();
    if (!/^[\w-]+$/.test(this.name)) throw new GungnirError(`'${this.name}' is not a valid ${type} name`);
    if (this.name.length > 32) throw new GungnirError(`${type} names can't be more than 32 characters long`);
    if (this.#modules.has(this.name)) throw new GungnirError(`a ${type} called '${this.name}' already exists`);
    this.#modules.set(this.name, this);
    this.client = handler.client;
    (async () => {
      await handler.client.ready;
      this.init();
    })();
  }

  // init
  public init(): void {}

  // deletion
  public get deleted() {
    return this.#modules.get(this.name) != this;
  }
  public delete() {
    if (this.deleted) return;
    this.#modules.delete(this.name);
  }

  // disableable
  public disabled = false;
  public get enabled() {
    return !this.disabled;
  }
  public set enabled(enabled) {
    this.disabled = !enabled;
  }
  public disable() {
    this.disabled = true;
  }
  public enable() {
    this.disabled = false;
  }
}