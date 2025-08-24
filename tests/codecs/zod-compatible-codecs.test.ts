import { describe, it, expect } from '@jest/globals';
import { v } from '../../src/index';
import {
  stringToNumber,
  stringToInt,
  stringToBigInt,
  numberToBigInt,
  stringToBoolean,
  isoDatetimeToDate,
  epochSecondsToDate,
  epochMillisToDate,
  jsonCodec,
  stringToURL,
  stringToHttpURL,
  uriComponent,
  bytesToUtf8,
  base64urlToBytes
} from '../../src/index';

describe('Zod-Compatible Codecs', () => {
  describe('String to Number Codecs', () => {
    it('should convert string to number', () => {
      expect(stringToNumber.parse('123')).toBe(123);
      expect(stringToNumber.parse('123.45')).toBe(123.45);
      expect(stringToNumber.parse('-99')).toBe(-99);
      
      // Test encode
      expect(stringToNumber.encode(456)).toBe('456');
      expect(stringToNumber.encode(456.78)).toBe('456.78');
      
      // Test invalid
      expect(stringToNumber.safeParse('invalid').success).toBe(false);
      expect(stringToNumber.safeParse('').success).toBe(true); // Empty string converts to 0
    });
    
    it('should convert string to integer', () => {
      expect(stringToInt.parse('123')).toBe(123);
      expect(stringToInt.parse('-456')).toBe(-456);
      
      // Test encode (should floor integers only)
      expect(stringToInt.encode(123)).toBe('123');
      expect(stringToInt.encode(-456)).toBe('-456');
      
      // Test invalid
      expect(stringToInt.safeParse('abc').success).toBe(false);
      expect(stringToInt.safeParse('').success).toBe(false); // Empty string should fail since NaN
    });
    
    it('should convert string to BigInt', () => {
      expect(stringToBigInt.parse('123456789012345678901234567890')).toBe(123456789012345678901234567890n);
      expect(stringToBigInt.parse('0')).toBe(0n);
      expect(stringToBigInt.parse('-999')).toBe(-999n);
      
      // Test encode
      expect(stringToBigInt.encode(123n)).toBe('123');
      expect(stringToBigInt.encode(-456n)).toBe('-456');
      
      // Test invalid
      expect(stringToBigInt.safeParse('123.45').success).toBe(false);
      expect(stringToBigInt.safeParse('invalid').success).toBe(false);
    });
    
    it('should convert number to BigInt', () => {
      expect(numberToBigInt.parse(123)).toBe(123n);
      expect(numberToBigInt.parse(-456)).toBe(-456n);
      // Don't test float inputs as numberToBigInt uses int() validator
      
      // Test encode  
      expect(numberToBigInt.encode(789n)).toBe(789);
      expect(numberToBigInt.encode(-123n)).toBe(-123);
    });
  });
  
  describe('String to Boolean Codec', () => {
    it('should convert truthy strings to true', () => {
      expect(stringToBoolean.parse('true')).toBe(true);
      expect(stringToBoolean.parse('TRUE')).toBe(true);
      expect(stringToBoolean.parse('1')).toBe(true);
      expect(stringToBoolean.parse('yes')).toBe(true);
      expect(stringToBoolean.parse('YES')).toBe(true);
      expect(stringToBoolean.parse('on')).toBe(true);
      expect(stringToBoolean.parse('ON')).toBe(true);
    });
    
    it('should convert falsy strings to false', () => {
      expect(stringToBoolean.parse('false')).toBe(false);
      expect(stringToBoolean.parse('FALSE')).toBe(false);
      expect(stringToBoolean.parse('0')).toBe(false);
      expect(stringToBoolean.parse('no')).toBe(false);
      expect(stringToBoolean.parse('NO')).toBe(false);
      expect(stringToBoolean.parse('off')).toBe(false);
      expect(stringToBoolean.parse('OFF')).toBe(false);
    });
    
    it('should encode boolean to string', () => {
      expect(stringToBoolean.encode(true)).toBe('true');
      expect(stringToBoolean.encode(false)).toBe('false');
    });
    
    it('should reject invalid boolean strings', () => {
      expect(stringToBoolean.safeParse('maybe').success).toBe(false);
      expect(stringToBoolean.safeParse('2').success).toBe(false);
      expect(stringToBoolean.safeParse('').success).toBe(false);
    });
  });
  
  describe('Date Conversion Codecs', () => {
    it('should convert ISO datetime to Date', () => {
      const isoString = '2023-12-25T10:30:00.000Z';
      const date = isoDatetimeToDate.parse(isoString);
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe(isoString);
      
      // Test encode
      const encoded = isoDatetimeToDate.encode(date);
      expect(encoded).toBe(isoString);
      
      // Test various ISO formats
      expect(isoDatetimeToDate.parse('2023-01-01T00:00:00Z')).toBeInstanceOf(Date);
      expect(isoDatetimeToDate.parse('2023-01-01T12:30:45.123Z')).toBeInstanceOf(Date);
    });
    
    it('should reject invalid ISO datetime strings', () => {
      expect(isoDatetimeToDate.safeParse('2023-13-01T00:00:00Z').success).toBe(false); // Invalid month
      expect(isoDatetimeToDate.safeParse('not-a-date').success).toBe(false);
      expect(isoDatetimeToDate.safeParse('2023/01/01').success).toBe(false); // Wrong format
    });
    
    it('should convert epoch seconds to Date', () => {
      const epochSeconds = 1703505000; // 2023-12-25 10:30:00 UTC
      const date = epochSecondsToDate.parse(epochSeconds);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(epochSeconds * 1000);
      
      // Test encode
      const encoded = epochSecondsToDate.encode(date);
      expect(encoded).toBe(epochSeconds);
    });
    
    it('should convert epoch milliseconds to Date', () => {
      const epochMillis = 1703505000000; // 2023-12-25 10:30:00 UTC
      const date = epochMillisToDate.parse(epochMillis);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(epochMillis);
      
      // Test encode
      const encoded = epochMillisToDate.encode(date);
      expect(encoded).toBe(epochMillis);
    });
  });
  
  describe('JSON Codec', () => {
    it('should parse and stringify JSON', () => {
      const obj = { name: 'John', age: 30, active: true };
      const jsonString = JSON.stringify(obj);
      
      const codec = jsonCodec();
      expect(codec.parse(jsonString)).toEqual(obj);
      expect(codec.encode(obj)).toBe(jsonString);
    });
    
    it('should work with schema validation', () => {
      // Use a proper VLD schema instead of a mock
      const userSchema = v.object({
        name: v.string(),
        age: v.number()
      });
      
      const codec = jsonCodec(userSchema);
      const validJson = '{"name":"John","age":30}';
      const result = codec.parse(validJson);
      expect(result).toEqual({ name: 'John', age: 30 });
    });
    
    it('should reject invalid JSON', () => {
      const codec = jsonCodec();
      expect(codec.safeParse('invalid json').success).toBe(false);
      expect(codec.safeParse('{"incomplete": ').success).toBe(false);
    });
  });
  
  describe('URL Codecs', () => {
    it('should convert string to URL object', () => {
      const urlString = 'https://example.com/path?param=value';
      const url = stringToURL.parse(urlString);
      expect(url).toBeInstanceOf(URL);
      expect(url.href).toBe(urlString);
      
      // Test encode
      const encoded = stringToURL.encode(url);
      expect(encoded).toBe(urlString);
    });
    
    it('should handle HTTP/HTTPS URLs specifically', () => {
      const httpUrl = 'http://example.com';
      const httpsUrl = 'https://example.com';
      
      expect(stringToHttpURL.parse(httpUrl)).toBeInstanceOf(URL);
      expect(stringToHttpURL.parse(httpsUrl)).toBeInstanceOf(URL);
      
      // Should reject non-HTTP protocols
      expect(stringToHttpURL.safeParse('ftp://example.com').success).toBe(false);
      expect(stringToHttpURL.safeParse('file:///path').success).toBe(false);
    });
    
    it('should handle URI component encoding', () => {
      // uriComponent expects encoded string as input, returns decoded string
      const original = 'Hello World! @#$%';
      const encodedInput = encodeURIComponent(original);
      
      // Parse (decode) the encoded string
      const decoded = uriComponent.parse(encodedInput);
      expect(decoded).toBe(original);
      
      // Encode (encode) the decoded string back
      const encoded = uriComponent.encode(original);
      expect(encoded).toBe(encodedInput);
    });
  });
  
  describe('Byte String Codecs', () => {
    it('should convert bytes to UTF-8 string', () => {
      const text = 'Hello VLD! 🚀';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      
      const decoded = bytesToUtf8.parse(bytes);
      expect(decoded).toBe(text);
      
      // Test encode
      const encoded = bytesToUtf8.encode(text);
      expect(encoded).toEqual(bytes);
    });
    
    it('should handle base64url to bytes conversion', () => {
      const base64url = 'SGVsbG8gV29ybGQ='; // "Hello World" with padding to make valid base64
      const result = base64urlToBytes.parse(base64url);
      expect(result).toBeInstanceOf(Uint8Array);
      
      const decoder = new TextDecoder();
      expect(decoder.decode(result)).toBe('Hello World');
    });
  });
  
  describe('Round-trip conversions', () => {
    it('should handle round-trip conversions correctly', () => {
      // Number conversion
      const original1 = '42.5';
      const roundTrip1 = stringToNumber.encode(stringToNumber.parse(original1));
      expect(roundTrip1).toBe(original1);
      
      // Boolean conversion
      const original2 = 'true';
      const roundTrip2 = stringToBoolean.encode(stringToBoolean.parse(original2));
      expect(roundTrip2).toBe(original2);
      
      // Date conversion
      const originalDate = new Date('2023-12-25T10:30:00.000Z');
      const roundTripDate = epochMillisToDate.parse(epochMillisToDate.encode(originalDate));
      expect(roundTripDate.getTime()).toBe(originalDate.getTime());
      
      // JSON conversion
      const originalObj = { test: 'value', number: 123 };
      const jsonString = jsonCodec().encode(originalObj);
      const roundTripObj = jsonCodec().parse(jsonString);
      expect(roundTripObj).toEqual(originalObj);
    });
  });
});