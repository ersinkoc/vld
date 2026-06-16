import { v, VldBase, setLocale, getLocale, getMessages, VldError, treeifyError, prettifyError, flattenError } from '../src/index';

describe('index.ts - Main API Coverage', () => {
  describe('Main v API object', () => {
    it('should export all primitive validators', () => {
      expect(v.string).toBeDefined();
      expect(v.number).toBeDefined();
      expect(v.boolean).toBeDefined();
      expect(v.date).toBeDefined();
      
      // Test that they create validators
      const str = v.string();
      const num = v.number();
      const bool = v.boolean();
      const date = v.date();
      
      expect(str.parse('hello')).toBe('hello');
      expect(num.parse(123)).toBe(123);
      expect(bool.parse(true)).toBe(true);
      expect(date.parse(new Date('2024-01-01'))).toEqual(new Date('2024-01-01'));
    });
    
    it('should export complex validators', () => {
      expect(v.array).toBeDefined();
      expect(v.object).toBeDefined();
      expect(v.union).toBeDefined();
      expect(v.literal).toBeDefined();
      
      // Test array
      const arr = v.array(v.string());
      expect(arr.parse(['a', 'b'])).toEqual(['a', 'b']);
      
      // Test object
      const obj = v.object({
        name: v.string(),
        age: v.number()
      });
      expect(obj.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
      
      // Test union
      const union = v.union(v.string(), v.number());
      expect(union.parse('hello')).toBe('hello');
      expect(union.parse(123)).toBe(123);
      
      // Test literal
      const lit = v.literal('hello');
      expect(lit.parse('hello')).toBe('hello');
    });
    
    it('should export coerce API', () => {
      expect(v.coerce).toBeDefined();
      expect(v.coerce.string).toBeDefined();
      expect(v.coerce.number).toBeDefined();
      expect(v.coerce.boolean).toBeDefined();
      expect(v.coerce.date).toBeDefined();
      expect(v.coerce.bigint).toBeDefined();
      
      // Test coerce validators
      const str = v.coerce.string();
      const num = v.coerce.number();
      const bool = v.coerce.boolean();
      const date = v.coerce.date();
      const bigint = v.coerce.bigint();
      
      expect(str.parse(123)).toBe('123');
      expect(num.parse('123')).toBe(123);
      expect(bool.parse('true')).toBe(true);
      expect(date.parse('2024-01-01')).toEqual(new Date('2024-01-01'));
      expect(bigint.parse('123')).toBe(123n);
    });
  });
  
  describe('Re-exported base classes', () => {
    it('should export VldBase', () => {
      expect(VldBase).toBeDefined();
      
      // VldBase is abstract, but we can check it exists
      expect(typeof VldBase).toBe('function');
    });
  });
  
  describe('Re-exported locale functionality', () => {
    it('should export locale functions', () => {
      expect(setLocale).toBeDefined();
      expect(getLocale).toBeDefined();
      expect(getMessages).toBeDefined();
      
      // Test locale functions
      const originalLocale = getLocale();
      setLocale('es');
      expect(getLocale()).toBe('es');
      
      const messages = getMessages();
      expect(messages).toBeDefined();
      expect(messages.invalidString).toBeDefined();
      
      // Restore locale
      setLocale(originalLocale);
    });
  });
  
  describe('Re-exported error formatting utilities', () => {
    it('should export error utilities', () => {
      expect(VldError).toBeDefined();
      expect(treeifyError).toBeDefined();
      expect(prettifyError).toBeDefined();
      expect(flattenError).toBeDefined();
      
      // Test VldError
      const error = new VldError([
        { code: 'invalid_string', message: 'Invalid string', path: ['field'] }
      ]);
      expect(error.issues).toHaveLength(1);
      
      // Test treeifyError
      const tree = treeifyError(error);
      expect(tree).toBeDefined();
      
      // Test prettifyError
      const pretty = prettifyError(error);
      expect(pretty).toContain('field');
      
      // Test flattenError
      const flat = flattenError(error);
      expect(flat.fieldErrors).toBeDefined();
    });
  });
  
  describe('Default export', () => {
    it('should have default export for backward compatibility', async () => {
      const module = await import('../src/index');
      expect(module.default).toBe(v);
    });
  });

  describe('Root-level compatibility exports', () => {
    it('should execute root-level factory and utility aliases', async () => {
      const api = await import('../src/index');

      expect(api.maxLength(3).parse('ok')).toBe('ok');
      expect(api.toLowerCase().parse('OK')).toBe('ok');
      expect(api.lowercase().parse('OK')).toBe('ok');
      expect(api.toUpperCase().parse('ok')).toBe('OK');
      expect(api.uppercase().parse('ok')).toBe('OK');
      expect(api.gte(2).parse(2)).toBe(2);
      expect(api.lt(2).parse(1)).toBe(1);
      expect(api.lte(2).parse(2)).toBe(2);
      expect(api.negative().parse(-1)).toBe(-1);
      expect(api.nonnegative().parse(0)).toBe(0);
      expect(api.nonpositive().parse(0)).toBe(0);
      expect(api.minSize(2).parse('ok')).toBe('ok');
      expect(api.maxSize(2).parse('ok')).toBe('ok');
      expect(api.size(2).parse('ok')).toBe('ok');

      const ok = api.Ok(1);
      const err = api.Err('bad');
      expect(api.isResult(ok)).toBe(true);
      expect(api.isErr(err)).toBe(true);
      expect(api.unwrap(ok)).toBe(1);
      expect(api.unwrapOr(err, 2)).toBe(2);
      expect(api.mapErr(err, value => value.toUpperCase())).toEqual(api.Err('BAD'));
      expect(api.flatMap(ok, value => api.Ok(value + 1))).toEqual(api.Ok(2));
      expect(api.match(ok, {
        ok: value => value + 1,
        err: () => 0
      })).toBe(2);
      expect(api.tryCatch(() => 3)).toEqual(api.Ok(3));
      await expect(api.tryCatchAsync(async () => 4)).resolves.toEqual(api.Ok(4));
      expect(api.all([api.Ok(1), api.Ok(2)])).toEqual(api.Ok([1, 2]));
      const nullableError = new Error('missing');
      expect(api.fromNullable(null, nullableError)).toEqual(api.Err(nullableError));
      expect(api.failure('failed')).toEqual(api.Err('failed'));
      expect(api.ResultUtils.Ok('ok')).toEqual(api.Ok('ok'));
      expect(api.ResultUtils.failure('bad')).toEqual(api.Err('bad'));

      const emitter = api.createEmitter<{ ready: string }>();
      const events: string[] = [];
      emitter.on('ready', value => {
        events.push(value);
      });
      emitter.emit('ready', 'ok');
      expect(events).toEqual(['ok']);

      const bus = api.createEventBus<{ saved: number }>();
      const saved: number[] = [];
      bus.on('saved', value => {
        saved.push(value);
      });
      bus.emit('saved', 1);
      expect(saved).toEqual([1]);
      class BaseWithEvents {}
      const Eventful = api.withEmitter<{ done: boolean }>()(BaseWithEvents);
      const withEvents = new Eventful();
      const done: boolean[] = [];
      withEvents.on('done', value => {
        done.push(value);
      });
      withEvents.emit('done', true);
      expect(done).toEqual([true]);

      const plugin = api.definePlugin()
        .name('root-index-test')
        .version('1.0.0')
        .build();
      const kernel = api.createVldKernel();
      expect(kernel.use(plugin).hasPlugin('root-index-test')).toBe(true);
      api.usePlugin(plugin);
      expect(api.getVldKernel().hasPlugin('root-index-test')).toBe(true);
      await api.resetVldKernel();
      expect(api.getVldKernel().hasPlugin('root-index-test')).toBe(false);

      const logger = api.createNoOpLogger();
      expect(logger.getLevel()).toBe('silent');
      const customLogger = api.createLogger({ name: 'root-test', level: 'silent' });
      expect(customLogger.getLevel()).toBe('silent');
      const initializedLogger = api.initLogger({ name: 'root-init-test', level: 'silent' });
      expect(api.getLogger()).toBe(initializedLogger);
      api.setLogLevel('error');
      expect(api.getLogger()?.getLevel()).toBe('error');
      api.enableDebug();
      expect(api.getLogger()?.getLevel()).toBe('debug');
      api.disableLogging();
      expect(api.getLogger()?.getLevel()).toBe('silent');

      expect(api.strip(api.red('text'))).toBe('text');
      expect(api.supportsColor()).toBe(false);
      expect(api.pigment.strip(api.pigment.red('text'))).toBe('text');
      expect(api.bold('text')).toContain('text');
      expect(api.dim('text')).toContain('text');
      expect(api.italic('text')).toContain('text');
      expect(api.underline('text')).toContain('text');
      expect(api.green('text')).toContain('text');
      expect(api.yellow('text')).toContain('text');
      expect(api.blue('text')).toContain('text');
      expect(api.magenta('text')).toContain('text');
      expect(api.cyan('text')).toContain('text');
      expect(api.white('text')).toContain('text');
      expect(api.gray('text')).toContain('text');
      expect(api.grey('text')).toContain('text');
      expect(api.createTheme({ info: api.red }).info('text')).toContain('text');
      expect(api.vldTheme.error('text')).toContain('text');

      let syncContextCalled = false;
      const syncTransform = api.transform((value: string, ctx) => {
        ctx?.addIssue({ message: 'ignored' });
        syncContextCalled = true;
        return value.trim();
      });
      expect(syncTransform.parse(' ok ')).toBe('ok');
      expect(syncContextCalled).toBe(true);

      let asyncContextCalled = false;
      const asyncTransform = api.transform(async (value: string, ctx) => {
        ctx?.addIssue({ message: 'ignored' });
        asyncContextCalled = true;
        return value.trim();
      });
      await expect(asyncTransform.parseAsync(' ok ')).resolves.toBe('ok');
      expect(asyncContextCalled).toBe(true);
    });
  });
});
