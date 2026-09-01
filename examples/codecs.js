/**
 * VLD v3.0 — Codecs Example
 *
 * Demonstrates VLD's codec system for bidirectional data transformations
 * with V2 method-memoization chains (2-6x faster than V1/Zod 4.5 in
 * production benchmarks). All built-in codecs are Zod-compatible.
 */

const {
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
  bytesToUtf8
} = require('@oxog/vld');

console.log('VLD v3.0 Codecs Examples\n');
console.log('V2 method-memoization + bidirectional codecs\n');

// ===== STRING CONVERSION CODECS =====
console.log('String Conversion Codecs');
console.log('==========================');

try {
  const age = stringToNumber.parse('25');
  console.log('   String to number:', age, typeof age);

  const price = stringToNumber.encode(99.99);
  console.log('   Number to string:', price, typeof price);

  const count = stringToInt.parse('42');
  console.log('   String to int:', count);

  const invalidInt = stringToInt.safeParse('42.5');
  console.log('   Invalid int result:', invalidInt.success);

  const bigNumber = stringToBigInt.parse('123456789012345678901234567890');
  console.log('   String to BigInt:', bigNumber);

  console.log('   Boolean parsing examples:');
  console.log('     "true" ->', stringToBoolean.parse('true'));
  console.log('     "1" ->', stringToBoolean.parse('1'));
  console.log('     "yes" ->', stringToBoolean.parse('yes'));
  console.log('     "on" ->', stringToBoolean.parse('on'));
  console.log('     "false" ->', stringToBoolean.parse('false'));
  console.log('     "0" ->', stringToBoolean.parse('0'));
} catch (error) {
  console.error('String conversion error:', error.message);
}

console.log('\n');

// ===== DATE CONVERSION CODECS =====
console.log('Date Conversion Codecs');
console.log('=========================');

try {
  const isoDate = isoDatetimeToDate.parse('2023-12-25T10:30:00.000Z');
  console.log('   ISO to Date:', isoDate);
  console.log('   Date to ISO:', isoDatetimeToDate.encode(isoDate));

  const epochDate = epochSecondsToDate.parse(1703505000);
  console.log('   Epoch seconds to Date:', epochDate);
  console.log('   Date to epoch seconds:', epochSecondsToDate.encode(epochDate));

  const epochMillisDate = epochMillisToDate.parse(1703505000000);
  console.log('   Epoch millis to Date:', epochMillisDate);
} catch (error) {
  console.error('Date conversion error:', error.message);
}

console.log('\n');

// ===== JSON AND COMPLEX DATA =====
console.log('JSON and Complex Data Codecs');
console.log('================================');

try {
  const genericJson = jsonCodec();
  const userData = genericJson.parse('{"name":"John","age":30,"active":true}');
  console.log('   Parsed JSON:', userData);

  const jsonString = genericJson.encode({ name: 'Jane', age: 25, role: 'admin' });
  console.log('   Encoded JSON:', jsonString);

  // V2 user schema — V2 string/number children are 2-6x faster
  const userSchema = vV2.object({
    name: vV2.string().min(2),
    age: vV2.number().min(0).max(150),
    email: vV2.string().email().optional()
  });

  const typedJson = jsonCodec(userSchema);
  const validUser = typedJson.parse('{"name":"Alice","age":30,"email":"alice@example.com"}');
  console.log('   Typed JSON parse (V2 children):', validUser);

  const b64Json = base64Json(userSchema);
  const user = { name: 'Bob', age: 40, email: 'bob@company.com' };
  const encoded = b64Json.encode(user);
  console.log('   Base64 encoded JSON (V2 children):', encoded);

  const decoded = b64Json.parse(encoded);
  console.log('   Base64 decoded JSON (V2 children):', decoded);
} catch (error) {
  console.error('JSON codec error:', error.message);
}

console.log('\n');

// ===== URL AND WEB CODECS =====
console.log('URL and Web Codecs');
console.log('=====================');

