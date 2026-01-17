# @oxog/vld v2.0 - Ekosistem Entegrasyon Refactor Planı

**Tarih:** 17 Ocak 2026  
**Paket:** @oxog/vld  
**Mevcut Versiyon:** 1.4.0  
**Hedef Versiyon:** 2.0.0

---

## 1. Mevcut Durum Analizi

### 1.1 VLD Yapısı

```
src/
├── index.ts              # Ana export (10KB)
├── errors.ts             # Error handling (5KB)
├── validators/           # 40+ validator class
│   ├── base.ts          # VldBase abstract class (18KB)
│   ├── string.ts        # String validator (9KB)
│   ├── number.ts        # Number validator (7KB)
│   ├── object.ts        # Object validator (16KB)
│   └── ... (35+ dosya)
├── codecs/               # Bidirectional codec'ler
│   └── index.ts         # 19 built-in codec (9KB)
├── coercion/             # Type coercion validators
│   ├── string.ts        # (9KB)
│   ├── number.ts        # (5KB)
│   └── ... (5 dosya)
├── locales/              # 27+ dil desteği
│   ├── index.ts         # Locale management
│   └── ... (30 dosya)
└── utils/                # Utility fonksiyonlar
    ├── codec-utils.ts   # (8KB)
    ├── deep-merge.ts    # (3KB)
    ├── ip-validation.ts # (4KB)
    └── security.ts      # (2KB)
```

### 1.2 Mevcut Özellikler

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Zod API Uyumu | ✅ %100 | Tam API paritesi |
| Performans | ✅ 2.52x | Zod'dan hızlı |
| Test Coverage | ✅ %96.55 | 1142 test |
| i18n | ✅ 27+ dil | Built-in |
| Zero Dependency | ✅ | Hiç bağımlılık yok |
| TypeScript | ✅ | First-class support |
| Codec System | ✅ | 19 built-in codec |

### 1.3 Entegrasyon Noktaları

Mevcut yapıda @oxog ekosistemiyle entegre edilebilecek alanlar:

| Alan | Mevcut | Hedef | Entegrasyon |
|------|--------|-------|-------------|
| Error Handling | `VldError` extends `Error` | `Result<T, VldError>` | @oxog/types |
| Plugin System | Yok | Micro-kernel | @oxog/plugin |
| Events | Yok | Validation events | @oxog/emitter |
| CLI Tool | Yok | Schema generator | @oxog/cli |
| Logging | Yok | Debug tracing | @oxog/log |
| Console Output | Basic | Renkli output | @oxog/pigment |

---

## 2. Entegrasyon Stratejisi

### 2.1 Bağımlılık Hiyerarşisi

```
@oxog/vld v2.0
├── peerDependencies (opsiyonel)
│   ├── @oxog/types    # Result pattern, type utilities
│   ├── @oxog/plugin   # Plugin architecture
│   └── @oxog/emitter  # Event system
│
├── optionalDependencies (CLI için)
│   ├── @oxog/cli      # CLI framework
│   ├── @oxog/log      # Structured logging
│   └── @oxog/pigment  # Console styling
│
└── Zero-dependency mode (varsayılan)
    └── Tüm özellikler internal olarak çalışır
```

### 2.2 Conditional Imports Stratejisi

```typescript
// src/compat/result.ts
let ResultImpl: typeof import('@oxog/types').Result;

try {
  const types = await import('@oxog/types');
  ResultImpl = types.Result;
} catch {
  // Fallback: internal Result implementation
  ResultImpl = InternalResult;
}

export { ResultImpl as Result };
```

---

## 3. Detaylı Refactor Planı

### 3.1 Phase 1: @oxog/types Entegrasyonu

**Hedef:** Result pattern ve type utilities

#### 3.1.1 ParseResult → Result<T, VldError>

**Mevcut (base.ts:1-5):**
```typescript
export type ParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: Error };
```

