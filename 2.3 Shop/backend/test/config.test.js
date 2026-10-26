const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRuntimeConfig } = require('../src/config');

test('runtime config accepts a Mongo URI and a sufficiently long secret', () => {
  assert.doesNotThrow(() => validateRuntimeConfig({
    MONGO_URI: 'mongodb://localhost:27017/workshop_2_3',
    JWT_SECRET: 'dev-secret-that-is-at-least-32-characters-long',
  }));
});

test('runtime config rejects missing database configuration', () => {
  assert.throws(() => validateRuntimeConfig({ JWT_SECRET: 'dev-secret-that-is-at-least-32-characters-long' }), /MONGO_URI/);
});

test('runtime config rejects placeholder and short JWT secrets', () => {
  assert.throws(() => validateRuntimeConfig({ MONGO_URI: 'mongodb://localhost/db', JWT_SECRET: 'replace-with-a-long-random-secret' }), /JWT_SECRET/);
  assert.throws(() => validateRuntimeConfig({ MONGO_URI: 'mongodb://localhost/db', JWT_SECRET: 'replace-this-with-a-random-secret-at-least-32-characters' }), /JWT_SECRET/);
  assert.throws(() => validateRuntimeConfig({ MONGO_URI: 'mongodb://localhost/db', JWT_SECRET: 'short' }), /JWT_SECRET/);
});
