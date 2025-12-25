import { VldCodec } from '../validators/codec';
import { VldBase64 } from '../validators/base64';
import { VldHex } from '../validators/hex';
import { VldUint8Array } from '../validators/uint8array';
import { VldString } from '../validators/string';
import { VldNumber } from '../validators/number';
import { VldBigInt } from '../validators/bigint';
import { VldBoolean } from '../validators/boolean';
import { VldDate } from '../validators/date';
import { VldUnknown } from '../validators/unknown';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToBase64Url,
  hexToUint8Array,
  uint8ArrayToHex,
  stringToUint8Array,
  uint8ArrayToString
} from '../utils/codec-utils';

/**
 * Predefined codecs for common transformations (Zod-compatible)
 */

// ===== STRING TO NUMBER CODECS =====

/**
 * String to number codec
 */
export const stringToNumber = VldCodec.create(
  VldString.create(),
  VldNumber.create(),
  {
    decode: (str: string) => {
      const num = Number(str);
      if (isNaN(num)) throw new Error('Invalid number');
      return num;
    },
    encode: (num: number) => num.toString()
  }
);

/**
 * String to integer codec
 */
export const stringToInt = VldCodec.create(
  VldString.create(),
  VldNumber.create().int(),
  {
    decode: (str: string) => {
      const num = parseInt(str, 10);
      if (isNaN(num)) throw new Error('Invalid integer');
      return num;
    },
    encode: (num: number) => Math.floor(num).toString()
  }
);

/**
 * String to BigInt codec
 */
export const stringToBigInt = VldCodec.create(
  VldString.create(),
  VldBigInt.create(),
  {
    decode: (str: string) => {
      try {
        return BigInt(str);
      } catch {
        throw new Error('Invalid BigInt');
      }
    },
    encode: (bigint: bigint) => bigint.toString()
  }
);

/**
 * Number to BigInt codec
 */
export const numberToBigInt = VldCodec.create(
  VldNumber.create().int(),
  VldBigInt.create(),
  {
    decode: (num: number) => BigInt(Math.floor(num)),
    encode: (bigint: bigint) => Number(bigint)
  }
);

// ===== DATE CODECS =====

/**
 * ISO datetime string to Date codec
 */
export const isoDatetimeToDate = VldCodec.create(
  VldString.create().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/, 'Invalid ISO datetime format'),
  VldDate.create(),
  {
    decode: (isoString: string) => {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date;
    },
    encode: (date: Date) => date.toISOString()
  }
);

/**
 * Epoch seconds to Date codec
 */
export const epochSecondsToDate = VldCodec.create(
  VldNumber.create(),
  VldDate.create(),
  {
    decode: (seconds: number) => new Date(seconds * 1000),
    encode: (date: Date) => Math.floor(date.getTime() / 1000)
  }
);

/**
 * Epoch milliseconds to Date codec
 */
export const epochMillisToDate = VldCodec.create(
  VldNumber.create(),
  VldDate.create(),
  {
    decode: (millis: number) => new Date(millis),
    encode: (date: Date) => date.getTime()
  }
);

// ===== JSON CODEC =====

/**
 * JSON string codec for any type
 */
export const jsonCodec = <T = any>(schema?: any) => {
  const outputSchema = schema || VldUnknown.create();
  
  return VldCodec.create(
    VldString.create(),
    outputSchema,
    {
      decode: (jsonString: string) => {
        try {
          return JSON.parse(jsonString);
        } catch {
          throw new Error('Invalid JSON');
        }
      },
      encode: (data: T) => JSON.stringify(data)
    }
  );
};

// ===== URL CODECS =====

/**
 * String to URL codec
 */
export const stringToURL = VldCodec.create(
  VldString.create().url(),
  VldUnknown.create() as any, // URL object
  {
    decode: (urlString: string) => {
      try {
        return new URL(urlString);
      } catch {
        throw new Error('Invalid URL');
      }
    },
    encode: (url: URL) => url.toString()
  }
);

/**
 * String to HTTP/HTTPS URL codec
 */
export const stringToHttpURL = VldCodec.create(
  VldString.create().regex(/^https?:\/\//, 'Must be HTTP or HTTPS URL'),
  VldUnknown.create() as any, // URL object
  {
    decode: (urlString: string) => {
      try {
        const url = new URL(urlString);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Must be HTTP or HTTPS');
        }
        return url;
      } catch {
        throw new Error('Invalid HTTP URL');
      }
    },
    encode: (url: URL) => url.toString()
  }
);

/**
 * URI component encode/decode codec
 */
