import { Provider } from "./Provider";

type Data = {[key: string]: Provider.ValueTypes | null}
type Row = Data & {id: string};

export abstract class SQLProvider extends Provider {
  public async get(table: string, id: string, key: string): Promise<Provider.ValueTypes | null> {
    const selected = await this.selectOne(table, {id});
    if (selected) return selected[key] ?? null;
    else return null;
  }
  public async set(table: string, id: string, key: string, value: Provider.ValueTypes | null) {
    const selected = await this.selectOne(table, {id});
    if (selected) return this.update(table, {id}, {[key]: value});
    else return this.insert(table, {id, [key]: value});
  }
  public async clear(table: string, id: string) {
    return this.delete(table, {id});
  }

  public abstract select(table: string, row: Row): Promise<Row[]>;
  public abstract insert(table: string, row: Row): Promise<any>;
  public abstract update(table: string, row: Row, data: Data): Promise<any>;
  public abstract delete(table: string, row: Row): Promise<any>;

  public async selectOne(table: string, row: Row): Promise<Row|null> {
    const selected = await this.select(table, row);
    if (selected.length == 1) return selected[0];
    else return null;
  }
}