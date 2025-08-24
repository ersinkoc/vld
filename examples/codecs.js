/**
 * VLD Codecs Examples
 * 
 * This file demonstrates VLD's powerful codec system for bidirectional
 * data transformations. Codecs can both decode (input → output) and
 * encode (output → input) with full type safety.
 */

const { 
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
  bytesToUtf8
} = require('@oxog/vld');

console.log('🚀 VLD Codecs Examples\n');

// ===== STRING CONVERSION CODECS =====
console.log('📝 String Conversion Codecs');
console.log('==========================');

try {
  // String to number with validation
  const age = stringToNumber.parse('25');
  console.log('✅ String to number:', age, typeof age); // 25 number
  
  const price = stringToNumber.encode(99.99);
  console.log('✅ Number to string:', price, typeof price); // "99.99" string
  
  // String to integer (validates integer constraint) 
  const count = stringToInt.parse('42');
  console.log('✅ String to int:', count); // 42
  
  // This will fail because it's not an integer
  const invalidInt = stringToInt.safeParse('42.5');
  console.log('❌ Invalid int result:', invalidInt.success); // false
  
  // String to BigInt for large numbers
  const bigNumber = stringToBigInt.parse('123456789012345678901234567890');
  console.log('✅ String to BigInt:', bigNumber); // 123456789012345678901234567890n
  
  // Flexible boolean parsing
  console.log('✅ Boolean parsing examples:');
  console.log('  "true" →', stringToBoolean.parse('true'));   // true
  console.log('  "1" →', stringToBoolean.parse('1'));         // true
  console.log('  "yes" →', stringToBoolean.parse('yes'));     // true
  console.log('  "on" →', stringToBoolean.parse('on'));       // true
  console.log('  "false" →', stringToBoolean.parse('false')); // false
  console.log('  "0" →', stringToBoolean.parse('0'));         // false
  
} catch (error) {
  console.error('❌ String conversion error:', error.message);
}

console.log('\n');

// ===== DATE CONVERSION CODECS =====
console.log('📅 Date Conversion Codecs');
console.log('=========================');

try {
  // ISO datetime string to Date
  const isoDate = isoDatetimeToDate.parse('2023-12-25T10:30:00.000Z');
  console.log('✅ ISO to Date:', isoDate);
  console.log('✅ Date to ISO:', isoDatetimeToDate.encode(isoDate));
  
  // Unix epoch seconds to Date
  const epochDate = epochSecondsToDate.parse(1703505000);
  console.log('✅ Epoch seconds to Date:', epochDate);
  console.log('✅ Date to epoch seconds:', epochSecondsToDate.encode(epochDate));
  
  // Unix epoch milliseconds to Date
  const epochMillisDate = epochMillisToDate.parse(1703505000000);
  console.log('✅ Epoch millis to Date:', epochMillisDate);
  
} catch (error) {
  console.error('❌ Date conversion error:', error.message);
}

console.log('\n');

// ===== JSON AND COMPLEX DATA =====
console.log('📋 JSON and Complex Data Codecs');
console.log('================================');

try {
  // Generic JSON codec
  const genericJson = jsonCodec();
  const userData = genericJson.parse('{"name":"John","age":30,"active":true}');
  console.log('✅ Parsed JSON:', userData);
  
  const jsonString = genericJson.encode({ name: 'Jane', age: 25, role: 'admin' });
  console.log('✅ Encoded JSON:', jsonString);
  
  // Typed JSON codec with schema validation
  const userSchema = v.object({
    name: v.string().min(2),
    age: v.number().min(0).max(150),
    email: v.string().email().optional()
  });
  
  const typedJson = jsonCodec(userSchema);
  const validUser = typedJson.parse('{"name":"Alice","age":30,"email":"alice@example.com"}');
  console.log('✅ Typed JSON parse:', validUser);
  
  // Base64-encoded JSON
  const b64Json = base64Json(userSchema);
  const user = { name: 'Bob', age: 40, email: 'bob@company.com' };
  const encoded = b64Json.encode(user);
  console.log('✅ Base64 encoded JSON:', encoded);
  
  const decoded = b64Json.parse(encoded);
  console.log('✅ Base64 decoded JSON:', decoded);
  
} catch (error) {
  console.error('❌ JSON codec error:', error.message);
}

console.log('\n');

// ===== URL AND WEB CODECS =====
console.log('🌐 URL and Web Codecs');
console.log('=====================');

try {
  // String to URL object
  const url = stringToURL.parse('https://example.com/api/users?page=1&limit=10');
  console.log('✅ URL parsing:');
  console.log('  Protocol:', url.protocol);  // https:
  console.log('  Hostname:', url.hostname);  // example.com
  console.log('  Pathname:', url.pathname);  // /api/users
  console.log('  Search params:', Object.fromEntries(url.searchParams));
  
  // HTTP/HTTPS only URLs
  const httpUrl = stringToHttpURL.parse('https://api.example.com/v1/data');
  console.log('✅ HTTP URL parsed:', httpUrl.href);
  
  // URI component encoding/decoding
  const originalText = 'Hello World! 🚀 Special chars: @#$%';
  const encodedUri = uriComponent.parse(originalText);
  console.log('✅ URI encoded:', encodedUri);
  
  const decodedUri = uriComponent.encode(encodedUri);
  console.log('✅ URI decoded:', decodedUri);
  
} catch (error) {
  console.error('❌ URL codec error:', error.message);
}

console.log('\n');

// ===== BINARY DATA CODECS =====
console.log('💾 Binary Data Codecs');
console.log('=====================');

