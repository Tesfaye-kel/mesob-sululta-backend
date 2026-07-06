const path = require('path');
const xlsx = require('xlsx');
const About = require('./models/About');
const Contact = require('./models/Contact');
const Organization = require('./models/Organization');
const Service = require('./models/Service');
const Window = require('./models/Window');

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseWindowNumber = (label = '') => {
  const match = String(label).match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const findOrganization = (officeName, organizations) => {
  const target = normalize(officeName);
  if (!target) return null;

  let best = null;
  let bestScore = 0;

  for (const org of organizations) {
    const candidates = [org.name?.or, org.name?.en, org.name?.am].map(normalize);
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (candidate === target || target.includes(candidate) || candidate.includes(target)) {
        const score = Math.min(candidate.length, target.length);
        if (score > bestScore) {
          best = org;
          bestScore = score;
        }
      }
    }
  }

  return best;
};

const findService = (taskName, services) => {
  const target = normalize(taskName).replace(/^\d+\.?\s*/, '');
  if (!target || target.length < 3) return null;

  let best = null;
  let bestScore = 0;

  for (const service of services) {
    const candidates = [service.name?.or, service.name?.en, service.name?.am].map(normalize);
    for (const candidate of candidates) {
      if (!candidate) continue;
      const score = candidate.includes(target) || target.includes(candidate)
        ? Math.min(candidate.length, target.length)
        : 0;
      if (score > bestScore) {
        best = service;
        bestScore = score;
      }
    }
  }

  return bestScore > 8 ? best : null;
};

const seedAbout = async () => {
  const existing = await About.countDocuments();
  if (existing > 0) return;

  await About.create({
    mission: {
      or: 'Hawaasaaf tajaajila mootummaa qulqulluu, saffisaa fi walqixa ta’e kennuudhaan misooma qabeenya namaa guddisuu.',
      en: 'To deliver equitable, efficient, and quality public services that advance human resource development.',
      am: 'እኩል፣ ቀልጣፋ እና ጥራት ያለው የመንግስት አገልግሎት በመስጠት የሰው ሀብት ልማትን ማሳደግ።',
    },
    vision: {
      or: 'Wiirtuu Misooma Qabeenya Namaa Oromiyaa kan teknooloojii irratti hundaa’e fi hawaasni itti amanu ta’uu.',
      en: 'To become a trusted, technology-driven Oromia Human Resource Development Center.',
      am: 'በቴክኖሎጂ ላይ የተመሰረተ እና ማህበረሰቡ የሚያምንበት የኦሮሚያ የሰው ሀብት ልማት ማዕከል መሆን።',
    },
    objectives: {
      or: 'Tajaajila foddaa tokkoffaa cimsuu, tajaajila dijitaalaa babal’isuu, fi hojjettoota leenjisuu.',
      en: 'Strengthen one-stop services, expand digital delivery, and build staff capacity.',
      am: 'አንድ ማዕከል አገልግሎትን ማጠናከር፣ ዲጂታል አገልግሎትን ማስፋፋት እና የሰራተኞችን ችሎታ ማሳደግ።',
    },
    branchIntroduction: {
      or: 'Damee Sulultaa Wiirtuu Misooma Qabeenya Namaa Oromiyaa hawaasa naannoo keessatti tajaajila mootummaa walitti qabuu fi saffisiisuuf hojjeta.',
      en: 'The Sululta Branch of Oromia HRDC coordinates and streamlines public services for the local community.',
      am: 'የኦሮሚያ የሰው ሀብት ልማት ማዕከል ሱሉልታ ቅርንጫፍ ለአካባቢው ማህበረሰብ የመንግስት አገልግሎቶችን ያስተባብራል እና ያፋጥናል።',
    },
    history: {
      or: 'Dameen kun tajaajila mootummaa naannoo tokkotti walitti qabuuf ijaaramee, amma immoo tajaajila foddaa adda addaa kennuudhaan hojjeta.',
      en: 'Established to centralize local government services, the branch now operates multiple service windows.',
      am: 'የአካባቢው የመንግስት አገልግሎቶችን ለማዕከላዊነት የተመሠረተ ቅርንጫፍ ነው፣ አሁን በብዙ የአገልግሎት መስኮቶች ያገለግላል።',
    },
  });

  console.log('Seed completed: about content inserted.');
};

