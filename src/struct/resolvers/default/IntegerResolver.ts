import { NumberResolver } from "./NumberResolver";
import { defineResolver } from "../DefineResolver";

@defineResolver("integer")
export class IntegerResolver extends NumberResolver {
  public resolve(str: string) {
    const nb = super.resolve(str);
    if (!nb) return null;
    return Math.round(nb) == nb ? nb : null;
  }
}