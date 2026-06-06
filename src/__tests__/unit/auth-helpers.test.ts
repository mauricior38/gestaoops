import { describe, it, expect } from 'vitest';
import { isOperatorRole, OPERATOR_ROLES, ROLE_LABELS, type SystemRole } from '@/lib/auth-context';

describe('isOperatorRole', () => {
  it('returns true for tecnico', () => {
    expect(isOperatorRole('tecnico')).toBe(true);
  });

  it('returns true for operador_painel', () => {
    expect(isOperatorRole('operador_painel')).toBe(true);
  });

  it('returns true for freelancer_estudio', () => {
    expect(isOperatorRole('freelancer_estudio')).toBe(true);
  });

  it('returns true for freelancer_externo', () => {
    expect(isOperatorRole('freelancer_externo')).toBe(true);
  });

  it('returns true for operacao', () => {
    expect(isOperatorRole('operacao')).toBe(true);
  });

  it('returns true for legacy operador', () => {
    expect(isOperatorRole('operador')).toBe(true);
  });

  it('returns false for admin', () => {
    expect(isOperatorRole('admin')).toBe(false);
  });

  it('returns false for ceo', () => {
    expect(isOperatorRole('ceo')).toBe(false);
  });

  it('returns false for financeiro', () => {
    expect(isOperatorRole('financeiro')).toBe(false);
  });

  it('returns false for planejamento', () => {
    expect(isOperatorRole('planejamento')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isOperatorRole(undefined)).toBe(false);
  });
});

describe('OPERATOR_ROLES', () => {
  it('contains 7 operator roles', () => {
    expect(OPERATOR_ROLES).toHaveLength(7);
  });

  it('includes operacao', () => {
    expect(OPERATOR_ROLES).toContain('operacao');
  });

  it('includes operador_transmissao', () => {
    expect(OPERATOR_ROLES).toContain('operador_transmissao');
  });

  it('does NOT include admin', () => {
    expect(OPERATOR_ROLES).not.toContain('admin');
  });

  it('does NOT include gestor', () => {
    expect(OPERATOR_ROLES).not.toContain('gestor');
  });
});

describe('ROLE_LABELS', () => {
  const allRoles: SystemRole[] = [
    'admin', 'ceo', 'financeiro', 'comercial', 'administrativo',
    'planejamento', 'operacao', 'operador_painel', 'tecnico',
    'freelancer_estudio', 'freelancer_externo', 'operador_transmissao',
    'gestor', 'operador',
  ];

  it('has label for every SystemRole', () => {
    allRoles.forEach((role) => {
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
    });
  });

  it('admin is Administrador', () => {
    expect(ROLE_LABELS.admin).toBe('Administrador');
  });

  it('ceo is CEO', () => {
    expect(ROLE_LABELS.ceo).toBe('CEO');
  });

  it('tecnico is Operador de Transmissão', () => {
    expect(ROLE_LABELS.tecnico).toBe('Operador de Transmissão');
  });
});
