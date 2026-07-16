/**
 * Bootstraps the database with an initial admin account.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[Seed] Connected to MongoDB.');

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@hireia.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[Seed] Admin account already exists: ${email}`);
  } else {
    await User.create({
      name: 'HireIA Super Admin',
      email,
      password,
      role: 'admin',
    });
    console.log(`[Seed] Admin account created.`);
    console.log(`        Email:    ${email}`);
    console.log(`        Password: ${password}`);
    console.log('[Seed] Please log in and change this password immediately.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
