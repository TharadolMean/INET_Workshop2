const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProductQuery } = require('../src/utils/productQuery');
const { csvCell, csvRow } = require('../src/utils/csv');

test('product query supports safely escaped search, filters, sorting and bounded pagination', () => {
  const parsed = parseProductQuery({ q: 'cpu.*', minPrice: '10', maxPrice: '500', inStock: 'true', sort: 'price-asc', paged: 'true', page: '2', limit: '12' });
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.filter.$or[0].name.source, 'cpu\\.\\*');
  assert.deepEqual(parsed.filter.price, { $gte: 10, $lte: 500 });
  assert.deepEqual(parsed.filter.stock, { $gt: 0 });
  assert.deepEqual(parsed.pagination, { page: 2, limit: 12, skip: 12 });
  assert.equal(parseProductQuery({ limit: '101' }).error, 'limit must be an integer between 1 and 100');
  assert.equal(parseProductQuery({ minPrice: 50, maxPrice: 10 }).error, 'minPrice must be less than or equal to maxPrice');
  assert.equal(parseProductQuery({ stockStatus: 'low' }).error, 'stockStatus must be all, normal, low or out');
  assert.equal(parseProductQuery({ stockStatus: 'low' }, true).filter.stock.$lte, 5);
});

test('CSV cells escape quotes and neutralize spreadsheet formulas', () => {
  assert.equal(csvCell('=SUM(A1:A2)'), "\"'=SUM(A1:A2)\"");
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvRow(['one', 'two']), '"one","two"\r\n');
});
