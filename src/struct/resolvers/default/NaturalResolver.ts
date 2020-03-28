import { IntegerResolver } from "./IntegerResolver";
import { defineResolver } from "../DefineResolver";

@defineResolver("natural")
export class NaturalResolver extends IntegerResolver {
  public resolver(str: string) {
    const nb = super.resolve(str);
    if (!nb) return null;
    return nb > 0 ? nb : null;
  }
}