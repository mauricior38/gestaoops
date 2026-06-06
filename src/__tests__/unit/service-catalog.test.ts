import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SERVICE_CATALOG,
  SERVICE_NATURE_LABELS,
  serviceFixedValues,
  serviceDefFromName,
  managedServiceNames,
  type ServiceDef,
} from '@/types/service';

describe('DEFAULT_SERVICE_CATALOG', () => {
  it('has 22 services', () => {
    expect(DEFAULT_SERVICE_CATALOG).toHaveLength(22);
  });

  it('all entries have required fields', () => {
    DEFAULT_SERVICE_CATALOG.forEach((s) => {
      expect(s.name).toBeTruthy();
      expect(['estudio', 'externo', 'retransmissao', 'outro']).toContain(s.nature);
      expect(typeof s.requiresCrew).toBe('boolean');
      expect(typeof s.managed).toBe('boolean');
    });
  });

  it('Programa Bora Leilão has fixedValue 75', () => {
    const bora = DEFAULT_SERVICE_CATALOG.find((s) => s.name === 'Programa Bora Leilão');
    expect(bora).toBeDefined();
    expect(bora!.fixedValue).toBe(75);
  });
});

describe('SERVICE_NATURE_LABELS', () => {
  it('has 4 labels', () => {
    expect(Object.keys(SERVICE_NATURE_LABELS)).toHaveLength(4);
  });

  it('covers all natures', () => {
    expect(SERVICE_NATURE_LABELS.estudio).toBe('Estúdio');
    expect(SERVICE_NATURE_LABELS.externo).toBe('Externo (viagem)');
    expect(SERVICE_NATURE_LABELS.retransmissao).toBe('Retransmissão');
    expect(SERVICE_NATURE_LABELS.outro).toBe('Outro (mídia/edição)');
  });
});

describe('serviceFixedValues', () => {
  it('extracts fixed values from catalog', () => {
    const vals = serviceFixedValues(DEFAULT_SERVICE_CATALOG);
    expect(vals['Programa Bora Leilão']).toBe(75);
  });

  it('excludes services without fixedValue', () => {
    const vals = serviceFixedValues(DEFAULT_SERVICE_CATALOG);
    expect(vals['Live']).toBeUndefined();
    expect(vals['Transmissão Estúdio']).toBeUndefined();
  });

  it('returns empty for catalog without fixed values', () => {
    const catalog: ServiceDef[] = [
      { name: 'Test', nature: 'estudio', requiresCrew: true, managed: true },
    ];
    expect(serviceFixedValues(catalog)).toEqual({});
  });
});

describe('serviceDefFromName', () => {
  it('finds known service by name', () => {
    const def = serviceDefFromName('Live');
    expect(def.name).toBe('Live');
    expect(def.nature).toBe('estudio');
    expect(def.requiresCrew).toBe(true);
    expect(def.managed).toBe(true);
  });

  it('returns default for unknown name', () => {
    const def = serviceDefFromName('Serviço Inexistente');
    expect(def.name).toBe('Serviço Inexistente');
    expect(def.nature).toBe('estudio');
    expect(def.requiresCrew).toBe(true);
    expect(def.managed).toBe(true);
  });
});

describe('managedServiceNames', () => {
  it('filters only managed services', () => {
    const names = managedServiceNames(DEFAULT_SERVICE_CATALOG);
    // Should include managed services
    expect(names).toContain('Live');
    expect(names).toContain('Transmissão Estúdio');
    expect(names).toContain('Retransmissão');
    // Should NOT include non-managed
    expect(names).not.toContain('Reels Relacionamento');
    expect(names).not.toContain('Edição de Vídeos');
  });

  it('returns fewer items than total catalog', () => {
    const names = managedServiceNames(DEFAULT_SERVICE_CATALOG);
    expect(names.length).toBeLessThan(DEFAULT_SERVICE_CATALOG.length);
    expect(names.length).toBeGreaterThan(0);
  });
});
