import { vV2 } from '../../src/index';

describe('direct V2 invocation', () => {
  test('vV2.record(vV2.symbol()) creates VldRecordV2', () => {
    const sym = vV2.symbol();
    expect(sym.isSimple).toBe(true);
    expect((sym as any).validatorType).toBe('symbol');
    const r = vV2.record(sym);
    expect(r.constructor.name).toBe('VldRecordV2');
    expect((r as any).__def.simpleValueMode).toBe('symbol');
  });

  test('vV2.record with simple modes (string, number, bigint, symbol)', () => {
    expect((vV2.record(vV2.string()) as any).__def.simpleValueMode).toBe('string');
    expect((vV2.record(vV2.number()) as any).__def.simpleValueMode).toBe('number');
    expect((vV2.record(vV2.boolean()) as any).__def.simpleValueMode).toBe('boolean');
    expect((vV2.record(vV2.bigint()) as any).__def.simpleValueMode).toBe('bigint');
    expect((vV2.record(vV2.symbol()) as any).__def.simpleValueMode).toBe('symbol');
  });

  test('vV2 union safeParse error path', () => {
    const s = vV2.union(vV2.string(), vV2.number());
    const r = s.safeParse({});
    expect(r.success).toBe(false);
  });

  test('vV2 bigint withDef errorMessage', () => {
    const s = vV2.bigint().min(10n, 'too small');
    const r = s.safeParse(5n);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.message).toContain('too small');
    }
  });

  test('vV2 date withDef errorMessage', () => {
    const s = vV2.date().min(new Date('2024-01-01'), 'too early');
    const r = s.safeParse(new Date('2020-01-01'));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.message).toContain('too early');
    }
  });
});
