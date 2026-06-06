import { describe, it, expect } from 'vitest';
import { computeTrips, computeFolgaBalance, getTripRoute, TravelTrip } from '@/lib/folgas';
import { Holiday } from '@/types/payment';

// ── computeTrips ─────────────────────────────────────────────

describe('computeTrips', () => {
  it('returns empty for no windows', () => {
    expect(computeTrips([])).toEqual([]);
  });

  it('returns single trip for single window', () => {
    const trips = computeTrips([
      { start: new Date('2025-03-10'), end: new Date('2025-03-12'), eventId: 'e1' },
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].eventIds).toEqual(['e1']);
  });

  it('merges overlapping windows into single trip', () => {
    const trips = computeTrips([
      { start: new Date('2025-03-10'), end: new Date('2025-03-12'), eventId: 'e1' },
      { start: new Date('2025-03-11'), end: new Date('2025-03-14'), eventId: 'e2' },
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].eventIds).toEqual(['e1', 'e2']);
    expect(trips[0].end).toEqual(new Date('2025-03-14'));
  });

  it('merges adjacent windows (gap of 1 day)', () => {
    const trips = computeTrips([
      { start: new Date('2025-03-10'), end: new Date('2025-03-12'), eventId: 'e1' },
      { start: new Date('2025-03-13'), end: new Date('2025-03-15'), eventId: 'e2' },
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].eventIds).toContain('e1');
    expect(trips[0].eventIds).toContain('e2');
  });

  it('keeps separate trips when gap > 1 day', () => {
    const trips = computeTrips([
      { start: new Date('2025-03-10'), end: new Date('2025-03-11'), eventId: 'e1' },
      { start: new Date('2025-03-15'), end: new Date('2025-03-16'), eventId: 'e2' },
    ]);
    expect(trips).toHaveLength(2);
  });

  it('merges 3 chained windows progressively', () => {
    const trips = computeTrips([
      { start: new Date('2025-03-10'), end: new Date('2025-03-11'), eventId: 'e1' },
      { start: new Date('2025-03-12'), end: new Date('2025-03-13'), eventId: 'e2' },
      { start: new Date('2025-03-14'), end: new Date('2025-03-15'), eventId: 'e3' },
    ]);
    expect(trips).toHaveLength(1);
    expect(trips[0].eventIds).toHaveLength(3);
  });

  it('sorts windows by start date', () => {
    const trips = computeTrips([
      { start: new Date('2025-03-15'), end: new Date('2025-03-16'), eventId: 'e2' },
      { start: new Date('2025-03-10'), end: new Date('2025-03-11'), eventId: 'e1' },
    ]);
    expect(trips).toHaveLength(2);
    expect(trips[0].eventIds).toEqual(['e1']);
    expect(trips[1].eventIds).toEqual(['e2']);
  });
});

// ── computeFolgaBalance ──────────────────────────────────────

