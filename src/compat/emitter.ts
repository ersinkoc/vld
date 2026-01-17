/**
 * Event Emitter Implementation
 *
 * This module provides a type-safe event emitter,
 * compatible with @oxog/emitter when available.
 */

/**
 * Event map type - maps event names to their payload types
 */
export type EventMap = Record<string, unknown>;

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * Listener options
 */
export interface ListenerOptions {
  /** Remove listener after first call */
  once?: boolean;
  /** Listener priority (higher = called first) */
  priority?: number;
}

/**
 * Internal listener entry
 */
interface ListenerEntry<T = unknown> {
  handler: EventHandler<T>;
  once: boolean;
  priority: number;
}

/**
 * Emitter interface
 */
export interface Emitter<TEvents extends EventMap = EventMap> {
  /** Subscribe to an event */
  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
    options?: ListenerOptions
  ): () => void;

  /** Subscribe to an event once */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void;

  /** Unsubscribe from an event */
  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void;

  /** Emit an event */
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;

  /** Emit an event and wait for all handlers */
  emitAsync<K extends keyof TEvents>(event: K, payload: TEvents[K]): Promise<void>;

  /** Remove all listeners for an event or all events */
  removeAllListeners<K extends keyof TEvents>(event?: K): void;

  /** Get listener count for an event */
  listenerCount<K extends keyof TEvents>(event: K): number;

  /** Get all event names with listeners */
  eventNames(): (keyof TEvents)[];
}

/**
 * Create a type-safe event emitter
 */
export function createEmitter<TEvents extends EventMap = EventMap>(): Emitter<TEvents> {
  const listeners = new Map<keyof TEvents, ListenerEntry<unknown>[]>();

  const getListeners = <K extends keyof TEvents>(event: K): ListenerEntry<TEvents[K]>[] => {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    return listeners.get(event) as ListenerEntry<TEvents[K]>[];
  };

  const sortListeners = <K extends keyof TEvents>(event: K): void => {
    const eventListeners = getListeners(event);
    eventListeners.sort((a, b) => b.priority - a.priority);
  };

  const on = <K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
    options: ListenerOptions = {}
  ): (() => void) => {
    const entry: ListenerEntry<TEvents[K]> = {
      handler,
      once: options.once ?? false,
      priority: options.priority ?? 0
    };

    getListeners(event).push(entry);
    sortListeners(event);

    // Return unsubscribe function
    return () => off(event, handler);
  };

  const once = <K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): (() => void) => {
    return on(event, handler, { once: true });
  };

  const off = <K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): void => {
    const eventListeners = listeners.get(event);
    if (!eventListeners) return;

    const index = eventListeners.findIndex((entry) => entry.handler === handler);
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }
  };

  const emit = <K extends keyof TEvents>(event: K, payload: TEvents[K]): void => {
    const eventListeners = listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) return;

    // Create a copy to allow modifications during iteration
    const listenersToCall = [...eventListeners];

    for (const entry of listenersToCall) {
      if (entry.once) {
        off(event, entry.handler as EventHandler<TEvents[K]>);
      }

      try {
        entry.handler(payload);
      } catch (error) {
        // Log error but don't stop other handlers
        console.error(`Error in event handler for "${String(event)}":`, error);
      }
    }
  };

  const emitAsync = async <K extends keyof TEvents>(
    event: K,
    payload: TEvents[K]
  ): Promise<void> => {
    const eventListeners = listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) return;

    // Create a copy to allow modifications during iteration
    const listenersToCall = [...eventListeners];

    for (const entry of listenersToCall) {
      if (entry.once) {
        off(event, entry.handler as EventHandler<TEvents[K]>);
      }

      try {
        await entry.handler(payload);
      } catch (error) {
        // Log error but don't stop other handlers
        console.error(`Error in async event handler for "${String(event)}":`, error);
      }
    }
  };

  const removeAllListeners = <K extends keyof TEvents>(event?: K): void => {
    if (event !== undefined) {
      listeners.delete(event);
    } else {
      listeners.clear();
    }
  };

  const listenerCount = <K extends keyof TEvents>(event: K): number => {
    return listeners.get(event)?.length ?? 0;
  };

  const eventNames = (): (keyof TEvents)[] => {
    return Array.from(listeners.keys()).filter((key) => (listeners.get(key)?.length ?? 0) > 0);
  };

  return {
    on,
    once,
    off,
    emit,
    emitAsync,
    removeAllListeners,
    listenerCount,
    eventNames
  };
}

/**
 * Mixin to add event emitter capabilities to a class
 */
export function withEmitter<TEvents extends EventMap>() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class extends Base {
      /** @internal */
      _emitter = createEmitter<TEvents>();

      on<K extends keyof TEvents>(
        event: K,
        handler: EventHandler<TEvents[K]>,
        options?: ListenerOptions
      ): () => void {
        return this._emitter.on(event, handler, options);
      }

      once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
        return this._emitter.once(event, handler);
      }

      off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
        this._emitter.off(event, handler);
      }

      emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
        this._emitter.emit(event, payload);
      }

      async emitAsync<K extends keyof TEvents>(
        event: K,
        payload: TEvents[K]
      ): Promise<void> {
        await this._emitter.emitAsync(event, payload);
      }
    };
  };
}

/**
 * Create an event bus for global event handling
 */
export function createEventBus<TEvents extends EventMap>(): Emitter<TEvents> & {
  /** Create a scoped emitter that auto-cleans up */
  createScope(): Emitter<TEvents> & { dispose(): void };
} {
  const emitter = createEmitter<TEvents>();

  const createScope = (): Emitter<TEvents> & { dispose(): void } => {
    const unsubscribers: (() => void)[] = [];

    const scopedEmitter: Emitter<TEvents> & { dispose(): void } = {
      on: (event, handler, options) => {
        const unsubscribe = emitter.on(event, handler, options);
        unsubscribers.push(unsubscribe);
        return unsubscribe;
      },
      once: (event, handler) => {
        const unsubscribe = emitter.once(event, handler);
        unsubscribers.push(unsubscribe);
        return unsubscribe;
      },
      off: emitter.off,
      emit: emitter.emit,
      emitAsync: emitter.emitAsync,
      removeAllListeners: emitter.removeAllListeners,
      listenerCount: emitter.listenerCount,
      eventNames: emitter.eventNames,
      dispose: () => {
        for (const unsubscribe of unsubscribers) {
          unsubscribe();
        }
        unsubscribers.length = 0;
      }
    };

    return scopedEmitter;
  };

  return {
    ...emitter,
    createScope
  };
}

export type { EventHandler as VldEventHandler };
