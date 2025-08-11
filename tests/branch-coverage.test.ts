import { describe, it, expect } from '@jest/globals';
import { v, VldString, VldNumber, VldDate, VldBoolean, VldVoid } from '../src/index';

describe('Complete Branch Coverage Tests', () => {
  
  describe('Error message fallbacks', () => {
    it('covers string error message fallback when errorMessage is undefined', () => {
      const validator = new VldString();
      // Force errorMessage to be undefined
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse(123)).toThrow('Invalid string');
    });

    it('covers string check failure fallback when errorMessage is undefined', () => {
      const validator = v.string().min(5);
      // Force errorMessage to be undefined  
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse('hi')).toThrow('Invalid string');
    });

    it('covers number error message fallback when errorMessage is undefined', () => {
      const validator = new VldNumber();
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse('not a number')).toThrow('Invalid number');
    });

    it('covers number check failure fallback when errorMessage is undefined', () => {
      const validator = v.number().min(5);
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse(3)).toThrow('Invalid number');
    });

    it('covers date error message fallback when errorMessage is undefined', () => {
      const validator = new VldDate();
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse('invalid')).toThrow('Invalid date');
    });

    it('covers date check failure fallback when errorMessage is undefined', () => {
      const validator = v.date().min(new Date('2024-01-01'));
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse(new Date('2023-01-01'))).toThrow('Invalid date');
    });

    it('covers boolean error message fallback when errorMessage is undefined', () => {
      const validator = new VldBoolean();
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse('not boolean')).toThrow('Invalid boolean');
    });

    it('covers void parse branch', () => {
      const validator = new VldVoid();
      
      expect(() => validator.parse('not undefined')).toThrow('Expected undefined');
    });

    it('covers void safeParse success branch', () => {
      const validator = new VldVoid();
      
      const result = validator.safeParse(undefined);
      expect(result).toEqual({ success: true, data: undefined });
    });

    it('covers void safeParse error branch', () => {
      const validator = new VldVoid();
      
      const result = validator.safeParse('not undefined') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Expected undefined');
    });
  });

  describe('Additional edge cases', () => {
    it('covers array parse with invalid item type', () => {
      const validator = v.array(v.string());
      
      expect(() => validator.parse(['valid', 123, 'also valid'])).toThrow();
    });

    it('covers object parse with missing required field', () => {
      const validator = v.object({
        name: v.string(),
        age: v.number()
      });
      
      expect(() => validator.parse({ name: 'John' })).toThrow();
    });

    it('covers union with all validators failing', () => {
      const validator = v.union(v.string(), v.number());
      
      expect(() => validator.parse(true)).toThrow();
    });

    it('covers literal validation failure', () => {
      const validator = v.literal('test');
      
      expect(() => validator.parse('wrong')).toThrow();
    });

    it('covers enum validation failure', () => {
      const validator = v.enum('red', 'green', 'blue');
      
      expect(() => validator.parse('yellow')).toThrow();
    });
  });

  describe('Error message branches in error state', () => {
    it('covers string with null errorMessage in check failure', () => {
      const validator = v.string().min(10);
      (validator as any).errorMessage = null;
      
      expect(() => validator.parse('short')).toThrow();
    });

    it('covers number with empty errorMessage in parse failure', () => {
      const validator = new VldNumber();
      (validator as any).errorMessage = '';
      
      expect(() => validator.parse(NaN)).toThrow();
    });

    it('covers date with null errorMessage in invalid date', () => {
      const validator = new VldDate();
      (validator as any).errorMessage = null;
      
      expect(() => validator.parse('not-a-date')).toThrow();
    });

    it('covers date parse with invalid type and undefined errorMessage', () => {
      const validator = new VldDate();
      (validator as any).errorMessage = undefined;
      
      expect(() => validator.parse(true)).toThrow('Invalid date');
    });
  });
});