try {
  const url = stringToURL.parse('https://example.com/api/users?page=1&limit=10');
  console.log('   URL parsing:');
  console.log('     Protocol:', url.protocol);
  console.log('     Hostname:', url.hostname);
  console.log('     Pathname:', url.pathname);
  console.log('     Search params:', Object.fromEntries(url.searchParams));

  const httpUrl = stringToHttpURL.parse('https://api.example.com/v1/data');
  console.log('   HTTP URL parsed:', httpUrl.href);

  const originalText = 'Hello World! Special chars: @#$%';
  const encodedUri = uriComponent.parse(originalText);
  console.log('   URI encoded:', encodedUri);

  const decodedUri = uriComponent.encode(encodedUri);
  console.log('   URI decoded:', decodedUri);
} catch (error) {
  console.error('URL codec error:', error.message);
}

console.log('\n');

// ===== BINARY DATA CODECS =====
console.log('Binary Data Codecs');
console.log('=====================');

try {
  const base64String = 'SGVsbG8gV29ybGQ='; // "Hello World"
  const bytes1 = base64ToBytes.parse(base64String);
  console.log('   Base64 to bytes:', bytes1);
  console.log('   Bytes back to base64:', base64ToBytes.encode(bytes1));

  const hexString = '48656c6c6f20566c64'; // "Hello Vld"
  const bytes2 = hexToBytes.parse(hexString);
  console.log('   Hex to bytes:', bytes2);
  console.log('   Bytes back to hex:', hexToBytes.encode(bytes2));

  const originalText2 = 'Hello VLD! Supports CJK: 中文';
  const utf8Bytes = utf8ToBytes.parse(originalText2);
  console.log('   UTF-8 to bytes:', utf8Bytes);

  const backToText = bytesToUtf8.parse(utf8Bytes);
  console.log('   Bytes back to UTF-8:', backToText);
  console.log('   Round-trip successful:', originalText2 === backToText);

  const base64UrlString = 'SGVsbG9fV29ybGQ';
  const urlBytes = base64urlToBytes.parse(base64UrlString);
  console.log('   Base64URL to bytes:', urlBytes);
} catch (error) {
  console.error('Binary data codec error:', error.message);
}

console.log('\n');

// ===== CUSTOM CODECS WITH V2 INNER SCHEMAS =====
console.log('Custom Codecs (VLD v3.0 — V2 inner schemas)');
console.log('==================');

try {
  // CSV codec with V2 string inner schema (faster hot path)
  const csvToArray = v.codec(
    vV2.string().min(1),
    vV2.array(vV2.string()),
    {
      decode: (csv) => csv.split(',').map(s => s.trim()),
      encode: (arr) => arr.join(', ')
    }
  );

  const tags = csvToArray.parse('react, typescript, nodejs, vld');
  console.log('   V2 CSV parsed to array:', tags);

  const csvString = csvToArray.encode(['express', 'mongodb', 'jwt', 'api']);
  console.log('   V2 CSV encoded:', csvString);

  // Custom configuration codec with V2 children
  const configCodec = v.codec(
    vV2.string(),
    vV2.object({
      port: vV2.number(),
      debug: vV2.boolean(),
      environment: vV2.string(),
      maxConnections: vV2.number().optional()
    }),
    {
      decode: (configString) => {
        const config = {};
        configString.split('\n').forEach(line => {
          const [key, value] = line.split('=').map(s => s.trim());
          if (key === 'PORT') config.port = parseInt(value, 10);
          if (key === 'DEBUG') config.debug = value === 'true';
          if (key === 'ENVIRONMENT') config.environment = value;
          if (key === 'MAX_CONNECTIONS') config.maxConnections = parseInt(value, 10);
        });
        return config;
      },
      encode: (config) => {
        const lines = [
          `PORT=${config.port}`,
          `DEBUG=${config.debug}`,
          `ENVIRONMENT=${config.environment}`
        ];
        if (config.maxConnections !== undefined) {
          lines.push(`MAX_CONNECTIONS=${config.maxConnections}`);
        }
        return lines.join('\n');
      }
    }
  );

  const configString = `PORT=3000
DEBUG=true
ENVIRONMENT=development
MAX_CONNECTIONS=100`;

  const parsedConfig = configCodec.parse(configString);
  console.log('   V2 Parsed config:', parsedConfig);

  const encodedConfig = configCodec.encode({
    port: 8080,
    debug: false,
    environment: 'production',
    maxConnections: 200
  });
  console.log('   V2 Encoded config:\n' + encodedConfig);
} catch (error) {
  console.error('Custom codec error:', error.message);
}