**Hedef:**
```typescript
import { Result, Ok, Err } from '@oxog/types';

// ParseResult artık Result alias'ı olacak
export type ParseResult<T> = Result<T, VldError>;

// Factory fonksiyonları
export const success = <T>(data: T): ParseResult<T> => Ok(data);
export const failure = (error: VldError): ParseResult<never> => Err(error);
```

#### 3.1.2 VldError → OxogError Entegrasyonu

**Mevcut (errors.ts):**
```typescript
export class VldError extends Error {
  public readonly issues: VldIssue[];
  constructor(issues: VldIssue[]) { ... }
}
```

**Hedef:**
```typescript
import { OxogError, ErrorCode } from '@oxog/types';

export class VldError extends OxogError {
  public readonly issues: VldIssue[];
  
  constructor(issues: VldIssue[]) {
    super(
      issues[0]?.message || 'Validation failed',
      'VLD_VALIDATION_ERROR' as ErrorCode,
      { issues }
    );
  }
  
  // OxogError uyumlu methodlar
  toJSON(): object { ... }
  static fromJSON(json: object): VldError { ... }
}
```

#### 3.1.3 Type Guards

```typescript
// src/guards.ts
import { isOk, isErr, isResult } from '@oxog/types';

export { isOk, isErr, isResult };

// VLD-specific guards
export function isVldError(value: unknown): value is VldError {
  return value instanceof VldError;
}

export function isParseSuccess<T>(result: ParseResult<T>): result is Ok<T> {
  return isOk(result);
}
```

### 3.2 Phase 2: @oxog/plugin Entegrasyonu

**Hedef:** Validator plugin sistemi

#### 3.2.1 Validator Plugin Interface

```typescript
// src/plugins/types.ts
import { Plugin } from '@oxog/types';

export interface ValidatorPlugin extends Plugin<VldContext> {
  // Plugin meta
  readonly name: string;
  readonly version: string;
  
  // Validator extensions
  validators?: Record<string, ValidatorFactory>;
  transforms?: Record<string, TransformFactory>;
  codecs?: Record<string, CodecFactory>;
  
  // Hooks
  onBeforeParse?: (value: unknown, schema: VldBase) => unknown;
  onAfterParse?: <T>(result: ParseResult<T>, schema: VldBase) => ParseResult<T>;
  onError?: (error: VldError, schema: VldBase) => void;
}

export interface VldContext {
  locale: Locale;
  strict: boolean;
  debug: boolean;
}
```

#### 3.2.2 VLD Kernel

```typescript
// src/kernel.ts
import { createKernel, KernelInstance } from '@oxog/plugin';

export interface VldKernel extends KernelInstance<VldContext, VldEvents> {
  // Custom validators
  registerValidator(name: string, factory: ValidatorFactory): this;
  getValidator(name: string): VldBase | undefined;
  
  // Custom transforms
  registerTransform(name: string, factory: TransformFactory): this;
  
  // Custom codecs
  registerCodec(name: string, factory: CodecFactory): this;
}

export function createVldKernel(options?: VldKernelOptions): VldKernel {
  const kernel = createKernel<VldContext, VldEvents>({
    context: {
      locale: options?.locale || 'en',
      strict: options?.strict || false,
      debug: options?.debug || false,
    },
    errorStrategy: 'isolate',
  });
  
  // Core plugins
  kernel.use(coreValidatorsPlugin);
  kernel.use(coercionPlugin);
  kernel.use(codecsPlugin);
  
  return kernel as VldKernel;
}
```

#### 3.2.3 Built-in Plugins

