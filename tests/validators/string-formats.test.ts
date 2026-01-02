/**
 * Tests for top-level string format validators
 * Part of Zod 4 API parity implementation
 */

import { v } from '../../src';

describe('String Format Validators', () => {
  describe('email()', () => {
    const emailValidator = v.email();

    it('should validate valid email addresses', () => {
      expect(emailValidator.safeParse('user@example.com').success).toBe(true);
      expect(emailValidator.safeParse('test.user@domain.co.uk').success).toBe(true);
      expect(emailValidator.safeParse('user+tag@example.org').success).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(emailValidator.safeParse('invalid').success).toBe(false);
      expect(emailValidator.safeParse('@example.com').success).toBe(false);
      expect(emailValidator.safeParse('user@').success).toBe(false);
      expect(emailValidator.safeParse('user @example.com').success).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(emailValidator.safeParse(123).success).toBe(false);
      expect(emailValidator.safeParse(null).success).toBe(false);
      expect(emailValidator.safeParse(undefined).success).toBe(false);
    });

    it('should support custom pattern', () => {
      const customEmail = v.email({ pattern: /^[a-z]+@example\.com$/ });
      expect(customEmail.safeParse('user@example.com').success).toBe(true);
      expect(customEmail.safeParse('user@other.com').success).toBe(false);
    });
  });

  describe('uuid()', () => {
    const uuidValidator = v.uuid();

    it('should validate valid UUIDs', () => {
      expect(uuidValidator.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
      expect(uuidValidator.safeParse('123E4567-E89B-12D3-A456-426614174000').success).toBe(true);
      expect(uuidValidator.safeParse('00000000-0000-0000-0000-000000000000').success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(uuidValidator.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidValidator.safeParse('123e4567-e89b-12d3-a456').success).toBe(false);
      expect(uuidValidator.safeParse('123e4567-e89b-12d3-a456-426614174000-extra').success).toBe(false);
    });

    it('should support version option', () => {
      const uuidv4 = v.uuid({ version: 'v4' });
      expect(uuidv4.safeParse('123e4567-e89b-42d3-a456-426614174000').success).toBe(true);
      expect(uuidv4.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(false);
    });
  });

  describe('uuidv4()', () => {
    const uuidv4Validator = v.uuidv4();

    it('should only validate UUID v4', () => {
      expect(uuidv4Validator.safeParse('123e4567-e89b-42d3-a456-426614174000').success).toBe(true);
      expect(uuidv4Validator.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(false);
    });
  });

  describe('hostname()', () => {
    const hostnameValidator = v.hostname();

    it('should validate valid hostnames', () => {
      expect(hostnameValidator.safeParse('example.com').success).toBe(true);
      expect(hostnameValidator.safeParse('subdomain.example.com').success).toBe(true);
      expect(hostnameValidator.safeParse('my-app.example.com').success).toBe(true);
      expect(hostnameValidator.safeParse('a.b.c.d.example.com').success).toBe(true);
    });

    it('should reject invalid hostnames', () => {
      expect(hostnameValidator.safeParse('-invalid.com').success).toBe(false);
      expect(hostnameValidator.safeParse('invalid-.com').success).toBe(false);
      expect(hostnameValidator.safeParse('').success).toBe(false);
    });
  });

  describe('emoji()', () => {
    const emojiValidator = v.emoji();

    it('should validate emojis', () => {
      expect(emojiValidator.safeParse('😀').success).toBe(true);
      expect(emojiValidator.safeParse('👨‍👩‍👧‍👦').success).toBe(true);
      expect(emojiValidator.safeParse('❤️').success).toBe(true);
    });

    it('should reject non-emoji strings', () => {
      expect(emojiValidator.safeParse('hello').success).toBe(false);
      expect(emojiValidator.safeParse('123').success).toBe(false);
    });
  });

  describe('base64() and base64url()', () => {
    const base64Validator = v.base64();
    const base64urlValidator = v.base64url();

    it('should validate standard base64', () => {
      expect(base64Validator.safeParse('SGVsbG8gV29ybGQ=').success).toBe(true);
      expect(base64Validator.safeParse('VGVzdA==').success).toBe(true);
      expect(base64Validator.safeParse('YWJj').success).toBe(true);
    });

    it('should reject invalid base64', () => {
      expect(base64Validator.safeParse('Not @ base64!').success).toBe(false);
    });

    it('should validate URL-safe base64', () => {
      expect(base64urlValidator.safeParse('SGVsbG8gV29ybGQ').success).toBe(true);
      expect(base64urlValidator.safeParse('abc123-_').success).toBe(true);
    });
  });

  describe('hex()', () => {
    const hexValidator = v.hex();

    it('should validate hexadecimal strings', () => {
      expect(hexValidator.safeParse('deadbeef').success).toBe(true);
      expect(hexValidator.safeParse('DEADBEEF').success).toBe(true);
      expect(hexValidator.safeParse('123abc').success).toBe(true);
      expect(hexValidator.safeParse('').success).toBe(true);
    });

    it('should reject invalid hex', () => {
      expect(hexValidator.safeParse('xyz').success).toBe(false);
      expect(hexValidator.safeParse('123g').success).toBe(false);
    });
  });

  describe('jwt()', () => {
    const jwtValidator = v.jwt();

    it('should validate valid JWT tokens', () => {
      const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(jwtValidator.safeParse(validJwt).success).toBe(true);
    });

    it('should reject invalid JWT', () => {
      // JWT must contain base64url-safe characters only
      expect(jwtValidator.safeParse('invalid@chars').success).toBe(false);
      expect(jwtValidator.safeParse('only-two').success).toBe(false);
    });
  });

  describe('nanoid()', () => {
    const nanoidValidator = v.nanoid();

    it('should validate Nano IDs (21 chars)', () => {
      expect(nanoidValidator.safeParse('V1StGXR8_Z5jdHi6B-myT').success).toBe(true);
      expect(nanoidValidator.safeParse('123456789012345678901').success).toBe(true);
    });

    it('should reject wrong length', () => {
      expect(nanoidValidator.safeParse('short').success).toBe(false);
      expect(nanoidValidator.safeParse('way_too_long_for_nanoid_123').success).toBe(false);
    });
  });

  describe('cuid() and cuid2()', () => {
    const cuidValidator = v.cuid();
    const cuid2Validator = v.cuid2();

    it('should validate CUIDs', () => {
      expect(cuidValidator.safeParse('clhqv3xk00000qoq2e8j0k6rh').success).toBe(true);
      expect(cuidValidator.safeParse('ckhqv3xk00000qoq2e8j0k6rh').success).toBe(true);
    });

    it('should validate CUID2', () => {
      expect(cuid2Validator.safeParse('clhqv3xk00000qoq2e8j0k6rh').success).toBe(true);
      expect(cuid2Validator.safeParse('abc123').success).toBe(true);
    });
  });

  describe('ulid()', () => {
    const ulidValidator = v.ulid();

    it('should validate ULIDs', () => {
      expect(ulidValidator.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV').success).toBe(true);
      expect(ulidValidator.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FBV').success).toBe(true);
    });

    it('should reject invalid ULIDs', () => {
      expect(ulidValidator.safeParse('invalid-ulid!').success).toBe(false);
      expect(ulidValidator.safeParse('SHORT').success).toBe(false);
    });
  });

  describe('ipv4() and ipv6()', () => {
    const ipv4Validator = v.ipv4();
    const ipv6Validator = v.ipv6();

    it('should validate IPv4 addresses', () => {
      expect(ipv4Validator.safeParse('192.168.1.1').success).toBe(true);
      expect(ipv4Validator.safeParse('0.0.0.0').success).toBe(true);
      expect(ipv4Validator.safeParse('255.255.255.255').success).toBe(true);
    });

    it('should reject invalid IPv4', () => {
      expect(ipv4Validator.safeParse('256.1.1.1').success).toBe(false);
      expect(ipv4Validator.safeParse('192.168.1').success).toBe(false);
    });

    it('should validate IPv6 addresses', () => {
      // Full IPv6 address
      expect(ipv6Validator.safeParse('2001:0db8:85a3:0000:0000:8a2e:0370:7334').success).toBe(true);
      // Full IPv6 with different casing
      expect(ipv6Validator.safeParse('2001:0DB8:85A3:0000:0000:8A2E:0370:7334').success).toBe(true);
    });
  });

  describe('mac() and cidrv4()', () => {
    const macValidator = v.mac();
    const cidrValidator = v.cidrv4();

    it('should validate MAC addresses', () => {
      expect(macValidator.safeParse('00:1A:2B:3C:4D:5E').success).toBe(true);
      expect(macValidator.safeParse('00-1A-2B-3C-4D-5E').success).toBe(false); // Wrong format
    });

    it('should validate CIDR notation', () => {
      expect(cidrValidator.safeParse('192.168.1.0/24').success).toBe(true);
      expect(cidrValidator.safeParse('10.0.0.0/8').success).toBe(true);
      expect(cidrValidator.safeParse('192.168.1.1/33').success).toBe(false); // Invalid subnet
    });
  });

  describe('e164()', () => {
    const e164Validator = v.e164();

    it('should validate E.164 phone numbers', () => {
      expect(e164Validator.safeParse('+14155552671').success).toBe(true);
      expect(e164Validator.safeParse('+442071234567').success).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(e164Validator.safeParse('14155552671').success).toBe(false); // Missing +
      expect(e164Validator.safeParse('+1 (415) 555-2671').success).toBe(false); // Has spaces
    });
  });

  describe('hash()', () => {
    it('should validate MD5 hashes', () => {
      const md5Validator = v.hash('md5');
      expect(md5Validator.safeParse('d41d8cd98f00b204e9800998ecf8427e').success).toBe(true);
      expect(md5Validator.safeParse('invalid').success).toBe(false);
    });

    it('should validate SHA1 hashes', () => {
      const sha1Validator = v.hash('sha1');
      expect(sha1Validator.safeParse('da39a3ee5e6b4b0d3255bfef95601890afd80709').success).toBe(true);
    });

    it('should validate SHA256 hashes', () => {
      const sha256Validator = v.hash('sha256');
      expect(sha256Validator.safeParse('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855').success).toBe(true);
    });

    it('should validate SHA384 hashes', () => {
      const sha384Validator = v.hash('sha384');
      expect(sha384Validator.safeParse('38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b').success).toBe(true);
    });

    it('should validate SHA512 hashes', () => {
      const sha512Validator = v.hash('sha512');
      expect(sha512Validator.safeParse('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e').success).toBe(true);
    });
  });

  describe('iso()', () => {
    describe('date()', () => {
      const isoDate = v.iso.date();

      it('should validate ISO dates', () => {
        expect(isoDate.safeParse('2023-01-15').success).toBe(true);
        expect(isoDate.safeParse('2023-12-31').success).toBe(true);
      });

      it('should reject invalid dates', () => {
        expect(isoDate.safeParse('2023-13-01').success).toBe(false);
        expect(isoDate.safeParse('2023-01-32').success).toBe(false);
      });
    });

    describe('time()', () => {
      const isoTime = v.iso.time();

      it('should validate ISO times', () => {
        expect(isoTime.safeParse('13:45:30').success).toBe(true);
        expect(isoTime.safeParse('23:59:59').success).toBe(true);
        expect(isoTime.safeParse('13:45:30.123').success).toBe(true);
      });

      it('should reject invalid times', () => {
        expect(isoTime.safeParse('25:00:00').success).toBe(false);
      });
    });

    describe('dateTime()', () => {
      const isoDateTime = v.iso.dateTime();

      it('should validate ISO date-times', () => {
        expect(isoDateTime.safeParse('2023-01-15T13:45:30Z').success).toBe(true);
        expect(isoDateTime.safeParse('2023-12-31T23:59:59').success).toBe(true);
      });
    });

    describe('duration()', () => {
      const isoDuration = v.iso.duration();

      it('should validate ISO durations', () => {
        expect(isoDuration.safeParse('P1Y').success).toBe(true);
        expect(isoDuration.safeParse('P1DT12H').success).toBe(true);
        expect(isoDuration.safeParse('PT5M30S').success).toBe(true);
      });

      it('should reject invalid durations', () => {
        expect(isoDuration.safeParse('1Y').success).toBe(false);
      });
    });
  });

  describe('stringFormat()', () => {
    it('should create custom format validators', () => {
      const customFormat = v.stringFormat('custom', /^[A-Z]{2}\d{4}$/);
      expect(customFormat.safeParse('AB1234').success).toBe(true);
      expect(customFormat.safeParse('invalid').success).toBe(false);
    });

    it('should support function validators', () => {
      const customFormat = v.stringFormat('custom', (val) => val.startsWith('test_'));
      expect(customFormat.safeParse('test_value').success).toBe(true);
      expect(customFormat.safeParse('invalid').success).toBe(false);
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const optionalEmail = v.email().optional();
      expect(optionalEmail.safeParse('user@example.com').success).toBe(true);
      expect(optionalEmail.safeParse(undefined).success).toBe(true);
    });

    it('should work with nullable', () => {
      const nullableUuid = v.uuid().nullable();
      expect(nullableUuid.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
      expect(nullableUuid.safeParse(null).success).toBe(true);
    });

    it('should work with transform', () => {
      const lowercaseEmail = v.email().transform((val) => val.toLowerCase());
      const result = lowercaseEmail.safeParse('USER@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });

    it('should work with refine', () => {
      const specificDomain = v.email().refine((email) => email.endsWith('@example.com'));
      expect(specificDomain.safeParse('user@example.com').success).toBe(true);
      expect(specificDomain.safeParse('user@other.com').success).toBe(false);
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const userSchema = v.object({
        email: v.email(),
        userId: v.uuid(),
        apiKey: v.nanoid()
      });

      expect(userSchema.safeParse({
        email: 'user@example.com',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        apiKey: 'V1StGXR8_Z5jdHi6B-myT'
      }).success).toBe(true);
    });

    it('should work in arrays', () => {
      const emailsSchema = v.array(v.email());

      expect(emailsSchema.safeParse([
        'user1@example.com',
        'user2@example.com'
      ]).success).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should provide descriptive error messages', () => {
      const emailValidator = v.email();
      const result = emailValidator.safeParse('invalid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('email');
      }
    });

    it('should work with custom error messages in refine', () => {
      const customEmail = v.email().refine(
        (email) => email.endsWith('@example.com'),
        'Must be an example.com email'
      );

      const result = customEmail.safeParse('user@other.com');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Must be an example.com email');
      }
    });
  });
});
