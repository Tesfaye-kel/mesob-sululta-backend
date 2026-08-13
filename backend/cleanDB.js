// cleanDB.js — Delete all organizations and services, then re-seed from Excel
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const xlsx = require('xlsx');
const Organization = require('./models/Organization');
const Service = require('./models/Service');
const Window = require('./models/Window');
const Requirement = require('./models/Requirement');

async function cleanAndReseed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Wipe existing data
  await Organization.deleteMany({});
  await Service.deleteMany({});
  await Requirement.deleteMany({});
  console.log('Cleared organizations, services, requirements');

  const excelPath = path.resolve(__dirname, '../excel/Humna Namaa Wirtuu Damee Sulultaa.xlsx');
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets['Tajaajila Waajjiraa'];
  if (!sheet) throw new Error('Sheet "Tajaajila Waajjiraa" not found');

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  // Find header row (contains "Mana Hojii")
  let headerIdx = rows.findIndex(r => r && r.some(c => String(c || '').toLowerCase().includes('mana hojii')));
  if (headerIdx === -1) headerIdx = 2;

  const officeMap = new Map(); // officeName -> { org, services: [] }
  let currentOffice = '';
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rawOffice = String(row[1] || '').trim();
    const serviceName = String(row[2] || '').trim();
    // Carry forward last known office for continuation rows
    if (rawOffice) {
      currentOffice = rawOffice;
    }
    if (!currentOffice) continue;
    if (!serviceName) continue;
    const lowerOffice = currentOffice.toLowerCase();
    if (lowerOffice.includes("ida'ama") || lowerOffice.includes('wliigalaa')) continue;

    if (!officeMap.has(currentOffice)) {
      officeMap.set(currentOffice, { name: currentOffice, services: [] });
    }
    officeMap.get(currentOffice).services.push(serviceName.replace(/^\d+\.\s*/, ''));
  }

  console.log(`Found ${officeMap.size} offices from Excel`);
  let totalServices = 0;
  for (const [, office] of officeMap) {
    totalServices += office.services.length;
  }
  console.log(`Found ${totalServices} services from Excel`);

  // Create organizations and services
  let orgCount = 0;
  let serviceCount = 0;
  for (const [officeName, office] of officeMap) {
    const org = await Organization.create({
      name: { en: officeName, am: officeName, or: officeName },
      description: { en: '', am: '', or: '' },
      logoUrl: '',
    });
    orgCount++;

    for (const svcName of office.services) {
      await Service.create({
        name: { en: svcName, am: svcName, or: svcName },
        description: { en: '', am: '', or: '' },
        organization: org._id,
        window: null,
        requiredDocuments: [],
        fee: 0,
        processingTime: '',
        workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
        contactPhone: '',
      });
      serviceCount++;
    }
  }

  console.log(`Created ${orgCount} organizations and ${serviceCount} services`);
  await mongoose.connection.close();
  console.log('Done!');
}

cleanAndReseed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});