```typescript
// src/plugins/core-validators.ts
export const coreValidatorsPlugin: ValidatorPlugin = {
  name: 'vld-core-validators',
  version: '2.0.0',
  
  validators: {
    string: () => VldString.create(),
    number: () => VldNumber.create(),
    boolean: () => VldBoolean.create(),
    date: () => VldDate.create(),
    bigint: () => VldBigInt.create(),
    symbol: () => VldSymbol.create(),
    array: (item) => VldArray.create(item),
    object: (shape) => VldObject.create(shape),
    // ... tüm validator'lar
  },
  
  install(kernel) {
    kernel.on('vld:parse:start', ({ value, schema }) => {
      if (kernel.getContext().debug) {
        console.log(`[VLD] Parsing: ${schema.constructor.name}`);
      }
    });
  }
};
```

### 3.3 Phase 3: @oxog/emitter Entegrasyonu

**Hedef:** Validation event sistemi

#### 3.3.1 VLD Events

```typescript
// src/events.ts
import { EventMap } from '@oxog/emitter';

export interface VldEvents extends EventMap {
  // Parse lifecycle
  'vld:parse:start': { value: unknown; schema: VldBase };
  'vld:parse:success': { data: unknown; schema: VldBase; duration: number };
  'vld:parse:error': { error: VldError; schema: VldBase; duration: number };
  
  // Validation events
  'vld:validate:field': { key: string; value: unknown; valid: boolean };
  'vld:validate:transform': { before: unknown; after: unknown };
  
  // Plugin events
  'vld:plugin:registered': { name: string; version: string };
  'vld:plugin:error': { name: string; error: Error };
  
  // Locale events
  'vld:locale:changed': { from: Locale; to: Locale };
}
```

#### 3.3.2 Event-Enabled Base Class

```typescript
// src/validators/base.ts (updated)
import { Emitter, createEmitter } from '@oxog/emitter';

export abstract class VldBase<TInput, TOutput = TInput> {
  protected readonly emitter: Emitter<VldEvents>;
  
  constructor() {
    this.emitter = createEmitter<VldEvents>();
  }
  
  // Event subscription
  on<K extends keyof VldEvents>(
    event: K,
    handler: (payload: VldEvents[K]) => void
  ): () => void {
    return this.emitter.on(event, handler);
  }
  
  // Enhanced parse with events
  parse(value: unknown): TOutput {
    const start = performance.now();
    this.emitter.emit('vld:parse:start', { value, schema: this });
    
    try {
      const result = this._parse(value);
      const duration = performance.now() - start;
      this.emitter.emit('vld:parse:success', { data: result, schema: this, duration });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      const vldError = error instanceof VldError ? error : new VldError([...]);
      this.emitter.emit('vld:parse:error', { error: vldError, schema: this, duration });
      throw vldError;
    }
  }
  
  protected abstract _parse(value: unknown): TOutput;
}
```

### 3.4 Phase 4: @oxog/pigment Entegrasyonu (Opsiyonel)

**Hedef:** Renkli console output

#### 3.4.1 Enhanced prettifyError

```typescript
// src/errors.ts (updated)
let pigment: typeof import('@oxog/pigment') | null = null;

try {
  pigment = await import('@oxog/pigment');
} catch {
  pigment = null;
}

export function prettifyError(error: VldError, colored = true): string {
  const lines: string[] = [];
  const p = pigment;
  
  for (const issue of error.issues) {
    const symbol = colored && p ? p.red('✖') : '✖';
    const message = colored && p ? p.bold(issue.message) : issue.message;
    let line = `${symbol} ${message}`;
    
    if (issue.path.length > 0) {
      const pathStr = issue.path
        .map((segment, index) => {
          const str = typeof segment === 'string'
            ? (index === 0 ? segment : `.${segment}`)
            : `[${segment}]`;
          return colored && p ? p.cyan(str) : str;
        })
        .join('');
      
      const arrow = colored && p ? p.dim('→ at ') : '→ at ';
      line += `\n  ${arrow}${pathStr}`;
    }
    
    lines.push(line);
  }
  
  return lines.join('\n');
}
```

### 3.5 Phase 5: @oxog/log Entegrasyonu (Opsiyonel)

