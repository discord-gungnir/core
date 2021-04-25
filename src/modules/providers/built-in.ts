import { GungnirClient } from "../../GungnirClient";
import type { Provider } from "./Provider";
import fsp from "fs/promises";
import { join } from "path";

export class JSONProvider implements Provider {
  public constructor(public readonly path: string) {}

  // helpers
  protected folder(id: string): string {
    const split = id.split(/[/:]/g);
    split.pop();
    return join(this.path, ...split);
  }
  protected file(id: string): string {
    const split = id.split(/[/:]/g);
    split[split.length-1] += ".json";
    return join(this.path, ...split);
  }
  protected async read(id: string): Promise<Record<string, Provider.Data>> {
    let json: string;
    try {json = (await fsp.readFile(this.file(id))).toString("utf8")}
    catch {return {}}
    return JSON.parse(json);
  }

  // accessors
  public async get(id: string, key: string): Promise<Provider.Data | null> {
    const data = await this.read(id);
    return data[key] ?? null;
  }
  public async set(id: string, key: string, value: Provider.Data | null): Promise<void> {
    try {await fsp.access(this.file(id))}
    catch {
      if (value !== null) fsp.mkdir(this.folder(id), {recursive: true});
      else return;
    }
    const data = await this.read(id);
    if (value === null) delete data[key];
    else data[key] = value;
    return fsp.writeFile(this.file(id), JSON.stringify(data));
  }
  public async clear(id: string): Promise<void> {
    try {await fsp.access(this.file(id))} catch {return}
    return fsp.unlink(this.file(id));
  }
}
export namespace JSONProvider {
  /**
   * Use a JSON provider
   * @param path The path to where data needs to be stored
   * @param cache Whether or not to cache the results returned by the provider, enabled by default
   */
   export function provide(path: string, cached?: boolean) {
    return GungnirClient.provider(() => new JSONProvider(path), cached);
  }
}