import { describe, it, expect } from 'vitest';
import {
  calculateOperatorPayment,
  calculateAssignmentDuration,
  toSafeDate,
  isWeekendOrHoliday,
  isInternalService,
  isInternalEvent,
} from '@/lib/payment-engine';
import { GestaoEvent, EventAssignment } from '@/types/event';
import { PaymentRules, HourRange } from '@/types/operator';
import { Holiday } from '@/types/payment';

// ── Helpers ──────────────────────────────────────────────────

function makeEvent(overrides: Partial<GestaoEvent> = {}): GestaoEvent {
  return {
    title: 'Leilão Teste',
    date: new Date('2025-03-10T19:00:00'), // Monday
    operationType: 'estudio',
    services: [],
    assignments: [],
    revenue: 5000,
    expenses: [],
    status: 'finalizado',
    closing: {
      actualStartTime: new Date('2025-03-10T19:00:00'),
      actualEndTime: new Date('2025-03-10T23:00:00'), // 4h
      durationMinutes: 240,
      closedBy: 'test',
      closedAt: new Date(),
    },
    ...overrides,
  } as GestaoEvent;
}

function makeAssignment(overrides: Partial<EventAssignment> = {}): EventAssignment {
  return {
    operatorId: 'op1',
    operatorName: 'Operador Teste',
    role: 'vMix',
    ...overrides,
  } as EventAssignment;
}

const rulesFreelancerN1: PaymentRules = {
  contractType: 'freelancer_n1',
  hourRanges: [
    { minHours: 0, maxHours: 8, weekdayValue: 100, weekendHolidayValue: 130 },
    { minHours: 8, maxHours: 12, weekdayValue: 150, weekendHolidayValue: 195 },
    { minHours: 12, maxHours: 24, weekdayValue: 200, weekendHolidayValue: 260 },
  ],
  dailyTravel: 200,
  dailyTravelMultiple: 300,
};

const rulesCLT: PaymentRules = {
  contractType: 'funcionario',
  hourRanges: [
    { minHours: 0, maxHours: 3.75, weekdayValue: 0, weekendHolidayValue: 0 },
    { minHours: 3.75, maxHours: 7.75, weekdayValue: 0, weekendHolidayValue: 100 },
    { minHours: 7.75, maxHours: 11.75, weekdayValue: 0, weekendHolidayValue: 150 },
    { minHours: 11.75, maxHours: 24, weekdayValue: 0, weekendHolidayValue: 200 },
  ],
  weekendHolidayBonus: 0,
  dailyTravel: 200,
  dailyTravelMultiple: 300,
};

const rulesFreelancerN2: PaymentRules = {
  contractType: 'freelancer_n2',
  hourRanges: [
    { minHours: 0, maxHours: 8, weekdayValue: 80, weekendHolidayValue: 110 },
    { minHours: 8, maxHours: 12, weekdayValue: 120, weekendHolidayValue: 160 },
    { minHours: 12, maxHours: 24, weekdayValue: 160, weekendHolidayValue: 210 },
  ],
  dailyTravel: 200,
};

const holidays: Holiday[] = [
  { date: '2025-03-11', name: 'Feriado Teste', national: true },
];

// ── toSafeDate ───────────────────────────────────────────────

describe('toSafeDate', () => {
  it('converts ISO string', () => {
    const d = toSafeDate('2025-03-10T19:00:00');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2025);
  });

  it('returns Date as-is', () => {
    const original = new Date('2025-01-01');
    expect(toSafeDate(original)).toBe(original);
  });

  it('converts Firestore Timestamp-like object', () => {
    const ts = { toDate: () => new Date('2025-06-15T10:00:00') };
    const d = toSafeDate(ts);
    expect(d.getMonth()).toBe(5); // June
  });

  it('returns current date for null/undefined', () => {
    const d = toSafeDate(null);
    expect(d).toBeInstanceOf(Date);
    // Should be roughly now
    expect(Math.abs(d.getTime() - Date.now())).toBeLessThan(1000);
  });
});

// ── isWeekendOrHoliday ───────────────────────────────────────

