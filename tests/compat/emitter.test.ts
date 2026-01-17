/**
 * Tests for Event Emitter implementation
 */

import {
  createEmitter,
  createEventBus,
  withEmitter
} from '../../src/compat/emitter';

describe('Event Emitter', () => {
  describe('createEmitter', () => {
    it('should create an emitter', () => {
      const emitter = createEmitter<{ test: string }>();

      expect(emitter).toBeDefined();
      expect(typeof emitter.on).toBe('function');
      expect(typeof emitter.off).toBe('function');
      expect(typeof emitter.emit).toBe('function');
    });

    it('should emit events to listeners', () => {
      const emitter = createEmitter<{ message: string }>();
      const received: string[] = [];

      emitter.on('message', (payload) => {
        received.push(payload);
      });

      emitter.emit('message', 'hello');
      emitter.emit('message', 'world');

      expect(received).toEqual(['hello', 'world']);
    });

    it('should support multiple listeners', () => {
      const emitter = createEmitter<{ event: number }>();
      const listener1: number[] = [];
      const listener2: number[] = [];

      emitter.on('event', (n) => { listener1.push(n); });
      emitter.on('event', (n) => { listener2.push(n * 2); });

      emitter.emit('event', 5);

      expect(listener1).toEqual([5]);
      expect(listener2).toEqual([10]);
    });

    it('should unsubscribe with returned function', () => {
      const emitter = createEmitter<{ data: string }>();
      const received: string[] = [];

      const unsubscribe = emitter.on('data', (s) => { received.push(s); });

      emitter.emit('data', 'first');
      unsubscribe();
      emitter.emit('data', 'second');

      expect(received).toEqual(['first']);
    });

    it('should unsubscribe with off method', () => {
      const emitter = createEmitter<{ data: string }>();
      const received: string[] = [];
      const handler = (s: string) => { received.push(s); };

      emitter.on('data', handler);
      emitter.emit('data', 'first');
      emitter.off('data', handler);
      emitter.emit('data', 'second');

      expect(received).toEqual(['first']);
    });

    it('should support once listeners', () => {
      const emitter = createEmitter<{ ping: void }>();
      let count = 0;

      emitter.once('ping', () => { count++; });

      emitter.emit('ping', undefined);
      emitter.emit('ping', undefined);
      emitter.emit('ping', undefined);

      expect(count).toBe(1);
    });

    it('should support priority ordering', () => {
      const emitter = createEmitter<{ event: void }>();
      const order: number[] = [];

      emitter.on('event', () => { order.push(1); }, { priority: 1 });
      emitter.on('event', () => { order.push(3); }, { priority: 3 });
      emitter.on('event', () => { order.push(2); }, { priority: 2 });

      emitter.emit('event', undefined);

      expect(order).toEqual([3, 2, 1]);
    });

    it('should handle errors in listeners gracefully', () => {
      const emitter = createEmitter<{ event: void }>();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let called = false;

      emitter.on('event', () => {
        throw new Error('test error');
      });
      emitter.on('event', () => {
        called = true;
      });

      emitter.emit('event', undefined);

      expect(called).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should remove all listeners for event', () => {
      const emitter = createEmitter<{ a: void; b: void }>();
      let aCount = 0;
      let bCount = 0;

      emitter.on('a', () => { aCount++; });
      emitter.on('b', () => { bCount++; });

      emitter.emit('a', undefined);
      emitter.emit('b', undefined);

      emitter.removeAllListeners('a');

      emitter.emit('a', undefined);
      emitter.emit('b', undefined);

      expect(aCount).toBe(1);
      expect(bCount).toBe(2);
    });

    it('should remove all listeners for all events', () => {
      const emitter = createEmitter<{ a: void; b: void }>();
      let aCount = 0;
      let bCount = 0;

      emitter.on('a', () => { aCount++; });
      emitter.on('b', () => { bCount++; });

      emitter.removeAllListeners();

      emitter.emit('a', undefined);
      emitter.emit('b', undefined);

      expect(aCount).toBe(0);
      expect(bCount).toBe(0);
    });

    it('should count listeners', () => {
      const emitter = createEmitter<{ event: void }>();

      expect(emitter.listenerCount('event')).toBe(0);

      const unsub1 = emitter.on('event', () => {});
      expect(emitter.listenerCount('event')).toBe(1);

      emitter.on('event', () => {});
      expect(emitter.listenerCount('event')).toBe(2);

      unsub1();
      expect(emitter.listenerCount('event')).toBe(1);
    });

    it('should list event names', () => {
      const emitter = createEmitter<{ a: void; b: void; c: void }>();

      expect(emitter.eventNames()).toEqual([]);

      emitter.on('a', () => {});
      emitter.on('b', () => {});

      expect(emitter.eventNames()).toContain('a');
      expect(emitter.eventNames()).toContain('b');
      expect(emitter.eventNames()).not.toContain('c');
    });

    it('should emit async and wait for handlers', async () => {
      const emitter = createEmitter<{ event: number }>();
      const results: number[] = [];

      emitter.on('event', async (n) => {
        await new Promise(r => setTimeout(r, 10));
        results.push(n);
        return;
      });

      await emitter.emitAsync('event', 42);

      expect(results).toEqual([42]);
    });

    it('should handle async errors gracefully', async () => {
      const emitter = createEmitter<{ event: void }>();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let called = false;

      emitter.on('event', async () => {
        throw new Error('async error');
      });
      emitter.on('event', async () => {
        called = true;
      });

      await emitter.emitAsync('event', undefined);

      expect(called).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should do nothing when emitting to no listeners', () => {
      const emitter = createEmitter<{ event: void }>();

      // Should not throw
      emitter.emit('event', undefined);
    });

    it('should handle off for non-existent handler', () => {
      const emitter = createEmitter<{ event: void }>();
      const handler = () => {};

      // Should not throw
      emitter.off('event', handler);
    });
  });

  describe('createEventBus', () => {
    it('should create an event bus', () => {
      const bus = createEventBus<{ test: string }>();

      expect(bus).toBeDefined();
      expect(typeof bus.on).toBe('function');
      expect(typeof bus.createScope).toBe('function');
    });

    it('should work like a regular emitter', () => {
      const bus = createEventBus<{ message: string }>();
      const received: string[] = [];

      bus.on('message', (s) => { received.push(s); });
      bus.emit('message', 'hello');

      expect(received).toEqual(['hello']);
    });

    it('should create scoped emitters that auto-cleanup', () => {
      const bus = createEventBus<{ event: number }>();
      const mainResults: number[] = [];
      const scopedResults: number[] = [];

      bus.on('event', (n) => { mainResults.push(n); });

      const scope = bus.createScope();
      scope.on('event', (n) => { scopedResults.push(n); });

      bus.emit('event', 1);

      scope.dispose();

      bus.emit('event', 2);

      expect(mainResults).toEqual([1, 2]);
      expect(scopedResults).toEqual([1]);
    });
  });

  describe('withEmitter mixin', () => {
    it('should add emitter capabilities to a class', () => {
      class Base {
        value = 42;
      }

      const EmitterClass = withEmitter<{ change: number }>()(Base);
      const instance = new EmitterClass();

      expect(instance.value).toBe(42);
      expect(typeof instance.on).toBe('function');
      expect(typeof instance.emit).toBe('function');
    });

    it('should emit and receive events on mixed class', () => {
      class Counter {
        count = 0;
      }

      const EmitterCounter = withEmitter<{ increment: number }>()(Counter);
      const counter = new EmitterCounter();
      const received: number[] = [];

      counter.on('increment', (n) => { received.push(n); });
      counter.emit('increment', 5);

      expect(received).toEqual([5]);
    });

    it('should support once on mixed class', () => {
      class Base {}

      const Emitting = withEmitter<{ ping: void }>()(Base);
      const instance = new Emitting();
      let count = 0;

      instance.once('ping', () => { count++; });
      instance.emit('ping', undefined);
      instance.emit('ping', undefined);

      expect(count).toBe(1);
    });

    it('should support off on mixed class', () => {
      class Base {}

      const Emitting = withEmitter<{ event: string }>()(Base);
      const instance = new Emitting();
      const received: string[] = [];
      const handler = (s: string) => { received.push(s); };

      instance.on('event', handler);
      instance.emit('event', 'first');
      instance.off('event', handler);
      instance.emit('event', 'second');

      expect(received).toEqual(['first']);
    });

    it('should support emitAsync on mixed class', async () => {
      class Base {}

      const Emitting = withEmitter<{ async: number }>()(Base);
      const instance = new Emitting();
      const results: number[] = [];

      instance.on('async', async (n) => {
        await new Promise(r => setTimeout(r, 5));
        results.push(n);
        return;
      });

      await instance.emitAsync('async', 99);

      expect(results).toEqual([99]);
    });
  });
});
