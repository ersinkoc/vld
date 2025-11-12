/**
 * Utility functions for codec transformations
 */

/**
 * Convert a base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  // Handle URL-safe base64
  const base64Clean = base64.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if necessary
  const padded = base64Clean.padEnd(base64Clean.length + (4 - base64Clean.length % 4) % 4, '=');
  
  // Decode base64 to binary string
  const binaryString = safeAtob(padded);
  
  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  // Encode to base64
  return safeBtoa(binaryString);
}

/**
 * Convert Uint8Array to URL-safe base64 string
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const base64 = uint8ArrayToBase64(bytes);
  // Make URL-safe and remove padding
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  // BUG-010 FIX: Add length validation to prevent memory exhaustion
  // 20 million characters = 10MB of data (consistent with base64 limits)
  if (hex.length > 20000000) {
    throw new Error('Hex string is too large (max 10MB)');
  }

  // Remove any 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

  // Ensure even length
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;

  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes[i / 2] = parseInt(paddedHex.substring(i, i + 2), 16);
  }

  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i].toString(16);
    hex += byte.length === 1 ? '0' + byte : byte;
  }
  return hex;
}

/**
 * Convert string to Uint8Array using UTF-8 encoding
 */
export function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert Uint8Array to string using UTF-8 decoding
 */
export function uint8ArrayToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Check if running in Node.js environment
 */
export function isNodeEnvironment(): boolean {
  return typeof globalThis !== 'undefined' && 
         typeof globalThis.process !== 'undefined' &&
         globalThis.process.versions != null &&
         globalThis.process.versions.node != null;
}

/**
 * Validate and sanitize base64 input to prevent prototype pollution
 */
function validateBase64Input(encoded: string): void {
  // Check for null/undefined
  if (encoded == null) {
    throw new Error('Base64 input cannot be null or undefined');
  }

  // Ensure it's a string
  if (typeof encoded !== 'string') {
    throw new Error('Base64 input must be a string');
  }

  // Length validation - base64 strings should be reasonable length
  if (encoded.length > 10000000) { // 10MB limit
    throw new Error('Base64 input is too large');
  }

  // Base64 character validation - only allow valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(encoded)) {
    throw new Error('Invalid base64 format');
  }

  // BUG-NEW-004 FIX: Correct base64 padding validation per RFC 4648
  // Base64 only uses '=' or '==' as padding, never '==='
  const paddingIndex = encoded.indexOf('=');
  if (paddingIndex !== -1) {
    const padding = encoded.substring(paddingIndex);
    // Only allow '=' or '==' as valid padding (RFC 4648 compliant)
    if (!/^={1,2}$/.test(padding)) {
      throw new Error('Invalid base64 padding');
    }
    // Padding should only be at the end
    if (paddingIndex < encoded.length - 2) {
      throw new Error('Base64 padding must be at the end');
    }
  }

  // Additional security check: prevent potential encoded JavaScript
  // by looking for suspicious patterns that might indicate malicious content
  const suspiciousPatterns = [
    /eval/i,
    /function/i,
    /javascript:/i,
    /<script/i,
    /on\w+\s*=/i,
    /__proto__/i,
    /constructor/i,
    /prototype/i
  ];

  // Decode a small portion to check for suspicious content
  try {
    const sampleSize = Math.min(100, encoded.length);
    const sample = encoded.substring(0, sampleSize);
    const sampleDecoded = typeof atob !== 'undefined'
      ? atob(sample)
      : Buffer.from(sample, 'base64').toString('utf8', 0, 50); // Only decode first 50 chars

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sampleDecoded)) {
        throw new Error('Suspicious content detected in base64 input');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Suspicious content')) {
      throw error;
    }
    // If decoding fails, continue - it might be invalid base64 which will be caught later
  }
}

/**
 * Polyfill for atob in Node.js with proper input validation
 */
export function safeAtob(encoded: string): string {
  // Input validation and sanitization
  validateBase64Input(encoded);

  if (typeof atob !== 'undefined') {
    try {
      return atob(encoded);
    } catch (error) {
      throw new Error('Failed to decode base64 data');
    }
  }

  // Node.js fallback with additional validation
  if (isNodeEnvironment()) {
    try {
      // Use Buffer with explicit error handling
      const buffer = Buffer.from(encoded, 'base64');

      // Additional validation: ensure the decoded data is reasonable size
      if (buffer.length > 5000000) { // 5MB limit for decoded data
        throw new Error('Decoded base64 data is too large');
      }

      return buffer.toString('binary');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid base64')) {
        throw new Error('Invalid base64 format');
      }
      throw new Error('Failed to decode base64 data in Node.js environment');
    }
  }

  throw new Error('Base64 decoding not supported in this environment');
}

/**
 * Polyfill for btoa in Node.js
 */
export function safeBtoa(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  }
  
  // Node.js fallback
  if (isNodeEnvironment()) {
    return Buffer.from(str, 'binary').toString('base64');
  }
  
  throw new Error('Base64 encoding not supported in this environment');
}