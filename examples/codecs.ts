/**
 * VLD Codecs TypeScript Examples
 * 
 * This file demonstrates VLD's codec system with full TypeScript type safety.
 * Codecs provide bidirectional transformations with complete type inference.
 */

import { 
  v,
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
  type Infer,
  type CodecTransform
} from '@oxog/vld';

console.log('🚀 VLD Codecs TypeScript Examples\n');

// ===== TYPE-SAFE SCHEMA DEFINITIONS =====
console.log('🎯 Type-Safe Schema Definitions');
console.log('================================');

// Define a user schema with full TypeScript support
const userSchema = v.object({
  id: v.string().uuid(),
  name: v.string().min(2).max(50),
  email: v.string().email(),
  age: v.number().min(13).max(120),
  isActive: v.boolean(),
  metadata: v.record(v.any()).optional(),
  tags: v.array(v.string()).default([])
});

// TypeScript automatically infers the type
type User = Infer<typeof userSchema>;

// Example user that matches the schema
const exampleUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  tags: ['developer', 'typescript']
};

console.log('✅ User schema defined with TypeScript types');
console.log('✅ Example user:', exampleUser);

// ===== TYPED JSON CODECS =====
console.log('\n📋 Typed JSON Codecs');
console.log('====================');

// Create a typed JSON codec
const typedUserJsonCodec = jsonCodec(userSchema);

try {
  const userJsonString = JSON.stringify(exampleUser);
  console.log('📤 JSON string:', userJsonString);
  
  // Parse with full type safety
  const parsedUser = typedUserJsonCodec.parse(userJsonString);
  console.log('📥 Parsed user (fully typed):', parsedUser.name, parsedUser.email);
  
  // TypeScript knows the exact type of parsedUser!
  // No need for type assertions or manual type checking
  
} catch (error) {
  console.error('❌ JSON codec error:', error);
}

// ===== CUSTOM TYPED CODECS =====
console.log('\n🛠️  Custom Typed Codecs');
console.log('=======================');

// Define a configuration type
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

// Create schema for the config
const configSchema = v.object({
  port: v.number().min(1000).max(65535),
  debug: v.boolean(),
  environment: v.union(v.literal('development'), v.literal('staging'), v.literal('production')),
  features: v.object({
    auth: v.boolean(),
    analytics: v.boolean(), 
    caching: v.boolean()
  }),
  databases: v.object({
    primary: v.string().url(),
    redis: v.string().url().optional()
  })
});

// Verify the schema matches our interface
type InferredConfig = Infer<typeof configSchema>;
// This line ensures type compatibility at compile time
const _typeCheck: AppConfig = {} as InferredConfig;

