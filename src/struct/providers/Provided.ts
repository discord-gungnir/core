import { GungnirError } from "../../util/GungnirError";
import type { GungnirClient } from "../GungnirClient";
import type { Provider } from "./Provider";
import type { Snowflake } from "discord.js";

const NO_PROVIDER = "no Provider.";

export interface Provided {
  readonly provider: Provider | null;
  readonly providedId: string;
  getData(key: string): Promise<Provider.ValueTypes | null>;
  getData<T extends Provider.ValueTypes>(key: string, defaultValue: T): Promise<T>;
  setData(key: string, value: Provider.ValueTypes | null): Promise<any>;
  clearData(): Promise<any>;
}

interface ProvidedConstructor {
  new (...args: any[]): Provided;
}

export function Provided<T extends new (...args: any[]) => {id: Snowflake, client: GungnirClient}>(superclass: T, table: string): T & ProvidedConstructor {
  return class extends superclass implements Provided {
    public get provider() {
      return this.client.provider;
    }
    public get providedId() {
      return this.id;
    }
    public async getData(key: string, defaultValue: Provider.ValueTypes | null = null): Promise<Provider.ValueTypes | null> {
      if (this.provider === null) throw new GungnirError(NO_PROVIDER);
      const res = await this.provider.get(table, this.providedId, key);
      return res ?? defaultValue;
    }
    public setData(key: string, value: Provider.ValueTypes | null): Promise<any> {
      if (this.provider === null) throw new GungnirError(NO_PROVIDER);
      return this.provider.set(table, this.providedId, key, value);
    }
    public clearData(): Promise<any> {
      if (this.provider === null) throw new GungnirError(NO_PROVIDER);
      return this.provider.clear(table, this.providedId);
    }
  }
}