console.log('\n');

// ===== ERROR HANDLING =====
console.log('Error Handling (with toZodError)');
console.log('=================');

const { toZodError } = require('@oxog/vld');

const safeResults = [
  stringToNumber.safeParse('not-a-number'),
  stringToInt.safeParse('42.5'),
  stringToBoolean.safeParse('maybe'),
  epochSecondsToDate.safeParse('invalid-timestamp')
];

safeResults.forEach((result, index) => {
  if (result.success) {
    console.log(`   Result ${index + 1}: Success -`, result.data);
  } else {
    const zodErr = toZodError(result.error);
    console.log(`   Result ${index + 1}: Failed (ZodError) -`,
      zodErr.issues[0]?.code, '-', zodErr.issues[0]?.message);
  }
});

console.log('\n');

// ===== REAL-WORLD EXAMPLE =====
console.log('Real-World Example: API Response Processing');
console.log('===============================================');

try {
  // Use V2 children for the inner API response shape
  const apiResponseCodec = v.codec(
    vV2.string(),
    vV2.object({
      users: vV2.array(vV2.object({
        id: vV2.string(),
        name: vV2.string(),
        email: vV2.string().email(),
        createdAt: vV2.string(),
        isActive: vV2.boolean()
      })),
      pagination: vV2.object({
        page: vV2.number(),
        total: vV2.number(),
        hasNext: vV2.boolean()
      })
    }),
    {
      decode: (base64Response) => {
        const jsonBytes = base64ToBytes.parse(base64Response);
        const jsonString = bytesToUtf8.parse(jsonBytes);
        return JSON.parse(jsonString);
      },
      encode: (responseData) => {
        const jsonString = JSON.stringify(responseData);
        const jsonBytes = utf8ToBytes.parse(jsonString);
        return base64ToBytes.encode(jsonBytes);
      }
    }
  );

  const apiData = {
    users: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2023-12-25T10:30:00.000Z',
        isActive: true
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        createdAt: '2023-12-20T15:45:00.000Z',
        isActive: false
      }
    ],
    pagination: { page: 1, total: 50, hasNext: true }
  };

  const encodedResponse = apiResponseCodec.encode(apiData);
  console.log('   Encoded API response (base64):',
    encodedResponse.substring(0, 50) + '...');

  const decodedResponse = apiResponseCodec.parse(encodedResponse);
  console.log('   Decoded API response (V2 children):');
  console.log(`     Found ${decodedResponse.users.length} users`);
  console.log(`     Page ${decodedResponse.pagination.page}`);
  console.log('     Users:',
    decodedResponse.users.map(u => `${u.name} (${u.email})`));
} catch (error) {
  console.error('Real-world example error:', error.message);
}

console.log('\nAll codec examples completed successfully!');
console.log('\nKey Takeaways (VLD v3.0):');
console.log('   • Codecs provide bidirectional transformations');
console.log('   • All built-in codecs are Zod-compatible');
console.log('   • V2 inner schemas (vV2.*) are 2-6x faster than V1');
console.log('   • toZodError converts VldError to ZodError shape');
console.log('   • Full type safety with TypeScript inference');
console.log('   • Perfect for API boundaries and data serialization');
