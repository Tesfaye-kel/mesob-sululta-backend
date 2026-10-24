const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const {
  getOrganizationTranslation,
  isPlaceholderTranslation,
} = require('../data/organizationTranslations');

async function migrateOrganizationTranslations() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const organizations = await Organization.find({}, { name: 1 }).lean();
    let updatedCount = 0;
    let skippedCount = 0;

    for (const organization of organizations) {
      const sourceName = organization.name?.or || organization.name?.en || organization.name?.am || '';
      const translation = getOrganizationTranslation(organization.name);
      if (!translation || !sourceName) {
        skippedCount += 1;
        continue;
      }

      const nameUpdate = {};
      if (isPlaceholderTranslation(organization.name?.en, sourceName)) {
        nameUpdate['name.en'] = translation.en;
      }
      if (isPlaceholderTranslation(organization.name?.am, sourceName)) {
        nameUpdate['name.am'] = translation.am;
      }
      if (Object.keys(nameUpdate).length === 0) {
        skippedCount += 1;
        continue;
      }

      await Organization.updateOne({ _id: organization._id }, { $set: nameUpdate });
      updatedCount += 1;
    }

    console.log(`Organization translations updated: ${updatedCount}; skipped: ${skippedCount}.`);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  migrateOrganizationTranslations().catch((error) => {
    console.error('Organization translation migration failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { migrateOrganizationTranslations };
