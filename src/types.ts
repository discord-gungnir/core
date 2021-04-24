export type Color = [red: number, green: number, blue: number];

export interface Disableable {
  disabled: boolean;
  enabled: boolean;
  enable(): void;
  disable(): void;
}