const seedContact = async () => {
  const existing = await Contact.countDocuments();
  if (existing > 0) return;

  await Contact.create({
    address: {
      or: 'Wiirtuu Misooma Qabeenya Namaa Oromiyaa, Damee Sulultaa, Oromiyaa, Itoophiyaa',
      en: 'Oromia Human Resource Development Center, Sululta Branch, Oromia, Ethiopia',
      am: 'የኦሮሚያ የሰው ሀብት ልማት ማዕከል፣ ሱሉልታ ቅርንጫፍ፣ ኦሮሚያ፣ ኢትዮጵያ',
    },
    phone: '+251 11 000 0000',
    email: 'info@sululta.mesobcenter.et',
    workingHours: {
      or: 'Wiixata - Jimaata: 8:30 - 17:00',
      en: 'Monday - Friday: 8:30 AM - 5:00 PM',
      am: 'ሰኞ - አርብ፡ 8:30 - 17:00',
    },
    mapEmbedUrl: 'https://maps.google.com/maps?q=Sululta%20Oromia&t=&z=13&ie=UTF8&iwloc=&output=embed',
  });

  console.log('Seed completed: contact content inserted.');
};

const seedWindowsFromExcel = async () => {
  const existing = await Window.countDocuments();
  if (existing > 0) {
    console.log('Seed skipped: windows already exist in the database.');
    return;
  }

  const excelPath = path.resolve(__dirname, '../Excel/Humna Namaa Wirtuu Damee Sulultaa.xlsx');
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets['Foddaadhaan'];
  if (!sheet) {
    console.warn('Window seed skipped: Foddaadhaan sheet not found.');
    return;
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalize(cell).includes('fooddaa')),
  );
  if (headerIndex < 0) {
    console.warn('Window seed skipped: header row not found.');
    return;
  }

  const header = rows[headerIndex].map((cell) => normalize(cell));
  const windowIdx = header.findIndex((h) => h.includes('fooddaa'));
  const taskIdx = header.findIndex((h) => h.includes('tajaajila'));
  const officeIdx = header.findIndex((h) => h.includes('mana hojii'));

  const organizations = await Organization.find();
  const services = await Service.find();
  const grouped = new Map();
  let currentWindow = '';

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const windowLabel = String(row[windowIdx] || currentWindow).trim();
    const task = String(row[taskIdx] || '').trim();
    const office = String(row[officeIdx] || '').trim();

    if (windowLabel) currentWindow = windowLabel;
    if (!task || /ida.?ama waligalaa/i.test(task)) continue;

    const number = parseWindowNumber(currentWindow);
    if (!number) continue;

    const org = findOrganization(office, organizations);
    if (!org) continue;

    const orgServices = services.filter((s) => String(s.organization) === String(org._id));
    const service = findService(task, orgServices);
    if (!service) continue;

    const key = `${number}::${org._id}`;
    if (!grouped.has(key)) {
      grouped.set(key, { number, organization: org._id, services: new Set() });
    }
    grouped.get(key).services.add(String(service._id));
  }

  const payload = Array.from(grouped.values()).map((item) => ({
    number: item.number,
    organization: item.organization,
    services: Array.from(item.services),
  }));

  if (payload.length) {
    await Window.insertMany(payload);
    console.log(`Seed completed: inserted ${payload.length} window records.`);
  } else {
    console.warn('Window seed completed with 0 records (check Excel/org matching).');
  }
};

const seedSiteContent = async () => {
  await seedAbout();
  await seedContact();
  await seedWindowsFromExcel();
};

module.exports = { seedAbout, seedContact, seedWindowsFromExcel, seedSiteContent };
