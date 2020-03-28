import { GungnirHandler } from "../GungnirHandler";
import type { Command, CommandConstructor } from "./Command";
import { aliasesIndex } from "./CommandAliases";

export class CommandHandler extends GungnirHandler<Command, CommandConstructor> {
  #aliases = aliasesIndex(this);
  public has(name: string): boolean {
    return super.has(name) || this.#aliases.has(name.toLowerCase());
  }
  public get(name: string): Command | null {
    return super.get(name) ?? this.#aliases.get(name.toLowerCase()) ?? null;
  }

  public create<T extends CommandConstructor>(name: string, command: T): InstanceType<T>;
  public create<T extends CommandConstructor>(names: [string, ...string[]], command: T): InstanceType<T>;
  public create<T extends CommandConstructor>(names: string | [string, ...string[]], command: T): InstanceType<T> {
    if (!Array.isArray(names)) return this.create([names], command);
    const name = names.shift() as string;
    const created = super.create(name, command);
    created.bindAliases(...names);
    return created;
  }

  public define(name: string, command: CommandConstructor): this
  public define(names: [string, ...string[]], command: CommandConstructor): this
  public define(names: string | [string, ...string[]], command: CommandConstructor): this {
    this.create(names as any, command);
    return this;
  }

  public remove(name: string): Command | null {
    const command = super.remove(name);
    if (command) command.unbindAllAliases();
    return command;
  }
}