// Create a custom environment variable codec
const envToConfigCodec = v.codec(
  v.string(),
  configSchema,
  {
    decode: (envString: string): AppConfig => {
      const lines = envString.split('\n').filter(line => line.trim());
      const config: any = {
        features: {},
        databases: {}
      };
      
      lines.forEach(line => {
        const [key, value] = line.split('=').map(s => s.trim());
        
        switch (key) {
          case 'PORT':
            config.port = parseInt(value, 10);
            break;
          case 'DEBUG':
            config.debug = value.toLowerCase() === 'true';
            break;
          case 'ENVIRONMENT':
            config.environment = value as AppConfig['environment'];
            break;
          case 'FEATURE_AUTH':
            config.features.auth = value.toLowerCase() === 'true';
            break;
          case 'FEATURE_ANALYTICS':
            config.features.analytics = value.toLowerCase() === 'true';
            break;
          case 'FEATURE_CACHING':
            config.features.caching = value.toLowerCase() === 'true';
            break;
          case 'DATABASE_PRIMARY':
            config.databases.primary = value;
            break;
          case 'DATABASE_REDIS':
            config.databases.redis = value;
            break;
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

// Example usage with full type safety
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
  console.log('✅ Parsed config (fully typed):', {
    port: parsedConfig.port,
    environment: parsedConfig.environment,
    features: parsedConfig.features
  });
  
  // TypeScript provides full autocomplete and type checking
  if (parsedConfig.debug) {
    console.log('🐛 Debug mode enabled');
  }
  
  if (parsedConfig.features.auth) {
    console.log('🔐 Authentication feature enabled');
  }
  
  // Encode back to environment string
  const encodedConfig = envToConfigCodec.encode(parsedConfig);
  console.log('✅ Config encoded back to env format');
  
} catch (error) {
  console.error('❌ Config codec error:', error);
}

// ===== API RESPONSE PROCESSING =====
console.log('\n🌐 API Response Processing');
console.log('===========================');

// Define API response types
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

// Create schema that matches the interfaces
const apiResponseSchema = v.object({
  data: v.array(v.object({
    id: v.string(),
    name: v.string(),
    email: v.string().email(),
    createdAt: v.string(), // ISO date string
    profile: v.object({
      avatar: v.string().url().optional(),
      bio: v.string().optional(),
      location: v.string().optional()
    })
  })),
  pagination: v.object({
    page: v.number().min(1),
    limit: v.number().min(1).max(100),
    total: v.number().min(0),
    hasNext: v.boolean()
  }),
  metadata: v.object({
    requestId: v.string().uuid(),
    timestamp: v.number()
  })
});

// Ensure type compatibility
type InferredApiResponse = Infer<typeof apiResponseSchema>;
const _apiTypeCheck: ApiResponse = {} as InferredApiResponse;

// Create a codec for base64-encoded API responses
const apiResponseCodec = v.codec(
  v.string(),
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

// Example API response
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
      profile: {
        bio: 'Backend engineer specializing in Node.js'
      }
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    hasNext: true
  },
  metadata: {
    requestId: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: Date.now()
  }
};

try {
  // Encode the response (what API sends)
  const encodedResponse = apiResponseCodec.encode(sampleApiResponse);
  console.log('📤 API response encoded to base64');
  
  // Decode the response (what client receives)
  const decodedResponse = apiResponseCodec.parse(encodedResponse);
  console.log('📥 API response decoded with full type safety');
  console.log(`   Found ${decodedResponse.data.length} users`);
  console.log(`   Page ${decodedResponse.pagination.page}/${Math.ceil(decodedResponse.pagination.total / decodedResponse.pagination.limit)}`);
  
  // TypeScript provides full type safety and autocomplete
  decodedResponse.data.forEach(user => {
    console.log(`   👤 ${user.name} (${user.email})`);
    if (user.profile.location) {
      console.log(`      📍 ${user.profile.location}`);
    }
  });
  
} catch (error) {
  console.error('❌ API response processing error:', error);
}

// ===== JWT PAYLOAD PROCESSING =====
console.log('\n🔐 JWT Payload Processing');
console.log('=========================');

// Define JWT payload structure
interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
  iat: number;
  exp: number;
}

// Create schema for JWT payload
const jwtPayloadSchema = v.object({
  sub: v.string(),
  name: v.string(),
  email: v.string().email(),
  role: v.union(v.literal('user'), v.literal('admin'), v.literal('moderator')),
  permissions: v.array(v.string()),
  iat: v.number(),
  exp: v.number()
});

// Create typed JWT decoder
const typedJwtDecoder = jwtPayload(jwtPayloadSchema);

// Example JWT token (this is just the payload part for demo)
const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsicmVhZCIsIndyaXRlIiwiZGVsZXRlIl0sImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5OTIyfQ.fake_signature';

try {
  // Note: This would normally fail because it's a mock token
  // In real usage, you'd have a valid JWT token
  console.log('🔑 JWT decoder created with full type safety');
  console.log('   Payload will be fully typed as JWTPayload interface');
  
} catch (error) {
  console.log('💡 JWT example shown (would work with real tokens)');
}

// ===== ASYNC CODECS =====
console.log('\n⚡ Async Codecs');
console.log('===============');

// Create an async codec that simulates API calls
const asyncDataProcessor = v.codec(
  v.string(),
  v.object({
    processed: v.string(),
    timestamp: v.number(),
    metadata: v.object({
      processingTime: v.number(),
      version: v.string()
    })
  }),
  {
    decode: async (input: string) => {
      // Simulate async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        processed: input.toUpperCase(),
        timestamp: Date.now(),
        metadata: {
          processingTime: 100,
          version: '1.0.0'
        }
      };
    },
    encode: async (data) => {
      // Simulate async encoding
      await new Promise(resolve => setTimeout(resolve, 50));
      return `${data.processed}_${data.timestamp}`;
    }
  }
);

// Demonstrate async codec usage
(async () => {
  try {
    console.log('🔄 Processing data asynchronously...');
    const result = await asyncDataProcessor.parseAsync('hello world');
    console.log('✅ Async decode result:', result);
    
    const encoded = await asyncDataProcessor.encodeAsync(result);
    console.log('✅ Async encode result:', encoded);
    
  } catch (error) {
    console.error('❌ Async codec error:', error);
  }
})();

console.log('\n🎉 TypeScript codec examples completed!');
console.log('\n💡 TypeScript Benefits:');
console.log('   • Complete type inference for all operations');
console.log('   • Compile-time type checking prevents runtime errors');  
console.log('   • Full IDE autocomplete and refactoring support');
console.log('   • Interface compatibility verification');
console.log('   • Zero runtime type assertion overhead');