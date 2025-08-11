import express from 'express';
import { v } from '@oxog/vld';

const app = express();
app.use(express.json());

// Define validation schemas
const createUserSchema = v.object({
  name: v.string().min(2).max(100),
  email: v.string().email(),
  password: v.string().min(8),
  age: v.optional(v.number().int().positive())
});

const updateUserSchema = v.object({
  name: v.optional(v.string().min(2).max(100)),
  email: v.optional(v.string().email()),
  age: v.optional(v.number().int().positive())
});

const querySchema = v.object({
  page: v.optional(v.number().int().positive()),
  limit: v.optional(v.number().int().positive().max(100)),
  sort: v.optional(v.enum('name', 'email', 'createdAt'))
});

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.message
      });
    }
    req.validated = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.error.message
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

// Routes
app.post('/api/users', validate(createUserSchema), (req, res) => {
  const user = req.validated;
  // Create user in database
  console.log('Creating user:', user);
  res.status(201).json({
    success: true,
    data: { id: '123', ...user }
  });
});

app.patch('/api/users/:id', validate(updateUserSchema), (req, res) => {
  const updates = req.validated;
  const { id } = req.params;
  // Update user in database
  console.log(`Updating user ${id}:`, updates);
  res.json({
    success: true,
    data: { id, ...updates }
  });
});

app.get('/api/users', validateQuery(querySchema), (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt' } = req.validatedQuery;
  // Fetch users from database
  console.log(`Fetching users: page=${page}, limit=${limit}, sort=${sort}`);
  res.json({
    success: true,
    data: [],
    pagination: { page, limit, total: 0 }
  });
});

// Error handling for validation errors
app.use((err, req, res, next) => {
  if (err instanceof Error) {
    res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
  } else {
    next(err);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;