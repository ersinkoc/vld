# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Compilation
```bash
npm run build              # TypeScript compilation + fix ESM imports
npm run test:types         # Type check without emitting files
```

### Testing
```bash
npm test                   # Run Jest tests with coverage (must maintain 80% threshold)
npm run test -- --watch    # Run tests in watch mode
npm run test -- path/to/test.ts  # Run specific test file
```

### Code Quality
```bash
npm run lint               # ESLint check for TypeScript files
npm run format             # Prettier formatting
```

### Performance Benchmarking
```bash
npm run benchmark          # Quick performance comparison
npm run benchmark:full     # Full performance suite
npm run benchmark:memory   # Memory usage analysis
npm run benchmark:startup  # Startup time comparison
npm run benchmark:all      # Run all benchmarks
```

### Publishing
```bash
npm run prepublishOnly     # Builds and tests before publishing
```

## Architecture Overview

### Core Design Principles
- **Immutable Validators**: All validators are immutable to prevent memory leaks and race conditions
- **Zero Dependencies**: No external runtime dependencies for maximum performance
- **TypeScript-First**: Full type inference with strict mode enabled
- **Modular Structure**: Each validator type in its own module for tree-shaking

### Module Structure
```
src/
├── validators/        # Core validator implementations (base, string, number, etc.)
├── coercion/         # Type coercion validators (convert types before validation)
├── locales/          # 27+ language translations for error messages
├── utils/            # Utilities (secure deepMerge implementation)
├── errors.ts         # Error classes and formatting utilities
└── index.ts          # Main API export with factory methods
```

### Key Architecture Patterns

#### 1. Validator Inheritance Chain
All validators extend `VldBase<TInput, TOutput>` which provides:
- `parse()`: Validates and returns value or throws
- `safeParse()`: Returns `{ success, data }` or `{ success, error }`
- Method chaining for composability (refine, transform, default, catch)

#### 2. Factory Pattern
Main API uses factory methods (`v.string()`, `v.number()`) that return new validator instances to ensure immutability.

#### 3. Error Formatting System
Three error formats for different use cases:
- `treeifyError()`: Nested structure for complex UIs
- `prettifyError()`: Human-readable console output
- `flattenError()`: Simple structure for form validation

#### 4. Internationalization
- Global locale setting via `setLocale()`
- All error messages support 27+ languages
- Fallback to English for unsupported locales

### Testing Strategy
- Jest with ts-jest for ESM support
- 80% minimum coverage threshold enforced
- Test files in `tests/` directory mirror source structure
- Focus on edge cases, type coercion, and error messages

### Build Process
1. TypeScript compilation to ES2020 modules
2. Post-build script (`scripts/fix-imports.js`) adds `.js` extensions for ESM compatibility
3. Both CommonJS and ESM exports supported via package.json exports field

### Performance Considerations
- Optimized for V8 engine with inline type checks
- Pre-computed keys with Set for O(1) lookups in object validation
- Simplified regex patterns for email/URL validation
- SafeParse optimized to avoid try-catch overhead when possible

## Codec System

### Architecture Overview
VLD includes a comprehensive codec system for bidirectional data transformations:

#### Key Components
- **VldCodec**: Base codec validator class supporting encode/decode operations
- **Built-in Codecs**: 19 ready-to-use Zod-compatible codecs
- **Codec Utils**: Cross-platform utility functions for common transformations
- **Type Safety**: Full TypeScript support with bidirectional type inference

#### Codec Categories
1. **String Conversions**: `stringToNumber`, `stringToInt`, `stringToBigInt`, `stringToBoolean`
2. **Date Conversions**: `isoDatetimeToDate`, `epochSecondsToDate`, `epochMillisToDate` 
3. **JSON/Complex**: `jsonCodec`, `base64Json`, `jwtPayload`
4. **URLs**: `stringToURL`, `stringToHttpURL`, `uriComponent`
5. **Binary Data**: `base64ToBytes`, `hexToBytes`, `utf8ToBytes`, etc.

#### Implementation Notes
- **Circular Dependency Avoidance**: Codecs use direct validator imports to prevent circular references
- **Error Handling**: Comprehensive error messages in all 27+ supported languages
- **Async Support**: Both sync and async operations with proper error propagation
- **Memory Safety**: Immutable codec architecture prevents memory leaks

#### Testing Strategy
- All codecs have comprehensive test coverage including edge cases
- Round-trip testing ensures encode/decode consistency
- Async codec testing verifies proper Promise handling
- Error path testing covers all failure modes

#### Development Guidelines
When adding new codecs:
1. Use `VldCodec.create()` with proper input/output validators
2. Implement both `decode` and `encode` functions
3. Add comprehensive tests including round-trip verification
4. Update codec exports in both `src/codecs/index.ts` and `src/index.ts`
5. Add error messages to all locale files
6. Document usage in README.md and API.md