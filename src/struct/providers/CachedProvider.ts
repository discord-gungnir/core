import type { Provider, ProviderConstructor } from "./Provider";

export interface CachedProvider extends Provider {
  getFromCache(...args: Parameters<Provider["get"]>): Provider.ValueTypes | null;
  setCache(...args: Parameters<Provider["set"]>): this;
  clearCache(...args: Parameters<Provider["clear"]>): this;
}

export interface CachedProviderConstructor<P extends ProviderConstructor> {
  new (...args: ConstructorParameters<P>): InstanceType<P> & CachedProvider;
}

type Entity = {[key: string]: Provider.ValueTypes | null | undefined};
type Table = {[id: string]: Entity};
type Cache = {[table: string]: Table};
export function CachedProvider<P extends ProviderConstructor>(provider: P): CachedProviderConstructor<P> {
  return class extends (provider as any) implements CachedProvider {
    public async get(table: string, id: string, key: string): Promise<Provider.ValueTypes | null> {
      const cached = this.getFromCache(table, id, key);
      if (cached !== null) return cached;
      const value = await super.get(table, id, key);
      this.setCache(table, id, key, value);
      return value;
    }
    public async set(table: string, id: string, key: string, value: Provider.ValueTypes | null): Promise<any> {
      const res = await super.set(table, id, key, value);
      this.setCache(table, id, key, value);
      return res;
    }
    public async clear(table: string, id: string): Promise<any> {
      const res = await super.clear(table, id);
      this.clearCache(table, id);
      return res;
    }
    public cached(): this is CachedProvider {
      return true;
    }

    // cache
    readonly #cache: Cache = {};
    private getTable(table: string) {
      return this.#cache[table] || (this.#cache[table] = {});
    }
    private getEntity(table: string, id: string) {
      return this.getTable(table)[id] || (this.getTable(table)[id] = {});
    }
    public getFromCache(table: string, id: string, key: string) {
      return this.getEntity(table, id)[key] ?? null;
    }
    public setCache(table: string, id: string, key: string, value: Provider.ValueTypes | null) {
      this.getEntity(table, id)[key] = value;
      return this;
    }
    public clearCache(table: string, id: string): this {
      delete this.getTable(table)[id];
      return this;
    }
  } as any;
}