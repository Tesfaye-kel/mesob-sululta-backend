/**
 * reseedWindows.js
 * Wipes and re-seeds all 11 windows using exact service name matching
 * from the "Foddaadhaan" sheet of the Excel file.
 *
 * Run once:  node reseedWindows.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
require('./models/Organization');
require('./models/Service');
const Service = require('./models/Service');
const Window  = require('./models/Window');

// ---------------------------------------------------------------------------
// Exact service names per window, taken directly from the Excel "Foddaadhaan"
// sheet (Oromo text, exactly as stored in the DB).
// ---------------------------------------------------------------------------
const WINDOW_SERVICES = {
  1: [
    'Tajaajila Waragaa Eenyummaa kennuu (Residential ID)',
    'Simannaa maamila haaraa fi Gurgurtaa Biilii Bishanii',
    'Qaama seerummaa waldaalee IMX kennuu',
    'Hoji dhabdoota galmeessuu, kaardii hoji dhabdummaa kennuu (Registration, Card Issuance of Job Seeker)',
    'Kaardii Hoji dhabdumma Haaromsuu',
  ],
  2: [
    'Xalayaa deggarsaa adda addaa walitti hidhamiinsa gabaa oomisha qonnaa fi industrii uumuu daldaltootaaf kennuu',
    'Inshuraansii fayyaa hawaasaa kennuu',
    'Inshuraansii fayyaa hawaasaa haaromsuu',
    'Deeggersa wldaalee IMX paakeejiwwan deggersaa akka argatan haala mijeessu',
    'waldaalee IMX Investimentiitti ce\u2019aniif waraqaa ragaa kennuu',
    'Deggersa aaddaa addaa waldaalee fi walitti hidhamiinsa gabaa WHG uumu kennuu',
    'Xalayaa deeggarsaa adda addaa kennuu',   // W/Bulchiinsaa
    'Xalayaa deeggarsa adda addaa kennuu',     // PSMQN
    'Deeggarsa Hayyama barjaalee kennuu',
    'Xalayaa hayyama beeksiisa sagalee kennuu',
    'Xalayaa deeggarsaa adda addaa kennuu',    // Poolisii
    'Deggarsaa Qonnaan bulaa investimentiitti ce\u2019uu fi W/hidhaminsa gabaa kennuu',
    'Xalayaa Deeggarsaa Kaafamtoota Misoomaa Invastimantii ce\u2019anii fi dhimmota biroof kennuu',
    'Xalayaa Deegarsa Barsiisoota fi Hoggantoota',
  ],
  3: [
    'Deegarsa Bu\u2019uuraalee Misooma (Ibsaa,Daandii ,Bishaanii)Kennuu',
    'Komii adda addaa keessuumeessuu',
    'Iyyannoo adda addaa keessuumeessuu',
    'Komii hojjattoota mootummaa Keessumeessuu',
    'Komii kaafamtoota Misoomaa Hiikuu',
  ],
  4: [
    'Tajaajila jijjiirraa barsiisotaa/hooggantoota manneen barnootaa',
    'Hayyama Gahumsa Manneen Barnoota Dhuunfaa fi miti mootummaa Kennuu, Haaromsuu, Kan bade bakka buusuufi deebisuu (Mana Barnootaa BSTDfi sadarkaa tokkoffaa 1-8)',
    'Hayyama suphaa mana mootummaa kennuu',
    'Hayyama tajaajila qalmaa kennuu (lakk. Qeeraa kennuu)',
    'Hayyama manneen yaalaa dhuunfaa kennuu',
    'Hayyama manneen yaalaa dhuunfaa haaromsuu',
    'Sanitary',
    'Artiteechure',
    'Structure /',
    'Electrical Eng.',
    'Surveyor',
    'Quantity',
    'Wal simsiisisa Pilaanii',
  ],
  5: [
    'Kenna Hayyama Gahumsa Ogummaa Ogeessota dhaabbilee, waldaalee ,kontraaktarootaa fi gorsitootaa haaraa kennuu, haaromsuu ol guddisuu fi haquu',
    'Waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu',
    'Waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu',
    'Waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu',
    'Waraqaa qulqullinaa gahumsa dhaabilee daldalaa haaromsuu',
    'Hayyama gahumsa ogummaa dhaabilee aadaa kennuu, haaromsuu, haquu',
  ],
  6: [
    'Hayyama daldalaa kennuu, haaromsuu,fooyyessuu(jijjiraa) fi haquu(License  Registration)',
    'Moggaasa maqaa daldalaa kennuu (License Registration)',
    'Hayyama Qorannoo Hojiiwwan Albuudaa kennuu',
    'Hayyama Qorannoo Hojiiwwan Albuudaa Haaroomsuu',
    'Hayyama Oomisha Albuudaa kennuu',
    'Hayyama Oomisha Albuudaa Haaroomsuu',
    'Hayyama Oomishaa Albuudaa Babal\u2019isuu',
    'Hayyama Oomisha Albuudaa Dabarsuu',
    'Heeyyama oomisha bishaanii kennu',
    'Heeyyama Oomisha bishaanii haaromsuu fi      haquu',
    'Hayyama konkolaachisaa haromsuu (Renew driving license)',
    'Hayyama konkolaachisaa Haaraa kennuu (new driving license)',
    'Hayyama Bobbii Konkoolaataa kennuu (Issuance of Vehicle Deployment Permits)',
    'Hayyama ogummaa galtee qonnaa kennuu',
    'Hayyama mirk.  gahumsa  ogummaa AI (Mala namaan loon diqaaloomsuu kennuu fi haaromsuu',
    'Hayyama mirk.  gahumsa  ogummaa manaa qalmaa Kennuu fi haaromsuu',
    'Hayyama mirk.  gahumsa  ogummaa horsiisa lukkuu kennuu',
    'Hayyama mirk.  gahumsa  ogummaa horsiisa horii Aannaanii fi foonii kennuu',
    'Heeyamaa Tajaajila Qalmaa Kennuu(Lakk.Qeera Kennuu)',
    'Heeyama gahuumsa ogeessota  leenjii suphaa  Meeshaalee elektirooniksii fi dandeettii kompitaraa (hardware and software)   Kennuu fi Haaromsuu..',
    'Heeyama gahuumsa ogeessota daldala Meeshaalee elektirooniksii kennuu fi haaromsuu.',
    'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu',
    'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haaressuu',
    'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu addaan cite itti fufsiisuu',
    'Hayyama Ejensii dhuunfaa hojii fi hojjetama biyyaa keessaa wal quunamsiisuu bade bakka buusuu',
    'Restore Licenses & release security deposit',
    'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haquu',
    'Hayyama waldaalee hawaasa aadda addaa kennu fi haaromsuu',
    'Waldiddaa dhimma hojjataaf hojjachiisaa jidduu jiru keessuumeessuu',
  ],
  7: [
    'Waldaalee lafa mana jireenyaa Gurmaa\'aniif qaama seerummaa kennuu fi haquu',
    'Waliigaltee kiraa mana mootummaa raawwachu',
    'Walii galtee gamoo Waliinii raawwachuu fi qaama 3ffaatti dabarsuu',
    'Mallattoo maxxantuu (boolloo) waggaa haaromsuu(Bollo Renew)',
    'Galmeessa ragaa dhuunfaa Fooyyessuu, dhorkuu fi kaasuu',
    'Hayyama tajaajila geejibaa ykn haaromsa eeyyama waldaa (Transportation service license or renewal of association license)',
    'Galmeessaa Sanadoota Sivilii (Civil Document Registration Service)',
    'Mirkaneessa Sadadoota Sivilii (Civil Document Authentication Service)',
    'Barreefama hundeefamaa daldala dhuunfaa itti gaafatmamuummaa isaa murtaa\'e Plc ( Private Limited Company )',
    'Ragaalee waldaalee galmeessuu fi mirkaneessu',
    'Galmeessa waliigaltee Liqii Loan Agreement',
    'Bakka bu\'ummaa galmeessuuu fi kennuu (Special Power of Agency)',
    'Mirkaneessa Gurmii Waldaale Hojii Gamtaa (Approval  of Cooperative Organizations)',
  ],
  8: [
    'Simannaa Piroojektoota invastimantii',
    'Hayyama invastimantii kennuu(Haaraa, Haaromsu,Bakka Buusuu)',
    'Waliigaltee piroojektii investimantii Haaraa Mallatteessuu',
    'Tajaajila Hayyama Jajjabeessituu Invastimantii Kennuu',
    'Jijjiirraa gosaa Piroojektii investimantii eyyamamuu',
    'Mirkaneessa Qorannoo haalaa dhiibbaa Naannoo',
    'TOR Qorannoo Eegumsa Nannoo Mirkaneessuu',
  ],
  9: [
    'Komii Waldiddaa Lafaa Simachuu fi Hiikuu',
    'Galmeessaa fi Kenna Kaartaa qabbiyyee',
    'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu',
    'Jijjiirraa maqaa raawwachuu (Bittaa fi Gurgurtaa, Kenna, Dhaaltummaa, Ajaja M/Murtii (Transfer of private property to another private party(for change name)',
    'Dhorka Mana Murtii Haquu / Cancelation of Court Injunction',
    'Walii galtee Liizii Galmeessuu/Registration of lease agreement',
    'Sirreeffama Qabiyyee sirreessuu',
    'Gaaffii lafaa simachuu(Registration of Request for land )',
    'Jijiiirraa itti fayyadama lafaa (Change Land use) (Jijjiirraa zoning)',
    'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii',
    'Galmeeessa fi Waraqaa Ragaa Kennuu Manneen Waliinii fi Qusannoo',
    'Jijjirraa  maqaa Raawwachuu (Transfer of private prperty to another party)for Change Name )',
    'Galmeessaa fi Kenna Kaartaa Dijitaalaa',
    'Qabiyyee walitti makuu/Merge Parcel',
    'Walii galtee Liizii Haaromsuu/Registration of lease agreement Renovation)',
    'Galmeessa Ragaa Dhorkuu, Fooyyessuu fi Kaasuu',
  ],
  10: [
    'Lakkoosfa kaffalaa Gibiraa(TIN)',
    'Sassabbii galii Idilee',
    'Sassaabbii galii M/Qopheessaa',
    'Murtii Gibiraa, kaffaltii VAT,TOT fi withholding  galmeessuu',
    'Deggersa maxxansa nagahee  kafalaa gibiraa kennuu',
    'Waraqaaa qulqullina idaa irraa bilisa ta\'u ibsu',
    'Gabaasa ooditii /Audit Report/',
    'Gumaataa fi galii buusaa gonofaa sassaabuu',
    'sassabbii galii Abba Alangaa',
    'Sassaabii galii geejjibaa raawwachuu',
    'Galii Bishaanii dhugaatii',
  ],
  11: [
    'Ogeessa Kanfaltii beenyaa(nama 2 ) barbaachiisa',
    'Ogeessa kanfaltii projeektii (nama 2)',
    'Ogeessa liqii kafaamtoota misoomaa (nama 1)',
    'Ogeessa Kanfaltii tajaajila addaa addaa (nama 2)',
    'Ogeessa bittaa fi tajaajilaa (nama 2)',
  ],
};

// ---------------------------------------------------------------------------

async function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'") // curly quotes → straight
    .replace(/\s+/g, ' ')
    .trim();
}

async function findServiceByName(name, allServices) {
  const target = await normalize(name);
  let best = null;
  let bestScore = 0;

  for (const svc of allServices) {
    for (const lang of ['or', 'en', 'am']) {
      const candidate = await normalize(svc.name?.[lang]);
      if (!candidate) continue;

      // Exact match
      if (candidate === target) return svc;

      // Substring match score
      const longer = Math.max(candidate.length, target.length);
      const shorter = Math.min(candidate.length, target.length);
      if (candidate.includes(target) || target.includes(candidate)) {
        const score = shorter / longer; // 0-1
        if (score > bestScore) { best = svc; bestScore = score; }
      }
    }
  }

  return bestScore > 0.5 ? best : null;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Wipe existing windows
  await Window.deleteMany({});
  console.log('Cleared existing windows');

  const allServices = await Service.find().populate('organization', 'name');
  console.log(`Loaded ${allServices.length} services from DB`);

  const results = [];

  for (const [windowNum, serviceNames] of Object.entries(WINDOW_SERVICES)) {
    const num = Number(windowNum);
    const matchedIds = new Set();
    const missed = [];

    for (const name of serviceNames) {
      const svc = await findServiceByName(name, allServices);
      if (svc) {
        matchedIds.add(svc._id.toString());
      } else {
        missed.push(name);
      }
    }

    // Group by organization — one Window doc per org per window number
    const byOrg = new Map();
    for (const id of matchedIds) {
      const svc = allServices.find(s => s._id.toString() === id);
      if (!svc) continue;
      const orgId = svc.organization?._id?.toString() ?? 'unknown';
      if (!byOrg.has(orgId)) byOrg.set(orgId, { orgId: svc.organization?._id, services: [] });
      byOrg.get(orgId).services.push(svc._id);
    }

    for (const { orgId, services } of byOrg.values()) {
      if (orgId) {
        results.push({ number: num, organization: orgId, services });
      }
    }

    console.log(`Foddaa ${num}: matched ${matchedIds.size}/${serviceNames.length}${missed.length ? ', missed: ' + missed.slice(0,3).join('; ') : ''}`);
  }

  await Window.insertMany(results);
  console.log(`\nInserted ${results.length} window documents across 11 windows.`);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
