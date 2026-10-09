/**
 * IP validation utilities
 * BUG-NEW-001 FIX: Extracted from validators/string.ts and coercion/string.ts
 * to eliminate code duplication (80 lines duplicated in two files)
 */

/**
 * Safe IPv6 validation function to prevent ReDoS attacks
 * Uses multiple simple checks instead of one complex regex
 */
export function isValidIPv6(ip: string): boolean {
  // Length check - IPv6 addresses should be reasonable length (allow zone IDs)
  if (ip.length === 0 || ip.length > 64) {
    return false;
  }

  // Allow zone IDs (interface identifiers) by splitting them out
  const ipParts = ip.split('%');
  const ipPart = ipParts[0]!;
  const zoneId = ipParts[1];
  let address = zoneId ? ipPart : ip;

  // An embedded IPv4 tail (::ffff:1.2.3.4, 64:ff9b::1.2.3.4, 1:2:3:4:5:6:1.2.3.4)
  // must be a valid dotted quad and stands for the last two 16-bit groups.
  if (address.includes('.')) {
    const lastColon = address.lastIndexOf(':');
    if (lastColon === -1 || !IPV4_TAIL.test(address.slice(lastColon + 1))) {
      return false;
    }
    address = `${address.slice(0, lastColon + 1)}0:0`;
  }

  // Only hex digits and colons; also bounds the work below (ReDoS-safe).
  if (address.length > 45 || !/^[0-9a-fA-F:]+$/.test(address)) {
    return false;
  }

  // At most one "::" (":::" is caught too: its two overlapping matches differ).
  const compression = address.indexOf('::');
  if (compression !== address.lastIndexOf('::')) {
    return false;
  }

  if (compression === -1) {
    const groups = address.split(':');
    return groups.length === 8 && groups.every(isHexGroup);
  }

  // Groups on each side of "::" must all be 1-4 hex digits, so a stray
  // leading/trailing single ":" (":1::2", "1::2:") yields an empty group.
  const head = address.slice(0, compression);
  const tail = address.slice(compression + 2);
  const groups = [...(head === '' ? [] : head.split(':')), ...(tail === '' ? [] : tail.split(':'))];
  return groups.length <= 7 && groups.every(isHexGroup);
}

// Same octet grammar as the standalone ipv4 format: no leading zeros (inet_aton reads "010" as octal).
const IPV4_TAIL = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

function isHexGroup(group: string): boolean {
  return /^[0-9a-fA-F]{1,4}$/.test(group);
}

/**
 * IPv6 address as Zod's ipv6 format accepts it: `isValidIPv6` without the
 * RFC 4007 zone id (`fe80::1%eth0`), which is not part of an address literal.
 */
export function isValidIPv6Address(ip: string): boolean {
  return !ip.includes('%') && isValidIPv6(ip);
}

/**
 * IPv6 CIDR block: a valid IPv6 address, "/", and a canonical prefix length
 * 0-128 (no sign, exponent, hex, whitespace or leading zeros).
 */
export function isValidCidrV6(value: string): boolean {
  const separator = value.lastIndexOf('/');
  if (separator <= 0) return false;
  return /^(?:12[0-8]|1[01]\d|[1-9]?\d)$/.test(value.slice(separator + 1)) && isValidIPv6Address(value.slice(0, separator));
}
