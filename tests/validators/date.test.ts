import { describe, it, expect } from '@jest/globals';
import { VldDate } from '../../src/validators/date';

describe('VldDate', () => {
  it('should handle chained error messages correctly', () => {
    const minDate = new Date('2023-01-01');
    const maxDate = new Date('2023-12-31');
    const validator = VldDate.create()
      .min(minDate, 'Date must be after 2023-01-01')
      .max(maxDate, 'Date must be before 2023-12-31');

    expect(() => validator.parse(new Date('2022-12-31'))).toThrow(
      'Date must be after 2023-01-01'
    );

    expect(() => validator.parse(new Date('2024-01-01'))).toThrow(
      'Date must be before 2023-12-31'
    );
  });
});
