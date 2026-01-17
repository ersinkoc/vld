/**
 * Coverage tests for codecs/index.ts
 * These tests target specific uncovered lines
 */

import {
  stringToURL,
  stringToHttpURL,
  uriComponent,
  hexLowerToBytes,
  jwtPayload
} from '../../src/codecs';

describe('Codecs Coverage Tests', () => {
  describe('stringToURL codec', () => {
    it('should fail on invalid URL', () => {
      // safeParse catches the error
      const result = stringToURL.safeParse('not-a-valid-url');
      expect(result.success).toBe(false);
    });

    it('should parse valid URL', () => {
      const url = stringToURL.parse('https://example.com/path');
      expect(url.hostname).toBe('example.com');
      expect(url.pathname).toBe('/path');
    });
  });

  describe('stringToHttpURL codec', () => {
    it('should fail on non-HTTP/HTTPS protocol', () => {
      // The input validator regex rejects non-http(s)
      const result = stringToHttpURL.safeParse('ftp://example.com');
      expect(result.success).toBe(false);
    });

    it('should fail on invalid URL format', () => {
      const result = stringToHttpURL.safeParse('not a url');
      expect(result.success).toBe(false);
    });

    it('should parse valid HTTP URL', () => {
      const url = stringToHttpURL.parse('https://example.com');
      expect(url.protocol).toBe('https:');
    });
  });

  describe('uriComponent codec', () => {
    it('should fail on invalid URI component', () => {
      // Invalid percent-encoding that can't be decoded
      const result = uriComponent.safeParse('%E0%A4%A');
      expect(result.success).toBe(false);
    });

    it('should parse valid URI component', () => {
      const decoded = uriComponent.parse('hello%20world');
      expect(decoded).toBe('hello world');
    });

    it('should encode URI component', () => {
      const encoded = uriComponent.encode('hello world');
      expect(encoded).toBe('hello%20world');
    });
  });

  describe('hexLowerToBytes codec', () => {
    it('should encode bytes to lowercase hex', () => {
      const bytes = new Uint8Array([0xAB, 0xCD, 0xEF]);
      const hex = hexLowerToBytes.encode(bytes);
      expect(hex).toBe('abcdef');
    });

    it('should parse lowercase hex to bytes', () => {
      const bytes = hexLowerToBytes.parse('abcdef');
      expect(bytes).toEqual(new Uint8Array([0xAB, 0xCD, 0xEF]));
    });
  });

  describe('jwtPayload codec', () => {
    it('should fail on JWT with wrong number of parts', () => {
      const codec = jwtPayload();

      // JWT with only 2 parts - input validation fails
      const result = codec.safeParse('part1.part2');
      expect(result.success).toBe(false);
    });

    it('should fail when encoding (not supported)', () => {
      const codec = jwtPayload();

      // The safeEncode wraps the error, so we check for failure
      const result = codec.safeEncode({ sub: '1234' });
      expect(result.success).toBe(false);
    });

    it('should parse valid JWT payload', () => {
      const codec = jwtPayload();

      // Create a valid JWT structure with base64url encoded payload
      // Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
      const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const payload = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
      const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const jwt = `${header}.${payload}.${signature}`;
      const decoded = codec.parse(jwt);

      expect(decoded.sub).toBe('1234567890');
      expect(decoded.name).toBe('John Doe');
    });
  });
});
