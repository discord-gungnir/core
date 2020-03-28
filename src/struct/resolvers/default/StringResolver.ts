import { Resolver } from "../Resolver";
import { defineResolver } from "../DefineResolver";

@defineResolver("string")
export class StringResolver extends Resolver<string> {
  public resolve(str: string) {
    return str;
  }
}