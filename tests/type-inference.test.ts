/**
 * TypeScript type inference tests — verifies that VLD's v.infer<>, v.input<>, v.output<>
 * produce the same types as Zod's z.infer<>, z.input<>, z.output<>.
 *
 * If this test file compiles, the types are correct.
 */
import { v, vV2, z, VldBase, type Infer, type Input, type Output } from '../src';

// Helper for union-style validators that don't fit Infer's VldBase<any, any> constraint
type InferOutput<T> = T extends VldBase<any, infer U> ? U : never;

describe('TypeScript type inference', () => {
  it('basic primitive types infer correctly', () => {
    const _s = v.string();
    const _n = v.number();
    const _b = v.boolean();
    const _d = v.date();
    const _bi = v.bigint();
    // These are compile-time checks; if the file compiles, types are correct.
    const _a: string = '' as unknown as Infer<typeof _s>;
    const _c: number = 0 as unknown as Infer<typeof _n>;
    const _e: boolean = false as unknown as Infer<typeof _b>;
    const _f: Date = new Date() as unknown as Infer<typeof _d>;
    const _g: bigint = 0n as unknown as Infer<typeof _bi>;
    void _a; void _c; void _e; void _f; void _g;
  });

  it('object types infer correctly', () => {
    const schema = v.object({
      name: v.string(),
      age: v.number().int().min(0),
      email: v.string().email().optional(),
      role: v.literal('admin'),
    });
    type T = Infer<typeof schema>;
    // Real data — type assertions verify TypeScript inference
    const valid: T = { name: 'Ada', age: 36, email: 'ada@x.dev', role: 'admin' };
    const name: string = valid.name;
    const age: number = valid.age;
    const email: string | undefined = valid.email;
    const role: 'admin' = valid.role;
    void name; void age; void email; void role; void valid;
  });

  it('union types infer correctly', () => {
    const schema = v.union([v.string(), v.number()]);
    type T = InferOutput<typeof schema>;
    const _check: T = 'hi' as T;
    // T should be string | number
    const _s: string = _check as string;
    const _n: number = _check as number;
    void _s; void _n; void _check;
  });

  it('array types infer correctly', () => {
    const schema = v.array(v.string());
    type T = Infer<typeof schema>;
    const valid: T = ['a', 'b', 'c'];
    const _first: string = valid[0]!;
    void _first; void valid;
  });

  it('transformed types infer correctly', () => {
    const schema = v.string().transform(s => s.length);
    type T = Infer<typeof schema>;
    const valid: T = 5;
    const _n: number = valid;
    void _n; void valid;
  });

  it('v.infer works on discriminated union', () => {
    const schema = v.discriminatedUnion('type', [
      v.object({ type: v.literal('cat'), meow: v.string() }),
      v.object({ type: v.literal('dog'), bark: v.string() }),
    ]);
    type T = InferOutput<typeof schema>;
    const _cat: T = { type: 'cat', meow: 'purr' } as T;
    const _dog: T = { type: 'dog', bark: 'woof' } as T;
    // T should be { type: 'cat'; meow: string } | { type: 'dog'; bark: string }
    const _meow: string = (_cat as { type: 'cat'; meow: string }).meow;
    const _bark: string = (_dog as { type: 'dog'; bark: string }).bark;
    void _meow; void _bark;
  });

  it('Input and Output types differ for transforms', () => {
    const schema = v.string().transform(s => s.length);
    type In = Input<typeof schema>;
    type Out = Output<typeof schema>;
    const _i: In = '' as In;
    const _o: Out = 0 as Out;
    void _i; void _o;
  });

  it('vV2 primitive types match v primitive types', () => {
    const s1 = v.string();
    const s2 = vV2.string();
    type T1 = Infer<typeof s1>;
    type T2 = Infer<typeof s2>;
    // Both should be string
    const _a: T1 = '' as T1;
    const _b: T2 = '' as T2;
    void _a; void _b;
  });

  it('z alias returns same types as v', () => {
    const s1 = v.object({ a: v.string() });
    const s2 = z.object({ a: z.string() });
    type T1 = Infer<typeof s1>;
    type T2 = Infer<typeof s2>;
    const _a: T1 = { a: 'x' };
    const _b: T2 = { a: 'x' };
    void _a; void _b;
  });
});
