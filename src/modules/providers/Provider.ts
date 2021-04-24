import type { GungnirClient } from "../../GungnirClient";
import { GungnirError } from "../../GungnirError";
import { OptionalPromise } from "../../util";

export interface Provider {
  get(id: string, key: string): OptionalPromise<Provider.Data | null>;
  set(id: string, key: string, value: Provider.Data | null): OptionalPromise<void>;
  clear(id: string): OptionalPromise<void>;
}
export namespace Provider {
  export type Data = string | number | boolean | (Data | null)[] | {[key: string]: Data | null};
  export declare const Data: unique symbol;

  export type AccessedData<T> = T extends {[Data]: {[key: string]: Data}} ? T[typeof Data] : {[key: string]: Data};
  export class DataAccessor<T> {
    public readonly client: GungnirClient;
    public constructor(public readonly access: T & {client: GungnirClient}, public readonly id: string) {
      this.client = "client" in access ? access.client : access;
    }

    // provider
    protected get provider() {
      return this.client.provider;
    }
    protected set provider(provider) {
      this.client.provider = provider;
    }

    // cache
    public readonly cache: DataAccessor.Cache<T> = new DataAccessor.Cache();
    public get useCache() {
      return this.client.options.useProviderCache ?? true;
    }
    public set useCache(useCache) {
      this.client.options.useProviderCache = useCache;
    }

    // actions
    readonly #queue: (() => Promise<any>)[] = [];
    protected doAction<T>(action: () => Promise<T>) {
      return new Promise<T>((resolve, reject) => {
        this.#queue.push(() => action().then(resolve, reject));
        if (this.#queue.length == 1) this.nextAction();
      });
    }
    private nextAction() {
      const action = this.#queue[0];
      if (action) action().finally(() => {
        this.#queue.shift();
        this.nextAction();
      });
    }

    // accessors
    public get<K extends string & keyof AccessedData<T>>(key: K) {
      return this.doAction(async () => {
        if (!this.provider) throw new GungnirError("no data provider");
        if (this.useCache && this.cache.has(key)) return this.cache.get(key) as AccessedData<T>[K] | null;
        const value = await this.provider.get(this.id, key) as AccessedData<T>[K] | null;
        this.cache.set(key, value);
        return value;
      });
    }
    public set<K extends string & keyof AccessedData<T>>(key: K, value: AccessedData<T>[K] | null) {
      return this.doAction(async () => {
        if (!this.provider) throw new GungnirError("no data provider");
        await this.provider.set(this.id, key, value as Data | null);
        this.cache.set(key, value);
      });
    }
    public clear() {
      return this.doAction(async () => {
        if (!this.provider) throw new GungnirError("no data provider");
        await this.provider.clear(this.id);
        for (const key of this.cache.keys)
          this.cache.set(key, null);
      });
    }
  }
  export namespace DataAccessor {
    export class Cache<T extends {[Data]?: Data}> {
      protected data: Record<string, string> = {};

      public has<K extends string & keyof AccessedData<T>>(key: K) {
        return key in this.data;
      }
      public get<K extends string & keyof AccessedData<T>>(key: K) {
        return this.has(key) ? JSON.parse(this.data[key] as string) as AccessedData<T>[K] | null : undefined;
      }
      public set<K extends string & keyof AccessedData<T>>(key: K, value: AccessedData<T>[K] | null | undefined) {
        if (value === undefined) delete this.data[key];
        else this.data[key] = JSON.stringify(value);
        return this;
      }
      public clear() {
        this.data = {};
        return this;
      }
      public get keys() {
        return Object.keys(this.data);
      }
    }
  }
}