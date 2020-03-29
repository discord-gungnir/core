import { Provider, CachedProviderConstructor } from "../Provider";
import { promises as fsp } from "fs";
import path from "path";

export class JSONProvider extends Provider {
  declare public static readonly cached: CachedProviderConstructor<typeof JSONProvider>;
  public constructor(public readonly path: string) {super()}

  private folder(table: string) {
    return path.join(this.path, table)
  }
  private file(table: string, id: string) {
    return path.join(this.path, table, `${id}.json`);
  }

  #actions: {[key: string]: (() => Promise<any>)[]} = {};
  private getQueue(table: string, id: string) {
    const key = `${table}/+++/${id}`;
    return this.#actions[key] ?? (this.#actions[key] = []);
  }
  private doAction<T>(table: string, id: string, action: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      const queue = this.getQueue(table, id);
      queue.push(() => action().then(resolve, reject));
      if (queue.length == 1) this.nextAction(table, id);
    });
  }
  private nextAction(table: string, id: string) {
    const queue = this.getQueue(table, id);
    const action = queue[0];
    if (!action) return;
    action().finally(() => {
      queue.shift();
      this.nextAction(table, id);
    });
  }

  private async read(table: string, id: string): Promise<{[key: string]: Provider.ValueTypes}> {
    try {return JSON.parse(((await fsp.readFile(this.file(table, id))).toString("utf8")));}
    catch {return {};}
  }

  public async get(table: string, id: string, key: string): Promise<Provider.ValueTypes | null> {
    const data = await this.doAction(table, id, () => this.read(table, id));
    return data[key] ?? null;
  }
  public async set(table: string, id: string, key: string, value: Provider.ValueTypes | null) {
    return this.doAction(table, id, async () => {
      let data = await this.read(table, id);
      if (value) data[key] = value;
      else delete data[key];
      try {await fsp.access(this.folder(table))}
      catch {await fsp.mkdir(this.folder(table), {recursive: true})}
      return fsp.writeFile(this.file(table, id), JSON.stringify(data));
    });
  }
  public async clear(table: string, id: string) {
    return this.doAction(table, id, async () => {
      try {
        await fsp.access(this.folder(table));
        return fsp.unlink(this.file(table, id));
      } catch {}
    });
  }
}