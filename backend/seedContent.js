const path = require('path');
const xlsx = require('xlsx');
const About = require('./models/About');
const Contact = require('./models/Contact');
const Organization = require('./models/Organization');
const Service = require('./models/Service');
const Window = require('./models/Window');
const News = require('./models/News');
const Gallery = require('./models/Gallery');
const FAQ = require('./models/FAQ');

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
      en: 'To provide fast, transparent, and accessible government services to all citizens of Ethiopia.',
      am: 'ለኢትዮጵያ ሁሉም ዜጎች ፈጣን፣ ግልጽ እና ቀላሉ ለማግኘት የሚቻሉ አገልግሎቶችን ማቅረብ።',
      or: 'Lammiilee hunda tajaajila saffisaa, ifaa fi dhaqqabamaa kennuu.',
    },
    vision: {
      en: "To become Africa's model one-stop government service center empowering citizens.",
      am: 'የዜጎችን አቅም የሚፈቱ የአፍሪካ ሞዴል አንድ-ቦታ አገልግሎት ማዕከል ማድረግ።',
      or: "Giddu-gala tajaajila bakka tokkotti mudelli Afrikaa ta'uu.",
    },
    objectives: { en: '', am: '', or: '' },
    branchIntroduction: { en: '', am: '', or: '' },
    history: { en: '', am: '', or: '' },
    // Seed story paragraphs — trilingual
    story: [
      {
        paragraph: {
          en: "MESOB Center was established as part of Ethiopia's digital transformation agenda. The name 'Mesob' symbolizes unity, sharing, and service — just as the traditional mesob basket brings families and communities together, this center brings multiple government services under one roof, making them easily accessible to the public.",
          am: "MESOB ማዕከል የኢትዮጵያ ዲጂታል ትሩፋት አጀንዳ አካል ሆኖ ተቋቋመ። 'ሜሶብ' የሚለው ስም አሃድነት፣ አጋርነት እና አገልግሎትን ያሳያል — ልክ ሜሶቡ ቤተሰብና ማህበረሰብ እንዲሰባሰቡ እንደሚያደርገው፣ ይህ ማዕከልም ብዙ የመንግሥት አገልግሎቶችን ጣሪያ አንድ ያደርጋቸዋል።",
          or: "Giddaan MESOB akka kutaa sagantaa jijjiirama dijitaalaa Itoophiyaatti hundaa'e. Maqaan 'Mesob' tokkummaa, qooduu fi tajaajila bakka bu'a — akkuma mesobni maatii fi hawaasa walitti fiduuf itti fayyadamu, giddaan kunis tajaajiloota mootummaa adda addaa walitti qabee, salphaatti ummataaf dhiyeessa.",
        },
        order: 1,
      },
      {
        paragraph: {
          en: "The Sululta Branch brings over 50 federal government services under one roof — making government accessible, fast, and transparent for every citizen. Our core goal is to ensure citizens no longer waste time and resources visiting multiple offices to access government services.",
          am: "ሱሉልታ ቅርንጫፍ ከ50 በላይ የፌዴራሌ አገልግሎቶችን ጣሪያ አንድ ያደርጋቸዋል — መንግሥት ለሁሉም ዜጋ ቀላሉ፣ ቀልጣፋ እና ግልጽ ያደርጋቸዋል። ዋና ዓላማችን ዜጎች ለአገልግሎት ፍለጋ ወደ ብዙ ቢሮዎች ሲሄዱ ጊዜ እና ሀብት እንዳያጠፉ ማረጋገጥ ነው።",
          or: "Dameen Sululta tajaajila federaalaa 50 ol ta'an takka jalatti argamsiisa — kanaanis mootummaa dhaqqabamaa, saffisaa fi ifa ta'e ummataaf kennuuf hojjeta. Kaayyoon keenya inni guddaan, lammiileen tajaajila mootummaa argachuuf yeroo fi qabeenya baay'ee akka hin balleessine gochuudha.",
        },
        order: 2,
      },
    ],
    // Seed highlights — "Waan Nu Addeessu" bullet list
    highlights: [
      { text: { en: 'Bring over 50 federal services under one roof', am: 'ከ50 በላይ ፌዴራሌ አገልግሎቶችን አንድ ጣሪያ ስር ማምጣት', or: 'Tajaajila federaalaa 50 ol bakka tokkotti argamsiisuu' }, order: 1 },
      { text: { en: 'Speed up service delivery through electronic systems', am: 'የኤሌክትሮኒክስ ስርዓትን ተጠቅሞ አገልግሎትን ማፋጠን', or: 'Sirna elektirooniksii fayyadamuun tajaajila saffisiisuu' }, order: 2 },
      { text: { en: 'Maintain transparency and accountability', am: 'ግልጽነት እና ተጠያቂነት ማቆየት', or: 'Ifa ta\'uu fi itti gaafatamummaa qabaachuu' }, order: 3 },
      { text: { en: 'Serve citizens in Afaan Oromo, Amharic and English', am: 'ዜጎችን በአፋን ኦሮሞ፣ አማርኛ እና እንግሊዝኛ ማገልገል', or: 'Afaan Oromoo, Amaariffaa fi Ingiliffaan tajaajiluu' }, order: 4 },
      { text: { en: 'Ensure good governance and public accessibility', am: 'ጥሩ አስተዳደር እና ለህዝብ ተደራሽነት ማረጋገጥ', or: 'Bulchiinsa gaarii fi dhaqqabamummaa uummataaf mirkaneessuu' }, order: 5 },
      { text: { en: 'Improve service using modern technology', am: 'ዘመናዊ ቴክኖሎጂን ተጠቅሞ አገልግሎትን ማሻሻል', or: 'Teeknooloojii ammayyaa fayyadamuun tajaajila fooyyessuu' }, order: 6 },
      { text: { en: 'Prioritize respect and service quality above all', am: 'ከሁሉ በላይ ክብርን እና የአገልግሎት ጥራትን ቅድሚያ መስጠት', or: 'Kabajaa fi qulqullina tajaajilaa duraan dursuu' }, order: 7 },
    ],
    // Seed core values from frontend
    values: [
      { icon: 'Heart', title: { en: 'Citizen-First', am: 'ዜጎችን ቅድሚያ', or: 'Lammiilee Dursa Kennu' }, description: { en: 'Every decision starts with what is best for citizens.', am: 'ለዜጎች ምርጥ የሆነው ከማሰብ ጀምሮ እያንዳንዱ ውሳኔ ይወሰናል።', or: "Murteen hundi kan jalqaban maal lammiileef gaariidha." }, order: 1 },
      { icon: 'Award', title: { en: 'Excellence', am: 'ምርጥነት', or: 'Caalaatti Hojjechuu' }, description: { en: 'We strive for the highest quality in every service delivered.', am: 'በሚሰጠው እያንዳንዱ አገልግሎት ከፍተኛ ጥራት ለማሳካት እንጥራለን።', or: "Tajaajila kennamu kamiyyuu keessatti qulqullina olaanaa galmaasuuf hojjennan." }, order: 2 },
      { icon: 'Eye', title: { en: 'Transparency', am: 'ግልጽነት', or: 'Iftoomina' }, description: { en: 'Open, honest, and accountable operations at all times.', am: 'ሁሌ ጊዜ ክፍት፣ ታማኝ እና ተጠያቂ አሠራር።', or: "Hojii baname, dhugaawaa fi itti gaafatamaa yeroo hunda." }, order: 3 },
      { icon: 'TrendingUp', title: { en: 'Innovation', am: 'ፈጠራ', or: 'Haaroomsa' }, description: { en: 'Embracing digital transformation to modernize service delivery.', am: 'የዲጂታል ለውጥን ተቀብሎ አገልግሎት አሰጣጥን ዘመናዊ ማድረግ።', or: "Jijjiirama dijitaalaa fudhachuun tajaajila kennuu ammayyeessuu." }, order: 4 },
      { icon: 'Target', title: { en: 'Efficiency', am: 'ቅልጥፍና', or: 'Hojii Saffisaa' }, description: { en: 'Minimizing bureaucracy to maximize value for citizens.', am: 'ቢሮክራሲን ቀንሶ ለዜጎች ዋጋ ማሳደግ።', or: "Biirookratii hir'isuun bu'aa lammiileef guddisuu." }, order: 5 },
      { icon: 'History', title: { en: 'Integrity', am: 'ሐቀኝነት', or: 'Qulqullina Yaadaa' }, description: { en: 'Upholding the highest ethical standards in public service.', am: 'ለህዝብ አገልግሎት ከፍተኛ የስነ-ምግባር ደረጃዎችን ማክበር።', or: "Sadarkaa xiyyeeffannoo ol'aanaa tajaajila ummataa keessatti eeguu." }, order: 6 },
    ],
    // Seed stats from frontend
    stats: [
      { value: '50+', label: { en: 'Federal Services', am: 'ፌዴራሌ አገልግሎቶች', or: 'Tajaajila Federaalaa' }, order: 1 },
      { value: '98%', label: { en: 'Satisfaction Rate', am: 'የእርካታ ደረጃ', or: 'Sadarkaa Quufinsa' }, order: 2 },
      { value: '28', label: { en: 'Partner Offices', am: 'ሸሪክ ቢሮዎች', or: 'Waajjirawwan Gamtaa' }, order: 3 },
    ],
    managerName: 'Ato Dereje debala',
    managerTitle: {
      en: 'Branch Manager, MESOB Sululta',
      am: 'የቅርንጫፍ ሥራ አስኪያጅ፣ MESOB ሱሉልታ',
      or: 'Hooggana Damee, MESOB Sululta',
    },
    managerMessage: {
      en: "Our mission at MESOB Sululta Branch is not just to process documents — it is to restore citizens' trust in government service delivery.",
      am: 'በ MESOB ሱሉልታ ቅርንጫፍ ያለን ዓላማ ሰነዶችን ማስኬድ ብቻ አይደለም — ዜጎች በአገልግሎት አሰጣጥ ላይ ያላቸውን እምነት ወደ ነበረበት መመለስ ነው።',
      or: 'Kaayyoon keenya Damee Sululta MESOB keessatti galmee qofaa hojjechuu miti — amanamummaa lammiilee tajaajila mootummaaf qaban deebisuudha.',
    },
    managerPhoto: '',
    storyBadge: { en: 'History', am: 'ታሪክ', or: 'Seenaa' },
    storyTitle: { en: 'Our Story', am: 'ታሪካችን', or: 'Seenaa Keenya' },
    missionTitle: { en: 'Mission', am: 'ተልዕኮ', or: 'Ergama' },
    visionTitle: { en: 'Vision', am: 'ራዕይ', or: "Mul'ata" },
    valuesTitle: { en: 'Core Values', am: 'መሠረታዊ እሴቶች', or: 'Gatiileen Ijoo' },
    valuesSubtitle: {
      en: 'The principles that guide everything we do',
      am: 'እያንዳንዱ ሥራ የሚመራበት መርህ',
      or: 'Gatiileen hojii keenya hundaa kan qajeelchu',
    },
    managerMessageTitle: {
      en: 'Message from Branch Manager',
      am: 'የቅርንጫፍ ሥራ አስኪያጅ መልዕክት',
      or: 'Ergaa Hooggansa Damee',
    },
  });

  console.log('Seed completed: about content inserted.');
};

