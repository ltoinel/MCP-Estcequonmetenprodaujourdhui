import { getDeploymentDecision } from '../dist/lib/deployment-logic';

function parseDateUTC(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

test('english - thursday shows CAUTION label', () => {
  const d = parseDateUTC('2025-10-30'); // Thursday
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('caution');
  expect(res.message).toMatch(/^⚠️ CAUTION - /);
});

test('french - monday shows OUI label', () => {
  const d = parseDateUTC('2025-10-27'); // Monday
  const res = getDeploymentDecision(d, 'fr');
  expect(res.decision).toBe('yes');
  expect(res.message).toMatch(/^✅ OUI - /);
});

test('german - thursday shows VORSICHT label', () => {
  const d = parseDateUTC('2025-10-30'); // Thursday
  const res = getDeploymentDecision(d, 'de');
  expect(res.decision).toBe('caution');
  expect(res.message).toMatch(/^⚠️ VORSICHT - /);
});
