import { GungnirHandler } from "../GungnirHandler";
import { Command, CommandConstructor, CommandReturnType, InferCommandTypes } from "./Command";
import { aliasesIndex } from "./CommandAliases";

export class CommandHandler extends GungnirHandler<Command, CommandConstructor> {
  #aliases = aliasesIndex(this);
  public has(name: string): boolean {
    return super.has(name) || this.#aliases.has(name.toLowerCase());
  }
  public get(name: string): Command | null {
    return super.get(name) ?? this.#aliases.get(name.toLowerCase()) ?? null;
  }

  public create<C extends CommandConstructor>(name: string, command: C): InstanceType<C>;
  public create<C extends CommandConstructor>(names: [string, ...string[]], command: C): InstanceType<C>;
  public create<C extends CommandConstructor>(names: string | [string, ...string[]], command: C): InstanceType<C> {
    if (!Array.isArray(names)) names = [names];
    const name = names.shift() as string;
    const created = super.create(name, command);
    created.bindAliases(...names);
    return created;
  }

  public define(name: string, command: CommandConstructor): this
  public define(names: [string, ...string[]], command: CommandConstructor): this
  public define(names: any, command: CommandConstructor): this {
    this.create(names, command);
    return this;
  }

  public promise<C extends CommandConstructor>(name: string, command: C): Promise<CommandReturnType<InstanceType<C>>>;
  public promise<C extends CommandConstructor>(names: [string, ...string[]], command: C): Promise<CommandReturnType<InstanceType<C>>>;
  public promise<C extends CommandConstructor>(names: any, command: C): Promise<CommandReturnType<InstanceType<C>>> {
    return new Promise((resolve, reject) => {
      const created = this.create(names, command);
      created.once("run", (msg, args, res) => {
        created.delete();
        resolve(res);
      }).once("error", (msg, args, err) => {
        created.delete();
        reject(err);
      })
    });
  }

  public remove(name: string): Command | null {
    const command = super.remove(name);
    if (command) command.unbindAllAliases();
    return command;
  }
}