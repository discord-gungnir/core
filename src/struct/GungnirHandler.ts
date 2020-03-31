import { GungnirModule, ModuleConstructor } from "./GungnirModule";
import { ClientOrHasClient } from "./Types";
import { GungnirClient } from "./GungnirClient";

export abstract class GungnirHandler<M extends GungnirModule, C extends ModuleConstructor<M> = ModuleConstructor<M>> {
  public readonly client: GungnirClient;
  public constructor(public readonly linkedTo: ClientOrHasClient) {
    this.client = "client" in linkedTo ? linkedTo.client : linkedTo;
  }

  #modules = new Map<string, M>();
  public has(name: string): boolean {
    return this.#modules.has(name.toLowerCase());
  }
  public get(name: string): M | null {
    return this.#modules.get(name.toLowerCase()) ?? null;
  }
  public create<U extends C>(name: string, module: U): InstanceType<U> {
    if (this.has(name)) this.remove(name);
    const created = new module(this, name);
    this.#modules.set(name.toLowerCase(), created);
    return created as InstanceType<U>;
  }
  public define(name: string, module: C): this {
    this.create(name, module);
    return this;
  }
  public remove(name: string): M | null {
    name = name.toLowerCase();
    const module = this.#modules.get(name);
    if (!module) return null;
    this.#modules.delete(name);
    module.emit("deleted");
    return module;
  }
  public removeAll(): M[] {
    const modules: M[] = [];
    for (const name of this.#modules.keys()) {
      const module = this.remove(name);
      if (module) modules.push(module);
    }
    return modules;
  }

  [Symbol.iterator]() {
    return this.#modules.values();
  }
  public get toArray() {
    return Array.from(this.#modules.values());
  }
  public get toMap() {
    return new Map(this.#modules);
  }
}