import { GungnirHandler } from "../GungnirHandler";
import { Command, CommandConstructor } from "./Command";
import { aliasesIndex } from "./CommandAliases";
import type { Message } from "discord.js";

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

  public promise<T extends CommandConstructor>(name: string, command: T): Promise<ReturnType<InstanceType<T>["run"]>>;
  public promise<T extends CommandConstructor>(names: [string, ...string[]], command: T): Promise<ReturnType<InstanceType<T>["run"]>>;
  public promise<T extends CommandConstructor>(names: any, command: T): Promise<ReturnType<InstanceType<T>["run"]>> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.create(names, class extends command {
        public async run(msg: Message, ...args: any[]): Promise<any> {
          try {
            // @ts-ignore
            const res = await super.run(msg, ...args);
            this.delete();
            resolve(res);
          } catch(err) {
            this.delete();
            reject(err);
          }
        }
      })
    });
  }

  public remove(name: string): Command | null {
    const command = super.remove(name);
    if (command) command.unbindAllAliases();
    return command;
  }
}