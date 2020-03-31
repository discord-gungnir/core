import type { InhibitorConstructor, InhibitorConstructorDecorator } from "./Inhibitor";

interface InhibitorToDeclare {
  name: string;
  inhibitor: InhibitorConstructor;
}

export const declaredInhibitors: InhibitorToDeclare[] = [];
export function defineInhibitor(name: string): InhibitorConstructorDecorator {
  return <T extends InhibitorConstructor>(inhibitor: T) => {
    declaredInhibitors.push({name, inhibitor});
    return inhibitor;
  }
}