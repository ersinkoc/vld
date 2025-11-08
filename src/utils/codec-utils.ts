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
 * Polyfill for atob in Node.js
 */
export function safeAtob(encoded: string): string {
  if (typeof atob !== 'undefined') {
    return atob(encoded);
  }
  
  // Node.js fallback
  if (isNodeEnvironment()) {
    return Buffer.from(encoded, 'base64').toString('binary');
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