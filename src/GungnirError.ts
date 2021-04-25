export class GungnirError extends Error {
  public readonly name: string = "GungnirError";
}
export namespace GungnirError {
  export class Resolver extends GungnirError {
    public readonly name: string = "GungnirError.Resolver";
  }
}