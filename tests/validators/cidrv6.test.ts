import { v, Infer } from '../../src';

describe('VldCidrv6 (IPv6 CIDR validator)', () => {
  describe('basic validation', () => {
    it('should accept valid IPv6 CIDR blocks', () => {
      const schema = v.cidrv6();

      // Full IPv6 CIDR
      expect(schema.safeParse('2001:0db8:85a3:0000:0000:8a2e:0370:7334/64').success).toBe(true);
      expect(schema.safeParse('2001:db8:85a3:0:0:8a2e:370:7334/128').success).toBe(true);
      expect(schema.safeParse('fe80:0000:0000:0000:0000:0000:0000:0001/10').success).toBe(true);
    });

    it('should accept valid IPv6 CIDR with various prefix lengths', () => {
      const schema = v.cidrv6();

      expect(schema.safeParse('2001:db8::/32').success).toBe(true);
      expect(schema.safeParse('fe80::/10').success).toBe(true);
      expect(schema.safeParse('::1/128').success).toBe(true);
    });

    it('should reject invalid IPv6 CIDR blocks', () => {
      const schema = v.cidrv6();

      // Invalid prefix length (129 is out of range)
      expect(schema.safeParse('2001:db8::/129').success).toBe(false);

      // IPv4 CIDR (not valid for cidrv6)
      expect(schema.safeParse('192.168.1.0/24').success).toBe(false);

      // Missing prefix
      expect(schema.safeParse('2001:db8::').success).toBe(false);

      // Invalid format
      expect(schema.safeParse('not-a-cidr').success).toBe(false);
    });

    it('should reject non-string input', () => {
      const schema = v.cidrv6();

      expect(schema.safeParse(123).success).toBe(false);
      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse(undefined).success).toBe(false);
      expect(schema.safeParse({}).success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should infer string type', () => {
      const schema = v.cidrv6();
      type Inferred = Infer<typeof schema>;

      // TypeScript compile-time check
      const value: Inferred = '2001:db8::/32';
      expect(typeof value).toBe('string');
    });
  });
});
