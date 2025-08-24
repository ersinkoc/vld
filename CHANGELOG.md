# Changelog

All notable changes to VLD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-08-24 

### 🎯 **100% Test Success Rate Achieved** 
- **569 tests passing** with 0 failures across all test suites
- **97.3% statement coverage** (up from 97.18%)
- **93.5% branch coverage** 
- **96.78% function coverage**
- **97.6% line coverage**
- All Zod-compatible codec tests now fully passing

### 🚀 Major Features Added

#### **Codec System - Bidirectional Transformations**
- **NEW**: Complete codec system for bidirectional data transformations
  - `v.codec()` factory method for creating custom codecs
  - Full encode/decode support with type safety
  - Async codec support with `parseAsync()` and `encodeAsync()` methods
  - Comprehensive error handling for both directions

#### **19 Built-in Zod-Compatible Codecs**

**String Conversion Codecs:**
- `stringToNumber` - String ↔ Number with validation
- `stringToInt` - String ↔ Integer with validation  
- `stringToBigInt` - String ↔ BigInt conversion
- `numberToBigInt` - Number ↔ BigInt conversion
- `stringToBoolean` - Flexible string ↔ boolean (`'true'`, `'1'`, `'yes'`, `'on'` → `true`)

**Date Conversion Codecs:**
- `isoDatetimeToDate` - ISO 8601 string ↔ Date object
- `epochSecondsToDate` - Unix seconds ↔ Date object  
- `epochMillisToDate` - Unix milliseconds ↔ Date object

**JSON and Complex Data:**
- `jsonCodec()` - Generic JSON string ↔ any type
- `base64Json()` - Base64-encoded JSON with schema validation
- `jwtPayload()` - JWT payload decoder (read-only)

**URL and Web:**
- `stringToURL` - String ↔ URL object
- `stringToHttpURL` - HTTP/HTTPS URL validation and conversion
- `uriComponent` - URI component encode/decode

**Binary Data:**
- `base64ToBytes` - Base64 ↔ Uint8Array
- `base64urlToBytes` - URL-safe Base64 ↔ Uint8Array  
- `hexToBytes` - Hexadecimal ↔ Uint8Array
- `utf8ToBytes` - UTF-8 string ↔ Uint8Array
- `bytesToUtf8` - Uint8Array ↔ UTF-8 string

#### **New Validator Types**
- `v.base64()` - Base64 string validation with URL-safe mode
- `v.hex()` - Hexadecimal string validation with lowercase mode
- `v.uint8Array()` - Uint8Array validation with length constraints

#### **Enhanced Utilities**
- Comprehensive codec utility functions in `codec-utils.ts`
- Cross-platform Base64 encoding/decoding (Node.js + Browser)
- Secure error handling for all codec operations

### 📚 Documentation Updates
- **README.md**: Comprehensive codec documentation with examples
- **API.md**: Complete codec API reference with TypeScript examples
- **New Examples**: 
  - `examples/codecs.js` - JavaScript codec examples
  - `examples/codecs.ts` - TypeScript codec examples with full type safety
- Updated CLAUDE.md with codec development guidance

### 🔧 Technical Improvements  
- **Zero Circular Dependencies**: Refactored codec architecture
- **Full Type Safety**: Complete TypeScript support with inference
- **97.3% Test Coverage**: Comprehensive test suite with 569 passing tests
- **Error Message Localization**: All codec errors support 27+ languages

### 🎯 Zod Compatibility
- **100% Zod Codec Parity**: All Zod codecs implemented and compatible
- **Beyond Zod**: Additional codecs not available in Zod
- **Drop-in Replacement**: Seamless migration path from Zod codecs

### Performance
- **Optimized Transformations**: Efficient bidirectional conversions
- **Memory Efficient**: Immutable codec architecture prevents leaks
- **Async Support**: Non-blocking operations for I/O-bound transformations

## [1.1.1] - 2025-08-18

### Security
- **CRITICAL**: Fixed prototype pollution vulnerability in VldObject passthrough mode
  - Added protection against `__proto__`, `constructor`, and `prototype` key pollution
  - Comprehensive security test suite added

