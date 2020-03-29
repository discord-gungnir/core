import { Resolver } from "../Resolver";
import { defineResolver } from "../DefineResolver";
import urlRegex from "url-regex";

@defineResolver("url")
export class URLResolver extends Resolver<string> {
  public resolve(str: string) {
    return urlRegex({exact: true}).test(str) ? str : null;
  }
}