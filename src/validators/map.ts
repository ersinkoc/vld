import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable Map validator
 */
export class VldMap<K, V> extends VldBase<unknown, Map<K, V>> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly keyValidator: VldBase<unknown, K>,
    private readonly valueValidator: VldBase<unknown, V>,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new Map validator
   */
  static create<K, V>(
    keyValidator: VldBase<unknown, K>,
    valueValidator: VldBase<unknown, V>
  ): VldMap<K, V> {
    return new VldMap(keyValidator, valueValidator);
  }
  
  /**
   * Parse and validate a Map value
   */
  parse(value: unknown): Map<K, V> {
    if (!(value instanceof Map)) {
      throw new Error(this.errorMessage || getMessages().invalidMap);
    }
    
    const result = new Map<K, V>();
    for (const [key, val] of value) {
      try {
        const validKey = this.keyValidator.parse(key);
        const validValue = this.valueValidator.parse(val);
        result.set(validKey, validValue);
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }
    
    return result;
  }
  
  /**
   * Safely parse and validate a Map value
   */
  safeParse(value: unknown): ParseResult<Map<K, V>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}