**Hedef:** Debug logging ve tracing

#### 3.5.1 VLD Logger

```typescript
// src/logger.ts
import { createLogger, Logger } from '@oxog/log';

let logger: Logger | null = null;

export function initLogger(options?: { level?: string; name?: string }) {
  try {
    logger = createLogger({
      name: options?.name || 'vld',
      level: options?.level || 'warn',
      format: 'pretty',
    });
  } catch {
    logger = null;
  }
}

export function getLogger(): Logger | null {
  return logger;
}

// Usage in validators
export abstract class VldBase<TInput, TOutput = TInput> {
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: object) {
    const log = getLogger();
    if (log) {
      log[level](message, data);
    }
  }
  
  parse(value: unknown): TOutput {
    this.log('debug', 'Parsing value', { type: typeof value, schema: this.constructor.name });
    // ...
  }
}
```

### 3.6 Phase 6: @oxog/cli Entegrasyonu (Opsiyonel)

**Hedef:** vld CLI tool

#### 3.6.1 CLI Commands

```typescript
// src/cli/index.ts
import { cli, Command } from '@oxog/cli';

const vldCli = cli('vld')
  .version('2.0.0')
  .description('VLD - Fast TypeScript Validation Library');

// Schema generator
vldCli.command('generate')
  .description('Generate VLD schema from TypeScript interface')
  .argument('<input>', 'Input TypeScript file')
  .option('-o, --output <file>', 'Output file')
  .action(async (input, options) => {
    // TypeScript interface'den VLD schema generate et
  });

// Schema validator
vldCli.command('validate')
  .description('Validate JSON data against a schema')
  .argument('<schema>', 'Schema file')
  .argument('<data>', 'JSON data file')
  .option('--strict', 'Enable strict mode')
  .action(async (schema, data, options) => {
    // JSON'ı schema'ya karşı validate et
  });

// Benchmark
vldCli.command('benchmark')
  .description('Run performance benchmarks')
  .option('--iterations <n>', 'Number of iterations', '10000')
  .action(async (options) => {
    // Benchmark çalıştır
  });

export { vldCli };
```

---

## 4. Dosya Değişiklikleri

### 4.1 Yeni Dosyalar

```
src/
├── compat/
│   ├── index.ts         # Conditional imports
│   ├── result.ts        # Result pattern compat
│   └── emitter.ts       # Emitter compat
├── plugins/
│   ├── index.ts         # Plugin exports
│   ├── types.ts         # Plugin type definitions
│   ├── core-validators.ts
│   ├── coercion.ts
│   └── codecs.ts
├── kernel.ts            # VLD Kernel
├── events.ts            # Event definitions
├── logger.ts            # Logger wrapper
└── cli/
    ├── index.ts         # CLI entry
    ├── generate.ts      # Schema generator
    ├── validate.ts      # Validator
    └── benchmark.ts     # Benchmarks
```

### 4.2 Değişen Dosyalar

| Dosya | Değişiklik | Öncelik |
|-------|------------|---------|
| `src/validators/base.ts` | Result pattern, events | Yüksek |
| `src/errors.ts` | OxogError extend, prettifyError | Yüksek |
| `src/index.ts` | Yeni export'lar | Yüksek |
| `src/locales/index.ts` | Event emit | Orta |
| `package.json` | peerDependencies | Yüksek |

### 4.3 package.json Değişiklikleri

```json
{
  "name": "@oxog/vld",
  "version": "2.0.0",
  "peerDependencies": {
    "@oxog/types": "^1.0.0",
    "@oxog/plugin": "^1.0.0",
    "@oxog/emitter": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@oxog/types": { "optional": true },
    "@oxog/plugin": { "optional": true },
    "@oxog/emitter": { "optional": true }
  },
  "optionalDependencies": {
    "@oxog/cli": "^1.0.0",
    "@oxog/log": "^1.0.0",
    "@oxog/pigment": "^1.0.0"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./cli": {
      "import": "./dist/cli/index.js",
      "types": "./dist/cli/index.d.ts"
    },
    "./plugins": {
      "import": "./dist/plugins/index.js",
      "types": "./dist/plugins/index.d.ts"
    }
  },
  "bin": {
    "vld": "./dist/cli/bin.js"
  }
}
```

