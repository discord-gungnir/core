import { Resolver } from "../Resolver";
import { defineResolver } from "../DefineResolver";

@defineResolver("number")
export class NumberResolver extends Resolver<number> {
  public resolve(str: string) {
    const nb = Number(str);
    return isNaN(nb) ? null : nb;
  }
}