export const uriComponent = VldCodec.create(
  VldString.create(),
  VldString.create(),
  {
    decode: (encoded: string) => {
      try {
        return decodeURIComponent(encoded);
      } catch {
        throw new Error('Invalid URI component');
      }
    },
    encode: (decoded: string) => encodeURIComponent(decoded)
  }
);

/**
 * String to boolean codec
 */
export const stringToBoolean = VldCodec.create(
  VldString.create(),
  VldBoolean.create(),
  {
    decode: (str: string) => {
      const lower = str.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') return true;
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') return false;
      throw new Error('Invalid boolean string');
    },
    encode: (bool: boolean) => bool.toString()
  }
);

// ===== EXISTING BYTE CODECS (updated) =====

/**
 * Base64 to Uint8Array codec
 */
export const base64ToBytes = VldCodec.create(
  VldBase64.create(),
  VldUint8Array.create(),
  {
    decode: base64ToUint8Array,
    encode: uint8ArrayToBase64
  }
);

/**
 * URL-safe Base64 to Uint8Array codec
 */
export const base64UrlToBytes = VldCodec.create(
  VldBase64.create().urlSafeMode(),
  VldUint8Array.create(),
  {
    decode: base64ToUint8Array,
    encode: uint8ArrayToBase64Url
  }
);

/**
 * Hexadecimal to Uint8Array codec
 */
export const hexToBytes = VldCodec.create(
  VldHex.create(),
  VldUint8Array.create(),
  {
    decode: hexToUint8Array,
    encode: uint8ArrayToHex
  }
);

/**
 * Lowercase hexadecimal to Uint8Array codec
 */
export const hexLowerToBytes = VldCodec.create(
  VldHex.create().lowercaseMode(),
  VldUint8Array.create(),
  {
    decode: hexToUint8Array,
    encode: (bytes) => uint8ArrayToHex(bytes).toLowerCase()
  }
);

/**
 * UTF-8 string to Uint8Array codec
 */
export const utf8ToBytes = VldCodec.create(
  VldString.create(),
  VldUint8Array.create(),
  {
    decode: stringToUint8Array,
    encode: uint8ArrayToString
  }
);

/**
 * Uint8Array to UTF-8 string codec (reverse of utf8ToBytes)
 */
export const bytesToUtf8 = VldCodec.create(
  VldUint8Array.create(),
  VldString.create(),
  {
    decode: uint8ArrayToString,
    encode: stringToUint8Array
  }
);

/**
 * Base64URL to Uint8Array codec (updated)
 */
export const base64urlToBytes = VldCodec.create(
  VldBase64.create().urlSafeMode(),
  VldUint8Array.create(),
  {
    decode: base64ToUint8Array,
    encode: uint8ArrayToBase64Url
  }
);

/**
 * Base64 encoded JSON codec (updated)
 */
export const base64Json = <T = any>(schema?: any) => {
  const outputSchema = schema || VldUnknown.create();
  
  return VldCodec.create(
    VldBase64.create(),
    outputSchema,
    {
      decode: (base64: string) => {
        // BUG-NPM-005 FIX: Add error handling for JSON parsing
        try {
          const jsonString = uint8ArrayToString(base64ToUint8Array(base64));
          return JSON.parse(jsonString);
        } catch (error) {
          throw new Error(`Failed to parse base64 JSON: ${(error as Error).message}`);
        }
      },
      encode: (data: T) => {
        const jsonString = JSON.stringify(data);
        return uint8ArrayToBase64(stringToUint8Array(jsonString));
      }
    }
  );
};

/**
 * JWT payload decoder (base64url encoded JSON) - updated
 */
export const jwtPayload = (schema?: any) => {
  const outputSchema = schema || VldUnknown.create();
  
  return VldCodec.create(
    VldString.create().refine(s => s.split('.').length === 3, 'Invalid JWT format'),
    outputSchema,
    {
      decode: (jwt: string) => {
        // BUG-NPM-004 FIX: Add comprehensive error handling for JWT parsing
        try {
          const parts = jwt.split('.');
          if (parts.length !== 3) {
            throw new Error('JWT must have exactly 3 parts');
          }

          const payloadBase64 = parts[1];
          if (!payloadBase64) {
            throw new Error('JWT payload is empty');
          }

          // Convert base64url to base64
          const base64 = payloadBase64
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(payloadBase64.length + (4 - payloadBase64.length % 4) % 4, '=');

          const jsonString = uint8ArrayToString(base64ToUint8Array(base64));
          return JSON.parse(jsonString);
        } catch (error) {
          throw new Error(`Failed to decode JWT payload: ${(error as Error).message}`);
        }
      },
      encode: () => {
        throw new Error('JWT encoding not supported - use a proper JWT library');
      }
    }
  );
};