import type { GungnirClient } from "../../GungnirClient";
import { GungnirHandler } from "../GungnirHandler";
import { GungnirError } from "../../GungnirError";
import { GungnirModule } from "../GungnirModule";

const listenerEvents = new WeakMap<Listener, ListenerEvent[]>();
interface ListenerEvent {
  event: string, once: boolean;
  key: string | symbol;
}

const listeners = new Map<string, Listener.Constructor>();
export abstract class Listener extends GungnirModule {
  readonly #callbacks: {event: string, callback: (...args: any[]) => any}[] = [];
  public constructor(public readonly handler: Listener.Handler, name: string) {
    super(handler, name, "listener");

    let proto: Listener = (this.constructor as any).prototype;
    while (proto != Listener.prototype) {
      const events = listenerEvents.get(proto);
      if (events) for (const {event, once, key} of events) {
        const callback = (...args: any[]) => {
          if (!this.disabled) (this as any)[key](...args)};
        this.client[once ? "once" : "on"](event as any, callback);
        this.#callbacks.push({event, callback});
      } proto = Object.getPrototypeOf(proto);
    }
  }

  public delete() {
    for (const {event, callback} of this.#callbacks)
      this.client.off(event, callback);
    return super.delete();
  }
}
export namespace Listener {
  export type Constructor = new (handler: Handler, name: string) => Listener;
  export type AbstractConstructor = abstract new (handler: Handler, name: string) => Listener;
  export type DefineDecorator = <T extends Constructor>(klass: T) => T;
  export type Decorator = <T extends AbstractConstructor>(klass: T) => T;
  export type EventMethod<E extends string> = E extends keyof GungnirClient.Events ?
    (this: Listener, ...args: GungnirClient.Events[E]) => any
    : (this: Listener, ...args: any[]) => any;
  export type EventDecorator<E extends string> = (klass: Listener, key: string | symbol, desc: TypedPropertyDescriptor<EventMethod<E>>) => void;

  // decorators

  export function define(name: string): DefineDecorator {
    name = name.toLowerCase();
    if (!/^[\w-]+$/.test(name))
      throw new GungnirError(`'${name}' is not a valid listener name`);
    if (name.length > 32)
      throw new GungnirError(`listener names can't be more than 32 characters long`);
    return klass => {
      if (listeners.has(name))
        throw new GungnirError(`a listener called '${name}' already exists`);
      listeners.set(name, klass);
      return klass;
    };
  }

  function attachEvent<E extends string>(proto: Listener, key: string | symbol, event: E, once: boolean) {
    if (!listenerEvents.has(proto)) listenerEvents.set(proto, []);
    const events = listenerEvents.get(proto) as ListenerEvent[];
    events.push({key, event, once});
  }

  export function on<E extends keyof GungnirClient.Events>(event: E): EventDecorator<E>;
  export function on<E extends string>(event: Exclude<E, keyof GungnirClient.Events>): EventDecorator<E>;
  export function on<E extends string>(event: E): EventDecorator<E> {
    return (proto, key) => attachEvent(proto, key, event, false);
  }

  export function once<E extends keyof GungnirClient.Events>(event: E): EventDecorator<E>;
  export function once<E extends string>(event: Exclude<E, keyof GungnirClient.Events>): EventDecorator<E>;
  export function once<E extends string>(event: E): EventDecorator<E> {
    return (proto, key) => attachEvent(proto, key, event, true);
  }

  // make

  type AttachEvent = <E extends string>(event: E, method: EventMethod<E>) => void;

  /**
   * A utility function to create new listeners without needing to extend classes
   * @param events Function used to add events to listen to
   */
  export function make(events: (on: AttachEvent, once: AttachEvent) => void) {
    const MadeListener = (() => class extends Listener {})();
    events((event: string, method: Function) => {
      let key = Symbol(event);
      Object.defineProperty(MadeListener.prototype, key, {
        configurable: true, writable: true, enumerable: false, value: method});
      (MadeListener.prototype as any)[key] = method;
      attachEvent(MadeListener.prototype, key, event, false);
    }, (event: string, method: Function) => {
      let key = Symbol(event);
      Object.defineProperty(MadeListener.prototype, key, {
        configurable: true, writable: true, enumerable: false, value: method});
      attachEvent(MadeListener.prototype, key, event, true);
    });
    return MadeListener;
  }

  // handler

  export class Handler extends GungnirHandler<Listener> {
    public constructor(client: GungnirClient) {
      super(client);
      for (const [name, klass] of listeners) {
        const listener = new klass(this, name);
        
      }
    }
  }
}