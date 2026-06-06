import { describe, it, expect } from 'vitest';
import { maskPhone, maskCurrency, maskCurrencyInput, parseCurrency } from '@/lib/masks';

describe('maskPhone', () => {
  it('returns empty string for empty input', () => {
    expect(maskPhone('')).toBe('');
  });

  it('formats 2 digits with opening paren', () => {
    expect(maskPhone('48')).toBe('(48');
  });

  it('formats 7 digits', () => {
    expect(maskPhone('4899999')).toBe('(48) 99999');
  });

  it('formats full 11 digits', () => {
    expect(maskPhone('48999990000')).toBe('(48) 99999-0000');
  });

  it('strips non-digit characters', () => {
    expect(maskPhone('(48) abc 9999-0000')).toBe('(48) 99990-000');
  });

  it('truncates beyond 11 digits', () => {
    expect(maskPhone('489999900001234')).toBe('(48) 99999-0000');
  });
});

describe('maskCurrency', () => {
  it('formats 1500.5 → "1.500,50"', () => {
    expect(maskCurrency(1500.5)).toBe('1.500,50');
  });

  it('formats 0 → "0,00"', () => {
    expect(maskCurrency(0)).toBe('0,00');
  });

  it('formats 1000000 → "1.000.000,00"', () => {
    expect(maskCurrency(1000000)).toBe('1.000.000,00');
  });

  it('formats 0.99 → "0,99"', () => {
    expect(maskCurrency(0.99)).toBe('0,99');
  });
});

describe('maskCurrencyInput', () => {
  it('formats "15000" → "150,00"', () => {
    expect(maskCurrencyInput('15000')).toBe('150,00');
  });

  it('formats "1500050" → "15.000,50"', () => {
    expect(maskCurrencyInput('1500050')).toBe('15.000,50');
  });

  it('returns "0,00" for empty string', () => {
    expect(maskCurrencyInput('')).toBe('0,00');
  });

  it('strips non-digits before formatting', () => {
    // 'R$ 1.500,50' → digits '150050' → 1500.50 → '1.500,50'
    expect(maskCurrencyInput('R$ 1.500,50')).toBe('1.500,50');
  });

  it('formats single digit "5" → "0,05"', () => {
    expect(maskCurrencyInput('5')).toBe('0,05');
  });
});

describe('parseCurrency', () => {
  it('parses "1.500,50" → 1500.5', () => {
    expect(parseCurrency('1.500,50')).toBe(1500.5);
  });

  it('parses "0,00" → 0', () => {
    expect(parseCurrency('0,00')).toBe(0);
  });

  it('parses "15.000,00" → 15000', () => {
    expect(parseCurrency('15.000,00')).toBe(15000);
  });

  it('returns 0 for invalid string', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0);
  });
});
