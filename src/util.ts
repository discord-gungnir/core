// misc

export type OptionalPromise<T> = T | Promise<T>;
export type Brand<T, B> = T & {__brand: B};
export type Not<B extends boolean> =
  B extends true ? false
  : B extends false ? true
  : boolean;

// array manipulation

export type Contains<T extends any[]> =
  T extends Array<infer Y> ? Y : never;
export type Flatten<T extends any[]> =
  T extends [] ? []
  : T extends [infer Left, ...infer Right] ?
    Left extends any[] ? [FlattenInner<Left>, ...Flatten<Right>]
    : [Left, ...Flatten<Right>]
  : FlattenInner<T>[];
type FlattenInner<T> =
  T extends Array<infer R> ? FlattenInner<R> : T;

// string manipulation

export type Includes<S extends string, I extends string> =
  S extends `${string}${I}${string}` ? true : false;
export type Replace<S extends string, ToReplace extends string, Replacement extends string> =
  S extends `${infer Left}${ToReplace}${infer Right}` ?
    Replace<`${Left}${Replacement}${Right}`, ToReplace, Replacement>
    : S;
export type Remove<S extends string, Remove extends string> = Replace<S, Remove, "">;


type Space = " ";
export type TrimLeft<S extends string> = S extends `${Space}${infer R}` ? TrimLeft<R> : S;
export type TrimRight<S extends string> = S extends `${infer L}${Space}` ? TrimRight<L> : S;
export type Trim<S extends string> = TrimLeft<TrimRight<S>>;
export type RemoveSpaces<S extends string> = Remove<S, Space>;