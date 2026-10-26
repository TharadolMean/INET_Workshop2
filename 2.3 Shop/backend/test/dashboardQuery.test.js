const test = require('node:test');
const assert = require('node:assert/strict');
const { getDashboardQuery } = require('../src/utils/dashboardQuery');

test('dashboard query defaults to the last 30 UTC dates and daily grouping', () => {
  const result = getDashboardQuery({}, new Date('2026-06-30T15:00:00.000Z'));
  assert.equal(result.fromDate, '2026-06-01');
  assert.equal(result.toDate, '2026-06-30');
  assert.equal(result.interval, 'day');
  assert.equal(result.toExclusive.toISOString(), '2026-07-01T00:00:00.000Z');
});

test('dashboard query validates calendar dates, ordering, interval and range size', () => {
  assert.match(getDashboardQuery({ from: '2026-02-30', to: '2026-03-01' }).error, /valid calendar date/);
  assert.match(getDashboardQuery({ from: '2026-05-02', to: '2026-05-01' }).error, /on or after/);
  assert.match(getDashboardQuery({ from: '2026-01-01', to: '2026-01-02', interval: 'week' }).error, /interval/);
  assert.match(getDashboardQuery({ from: '2025-01-01', to: '2026-01-02', interval: 'day' }).error, /monthly interval/);
});

test('dashboard query selects monthly grouping for long default ranges', () => {
  const result = getDashboardQuery({ from: '2025-01-01', to: '2025-06-30' });
  assert.equal(result.interval, 'month');
});
