require('dotenv').config();

const mongoose = require('mongoose');

const migrate = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  await mongoose.connect(process.env.MONGO_URI);

  const result = await mongoose.connection.collection('products').updateMany(
    { isArchived: { $exists: false } },
    { $set: { isArchived: false, archivedAt: null } }
  );
  console.log(`Product archive fields backfilled on ${result.modifiedCount} document(s)`);
};

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
