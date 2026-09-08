import { describe, expect, it } from 'vitest';

import { getDiceRoll } from '../../src/application/get-dice-roll.js';

describe('getDiceRoll', () => {
  it('returns a valid integer dice value', () => {
    for (let index = 0; index < 100; index += 1) {
      const result = getDiceRoll();

      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('maps the boundaries to one and six', () => {
    expect(getDiceRoll(() => 0)).toBe(1);
    expect(getDiceRoll(() => 0.999_999)).toBe(6);
  });
});