describe('computeFolgaBalance', () => {
  const holidayList: Holiday[] = [
    { date: '2025-03-11', name: 'Feriado Teste', national: true },
  ];

  it('CLT on holiday → holidayFolgas = 1', () => {
    const op = { id: 'op1', contractType: 'funcionario', weeklyRestDay: null };
    const events = [{
      id: 'e1',
      date: '2025-03-11T19:00:00',
      operationType: 'estudio',
      assignments: [{ operatorId: 'op1' }],
    }];
    const result = computeFolgaBalance(op, events, holidayList);
    expect(result.holidayFolgas).toBe(1);
    expect(result.total).toBe(1);
  });

  it('Freelancer on holiday → holidayFolgas = 0 (not CLT)', () => {
    const op = { id: 'op1', contractType: 'freelancer_n1', weeklyRestDay: null };
    const events = [{
      id: 'e1',
      date: '2025-03-11T19:00:00',
      operationType: 'estudio',
      assignments: [{ operatorId: 'op1' }],
    }];
    const result = computeFolgaBalance(op, events, holidayList);
    expect(result.holidayFolgas).toBe(0);
  });

  it('Weekly rest day during travel → travelFolgas counted', () => {
    const op = { id: 'op1', contractType: 'funcionario', weeklyRestDay: 0 }; // Sunday
    const events = [{
      id: 'e1',
      date: '2025-03-12T19:00:00', // Wednesday
      endDate: '2025-03-12T23:00:00',
      operationType: 'externo',
      assignments: [{
        operatorId: 'op1',
        departureDate: '2025-03-09T08:00:00', // Sunday (rest day!)
        returnDate: '2025-03-13T18:00:00', // Thursday
      }],
    }];
    const result = computeFolgaBalance(op, events, []);
    expect(result.travelFolgas).toBe(1); // Sunday falls in travel window
    expect(result.trips).toHaveLength(1);
  });

  it('No travel → travelFolgas = 0', () => {
    const op = { id: 'op1', contractType: 'funcionario', weeklyRestDay: 0 };
    const events = [{
      id: 'e1',
      date: '2025-03-10T19:00:00',
      operationType: 'estudio',
      assignments: [{ operatorId: 'op1' }],
    }];
    const result = computeFolgaBalance(op, events, []);
    expect(result.travelFolgas).toBe(0);
    expect(result.trips).toHaveLength(0);
  });

  it('Operator without weeklyRestDay → travelFolgas = 0', () => {
    const op = { id: 'op1', contractType: 'funcionario', weeklyRestDay: null };
    const events = [{
      id: 'e1',
      date: '2025-03-12T19:00:00',
      operationType: 'externo',
      assignments: [{
        operatorId: 'op1',
        departureDate: '2025-03-09T08:00:00',
        returnDate: '2025-03-13T18:00:00',
      }],
    }];
    const result = computeFolgaBalance(op, events, []);
    expect(result.travelFolgas).toBe(0);
  });

  it('Uses travelDaysBefore/After when no departure/return dates', () => {
    const op = { id: 'op1', contractType: 'funcionario', weeklyRestDay: 0 }; // Sunday
    const events = [{
      id: 'e1',
      date: '2025-03-12T19:00:00', // Wednesday
      endDate: '2025-03-12T23:00:00',
      operationType: 'externo',
      assignments: [{
        operatorId: 'op1',
        travelDaysBefore: 3, // Goes back to Sunday March 9
        travelDaysAfter: 1,
      }],
    }];
    const result = computeFolgaBalance(op, events, []);
    expect(result.travelFolgas).toBe(1); // Sunday March 9
    expect(result.trips).toHaveLength(1);
  });
});

// ── getTripRoute ─────────────────────────────────────────────

describe('getTripRoute', () => {
  const trip: TravelTrip = {
    start: new Date('2025-03-09'),
    end: new Date('2025-03-13'),
    eventIds: ['e1', 'e2'],
  };

  it('builds route with home city', () => {
    const events = [
      { id: 'e1', date: '2025-03-10T19:00:00', city: 'Curitiba' },
      { id: 'e2', date: '2025-03-12T19:00:00', city: 'Londrina' },
    ];
    const route = getTripRoute(trip, events, 'Porto Alegre');
    expect(route).toBe('Porto Alegre ➔ Curitiba ➔ Londrina ➔ Porto Alegre');
  });

  it('uses "Cidade Base" when no homeCity', () => {
    const events = [
      { id: 'e1', date: '2025-03-10T19:00:00', city: 'Curitiba' },
    ];
    const route = getTripRoute(trip, events);
    expect(route).toBe('Cidade Base ➔ Curitiba ➔ Cidade Base');
  });

  it('removes duplicate sequential cities', () => {
    const events = [
      { id: 'e1', date: '2025-03-10T19:00:00', city: 'Curitiba' },
      { id: 'e2', date: '2025-03-11T19:00:00', city: 'Curitiba' },
    ];
    const route = getTripRoute(trip, events, 'POA');
    expect(route).toBe('POA ➔ Curitiba ➔ POA');
  });

  it('returns home city for no events', () => {
    const route = getTripRoute(trip, [], 'Porto Alegre');
    expect(route).toBe('Porto Alegre');
  });
});
