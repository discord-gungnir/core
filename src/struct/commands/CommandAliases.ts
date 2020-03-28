import type { CommandHandler } from "./CommandHandler";
import type { Command } from "./Command";

const ALIASES = new Map<CommandHandler, Map<string, Command>>();
export const aliasesIndex = (handler: CommandHandler) => {
  if (!ALIASES.has(handler)) ALIASES.set(handler, new Map());
  return ALIASES.get(handler) as Map<string, Command>;
}