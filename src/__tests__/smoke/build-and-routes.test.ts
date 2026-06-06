import { describe, it, expect } from 'vitest';

// Smoke test: verify that all critical modules can be imported without errors.
// This catches missing exports, circular dependencies, and syntax errors.

describe('Module imports — smoke test', () => {
  it('imports payment-engine without errors', async () => {
    const mod = await import('@/lib/payment-engine');
    expect(mod.calculateOperatorPayment).toBeTypeOf('function');
    expect(mod.calculateAssignmentDuration).toBeTypeOf('function');
    expect(mod.toSafeDate).toBeTypeOf('function');
    expect(mod.isWeekendOrHoliday).toBeTypeOf('function');
    expect(mod.isInternalService).toBeTypeOf('function');
    expect(mod.isInternalEvent).toBeTypeOf('function');
  });

  it('imports folgas without errors', async () => {
    const mod = await import('@/lib/folgas');
    expect(mod.computeTrips).toBeTypeOf('function');
    expect(mod.computeFolgaBalance).toBeTypeOf('function');
    expect(mod.getTripRoute).toBeTypeOf('function');
  });

  it('imports masks without errors', async () => {
    const mod = await import('@/lib/masks');
    expect(mod.maskPhone).toBeTypeOf('function');
    expect(mod.maskCurrency).toBeTypeOf('function');
    expect(mod.maskCurrencyInput).toBeTypeOf('function');
    expect(mod.parseCurrency).toBeTypeOf('function');
  });

  it('imports service types without errors', async () => {
    const mod = await import('@/types/service');
    expect(mod.DEFAULT_SERVICE_CATALOG).toBeInstanceOf(Array);
    expect(mod.serviceFixedValues).toBeTypeOf('function');
    expect(mod.serviceDefFromName).toBeTypeOf('function');
    expect(mod.managedServiceNames).toBeTypeOf('function');
    expect(mod.SERVICE_NATURE_LABELS).toBeDefined();
  });

  it('imports event types without errors', async () => {
    const mod = await import('@/types/event');
    expect(mod.OPERATION_TYPE_LABELS).toBeDefined();
    expect(mod.OPERATION_TYPE_BADGE).toBeDefined();
  });

  it('imports operator types without errors', async () => {
    const mod = await import('@/types/operator');
    expect(mod.WEEKDAY_LABELS).toBeInstanceOf(Array);
    expect(mod.OPERATOR_FUNCTION_LABELS).toBeDefined();
    expect(mod.isOperatorRestDay).toBeTypeOf('function');
  });

  it('imports payment types without errors', async () => {
    const mod = await import('@/types/payment');
    expect(mod).toBeDefined();
  });

  it('imports auth-context helpers without errors', async () => {
    const mod = await import('@/lib/auth-context');
    expect(mod.isOperatorRole).toBeTypeOf('function');
    expect(mod.OPERATOR_ROLES).toBeInstanceOf(Array);
    expect(mod.ROLE_LABELS).toBeDefined();
  });
});

describe('Type consistency — smoke test', () => {
  it('OperationType includes retransmissao', async () => {
    const { OPERATION_TYPE_LABELS } = await import('@/types/event');
    expect(OPERATION_TYPE_LABELS).toHaveProperty('retransmissao');
    expect(OPERATION_TYPE_LABELS).toHaveProperty('estudio');
    expect(OPERATION_TYPE_LABELS).toHaveProperty('externo');
  });

  it('ROLE_LABELS covers OPERATOR_ROLES', async () => {
    const { OPERATOR_ROLES, ROLE_LABELS } = await import('@/lib/auth-context');
    OPERATOR_ROLES.forEach((role) => {
      expect(ROLE_LABELS[role]).toBeTruthy();
    });
  });

  it('Default service catalog contains studio and external services', async () => {
    const { DEFAULT_SERVICE_CATALOG } = await import('@/types/service');
    const natures = [...new Set(DEFAULT_SERVICE_CATALOG.map((s) => s.nature))];
    expect(natures).toContain('estudio');
    expect(natures).toContain('externo');
    expect(natures).toContain('retransmissao');
    expect(natures).toContain('outro');
  });
});
