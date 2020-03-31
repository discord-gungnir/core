import type { InhibitorConstructor, InhibitorDecorator } from "./Inhibitor";

interface InhibitorToDeclare {
  name: string;
  inhibitor: InhibitorConstructor;
}

export const declaredInhibitors: InhibitorToDeclare[] = [];
export function defineInhibitor(name: string): InhibitorDecorator {
  return <T extends InhibitorConstructor>(inhibitor: T) => {
    declaredInhibitors.push({name, inhibitor});
    return inhibitor;
  }
}