import type { InhibitorConstructor } from "./Inhibitor";

interface DefineInhibitorDecorator {
  <T extends InhibitorConstructor>(command: T): T;
}

interface InhibitorToDeclare {
  name: string;
  inhibitor: InhibitorConstructor;
}

export const declaredInhibitors: InhibitorToDeclare[] = [];
export function defineInhibitor(name: string): DefineInhibitorDecorator {
  return <T extends InhibitorConstructor>(inhibitor: T) => {
    declaredInhibitors.push({name, inhibitor});
    return inhibitor;
  }
}