try {
  // Base64 to Uint8Array
  const base64String = 'SGVsbG8gV29ybGQ='; // "Hello World"
  const bytes1 = base64ToBytes.parse(base64String);
  console.log('✅ Base64 to bytes:', bytes1);
  console.log('✅ Bytes back to base64:', base64ToBytes.encode(bytes1));
  
  // Hex to Uint8Array
  const hexString = '48656c6c6f20566c64'; // "Hello Vld"
  const bytes2 = hexToBytes.parse(hexString);
  console.log('✅ Hex to bytes:', bytes2);
  console.log('✅ Bytes back to hex:', hexToBytes.encode(bytes2));
  
  // UTF-8 string to bytes and back
  const originalText2 = 'Hello VLD! 🎉 支持中文';
  const utf8Bytes = utf8ToBytes.parse(originalText2);
  console.log('✅ UTF-8 to bytes:', utf8Bytes);
  
  const backToText = bytesToUtf8.parse(utf8Bytes);
  console.log('✅ Bytes back to UTF-8:', backToText);
  console.log('✅ Round-trip successful:', originalText2 === backToText);
  
  // Base64URL (URL-safe base64)
  const base64UrlString = 'SGVsbG9fV29ybGQ'; // URL-safe, no padding
  const urlBytes = base64urlToBytes.parse(base64UrlString);
  console.log('✅ Base64URL to bytes:', urlBytes);
  
} catch (error) {
  console.error('❌ Binary data codec error:', error.message);
}

console.log('\n');

// ===== CUSTOM CODECS =====
console.log('🛠️  Custom Codecs');
console.log('==================');

try {
  // Custom CSV to array codec
  const csvToArray = v.codec(
    v.string(),
    v.array(v.string()),
    {
      decode: (csv) => csv.split(',').map(s => s.trim()),
      encode: (arr) => arr.join(', ')
    }
  );
  
  const tags = csvToArray.parse('react, typescript, nodejs, vld');
  console.log('✅ CSV parsed to array:', tags);
  
  const csvString = csvToArray.encode(['express', 'mongodb', 'jwt', 'api']);
  console.log('✅ Array encoded to CSV:', csvString);
  
  // Custom configuration codec
  const configCodec = v.codec(
    v.string(),
    v.object({
      port: v.number(),
      debug: v.boolean(),
      environment: v.string(),
      maxConnections: v.number().optional()
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
  console.log('✅ Parsed config:', parsedConfig);
  
  const encodedConfig = configCodec.encode({
    port: 8080,
    debug: false, 
    environment: 'production',
    maxConnections: 200
  });
  console.log('✅ Encoded config:\n' + encodedConfig);
  
} catch (error) {
  console.error('❌ Custom codec error:', error.message);
}

console.log('\n');

// ===== ERROR HANDLING =====
console.log('🚨 Error Handling');
console.log('=================');

// Safe parsing examples
const safeResults = [
  stringToNumber.safeParse('not-a-number'),
  stringToInt.safeParse('42.5'), // Should fail integer validation
  stringToBoolean.safeParse('maybe'),
  epochSecondsToDate.safeParse('invalid-timestamp')
];

safeResults.forEach((result, index) => {
  if (result.success) {
    console.log(`✅ Result ${index + 1}: Success -`, result.data);
  } else {
    console.log(`❌ Result ${index + 1}: Failed -`, result.error.message);
  }
});

console.log('\n');

// ===== REAL-WORLD EXAMPLE =====
console.log('🌟 Real-World Example: API Response Processing');
console.log('===============================================');

try {
  // Simulate processing an API response that comes as a base64-encoded JSON
  const apiResponseCodec = v.codec(
    v.string(), // Base64-encoded response
    v.object({
      users: v.array(v.object({
        id: v.string(),
        name: v.string(),
        email: v.string().email(),
        createdAt: v.string(), // ISO date string
        isActive: v.boolean()
      })),
      pagination: v.object({
        page: v.number(),
        total: v.number(),
        hasNext: v.boolean()
      })
    }),
    {
      decode: (base64Response) => {
        // Decode base64 to JSON
        const jsonBytes = base64ToBytes.parse(base64Response);
        const jsonString = bytesToUtf8.parse(jsonBytes);
        return JSON.parse(jsonString);
      },
      encode: (responseData) => {
        // Encode JSON to base64
        const jsonString = JSON.stringify(responseData);
        const jsonBytes = utf8ToBytes.parse(jsonString);
        return base64ToBytes.encode(jsonBytes);
      }
    }
  );
  
  // Sample API response data
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
    pagination: {
      page: 1,
      total: 50,
      hasNext: true
    }
  };
  
  // Encode the response (simulate what API would send)
  const encodedResponse = apiResponseCodec.encode(apiData);
  console.log('📤 Encoded API response (base64):', encodedResponse.substring(0, 50) + '...');
  
  // Decode the response (simulate what client would receive)
  const decodedResponse = apiResponseCodec.parse(encodedResponse);
  console.log('📥 Decoded API response:');
  console.log(`  Found ${decodedResponse.users.length} users`);
  console.log(`  Page ${decodedResponse.pagination.page} of ${Math.ceil(decodedResponse.pagination.total / 10)}`);
  console.log('  Users:', decodedResponse.users.map(u => `${u.name} (${u.email})`));
  
} catch (error) {
  console.error('❌ Real-world example error:', error.message);
}

console.log('\n🎉 All codec examples completed successfully!');
console.log('\n💡 Key Takeaways:');
console.log('   • Codecs provide bidirectional transformations');
console.log('   • All built-in codecs are Zod-compatible');
console.log('   • Custom codecs enable domain-specific conversions');
console.log('   • Full type safety with TypeScript inference');
console.log('   • Perfect for API boundaries and data serialization');