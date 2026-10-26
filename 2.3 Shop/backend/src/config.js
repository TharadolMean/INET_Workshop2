const PLACEHOLDER_SECRETS = new Set([
  'replace-with-a-long-random-secret',
  'change-me',
  'secret',
]);

const validateRuntimeConfig = (env = process.env) => {
  if (!env.MONGO_URI || !String(env.MONGO_URI).trim()) {
    throw new Error('MONGO_URI is required');
  }

  const secret = String(env.JWT_SECRET || '');
  if (secret.length < 32 || PLACEHOLDER_SECRETS.has(secret.toLowerCase()) ||
    /^(replace|change|example)[-_]/i.test(secret)) {
    throw new Error('JWT_SECRET must be a non-placeholder secret with at least 32 characters');
  }
};

module.exports = { validateRuntimeConfig };
