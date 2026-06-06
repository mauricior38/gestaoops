import { describe, it, expect } from 'vitest';
import {
  isOperatorRestDay,
  WEEKDAY_LABELS,
  OPERATOR_FUNCTION_LABELS,
  type OperatorFunction,
} from '@/types/operator';

describe('isOperatorRestDay', () => {
  it('returns true on weekly rest day (Sunday = 0)', () => {
    const op = { weeklyRestDay: 0 }; // Sunday
    const sunday = new Date('2025-03-16'); // Sunday
    expect(isOperatorRestDay(op, sunday)).toBe(true);
  });

  it('returns false on non-rest weekday', () => {
    const op = { weeklyRestDay: 0 }; // Sunday
    const monday = new Date('2025-03-10'); // Monday
    expect(isOperatorRestDay(op, monday)).toBe(false);
  });

  it('returns true on specific rest day from restDays array', () => {
    const op = { restDays: ['2025-03-12'] };
    const date = new Date('2025-03-12');
    expect(isOperatorRestDay(op, date)).toBe(true);
  });

  it('returns false on non-rest specific date', () => {
    const op = { restDays: ['2025-03-12'] };
    const date = new Date('2025-03-13');
    expect(isOperatorRestDay(op, date)).toBe(false);
  });

  it('returns false when no rest day configured', () => {
    const op = {};
    const date = new Date('2025-03-10');
    expect(isOperatorRestDay(op, date)).toBe(false);
  });

  it('returns true when both weekly and specific match', () => {
    const op = { weeklyRestDay: 0, restDays: ['2025-03-16'] }; // Sunday + explicit
    const sunday = new Date('2025-03-16');
    expect(isOperatorRestDay(op, sunday)).toBe(true);
  });
});

describe('WEEKDAY_LABELS', () => {
  it('has 7 items', () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
  });

  it('starts with Domingo', () => {
    expect(WEEKDAY_LABELS[0]).toBe('Domingo');
  });

  it('ends with Sábado', () => {
    expect(WEEKDAY_LABELS[6]).toBe('Sábado');
  });
});

describe('OPERATOR_FUNCTION_LABELS', () => {
  it('has 5 functions', () => {
    expect(Object.keys(OPERATOR_FUNCTION_LABELS)).toHaveLength(5);
  });

  it('tecnico is labeled as Operador de Transmissão', () => {
    expect(OPERATOR_FUNCTION_LABELS.tecnico).toBe('Operador de Transmissão');
  });

  it('all functions have non-empty labels', () => {
    Object.values(OPERATOR_FUNCTION_LABELS).forEach((label) => {
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    });
  });
});
