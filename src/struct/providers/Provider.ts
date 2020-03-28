export abstract class Provider {
  public abstract get(table: string, id: string, key: string): Promise<Provider.ValueTypes | null>;
  public abstract set(table: string, id: string, key: string, value: Provider.ValueTypes | null): Promise<any>;
  public abstract clear(table: string, id: string): Promise<any>;
}

export interface ProviderConstructor {
  new (...args: any[]): Provider;
}

export type CachedProvider<T extends ProviderConstructor> = T & {cached: never};
type Entity = {[key: string]: Provider.ValueTypes | null};
type Table = {[id: string]: Entity};
type Cache = {[table: string]: Table};
Object.defineProperty(Provider, "cached", {
  get() {
    const cache: Cache = {};
    const getTable = (table: string) => (cache[table] || (cache[table] = {})) as Table;
    const getEntity = (table: string, id: string) => (getTable(table)[id] || (getTable(table)[id] = {})) as Entity;
    const getFromCache = (table: string, id: string, key: string) => getEntity(table, id)[key] ?? null;
    const setCache = (table: string, id: string, key: string, value: Provider.ValueTypes | null) => getEntity(table, id)[key] = value;
    const clearCache = (table: string, id: string) => delete getTable(table)[id];
    return class extends this {
      public async get(table: string, id: string, key: string): Promise<Provider.ValueTypes | null> {
        const cached = getFromCache(table, id, key);
        if (cached) return cached;
        // @ts-ignore
        const value = await super.get(table, id, key);
        setCache(table, id, key, value);
        return value;
      }
      public async set(table: string, id: string, key: string, value: Provider.ValueTypes | null): Promise<any> {
        // @ts-ignore
        const res = await super.set(table, id, key, value);
        setCache(table, id, key, value);
        return res;
      }
      public async clear(table: string, id: string): Promise<any> {
        // @ts-ignore
        const res = await super.clear(table, id);
        clearCache(table, id);
        return res;
      }
    } as any;
  }
});

export namespace Provider {
  export type ValueTypes = string|number|boolean;
}