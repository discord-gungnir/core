import { ResolverConstructor, ResolverConstructorDecorator } from "./Resolver";

interface ResolverToDeclare {
  name: string;
  resolver: ResolverConstructor;
}

export const declaredResolvers: ResolverToDeclare[] = [];
export function defineResolver(name: string): ResolverConstructorDecorator {
  return <T extends ResolverConstructor>(resolver: T) => {
    declaredResolvers.push({name, resolver});
    return resolver;
  }
}