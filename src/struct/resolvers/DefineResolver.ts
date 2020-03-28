import { ResolverConstructor } from "./Resolver";

interface DefineResolverDecorator {
  <T extends ResolverConstructor>(command: T): T;
}

interface ResolverToDeclare {
  name: string;
  resolver: ResolverConstructor;
}

export const declaredResolvers: ResolverToDeclare[] = [];
export function defineResolver(name: string): DefineResolverDecorator {
  return <T extends ResolverConstructor>(resolver: T) => {
    declaredResolvers.push({name, resolver});
    return resolver;
  }
}