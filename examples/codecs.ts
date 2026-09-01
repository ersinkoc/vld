/**
 * VLD v3.0 — Codecs TypeScript Examples
 *
 * Demonstrates VLD's codec system with full TypeScript type safety and
 * the V2 method-memoization pattern (2-6x faster than V1/Zod 4.5 in
 * production benchmarks). Codecs provide bidirectional transformations
 * with complete type inference.
 */

import {
  v,
  vV2,
  // String conversion codecs
  stringToNumber,
  stringToInt,
  stringToBigInt,
  numberToBigInt,
  stringToBoolean,
  // Date conversion codecs
  isoDatetimeToDate,
  epochSecondsToDate,
  epochMillisToDate,
  // JSON and complex data
  jsonCodec,
  base64Json,
  jwtPayload,
  // URL and web codecs
  stringToURL,
  stringToHttpURL,
  uriComponent,
  // Binary data codecs
  base64ToBytes,
  base64urlToBytes,
  hexToBytes,
  utf8ToBytes,
  bytesToUtf8,
  // Type inference
  type Infer
} from '@oxog/vld';

console.log('VLD v3.0 Codecs TypeScript Examples\n');
console.log('V2 method-memoization + bidirectional codecs + full type inference\n');

// ===== TYPE-SAFE SCHEMA DEFINITIONS (V2 children) =====
console.log('Type-Safe Schema Definitions (V2 children)');
console.log('================================');

// V2 user schema — string/number children use the V2 method-memoization path
const userSchema = vV2.object({
  id: vV2.string().uuid(),
  name: vV2.string().min(2).max(50),
  email: vV2.string().email(),
  age: vV2.number().min(13).max(120),
  isActive: vV2.boolean(),
  metadata: vV2.record(vV2.any()).optional(),
  tags: vV2.array(vV2.string()).default([] as string[])
});

type User = Infer<typeof userSchema>;

const exampleUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  tags: ['developer', 'typescript']
};

console.log('   V2 user schema defined with TypeScript types');
console.log('   Example user:', exampleUser);

// ===== TYPED JSON CODECS =====
console.log('\nTyped JSON Codecs');
console.log('====================');

const typedUserJsonCodec = jsonCodec(userSchema);

try {
  const userJsonString = JSON.stringify(exampleUser);
  console.log('   JSON string:', userJsonString);

  const parsedUser = typedUserJsonCodec.parse(userJsonString);
  console.log('   Parsed user (fully typed):', parsedUser.name, parsedUser.email);
} catch (error) {
  console.error('   JSON codec error:', (error as Error).message);
}

// ===== CUSTOM TYPED CODECS =====
console.log('\nCustom Typed Codecs (V2 children)');
console.log('=======================');

interface AppConfig {
  port: number;
  debug: boolean;
  environment: 'development' | 'staging' | 'production';
  features: {
    auth: boolean;
    analytics: boolean;
    caching: boolean;
  };
  databases: {
    primary: string;
    redis?: string;
  };
}

const configSchema = vV2.object({
  port: vV2.number().min(1000).max(65535),
  debug: vV2.boolean(),
  environment: vV2.union(
    vV2.literal('development'),
    vV2.literal('staging'),
    vV2.literal('production')
  ),
  features: vV2.object({
    auth: vV2.boolean(),
    analytics: vV2.boolean(),
    caching: vV2.boolean()
  }),
  databases: vV2.object({
    primary: vV2.string().url(),
    redis: vV2.string().url().optional()
  })
});

type InferredConfig = Infer<typeof configSchema>;
const _typeCheck: AppConfig = {} as InferredConfig;

const envToConfigCodec = v.codec(
  vV2.string(),
  configSchema,
  {
    decode: (envString: string): AppConfig => {
      const lines = envString.split('\n').filter(line => line.trim());
      const config: any = { features: {}, databases: {} };

      lines.forEach(line => {
        const [key, value] = line.split('=').map(s => s.trim());

        switch (key) {
          case 'PORT': config.port = parseInt(value, 10); break;
          case 'DEBUG': config.debug = value.toLowerCase() === 'true'; break;
          case 'ENVIRONMENT': config.environment = value as AppConfig['environment']; break;
          case 'FEATURE_AUTH': config.features.auth = value.toLowerCase() === 'true'; break;
          case 'FEATURE_ANALYTICS': config.features.analytics = value.toLowerCase() === 'true'; break;
          case 'FEATURE_CACHING': config.features.caching = value.toLowerCase() === 'true'; break;
          case 'DATABASE_PRIMARY': config.databases.primary = value; break;
          case 'DATABASE_REDIS': config.databases.redis = value; break;
        }
      });

      return config;
    },

    encode: (config: AppConfig): string => {
      const lines = [
        `PORT=${config.port}`,
        `DEBUG=${config.debug}`,
        `ENVIRONMENT=${config.environment}`,
        `FEATURE_AUTH=${config.features.auth}`,
        `FEATURE_ANALYTICS=${config.features.analytics}`,
        `FEATURE_CACHING=${config.features.caching}`,
        `DATABASE_PRIMARY=${config.databases.primary}`
      ];

      if (config.databases.redis) {
        lines.push(`DATABASE_REDIS=${config.databases.redis}`);
      }

      return lines.join('\n');
    }
  }
);

const envConfig = `PORT=3000
DEBUG=true
ENVIRONMENT=development
FEATURE_AUTH=true
FEATURE_ANALYTICS=false
FEATURE_CACHING=true
DATABASE_PRIMARY=postgresql://localhost:5432/myapp
DATABASE_REDIS=redis://localhost:6379`;