// Backfills any About document that predates the new fields so the
// frontend always receives complete data (runs on every server boot).
const ensureAboutDefaults = async () => {
  const DEFAULT = {
    managerPhoto: '',
    storyBadge: { en: 'History', am: 'ታሪክ', or: 'Seenaa' },
    storyTitle: { en: 'Our Story', am: 'ታሪካችን', or: 'Seenaa Keenya' },
    missionTitle: { en: 'Mission', am: 'ተልዕኮ', or: 'Ergama' },
    visionTitle: { en: 'Vision', am: 'ራዕይ', or: "Mul'ata" },
    valuesTitle: { en: 'Core Values', am: 'መሠረታዊ እሴቶች', or: 'Gatiileen Ijoo' },
    valuesSubtitle: {
      en: 'The principles that guide everything we do',
      am: 'እያንዳንዱ ሥራ የሚመራበት መርህ',
      or: 'Gatiileen hojii keenya hundaa kan qajeelchu',
    },
    managerMessageTitle: {
      en: 'Message from Branch Manager',
      am: 'የቅርንጫፍ ሥራ አስኪያጅ መልዕክት',
      or: 'Ergaa Hooggansa Damee',
    },
  };

  const abouts = await About.find();
  let updated = 0;
  for (const about of abouts) {
    let changed = false;
    if (about.managerPhoto === undefined) {
      about.managerPhoto = DEFAULT.managerPhoto;
      changed = true;
    }
    for (const key of Object.keys(DEFAULT)) {
      if (key === 'managerPhoto') continue;
      const value = DEFAULT[key];
      const current = about[key];
      const needsFill = !current ||
        !current.en || !current.am || !current.or ||
        (typeof current.en === 'string' && current.en === '' && value.en);
      if (needsFill) {
        about[key] = value;
        changed = true;
      }
    }
    // Backfill colors on values/stats sub-documents
    const valueColors = ['', 'text-red-600', 'text-brand-gold', 'text-brand-blue', 'text-brand-green', 'text-purple-600', 'text-teal-600'];
    if (about.values && about.values.length) {
      about.values.forEach((v, idx) => {
        if (!v.color) {
          v.color = valueColors[(idx % (valueColors.length - 1)) + 1];
          changed = true;
        }
      });
    }
    const statColors = ['text-brand-green', 'text-brand-blue', 'text-brand-gold'];
    if (about.stats && about.stats.length) {
      about.stats.forEach((s, idx) => {
        if (!s.color) {
          s.color = statColors[idx % statColors.length];
          changed = true;
        }
      });
    }
    if (changed) {
      await about.save();
      updated += 1;
    }
  }
  if (updated > 0) {
    console.log(`Backfill completed: ${updated} About document(s) updated with new fields.`);
  }
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

const seedFAQs = async () => {
  const existing = await FAQ.countDocuments();
  if (existing > 0) {
    console.log('Seed skipped: FAQs already exist.');
    return;
  }

  const faqs = [
    { question: { en: 'What is MESOB Center?', am: 'MESOB ማዕከል ምንድን ነው?', or: 'Giddaan MESOB maali?' }, answer: { en: 'MESOB (ሜሶብ) is Ethiopia\'s modern One-Stop Shop government service center that allows citizens to access multiple federal government services in one convenient location, eliminating the need to visit different offices.', am: 'MESOB (ሜሶብ) የኢትዮጵያ ዘመናዊ የአንድ ቦታ አቅርቦት የመንግሥት አገልግሎት ማዕከል ነው።', or: 'MESOB (ሜሶብ) giddu-gala tajaajila mootummaa bakka tokkotti argachuu kan dandeessisu Itoophiyaa ti.' }, category: 'General', order: 1, isPopular: true },
    { question: { en: 'What documents do I need to bring when visiting?', am: 'ስጎብኝ ምን ሰነዶች ማምጣት አለብኝ?', or: 'Daaw\'achuuf galmeelee maa fida?' }, answer: { en: 'You should always bring your National ID card or Kebele ID as primary identification. Additional documents vary by service type.', am: 'ሁልጊዜ ብሔራዊ መታወቂያ ካርድ ወይም ቀበሌ መታወቂያ ማምጣት አለብዎት።', or: 'Yeroo hunda kaardii ID Biyyoolessa ykn ID Qaballee fida.' }, category: 'General', order: 2, isPopular: true },
    { question: { en: 'How long does it take to get a National ID card?', am: 'ብሔራዊ መታወቂያ ካርድ ለማግኘት ምን ያህል ጊዜ ይወስዳል?', or: 'Kaardii ID Biyyoolessa argachuuf yeroon meeqa fudhata?' }, answer: { en: 'Processing time for National ID cards is typically 3–5 working days. You will receive an SMS notification when your card is ready for collection.', am: 'የብሔራዊ መታወቂያ ካርዱ ሂደት ሰዓት ብዙውን ጊዜ 3–5 የሥራ ቀናት ነው።', or: 'Yeroo ibsaa kaardii ID Biyyoolessa yeroo hojii 3–5 dha.' }, category: 'Services', order: 3, isPopular: true },
    { question: { en: 'Can I pay government fees online?', am: 'የመንግሥት ክፍያዎችን ኦንላይን ልከፍል እችላለሁ?', or: 'Kaffaltii mootummaa onlaayiniidhaan kaffaluu danda\'aa?' }, answer: { en: 'Yes! MESOB supports digital payments through CBE Birr, TeleBirr, and the MESOB mobile application.', am: 'አዎ! MESOB ዲጂታዊ ክፍያዎችን ከ CBE ቢር፣ ቴሌቢር እና MESOB ሞባይል አፕሊኬሽን ይደግፋል።', or: 'Eeyyee! MESOB kaffaltii dijitaalaa CBE Birr, TeleBirr fi app MESOB tiin ni deeggarsa.' }, category: 'Services', order: 4, isPopular: true },
    { question: { en: 'How do I renew my passport?', am: 'ፓስፖርቴን እንዴት አድሳለሁ?', or: 'Paasipoorti koo akkamitti haaromsa?' }, answer: { en: 'Visit the Passport Department with your current passport, National ID, 2 passport-size photos, and completed application form. Service takes 10–15 working days.', am: 'ፓስፖርት ክፍሉ ይሂዱ ከፓስፖርትዎ፣ ብሔራዊ መታወቂያ፣ 2 ፎቶ እና ሞሉ ቅጽ ጋር።', or: 'Kutaa Paasipoortiitti paasipoorti kee, ID Biyyoolessa, suuraa 2 fi foomii guutameen dhufi.' }, category: 'Services', order: 5, isPopular: false },
    { question: { en: 'What are your working hours?', am: 'የሥራ ሰዓቶችዎ ምን ያህል ናቸው?', or: 'Sa\'aatiin hojii keessan meeqa?' }, answer: { en: 'We are open Monday to Friday from 8:30 AM to 5:30 PM, and Saturday from 8:30 AM to 12:00 PM. We are closed on Sundays and Ethiopian public holidays.', am: 'ሰኞ እስከ አርብ ከ8:30 – 17:30፣ ቅዳሜ ከ8:30 – 12:00 ክፍት ነን።', or: 'Wiixata hanga Jimaata 8:30 – 17:30, Sanbata 8:30 – 12:00 ni banama.' }, category: 'Hours', order: 6, isPopular: true },
    { question: { en: 'Where is MESOB Sululta Branch located?', am: 'MESOB ሱሉልታ ቅርንጫፍ የት ይገኛል?', or: 'Dameen MESOB Sululta eessa argama?' }, answer: { en: 'MESOB Sululta Branch is located on the main road of Sululta Town, Oromia Region, approximately 30km north of Addis Ababa.', am: 'MESOB ሱሉልታ ቅርንጫፍ ከሱሉልታ ከተማ ዋና መንገድ ላይ ይገኛል።', or: 'Dameen MESOB Sululta daandii guddaa Magaalaa Sululta, Oromiyaa, km 30 gara kaabaa Finfinnee irraa argama.' }, category: 'Location', order: 7, isPopular: false },
    { question: { en: 'How do I file a complaint about a service?', am: 'ስለ አገልግሎት ቅሬታ እንዴት አስገባለሁ?', or: 'Komii tajaajila irratti akkamitti galcha?' }, answer: { en: 'You can file a complaint through our online Feedback Center, in person at the Customer Support desk, by phone, or via email.', am: 'ቅሬታ በኦንላይን ፊድባክ ማዕከልዎ፣ በደንበኛ ድጋፍ ዴስክ ፊት ለፊት፣ በስልክ ወይም በኢሜይል ሊያቀርቡ ይችላሉ።', or: 'Komii onlaayinii Giddaa Yaadaatiin, fuula-duratti meja deeggarsa maamiltootaa, bilbilaan ykn imeeliidhaan galchi.' }, category: 'General', order: 8, isPopular: false },
    { question: { en: 'Can I book an appointment in advance?', am: 'ቀጠሮ አስቀድሜ ልይዝ እችላለሁ?', or: 'Beellama duraan qabachuu danda\'aa?' }, answer: { en: 'Yes, you can book appointments online through the MESOB portal or mobile app. This helps reduce waiting time significantly.', am: 'አዎ፣ ቀጠሮ MESOB ፖርታሉ ወይም ሞባይል አፕ ላይ ኦንላይን ሊይዙ ይችላሉ።', or: 'Eeyyee, beellama onlaayinii pooortaala MESOB ykn app mobiilii tiin qabachuu ni danda\'ama.' }, category: 'Services', order: 9, isPopular: false },
    { question: { en: 'Is there a MESOB mobile app?', am: 'MESOB ሞባይል አፕሊኬሽን አለ?', or: 'App mobiilii MESOB ni jira?' }, answer: { en: 'Yes! The MESOB mobile application is available for both Android and iOS devices. Download it from Google Play Store or Apple App Store.', am: 'አዎ! MESOB ሞባይል አፕሊኬሽን ለ Android እና iOS ይገኛል።', or: 'Eeyyee! App mobiilii MESOB Android fi iOS lamaaniifuu ni argama.' }, category: 'Digital', order: 10, isPopular: true },
  ];

  await FAQ.insertMany(faqs);
  console.log(`Seed completed: ${faqs.length} FAQs inserted.`);
};

const seedGallery = async () => {
  const existing = await Gallery.countDocuments();
  if (existing > 0) {
    console.log('Seed skipped: gallery items already exist.');
    return;
  }

  // Using picsum.photos for placeholder images (free, no API key needed, reliable)
  // Admins can replace these with real uploads via the admin panel
  const galleryItems = [
    {
      title: { en: 'MESOB Sululta Building', am: 'MESOB ሱሉልታ ህንጻ', or: 'Ijaarama MESOB Sululta' },
      description: { en: 'The main building of MESOB Sululta Branch', am: 'የMESOB ሱሉልታ ቅርንጫፍ ዋና ህንጻ', or: 'Ijaarama guddaa Damee MESOB Sululta' },
      caption: { en: 'MESOB Sululta - Serving the Community', am: 'MESOB ሱሉልታ - ማህበረሰብን በማገልገል', or: 'MESOB Sululta - Hawaasa Tajaajiluu' },
      imageUrl: 'https://picsum.photos/seed/mesob1/800/600',
      category: 'building',
      order: 1,
    },
    {
      title: { en: 'Community Event', am: 'የማህበረሰብ ዝግጅት', or: 'Goosaa Hawaasaa' },
      description: { en: 'Community engagement event at MESOB Sululta', am: 'በMESOB ሱሉልታ የማህበረሰብ ተሳትፎ ዝግጅት', or: 'Goosaa hirmaannaa hawaasaa MESOB Sulultaa' },
      caption: { en: 'Working Together for a Better Community', am: 'ለተሻለ ማህበረሰብ አብረን መስራት', or: 'Hawaasa Fooyyaa' },
      imageUrl: 'https://picsum.photos/seed/mesob2/800/600',
      category: 'community',
      order: 2,
    },
    {
      title: { en: 'Service Windows', am: 'የአገልግሎት መስኮቶች', or: 'Foddaawwan Tajaajilaa' },
      description: { en: 'Service windows at MESOB Sululta', am: 'በMESOB ሱሉልታ የአገልግሎት መስኮቶች', or: 'Foddaawwan tajaajilaa MESOB Sululta' },
      caption: { en: 'Efficient Service Delivery', am: 'ቀልጣፋ አገልግሎት አሰጣጥ', or: 'Tajaajila Saffisaa Kennuu' },
      imageUrl: 'https://picsum.photos/seed/mesob3/800/600',
      category: 'activities',
      order: 3,
    },
    {
      title: { en: 'Staff Training Session', am: 'የሰራተኞች ስልጠና', or: 'Leenjii Hojjettootaa' },
      description: { en: 'Capacity building training for MESOB staff', am: 'ለMESOB ሰራተኞች የአቅም ግንባታ ስልጠና', or: 'Leenjii ciminaa hojjettoota MESOB' },
      caption: { en: 'Investing in Our People', am: 'በሰራተኞቻችን ላይ መዋዕለ ንዋይ ማፍሰስ', or: 'Hojjettoota Keenya Keessatti Kaappitaala' },
      imageUrl: 'https://picsum.photos/seed/mesob4/800/600',
      category: 'events',
      order: 4,
    },
  ];

  await Gallery.insertMany(galleryItems);
  console.log(`Seed completed: ${galleryItems.length} gallery items inserted.`);
};

const seedNews = async () => {
  const existing = await News.countDocuments();
  if (existing > 0) {
    console.log('Seed skipped: news items already exist.');
    return;
  }

  const newsItems = [
    {
      title: { en: 'MESOB Sululta Branch Celebrates 2nd Anniversary', am: 'MESOB ሱሉልታ ቅርንጫፍ 2ኛ ዓመት ምስረታ አከበረ', or: 'Dameen MESOB Sululta Guyyaa Dhalootaa 2ffaa Kabaje' },
      content: { en: 'The MESOB Sululta Branch proudly celebrates its second anniversary, having served over 50,000 citizens with excellence and efficiency. The branch has significantly reduced waiting times and improved service delivery across all departments.\n\nSince its opening, the Sululta Branch has become a model for customer-centric public service in the Oromia region. Citizens now enjoy faster processing times, friendly staff, and a welcoming environment.\n\nWe thank all our visitors, partners, and staff for making these two years a remarkable success. Here\'s to many more years of serving our community!', am: 'MESOB ሱሉልታ ቅርንጫፍ ከ50,000 በላይ ዜጎችን በማገልገል 2ኛ ዓመቱን በኩራት አከበረ።', or: 'Dameen MESOB Sululta waggaa 2ffaa isaa lammiilee 50,000 ol tajaajiluun kabaje.' },
      excerpt: { en: 'MESOB Sululta Branch marks two years of serving the community with excellence.', am: 'MESOB ሱሉልታ ቅርንጫፍ ማህበረሰብን በማገልገል 2ኛ ዓመቱን አከበረ።', or: 'Dameen MESOB Sululta waggaa 2ffaa hawaasa tajaajiluun kabaje.' },
      category: 'news',
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date('2024-12-15'),
      coverImageUrl: '',
      tags: ['anniversary', 'milestone', 'service'],
    },
    {
      title: { en: 'MESOB Launches Digital Payment Integration', am: 'MESOB ዲጂታል ክፍያ ውህደት ጀመረ', or: 'MESOB Walitti Hidhinsa Kaffaltii Dijitaalaa Jalqabe' },
      content: { en: 'MESOB Center proudly announces the launch of comprehensive digital payment integration. Citizens can now pay for all government services through MESOB Mobile App, CBE Birr, and TeleBirr platforms.\n\nThis new payment system eliminates the need for cash transactions, making service payments faster, safer, and more convenient for everyone. The integration covers all services offered at the Sululta branch.', am: 'MESOB ማዕከል አጠቃላይ የዲጂታል ክፍያ ውህደት መጀመሩን በኩራት ያስታውቃል።', or: 'Giddaan MESOB walitti hidhinsa kaffaltii dijitaalaa guutuu jalqabu isaa beeksisa.' },
      excerpt: { en: 'Digital payments now available for all MESOB services via mobile app and money transfer platforms.', am: 'በሞባይል አፕ እና በገንዘብ ማስተላለፊያ መድረኮች ዲጂታል ክፍያ አሁን ተገኝቷል።', or: 'Kaffaltii dijitaalaa app mobiilii fi plaatformii naannoo maallaqaa tajaajila MESOB hundaaf ni argama.' },
      category: 'news',
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date('2025-01-05'),
      coverImageUrl: '',
      tags: ['digital', 'payment', 'technology', 'innovation'],
    },
    {
      title: { en: 'Notice: Extended Service Hours During Ethiopian Christmas', am: 'ማስታወቂያ፡ በኢትዮጵያ ገና የተዘረጋ የአገልግሎት ሰዓት', or: 'Beeksisa: Sa\'aatii Tajaajilaa Diriirfame Yeroo Booraa Itoophiyaa' },
      content: { en: 'Dear Citizens, we are pleased to announce extended working hours from January 7–10 during the Ethiopian Christmas holiday. National ID and Passport services will operate from 8:00 AM to 7:00 PM.\n\nOther services will be available during regular hours. We wish you all a blessed Ethiopian Christmas!', am: 'ውድ ዜጎች፣ በኢትዮጵያ ገና በዓል ምክንያት ከጥር 7–10 የተዘረጋ የሥራ ሰዓት ማወጃችንን እንገልጻለን።', or: 'Lammiilee kabajamoo, sa\'aatii hojii diriirfame Amajjii 7–10 guyyaa boqonnaa Booraa Itoophiyaa beeksisna.' },
      excerpt: { en: 'Extended working hours during the Ethiopian Christmas holiday for your convenience.', am: 'ለእርስዎ ምቾት በኢትዮጵያ ገና በዓል የተራዘሙ የስራ ሰአታት።', or: 'Tajaajila keessaniif sa\'aatii hojii diriirfame guyyaa Booraa Itoophiyaa.' },
      category: 'notice',
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date('2024-12-28'),
      coverImageUrl: '',
      tags: ['holiday', 'hours', 'christmas'],
    },
    {
      title: { en: 'Digital Literacy Workshop for Elderly Citizens', am: 'ለአረጋውያን ዲጂታል ማንበብና መጻፍ አውደ ጥናት', or: 'Workshopii Dijitaalaa Lammiilee Maanguddoodhaaf' },
      content: { en: 'MESOB Sululta is hosting a free digital literacy workshop for elderly citizens every Saturday morning. Learn how to access government services from home using smartphones and computers.\n\nThe workshop covers basic smartphone use, internet navigation, and accessing MESOB online services. No prior experience needed - bring your phone and join us!', am: 'MESOB ሱሉልታ ለአረጋውያን በየቅዳሜ ማለዳ ነፃ የዲጂታል ማንበብና መጻፍ አውደ ጥናት ያካሂዳል።', or: 'MESOB Sululta lammiilee maanguddoodhaaf guyyaa Sanbata ganama worshoopii barnoota dijitaalaa bilisaa qopheessiti.' },
      excerpt: { en: 'Free digital skills workshop every Saturday at MESOB Sululta for senior citizens.', am: 'ለአረጋውያን በየቅዳሜው ነፃ የዲጂታል ክህሎት አውደ ጥናት።', or: 'Workshopii ogummaa dijitaalaa bilisaa guyyaa Sanbata MESOB Sulultaatti lammiilee maanguddoodhaaf.' },
      category: 'event',
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date('2025-01-10'),
      coverImageUrl: '',
      tags: ['workshop', 'digital', 'elderly', 'education'],
    },
    {
      title: { en: 'Office Closure – Ethiopian Epiphany (Timkat)', am: 'ቢሮ መዘጋት – የጥምቀት በዓል', or: 'Cufamuu Waajjiraa – Timkat' },
      content: { en: 'Dear Citizens, please note that all MESOB Center offices will be closed on January 19–20, 2025 for the Ethiopian Epiphany (Timkat) public holiday. Normal operations resume on January 21.\n\nWe apologize for any inconvenience this may cause. Emergency services will be available through our online platform.', am: 'ውድ ዜጎች፣ ሁሉም MESOB ማዕከል ቢሮዎች ጥር 11–12 ለጥምቀት በዓል ዝግ እንደሚሆኑ እንገልጻለን።', or: 'Lammiilee kabajamoo, waajjiraalee MESOB hundi Amajjii 19–20 Timkataaf cufamuu isaanii beeksisna.' },
      excerpt: { en: 'MESOB offices closed January 19-20 for the Timkat holiday.', am: 'MESOB ቢሮዎች ለጥምቀት በዓል ጥር 11-12 ዝግ ናቸው።', or: 'Waajjiraaleen MESOB Amajjii 19-20 Timkataaf cufamoo ta\'u.' },
      category: 'holiday',
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date('2025-01-15'),
      coverImageUrl: '',
      tags: ['holiday', 'closure', 'timkat'],
    },
    {
      title: { en: 'Updated Passport Application Requirements', am: 'የተሻሻሉ የፓስፖርት ማመልከቻ መስፈርቶች', or: 'Barbaachisuuwwan Gaaffii Paasipoortii Fooyya\'an' },
      content: { en: 'Starting February 1, 2025, all new passport applications must include an updated national ID card issued within the last 5 years. Please ensure your national ID is current before applying.\n\nThis change is part of our ongoing effort to improve document security and streamline the passport application process.', am: 'ከየካቲት 1, 2025 ጀምሮ ሁሉም አዲስ የፓስፖርት ማመልከቻዎች የተሻሻለ ብሔራዊ መታወቂያ ማካተት አለባቸው።', or: 'Gurraandhala 1, 2025 irraa jalqabee, gaaffii paasipoortii haaraa hundi kaardii ID biyyoolessa haaromsame of keessaa qabaachuu qaba.' },
      excerpt: { en: 'Important update: New passport applications now require an ID card issued within 5 years.', am: 'አስፈላጊ ማሻሻያ፡ አዲስ የፓስፖርት ማመልከቻዎች በ5 ዓመት ውስጥ የተሰጠ መታወቂያ ያስፈልጋቸዋል።', or: 'Fooyya\'insa barbaachisaa: Gaaffii paasipoortii haaraa kaardii ID waggaa 5 keessatti kenname barbaada.' },
      category: 'notice',
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date('2025-01-20'),
      coverImageUrl: '',
      tags: ['passport', 'requirements', 'id', 'update'],
    },
  ];

  await News.insertMany(newsItems);
  console.log(`Seed completed: ${newsItems.length} news items inserted.`);
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

  // Floor mapping for each window number
  const FLOOR_MAP = {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 2,
    6: 3, 7: 3, 8: 4, 9: 4, 10: 5, 11: 5,
  };

  const payload = Array.from(grouped.values()).map((item) => ({
    number: item.number,
    floor: FLOOR_MAP[item.number] || 1,
    organization: item.organization,
    services: Array.from(item.services),
  }));

  // Delete old windows without floor (from previous seed)
  await Window.deleteMany({ floor: { $exists: false } });

  if (payload.length) {
    await Window.insertMany(payload);
    console.log(`Seed completed: inserted ${payload.length} window records with floor info.`);
  } else {
    console.warn('Window seed completed with 0 records (check Excel/org matching).');
  }
};

const seedOrganizationContent = async () => {
  const OrganizationContent = require('./models/OrganizationContent');
  const existing = await OrganizationContent.countDocuments();
  if (existing > 0) return;

  await OrganizationContent.create({
    leadership: [
      {
        name: 'Ato Abebe Girma',
        role: { en: 'Branch Manager', am: 'የቅርንጫፍ ሥራ አስኪያጅ', or: 'Hooggana Damee' },
        avatar: 'A',
        color: 'bg-brand-green',
        order: 1,
      },
      {
        name: 'W/ro Tigist Haile',
        role: { en: 'Deputy Manager', am: 'ምክትል ሥራ አስኪያጅ', or: 'Itti Aanaa Hooggana' },
        avatar: 'T',
        color: 'bg-brand-blue',
        order: 2,
      },
      {
        name: 'Ato Girma Bekele',
        role: { en: 'Head of Administration', am: 'የአስተዳደር ኃላፊ', or: 'Hogganaa Bulchiinsaa' },
        avatar: 'G',
        color: 'bg-brand-gold',
        order: 3,
      },
      {
        name: 'W/ro Selamawit Alemu',
        role: { en: 'Head of Finance', am: 'የፋይናንስ ኃላፊ', or: 'Hogganaa Maallaqaa' },
        avatar: 'S',
        color: 'bg-purple-600',
        order: 4,
      },
    ],
    futureExpansion: {
      en: 'MESOB Sululta Branch is expanding to include additional departments by 2026.',
      am: 'MESOB ሱሉልታ ቅርንጫፍ እስከ 2026 ዓ.ም. ተጨማሪ ክፍሎችን ለማካተት እየሰፋ ነው።',
      or: "Dameen Sululta MESOB kutaalee dabalataa 2026 keessa dabaluuf babal'achaa jira.",
    },
    hierarchyTitle: {
      en: 'Organizational Hierarchy',
      am: 'የድርጅት ተዋረድ',
      or: 'Tartiiba Dhaabbata',
    },
  });

  console.log('Seed completed: organization content inserted.');
};

const seedSiteContent = async () => {
  await seedAbout();
  await ensureAboutDefaults();
  await seedContact();
  await seedNews();
  await seedGallery();
  await seedFAQs();
  await seedOrganizationContent();
  await seedWindowsFromExcel();
};

module.exports = { seedAbout, ensureAboutDefaults, seedContact, seedNews, seedGallery, seedFAQs, seedOrganizationContent, seedWindowsFromExcel, seedSiteContent };
