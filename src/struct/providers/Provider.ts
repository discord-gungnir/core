import type { CachedProvider } from "./CachedProvider";

export abstract class Provider {
  public abstract get(table: string, id: string, key: string): Promise<Provider.ValueTypes | null>;
  public abstract set(table: string, id: string, key: string, value: Provider.ValueTypes | null): Promise<any>;
  public abstract clear(table: string, id: string): Promise<any>;
  public cached(): this is CachedProvider {
    return false;
  }
}

export interface ProviderConstructor {
  new (...args: any[]): Provider;
}

export namespace Provider {
  export type ValueTypes = string|number|boolean;
}