---

## 5. Geriye Dönük Uyumluluk

### 5.1 Breaking Changes

| Değişiklik | Etki | Migrasyon |
|------------|------|-----------|
| `ParseResult` type | Düşük | Type inference aynı kalır |
| `VldError` extends `OxogError` | Düşük | Mevcut catch blokları çalışır |
| Event system | Yok | Opsiyonel, varsayılan kapalı |

### 5.2 Deprecation Plan

```typescript
// v2.0.0 - Deprecated ama çalışır
/** @deprecated Use `success(data)` instead */
export const createSuccess = <T>(data: T): ParseResult<T> => success(data);

// v3.0.0 - Kaldırılacak
```

### 5.3 Migrasyon Rehberi

```typescript
// v1.x
import { v } from '@oxog/vld';
const result = v.string().safeParse('hello');
if (result.success) {
  console.log(result.data);
}

// v2.x - Aynı API, ek özellikler
import { v, isOk } from '@oxog/vld';
const result = v.string().safeParse('hello');

// Eski yöntem hala çalışır
if (result.success) {
  console.log(result.data);
}

// Yeni yöntem - Result pattern
if (isOk(result)) {
  console.log(result.value);
}

// Yeni yöntem - Pattern matching
result.match({
  ok: (value) => console.log(value),
  err: (error) => console.error(error.message)
});
```

---

## 6. Test Planı

### 6.1 Yeni Testler

| Kategori | Test Dosyası | Açıklama |
|----------|--------------|----------|
| Result | `tests/result.test.ts` | Result pattern |
| Plugins | `tests/plugins/*.test.ts` | Plugin system |
| Events | `tests/events.test.ts` | Event emission |
| CLI | `tests/cli/*.test.ts` | CLI commands |
| Compat | `tests/compat.test.ts` | Backward compat |

### 6.2 Test Hedefleri

- **Coverage:** %98+ (mevcut %96.55)
- **Test sayısı:** 1500+ (mevcut 1142)
- **Performance regression:** <%5

---

## 7. Uygulama Takvimi

| Phase | Süre | Çıktı |
|-------|------|-------|
| Phase 1: @oxog/types | 2 gün | Result pattern, guards |
| Phase 2: @oxog/plugin | 3 gün | Plugin system, kernel |
| Phase 3: @oxog/emitter | 2 gün | Event system |
| Phase 4: @oxog/pigment | 1 gün | Colored output |
| Phase 5: @oxog/log | 1 gün | Debug logging |
| Phase 6: @oxog/cli | 3 gün | CLI tool |
| Testing & Docs | 2 gün | Full coverage |
| **Toplam** | **14 gün** | v2.0.0 release |

---

## 8. Sonraki Adımlar

1. **Onay:** Bu planı incele ve onayla
2. **Phase 1 Başlangıç:** @oxog/types entegrasyonu
3. **Iteratif Geliştirme:** Her phase sonrası test ve review
4. **Release:** v2.0.0-alpha, beta, RC, stable

---

## 9. Karar Noktaları

| Soru | Seçenekler | Önerim |
|------|------------|--------|
| Plugin system zorunlu mu? | Opsiyonel / Zorunlu | **Opsiyonel** |
| CLI ayrı paket mi? | Aynı / Ayrı | **Aynı** (subpath export) |
| Minimum Node.js | 18 / 20 | **18** (LTS) |
| ESM/CJS | ESM-only / Dual | **Dual** |

---

*Bu doküman @oxog/vld v2.0 refactor planını içermektedir.*
