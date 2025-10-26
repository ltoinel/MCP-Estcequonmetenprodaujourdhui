import { getDeploymentDecision, getDeploymentReasons } from '../dist/lib/deployment-logic';

function parseDateUTC(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

test('monday', () => {
  const d = parseDateUTC('2025-10-27');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('yes');
  expect(res.can_deploy).toBe(true);
  expect(res.emoji).toBe('✅');
});

test('tuesday', () => {
  const d = parseDateUTC('2025-10-28');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('yes');
  expect(res.can_deploy).toBe(true);
});

test('wednesday', () => {
  const d = parseDateUTC('2025-10-29');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('yes');
  expect(res.can_deploy).toBe(true);
});

test('thursday', () => {
  const d = parseDateUTC('2025-10-30');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('caution');
  expect(res.can_deploy).toBe(false);
  expect(res.emoji).toBe('⚠️');
});

test('friday', () => {
  const d = parseDateUTC('2025-10-31');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('blocked');
  expect(res.can_deploy).toBe(false);
  expect(res.emoji).toBe('🚫');
});

test('saturday', () => {
  const d = parseDateUTC('2025-11-01');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('no');
  expect(res.can_deploy).toBe(false);
  expect(res.emoji).toBe('🛑');
});

test('sunday', () => {
  const d = parseDateUTC('2025-11-02');
  const res = getDeploymentDecision(d, 'en');
  expect(res.decision).toBe('no');
  expect(res.can_deploy).toBe(false);
});

test('reason is from the correct decision list', () => {
  const d = parseDateUTC('2025-10-27'); // lundi = yes
  const res = getDeploymentDecision(d, 'fr');
  const reasons = getDeploymentReasons('fr');
  expect(reasons[res.decision]).toContain(res.reason);
});

test('message format is correct', () => {
  const d = parseDateUTC('2025-10-27'); // lundi
  const res = getDeploymentDecision(d, 'fr');
  expect(res.message).toMatch(/^✅ OUI - /);
});
