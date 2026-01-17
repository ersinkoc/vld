/**
 * Coverage tests for ip-validation.ts
 * These tests target specific uncovered edge cases
 */

import { isValidIPv6 } from '../../src/utils/ip-validation';

describe('IP Validation Coverage Tests', () => {
  describe('isValidIPv6 - ReDoS prevention', () => {
    it('should reject IPv6 longer than 45 characters (ReDoS protection)', () => {
      // Create an IPv6 that passes character check but exceeds length limit
      // A valid-looking IPv6 with too many characters
      const longIpv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334' + '0'.repeat(10);

      expect(isValidIPv6(longIpv6)).toBe(false);
    });
  });

  describe('isValidIPv6 - basic validation', () => {
    it('should accept valid full IPv6', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should accept valid compressed IPv6', () => {
      expect(isValidIPv6('2001:db8:85a3::8a2e:370:7334')).toBe(true);
    });

    it('should accept loopback', () => {
      expect(isValidIPv6('::1')).toBe(true);
    });

    it('should accept link-local', () => {
      expect(isValidIPv6('fe80::1ff:fe23:4567:890a')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(isValidIPv6('')).toBe(false);
    });

    it('should reject too long overall (> 64)', () => {
      expect(isValidIPv6('a'.repeat(65))).toBe(false);
    });

    it('should reject triple colons', () => {
      expect(isValidIPv6('2001:::1')).toBe(false);
    });

    it('should reject double compression', () => {
      expect(isValidIPv6('2001::1::1')).toBe(false);
    });

    it('should reject too many groups without compression', () => {
      expect(isValidIPv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    });

    it('should reject groups with more than 4 hex chars', () => {
      expect(isValidIPv6('12345:2:3:4:5:6:7:8')).toBe(false);
    });

    it('should accept IPv4-mapped IPv6', () => {
      expect(isValidIPv6('::ffff:192.0.2.1')).toBe(true);
    });

    it('should reject invalid IPv4-mapped without double colon', () => {
      // IPv4 part without proper :: prefix
      expect(isValidIPv6('192.0.2.1')).toBe(false);
    });

    it('should reject IPv4-mapped with invalid IPv4 part', () => {
      expect(isValidIPv6('::ffff:999.0.2.1')).toBe(false);
    });

    it('should accept IPv6 with zone ID', () => {
      expect(isValidIPv6('fe80::1%eth0')).toBe(true);
    });

    it('should reject non-hex characters', () => {
      expect(isValidIPv6('gggg:hhhh:iiii:jjjj:kkkk:llll:mmmm:nnnn')).toBe(false);
    });

    it('should accept 7 groups with compression', () => {
      expect(isValidIPv6('1:2:3:4:5:6::7')).toBe(true);
    });
  });
});