describe('isWeekendOrHoliday', () => {
  it('detects Saturday as weekend', () => {
    const sat = new Date('2025-03-15'); // Saturday
    const result = isWeekendOrHoliday(sat, []);
    expect(result.isWeekend).toBe(true);
    expect(result.isHoliday).toBe(false);
  });

  it('detects Sunday as weekend', () => {
    const sun = new Date('2025-03-16'); // Sunday
    const result = isWeekendOrHoliday(sun, []);
    expect(result.isWeekend).toBe(true);
  });

  it('detects weekday as non-weekend', () => {
    const mon = new Date('2025-03-10'); // Monday
    const result = isWeekendOrHoliday(mon, []);
    expect(result.isWeekend).toBe(false);
    expect(result.isHoliday).toBe(false);
  });

  it('detects holiday', () => {
    const date = new Date('2025-03-11');
    const result = isWeekendOrHoliday(date, holidays);
    expect(result.isHoliday).toBe(true);
  });

  it('non-holiday date returns false', () => {
    const date = new Date('2025-03-12');
    const result = isWeekendOrHoliday(date, holidays);
    expect(result.isHoliday).toBe(false);
  });
});

// ── isInternalService ────────────────────────────────────────

describe('isInternalService', () => {
  it('recognizes "Transmissão Estúdio"', () => {
    expect(isInternalService('Transmissão Estúdio')).toBe(true);
  });

  it('recognizes "Live"', () => {
    expect(isInternalService('Live')).toBe(true);
  });

  it('recognizes "Operação Estúdio"', () => {
    expect(isInternalService('Operação Estúdio')).toBe(true);
  });

  it('rejects "Transmissão Externa"', () => {
    expect(isInternalService('Transmissão Externa')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isInternalService('')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isInternalService('LIVE')).toBe(true);
    expect(isInternalService('live')).toBe(true);
  });
});

// ── isInternalEvent ──────────────────────────────────────────

describe('isInternalEvent', () => {
  it('returns true when at least one internal service', () => {
    expect(isInternalEvent([{ serviceName: 'Live' }, { serviceName: 'Cobertura' }])).toBe(true);
  });

  it('returns false with no internal services', () => {
    expect(isInternalEvent([{ serviceName: 'Transmissão Externa' }])).toBe(false);
  });

  it('returns false with empty array', () => {
    expect(isInternalEvent([])).toBe(false);
  });
});

// ── calculateAssignmentDuration ──────────────────────────────

describe('calculateAssignmentDuration', () => {
  const start = new Date('2025-03-10T19:00:00');
  const end = new Date('2025-03-10T23:00:00'); // 4h = 240min

  it('calculates full duration for non-half-shift', () => {
    expect(calculateAssignmentDuration(start, end, {})).toBe(240);
  });

  it('calculates 1st shift ending at shiftTime', () => {
    const result = calculateAssignmentDuration(start, end, {
      isHalfShift: true,
      halfShiftType: 'primeiro',
      shiftTime: '21:00',
    });
    expect(result).toBe(120); // 19:00 → 21:00 = 2h
  });

  it('calculates 2nd shift starting at shiftTime', () => {
    const result = calculateAssignmentDuration(start, end, {
      isHalfShift: true,
      halfShiftType: 'segundo',
      shiftTime: '21:00',
    });
    expect(result).toBe(120); // 21:00 → 23:00 = 2h
  });

  it('1st shift clamps to actual end if shiftTime > end', () => {
    const result = calculateAssignmentDuration(start, end, {
      isHalfShift: true,
      halfShiftType: 'primeiro',
      shiftTime: '23:30', // beyond end
    });
    expect(result).toBe(240); // full duration
  });

  it('2nd shift with shiftTime before start covers full event', () => {
    const result = calculateAssignmentDuration(start, end, {
      isHalfShift: true,
      halfShiftType: 'segundo',
      shiftTime: '18:00', // before 19:00
    });
    expect(result).toBe(240); // full event from actual start
  });

  it('returns 0 for negative duration', () => {
    const result = calculateAssignmentDuration(end, start, {});
    expect(result).toBe(0);
  });

  it('no shiftTime with isHalfShift returns full duration', () => {
    const result = calculateAssignmentDuration(start, end, {
      isHalfShift: true,
      halfShiftType: 'primeiro',
      // no shiftTime
    });
    expect(result).toBe(240); // falls through to full
  });
});