try {
  const parsedConfig = envToConfigCodec.parse(envConfig);
  console.log('   Parsed config (fully typed):', {
    port: parsedConfig.port,
    environment: parsedConfig.environment,
    features: parsedConfig.features
  });

  if (parsedConfig.debug) {
    console.log('   Debug mode enabled');
  }

  if (parsedConfig.features.auth) {
    console.log('   Authentication feature enabled');
  }

  const encodedConfig = envToConfigCodec.encode(parsedConfig);
  console.log('   Config encoded back to env format');
} catch (error) {
  console.error('   Config codec error:', (error as Error).message);
}

// ===== API RESPONSE PROCESSING =====
console.log('\nAPI Response Processing (V2 children)');
console.log('===========================');

interface ApiUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
  };
}

interface ApiResponse {
  data: ApiUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  metadata: {
    requestId: string;
    timestamp: number;
  };
}

const apiResponseSchema = vV2.object({
  data: vV2.array(vV2.object({
    id: vV2.string(),
    name: vV2.string(),
    email: vV2.string().email(),
    createdAt: vV2.string(),
    profile: vV2.object({
      avatar: vV2.string().url().optional(),
      bio: vV2.string().optional(),
      location: vV2.string().optional()
    })
  })),
  pagination: vV2.object({
    page: vV2.number().min(1),
    limit: vV2.number().min(1).max(100),
    total: vV2.number().min(0),
    hasNext: vV2.boolean()
  }),
  metadata: vV2.object({
    requestId: vV2.string().uuid(),
    timestamp: vV2.number()
  })
});

type InferredApiResponse = Infer<typeof apiResponseSchema>;
const _apiTypeCheck: ApiResponse = {} as InferredApiResponse;

const apiResponseCodec = v.codec(
  vV2.string(),
  apiResponseSchema,
  {
    decode: (base64Response: string): ApiResponse => {
      const jsonBytes = base64ToBytes.parse(base64Response);
      const jsonString = bytesToUtf8.parse(jsonBytes);
      return JSON.parse(jsonString);
    },
    encode: (response: ApiResponse): string => {
      const jsonString = JSON.stringify(response);
      const jsonBytes = utf8ToBytes.parse(jsonString);
      return base64ToBytes.encode(jsonBytes);
    }
  }
);

const sampleApiResponse: ApiResponse = {
  data: [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      createdAt: '2023-12-25T10:30:00.000Z',
      profile: {
        avatar: 'https://example.com/avatars/alice.jpg',
        bio: 'Full-stack developer passionate about TypeScript',
        location: 'San Francisco, CA'
      }
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      createdAt: '2023-12-20T15:45:00.000Z',
      profile: { bio: 'Backend engineer specializing in Node.js' }
    }
  ],
  pagination: { page: 1, limit: 10, total: 25, hasNext: true },
  metadata: {
    requestId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: Date.now()
  }
};

try {
  const encodedResponse = apiResponseCodec.encode(sampleApiResponse);
  console.log('   API response encoded to base64');

  const decodedResponse = apiResponseCodec.parse(encodedResponse);
  console.log('   API response decoded with full type safety');
  console.log(`   Found ${decodedResponse.data.length} users`);
  console.log(`   Page ${decodedResponse.pagination.page}/${Math.ceil(decodedResponse.pagination.total / decodedResponse.pagination.limit)}`);

  decodedResponse.data.forEach(user => {
    console.log(`   - ${user.name} (${user.email})`);
    if (user.profile.location) {
      console.log(`     ${user.profile.location}`);
    }
  });
} catch (error) {
  console.error('   API response processing error:', (error as Error).message);
}

// ===== JWT PAYLOAD PROCESSING =====
console.log('\nJWT Payload Processing');
console.log('=========================');

interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
  iat: number;
  exp: number;
}

const jwtPayloadSchema = vV2.object({
  sub: vV2.string(),
  name: vV2.string(),
  email: vV2.string().email(),
  role: vV2.union(
    vV2.literal('user'),
    vV2.literal('admin'),
    vV2.literal('moderator')
  ),
  permissions: vV2.array(vV2.string()),
  iat: vV2.number(),
  exp: vV2.number()
});

const typedJwtDecoder = jwtPayload(jwtPayloadSchema);
console.log('   JWT decoder created with full type safety');
console.log('   Payload is fully typed as JWTPayload');

// ===== ASYNC CODECS =====
console.log('\nAsync Codecs');
console.log('===============');

const asyncDataProcessor = v.codec(
  vV2.string(),
  vV2.object({
    processed: vV2.string(),
    timestamp: vV2.number(),
    metadata: vV2.object({
      processingTime: vV2.number(),
      version: vV2.string()
    })
  }),
  {
    decode: async (input: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        processed: input.toUpperCase(),
        timestamp: Date.now(),
        metadata: { processingTime: 100, version: '1.0.0' }
      };
    },
    encode: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return `${data.processed}_${data.timestamp}`;
    }
  }
);

(async () => {
  try {
    console.log('   Processing data asynchronously...');
    const result = await asyncDataProcessor.parseAsync('hello world');
    console.log('   Async decode result:', result);

    const encoded = await asyncDataProcessor.encodeAsync(result);
    console.log('   Async encode result:', encoded);
  } catch (error) {
    console.error('   Async codec error:', (error as Error).message);
  }
})();

console.log('\nTypeScript codec examples completed!');
console.log('\nTypeScript Benefits (VLD v3.0):');
console.log('   • Complete type inference for all operations');
console.log('   • V2 inner schemas (vV2.*) — 2-6x faster than V1/Zod 4.5');
console.log('   • Compile-time type checking prevents runtime errors');
console.log('   • Full IDE autocomplete and refactoring support');
console.log('   • Interface compatibility verification');
console.log('   • Zero runtime type assertion overhead');
