const request = require('supertest');
const { app, decisionForDateObj } = require('../index');

function parseDateUTC(dateStr) {
  return new Date(dateStr + 'T00:00:00Z');
}

test('monday', () => {
  const d = parseDateUTC('2025-10-27');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('oui');
  expect(res.can_deploy).toBe(true);
});

test('tuesday', () => {
  const d = parseDateUTC('2025-10-28');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('oui');
  expect(res.can_deploy).toBe(true);
});

test('wednesday', () => {
  const d = parseDateUTC('2025-10-29');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('oui');
  expect(res.can_deploy).toBe(true);
});

test('thursday', () => {
  const d = parseDateUTC('2025-10-30');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('attention');
  expect(res.can_deploy).toBe(false);
});

test('friday', () => {
  const d = parseDateUTC('2025-10-31');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('impossible');
  expect(res.can_deploy).toBe(false);
});

test('saturday', () => {
  const d = parseDateUTC('2025-11-01');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('non');
  expect(res.can_deploy).toBe(false);
});

test('sunday', () => {
  const d = parseDateUTC('2025-11-02');
  const res = decisionForDateObj(d);
  expect(res.decision).toBe('non');
  expect(res.can_deploy).toBe(false);
});

test('endpoint /status uses today only (does not accept date param)', async () => {
  const resp = await request(app).get('/status');
  const todayDecision = decisionForDateObj(new Date());
  // compare deterministic fields only (reason is random)
  expect(resp.status).toBe(200);
  expect(resp.body.decision).toBe(todayDecision.decision);
  expect(resp.body.can_deploy).toBe(todayDecision.can_deploy);
});