// ── calculateOperatorPayment ─────────────────────────────────

describe('calculateOperatorPayment', () => {
  // Freelancer N1 — weekday 4h → R$100
  it('Freelancer N1 weekday 4h = R$100', () => {
    const event = makeEvent();
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, []);
    expect(result.baseValue).toBe(100);
    expect(result.travelValue).toBe(0);
    expect(result.bonusValue).toBe(0);
    expect(result.totalValue).toBe(100);
    expect(result.durationMinutes).toBe(240);
  });

  // Freelancer N1 — weekday 10h → R$150
  it('Freelancer N1 weekday 10h = R$150', () => {
    const event = makeEvent({
      closing: {
        actualStartTime: new Date('2025-03-10T13:00:00'),
        actualEndTime: new Date('2025-03-10T23:00:00'), // 10h
        durationMinutes: 600,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, []);
    expect(result.baseValue).toBe(150);
  });

  // Freelancer N1 — weekend 4h → R$130
  it('Freelancer N1 weekend 4h = R$130', () => {
    const event = makeEvent({
      date: new Date('2025-03-15T19:00:00'), // Saturday
      closing: {
        actualStartTime: new Date('2025-03-15T19:00:00'),
        actualEndTime: new Date('2025-03-15T23:00:00'),
        durationMinutes: 240,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, []);
    expect(result.baseValue).toBe(130);
    expect(result.isWeekend).toBe(true);
  });

  // CLT — weekday 4h → R$0 (jornada normal)
  it('CLT weekday 4h = R$0 (within normal shift)', () => {
    const event = makeEvent();
    const result = calculateOperatorPayment(event, makeAssignment(), rulesCLT, []);
    expect(result.baseValue).toBe(0);
    expect(result.totalValue).toBe(0);
  });

  // CLT — weekend 4h → R$100
  it('CLT weekend 4h = R$100', () => {
    const event = makeEvent({
      date: new Date('2025-03-15T19:00:00'), // Saturday
      closing: {
        actualStartTime: new Date('2025-03-15T19:00:00'),
        actualEndTime: new Date('2025-03-15T23:00:00'),
        durationMinutes: 240,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesCLT, []);
    expect(result.baseValue).toBe(100);
    expect(result.isWeekend).toBe(true);
  });

  // CLT — weekend 8h → R$150
  it('CLT weekend 8h = R$150', () => {
    const event = makeEvent({
      date: new Date('2025-03-15T14:00:00'),
      closing: {
        actualStartTime: new Date('2025-03-15T14:00:00'),
        actualEndTime: new Date('2025-03-15T22:00:00'), // 8h
        durationMinutes: 480,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesCLT, []);
    expect(result.baseValue).toBe(150);
  });

  // CLT — weekend 13h (última faixa ilimitada) → R$200
  it('CLT weekend 13h = R$200 (last range unlimited)', () => {
    const event = makeEvent({
      date: new Date('2025-03-15T09:00:00'),
      closing: {
        actualStartTime: new Date('2025-03-15T09:00:00'),
        actualEndTime: new Date('2025-03-15T22:00:00'), // 13h
        durationMinutes: 780,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesCLT, []);
    expect(result.baseValue).toBe(200);
  });

  // CLT — holiday earns extra rest day
  it('CLT on holiday → earnedExtraRestDay = true', () => {
    const event = makeEvent({
      date: new Date('2025-03-11T19:00:00'), // holiday
      closing: {
        actualStartTime: new Date('2025-03-11T19:00:00'),
        actualEndTime: new Date('2025-03-11T23:00:00'),
        durationMinutes: 240,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesCLT, holidays);
    expect(result.earnedExtraRestDay).toBe(true);
    expect(result.isHoliday).toBe(true);
  });

  // Freelancer does NOT earn extra rest day
  it('Freelancer on holiday → earnedExtraRestDay = false', () => {
    const event = makeEvent({
      date: new Date('2025-03-11T19:00:00'),
      closing: {
        actualStartTime: new Date('2025-03-11T19:00:00'),
        actualEndTime: new Date('2025-03-11T23:00:00'),
        durationMinutes: 240,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, holidays);
    expect(result.earnedExtraRestDay).toBe(false);
  });

  // External event adds travel daily
  it('External event adds daily travel value', () => {
    const event = makeEvent({ operationType: 'externo' });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, []);
    expect(result.travelValue).toBe(200); // dailyTravel
    expect(result.totalValue).toBe(100 + 200); // base + travel
  });

  // Travel days before/after
  it('Travel days add to travel value', () => {
    const event = makeEvent({ operationType: 'externo' });
    const assignment = makeAssignment({ travelDaysBefore: 1, travelDaysAfter: 1 });
    const result = calculateOperatorPayment(event, assignment, rulesFreelancerN1, []);
    // 2 travel days * 200 + event day 200 = 600
    expect(result.travelValue).toBe(600);
  });

  // Multiple external events same day → proportional daily
  it('Multiple externals same day → proportional daily (300/2)', () => {
    const event = makeEvent({ id: 'evt1', operationType: 'externo' });
    const otherAssignments = [
      { eventId: 'evt2', date: new Date('2025-03-10T19:00:00'), operationType: 'externo' as const },
    ];
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, [], otherAssignments);
    // With 2 externals: 300 / 2 = 150
    expect(result.travelValue).toBe(150);
  });

  // Event not closed → all zeros
  it('Event without closing returns all zeros', () => {
    const event = makeEvent({ closing: undefined });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesFreelancerN1, []);
    expect(result.totalValue).toBe(0);
    expect(result.baseValue).toBe(0);
    expect(result.durationMinutes).toBe(0);
    expect(result.ruleApplied).toBe('Evento não finalizado');
  });

  // Rest day → uses restDayRules (N2) instead of base
  it('Rest day → baseValue = 0, restDayExtra from N2 rules', () => {
    const event = makeEvent();
    const assignment = makeAssignment({ onRestDay: true });
    const result = calculateOperatorPayment(event, assignment, rulesCLT, [], [], rulesFreelancerN2);
    expect(result.baseValue).toBe(0);
    expect(result.restDayExtra).toBe(80); // N2 weekday 0-8h = R$80
    expect(result.totalValue).toBe(80);
  });

  // Service with fixed value
  it('Service with fixedValue adds serviceExtra', () => {
    const event = makeEvent({
      services: [{ serviceName: 'Programa Bora Leilão' }] as any,
    });
    const fixedValues = { 'Programa Bora Leilão': 75 };
    // Freelancer → always gets fixedValue
    const otherAssignments = [
      { eventId: 'evt2', date: new Date('2025-03-10T19:00:00'), operationType: 'estudio' as const },
    ];
    const result = calculateOperatorPayment(
      event, makeAssignment(), rulesFreelancerN1, [], otherAssignments, null, fixedValues,
    );
    expect(result.serviceExtra).toBe(75);
  });

  // CLT bonus FDS without tiered → uses weekendHolidayBonus
  it('CLT FDS bonus fallback when no tiered weekend values', () => {
    const noTieredRules: PaymentRules = {
      contractType: 'funcionario',
      hourRanges: [
        { minHours: 0, maxHours: 24, weekdayValue: 0, weekendHolidayValue: 0 },
      ],
      weekendHolidayBonus: 120,
      dailyTravel: 200,
    };
    const event = makeEvent({
      date: new Date('2025-03-15T19:00:00'), // Saturday
      closing: {
        actualStartTime: new Date('2025-03-15T19:00:00'),
        actualEndTime: new Date('2025-03-15T23:00:00'),
        durationMinutes: 240,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), noTieredRules, []);
    expect(result.bonusValue).toBe(120);
  });

  // CLT bonus FDS with tiered → bonusValue = 0 (no double-counting)
  it('CLT FDS with tiered weekendHolidayValue → bonusValue = 0', () => {
    const event = makeEvent({
      date: new Date('2025-03-15T19:00:00'),
      closing: {
        actualStartTime: new Date('2025-03-15T19:00:00'),
        actualEndTime: new Date('2025-03-15T23:00:00'),
        durationMinutes: 240,
        closedBy: 'test',
        closedAt: new Date(),
      },
    });
    const result = calculateOperatorPayment(event, makeAssignment(), rulesCLT, []);
    expect(result.bonusValue).toBe(0); // tiered already handles it
  });
});
