# Changelog

All notable changes to VLD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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