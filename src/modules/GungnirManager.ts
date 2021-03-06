import type { GungnirClient } from "../GungnirClient";
import type { GungnirModule } from "./GungnirModule";

const modules = new WeakMap<GungnirManager<GungnirModule>, Map<string, GungnirModule>>();
export function getModules(handler: GungnirManager<any>) {
  if (!modules.has(handler)) modules.set(handler, new Map());
  return modules.get(handler) as Map<string, GungnirModule>;
}

export abstract class GungnirManager<M extends GungnirModule & {handler: GungnirManager<M>}> {
  public constructor(public readonly client: GungnirClient) {}

  // id
  readonly #modules = getModules(this) as Map<string, M>;
  public has(name: string) {
    return this.#modules.has(name);
  }
  public get(name: string) {
    return this.#modules.get(name);
  }

  // misc
  [Symbol.iterator]() {
    return this.#modules.values();
  }
  public get size() {
    return this.#modules.size;
  }
  public get array() {
    return Array.from(this);
  }
}