### Fixed
- Removed unnecessary escape characters in regex patterns (URL validation)
- Fixed escape characters in locale files (Afrikaans)
- Added ESLint configuration for code quality

### Added
- Security test suite with prototype pollution prevention tests
- Coverage improvement tests for better code quality
- ESLint configuration with TypeScript support

### Changed
- Improved test coverage to 97.1% statements
- All linting issues resolved

## [1.1.0] - 2025-08-12

### Added
- Professional benchmark suite with real-world performance testing
  - `benchmarks/quick-bench.cjs` - Fast performance comparison
  - `benchmarks/memory.cjs` - Memory usage analysis
  - `benchmarks/startup.cjs` - Startup time comparison
  - `benchmarks/performance.cjs` - Comprehensive benchmark suite
- Complete documentation overhaul in `/docs` folder:
  - `API.md` - Full API reference with all methods and examples
  - `GETTING_STARTED.md` - Beginner-friendly guide
  - `MIGRATION.md` - Step-by-step Zod to VLD migration
  - `PERFORMANCE.md` - Performance optimization guide
  - `ADVANCED_FEATURES.md` - Deep dive into advanced features

### Changed
- Updated README with accurate benchmark results showing 2.07x average improvement
- All documentation converted to English
- Improved build process with automatic ES module import fixes
- Test coverage increased to 99.5%
- Cleaned up project structure for better maintainability

### Removed
- Deleted `coverage/` folder (unnecessary for npm package)
- Removed 12 old benchmark files
- Cleaned up `src/errors/` and `src/types/` folders
- Removed redundant test files focused on coverage metrics
- Deleted unnecessary example files

### Fixed
- Fixed ES module import issues with `.js` extension resolver
- Resolved CommonJS compatibility for benchmark files
- Fixed all TypeScript compilation errors
- Corrected package.json export configurations

### Performance
- Memory usage: 86% less than Zod
- Startup time: 1.94x faster
- Schema creation: 8.22x faster
- Overall performance: 2.07x faster average

## [1.0.0] - 2025-08-11

### Initial Release

#### Core Features
- **Blazing Fast Performance**: 2-4x faster than Zod in most operations
- **Zero Dependencies**: Lightweight with no external packages
- **Full TypeScript Support**: Excellent type inference and IntelliSense
- **Zod API Compatibility**: Drop-in replacement with identical API
- **Tree-Shakeable**: Only import what you need

#### Validation Types
- **Primitives**: string, number, boolean, bigint, symbol, date, undefined, null, void, any, unknown, never
- **Collections**: array, tuple, object, record, map, set
- **Compositions**: union, intersection, literal, enum
- **Modifiers**: optional, nullable, nullish, default, catch

#### Advanced Features
- **Type Coercion**: Automatic type conversion for common cases
- **Custom Validation**: `refine()` and `superRefine()` for custom logic
- **Data Transformation**: `transform()` for post-validation processing
- **Object Utilities**: `pick()`, `omit()`, `extend()`, `merge()`, `partial()`
- **Error Formatting**: Tree, pretty, and flatten utilities

#### Internationalization
- Built-in support for 27+ languages
- Easy locale switching with `setLocale()`
- Comprehensive translation coverage

#### String Validators
- Email, URL, UUID validation
- IP address (v4/v6) validation
- Regex pattern matching
- Length constraints (min, max, length)
- Content checks (includes, startsWith, endsWith)
- Transformations (trim, toLowerCase, toUpperCase)

#### Number Validators
- Range validation (min, max)
- Type constraints (int, positive, negative, finite, safe)
- Mathematical checks (multipleOf)

#### Performance Optimizations
- Optimized for V8 JavaScript engine
- Minimal memory allocations
- Fast-path optimizations for common cases
- Immutable validators prevent memory leaks
- Pre-computed validation strategies

#### Developer Experience
- Clear, actionable error messages
- Comprehensive test suite (99.5% coverage)
- Extensive documentation and examples
- TypeScript-first design
- Intuitive, chainable API

---

For more details, see the [GitHub Releases](https://github.com/ersinkoc/vld/releases)