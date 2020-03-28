import { Resolver } from "../Resolver";
import { defineResolver } from "../DefineResolver";

@defineResolver("number")
export class NumberResolver extends Resolver<number> {
  public resolve(str: string) {
    return /^\d+$/.test(str) ? Number(str) : null;
  }
}