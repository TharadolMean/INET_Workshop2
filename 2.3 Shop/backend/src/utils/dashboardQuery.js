const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 3660;

const dateStringToUtc = (value, field) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `${field} must use YYYY-MM-DD format` };
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return { error: `${field} must be a valid calendar date` };
  }
  return { date };
};

const formatUtcDate = (date) => date.toISOString().slice(0, 10);

const getDashboardQuery = (query = {}, now = new Date()) => {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const defaultTo = formatUtcDate(today);
  const defaultFrom = formatUtcDate(new Date(today.getTime() - (29 * DAY_MS)));
  const fromResult = dateStringToUtc(query.from === undefined ? defaultFrom : query.from, 'from');
  if (fromResult.error) return fromResult;
  const toResult = dateStringToUtc(query.to === undefined ? defaultTo : query.to, 'to');
  if (toResult.error) return toResult;
  if (toResult.date < fromResult.date) return { error: 'to must be on or after from' };

  const dayCount = Math.floor((toResult.date - fromResult.date) / DAY_MS) + 1;
  if (dayCount > MAX_RANGE_DAYS) return { error: `date range cannot exceed ${MAX_RANGE_DAYS} days` };

  const interval = query.interval || (dayCount > 93 ? 'month' : 'day');
  if (!['day', 'month'].includes(interval)) return { error: 'interval must be day or month' };
  if (interval === 'day' && dayCount > 366) {
    return { error: 'daily interval cannot exceed 366 days; use monthly interval' };
  }

  const toExclusive = new Date(toResult.date.getTime() + DAY_MS);
  return {
    from: fromResult.date,
    toExclusive,
    fromDate: formatUtcDate(fromResult.date),
    toDate: formatUtcDate(toResult.date),
    interval,
  };
};

module.exports = { getDashboardQuery };
