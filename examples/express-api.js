// VLD v3.0 — Express API validation middleware
// V2 method-memoization pattern is recommended for request hot paths
// (2-6x faster than Zod 4.5 in production benchmarks, 1.6-10x less memory).
//
// `vV2` is the drop-in factory that always returns V2 classes.

import express from 'express';
import { v, vV2, toZodError } from '@oxog/vld';

const app = express();
app.use(express.json());

// ----- V2 schemas (recommended for hot paths) -----
const createUserSchema = vV2.object({
  name: vV2.string().min(2).max(100),
  email: vV2.string().email(),
  password: vV2.string().min(8),
  age: vV2.optional(vV2.number().int().positive())
});

const updateUserSchema = vV2.object({
  name: vV2.optional(vV2.string().min(2).max(100)),
  email: vV2.optional(vV2.string().email()),
  age: vV2.optional(vV2.number().int().positive())
});

const querySchema = vV2.object({
  page: vV2.optional(vV2.number().int().positive()),
  limit: vV2.optional(vV2.number().int().positive().max(100)),
  sort: vV2.optional(vV2.enum('name', 'email', 'createdAt'))
});

// ----- V1 schemas (legacy, also works) -----
const createUserSchemaV1 = v.object({
  name: v.string().min(2).max(100),
  email: v.string().email(),
  password: v.string().min(8),
  age: v.optional(v.number().int().positive())
});

// ----- Validation middleware -----
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const input = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(input);
    if (!result.success) {
      // Convert to ZodError shape for downstream tooling that expects it
      const zodErr = toZodError(result.error);
      return res.status(400).json({
        error: 'Validation failed',
        details: zodErr.flatten(),
        zodIssues: zodErr.issues
      });
    }
    if (source === 'query') req.validatedQuery = result.data;
    else req.validated = result.data;
    next();
  };
}

// ----- Routes -----
app.post('/api/users', validate(createUserSchema), (req, res) => {
  const user = req.validated;
  console.log('Creating user:', user);
  res.status(201).json({
    success: true,
    data: { id: '123', ...user }
  });
});

app.patch('/api/users/:id', validate(updateUserSchema), (req, res) => {
  const updates = req.validated;
  const { id } = req.params;
  console.log(`Updating user ${id}:`, updates);
  res.json({ success: true, data: { id, ...updates } });
});

app.get('/api/users', validate(querySchema, 'query'), (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt' } = req.validatedQuery;
  console.log(`Fetching users: page=${page}, limit=${limit}, sort=${sort}`);
  res.json({
    success: true,
    data: [],
    pagination: { page, limit, total: 0 }
  });
});

// ----- Error handling -----
app.use((err, req, res, next) => {
  if (err instanceof Error) {
    res.status(400).json({ error: 'Validation error', message: err.message });
  } else {
    next(err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VLD v3.0 Express server running on port ${PORT}`);
  console.log('   vV2 schemas active: 2-6x faster than Zod 4.5 on the hot path.');
});

export default app;
