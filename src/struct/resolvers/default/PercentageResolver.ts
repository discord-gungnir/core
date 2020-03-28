import { Resolver } from "../Resolver";
import { defineResolver } from "../DefineResolver";

@defineResolver("percentage")
export class PercentageResolver extends Resolver<number> {
  public resolve(str: string) {
    return /^\d+%?$/.test(str) ? Number(str.replace("%", "")) : null;
  }
}