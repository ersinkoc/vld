# VLD Documentation

Welcome to VLD's documentation. VLD is a blazing-fast, type-safe validation library for TypeScript and JavaScript.

## 📚 Documentation

- [API Reference](./api.md) - Complete API documentation
- [TypeScript Guide](./typescript.md) - TypeScript integration and type inference
- [Migration Guide](./migration.md) - Migrating from other validation libraries

## 🚀 Quick Start

```typescript
import { v } from '@oxog/vld';

const schema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().positive().int()
});

const result = schema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error);
}
```

## 🎯 Why VLD?

- **Zero Dependencies** - No external dependencies
- **Blazing Fast** - 2-3x faster than alternatives
- **Type Safe** - Full TypeScript support with inference
- **Small Bundle** - Minimal footprint
- **100% Test Coverage** - Thoroughly tested