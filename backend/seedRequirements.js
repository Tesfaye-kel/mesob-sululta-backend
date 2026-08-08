/**
 * seedRequirements.js
 * Fills every service in the database with real requirements (trilingual).
 * Run: node seedRequirements.js
 * Safe to re-run — skips services that already have requirements.
 */
'use strict';

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Service = require('./models/Service');
const Requirement = require('./models/Requirement');
const Organization = require('./models/Organization');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const t = (en, am, or) => ({ en, am, or });
const req = (en, am, or, seq, mandatory = true) => ({
  requirementText: t(en, am, or),
  notes: t('', '', ''),
  isMandatory: mandatory,
  sequenceNo: seq,
});

// ─── Common reusable requirements ────────────────────────────────────────────
const nationalId       = (s) => req('Valid National ID / Kebele ID card', 'የብሔራዊ መታወቂያ / ቀበሌ መታወቂያ ካርድ', 'Kaardii ID Biyyoolessa / ID Qaballee', s);
const applicationForm  = (s) => req('Completed application form', 'የተሞላ ማመልከቻ ቅጽ', 'Foomii iyyannoo guutame', s);
const photo2x2         = (s) => req('2 recent passport-size photographs (3×4 cm)', 'ፎቶ ሁለት (3×4 ሴ.ሜ) አዲስ', 'Suuraa 2 (3×4 cm) kan yeroo dhiyoo', s);
const supportLetter    = (s) => req('Recommendation/support letter from local Kebele office', 'ከቀበሌ ጽሕፈት ቤት የደገፍ ደብዳቤ', 'Xalayaa deeggarsaa biiroo qaballee irra', s);
const taxClearance     = (s) => req('Valid tax clearance certificate', 'የቅርብ ጊዜ የታክስ ፍቃድ የምስክር ወረቀት', 'Sanadoo bilisummaa taaksii yeroo ammaa', s);
const birthCert        = (s) => req('Original birth certificate', 'የልደት የምስክር ወረቀት ዋናው', 'Waraqaa ragaa dhalootaa asli', s);
const marriageCert     = (s) => req('Original marriage certificate (if applicable)', 'የጋብቻ የምስክር ወረቀት ዋናው (ካለ)', 'Waraqaa ragaa heerumaa asli (yoo jiraate)', s, false);
const businessLicense  = (s) => req('Valid business license', 'ያልተቋረጠ የንግድ ፈቃድ', 'Hayyama daldalaa yeroo ammaa', s);
const tinCert          = (s) => req('TIN (Taxpayer Identification Number) certificate', 'ቲን ሰርተፍኬት', 'Waraqaa ragaa TIN', s);
const companyReg       = (s) => req('Company registration certificate', 'የድርጅት ምዝገባ ሰርተፍኬት', 'Sanadoo galmeessa dhaabbataa', s);
const bankStatement    = (s) => req('Recent bank statement (last 3 months)', 'የቅርብ ጊዜ የባንክ ሂሳብ መግለጫ (ባለፉት 3 ወር)', 'Ibsa herrega baankii yeroo dhiyoo (ji\'a 3)', s, false);
const copyId           = (s) => req('Photocopy of national ID (both sides)', 'ፎቶ ኮፒ ብሔራዊ መታወቂያ (ሁለቱም ጎን)', 'Koppii ID biyyoolessa (lamaanuu)', s);
const oldLicense       = (s) => req('Original existing/expired license', 'ያልተቋረጠ ወይም ያለቀበት ፈቃድ ዋናው', 'Hayyama duraa asli', s);
const orgStructure     = (s) => req('Organizational structure / bylaws document', 'የድርጅት መዋቅር / ህጋዊ ሰነድ', 'Caasaa dhaabbataa / sanadoo seera keessaa', s);

// ─── Requirements data keyed by partial service name (Oromo) ─────────────────
// Key: lowercase fragment of service name.or  →  Value: array of requirement objects
const REQUIREMENTS_BY_SERVICE_KEY = {

  // ── Galmeessa Siivilii ────────────────────────────────────────────────────
  'waragaa eenyummaa': [
    nationalId(1),
    photo2x2(2),
    supportLetter(3),
    req('Proof of current residential address (utility bill or kebele certificate)', 'የመኖሪያ አድራሻ ማረጋገጫ (ቢሎ ወይም ቀበሌ ሰርተፍኬት)', 'Mirkaneessa teessoo jireenyaa ammaa', 4),
    applicationForm(5),
  ],

  'galmeessaa sanadoota sivilii': [
    nationalId(1),
    birthCert(2),
    applicationForm(3),
    photo2x2(4),
    req('Witness statements from 2 community members', 'ከ2 የማህበረሰብ አባላት የምስክሮች ቃል', 'Ibsa ragaa miseensota hawaasaa 2', 5),
    supportLetter(6),
  ],

  'mirkaneessa sadadoota sivilii': [
    nationalId(1),
    req('Original document to be authenticated', 'ሊረጋገጥ ያለው ዋና ሰነድ', 'Sanadoo asli kan mirkanaa\'amu', 2),
    applicationForm(3),
    req('Fee payment receipt', 'ሰርቪስ ክፍያ ደረሰኝ', 'Rasiidhaa kaffaltii', 4),
  ],

  // ── Dhaabbata Bishaan ─────────────────────────────────────────────────────
  'simannaa maamila haaraa': [
    nationalId(1),
    applicationForm(2),
    photo2x2(3),
    req('Proof of property ownership or rental agreement', 'የሪል እስቴት ባለቤትነት ወይም ኪራይ ስምምነት', 'Mirkaneessa abbummaa qabeenya ykn waliigaltee kiraa', 4),
    req('Site plan / plot number document', 'የቦታ ካርታ / ፕሎት ቁጥር ሰነድ', 'Karaayyee iddoo / lakkoofsa qabiyyee', 5),
  ],

  'mirkaneessa gurmii waldaale hojii gamtaa': [
    nationalId(1),
    orgStructure(2),
    applicationForm(3),
    req('List of founding members with signatures', 'ዝርዝር የመስራቾች አባላት ፊርማቸው ያለ', 'Tarree miseensota hundeessitootaa mallattoodhaan', 4),
    req('Meeting minutes approving establishment', 'ስብሰባ ቃለ ጉባኤ (ምስረታ ያጸደቀ)', 'Galmee walgahii hundeeffama raggaasise', 5),
  ],

  'deggersa aaddaa addaa waldaalee': [
    nationalId(1),
    orgStructure(2),
    applicationForm(3),
    req('Project proposal / business plan', 'ፕሮጀክት ሃሳብ / የንግድ ዕቅድ', 'Yaada pirojektii / karoora daldalaa', 4),
    taxClearance(5, false),
  ],

  // ── CHUO (Cooperatives) ───────────────────────────────────────────────────
  'qaama seerummaa waldaalee imx': [
    nationalId(1),
    orgStructure(2),
    applicationForm(3),
    req('List of members with their contribution amounts', 'ዝርዝር አባላት ከድርሻ መጠናቸው ጋር', 'Tarree miseensota hanga hirmaannaa isaaniin', 4),
    req('Proof of initial capital (bank deposit slip)', 'ሰነድ ማስረጃ ለወሃ ካፒታል (ባንክ ስሊፕ)', 'Mirkaneessa kaappitaala jalqabaa (siliippii baankii)', 5),
    photo2x2(6),
  ],

  'deeggersa wldaalee imx paakeejiwwan': [
    nationalId(1),
    orgStructure(2),
    req('Recent cooperative performance report', 'የቅርብ ጊዜ የህብረት ሥራ አፈጻጸም ሪፖርት', 'Gabaasa raawwii waldichaa yeroo dhiyoo', 3),
    applicationForm(4),
  ],

  'waldaalee imx investimentiitti': [
    nationalId(1),
    orgStructure(2),
    companyReg(3),
    taxClearance(4),
    applicationForm(5),
    req('Business plan with investment details', 'የኢንቨስትመንት ዝርዝር ያለው የንግድ ዕቅድ', 'Karoora daldalaa qabiyyee invastimantii qabu', 6),
  ],

  // ── Hawaasummaa (Labour & Social Affairs) ────────────────────────────────
  'hoji dhabdoota galmeessuu': [
    nationalId(1),
    photo2x2(2),
    applicationForm(3),
    req('Educational certificates (highest level)', 'የትምህርት ምስክር ወረቀቶች (ከፍተኛ ደረጃ)', 'Waraqaalee ragaa barnootaa (sadarkaa olaanaa)', 4),
    req('CV / resume', 'ሲቪ / ሬዙሜ', 'CV / seenaa jireenya hojii', 5),
    supportLetter(6, false),
  ],

  'kaardii hoji dhabdumma haaromsuu': [
    nationalId(1),
    req('Existing job seeker card (original)', 'ያለው የሥራ ፈላጊ ካርድ ዋናው', 'Kaardii hoji dhabdummaa duraa asli', 2),
    applicationForm(3),
    req('Proof that employment has not been found (self-declaration)', 'ሥራ እንዳልተገኘ ማስረጃ (ራስ ማረጋገጫ)', 'Mirkaneessa hoji akka hin argamne (ibsa ofii)', 4),
  ],

  'walii galtee qacarrii ogeessota profeeshinaala': [
    nationalId(1),
    businessLicense(2),
    tinCert(3),
    req('Employment contract draft (signed)', 'ረቂቅ የቅጥር ውሉ (የተፈረመ)', 'Diraaftii waliigaltee qacarraa (mallattaa\'ame)', 4),
    req('Job description for each professional role', 'ለእያንዳንዱ ሙያዊ ሚና የሥራ መግለጫ', 'Ibsa hojii gahee ogummaatiin', 5),
  ],

  'hayyama ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    taxClearance(4),
    orgStructure(5),
    req('Office lease agreement', 'የቢሮ ኪራይ ስምምነት', 'Waliigaltee kiraa waajjiiraa', 6),
    bankStatement(7),
    photo2x2(8),
  ],

  'hayyama ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haaressuu': [
    nationalId(1),
    oldLicense(2),
    taxClearance(3),
    req('Annual activity report', 'ዓመታዊ የሥራ ሪፖርት', 'Gabaasa hojii waggaa', 4),
    applicationForm(5),
  ],

  'hayyama ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu addaan cite': [
    nationalId(1),
    req('Court order or legal decision for reactivation', 'የፍርድ ቤት ትእዛዝ ወይም ሕጋዊ ውሳኔ', 'Ajaja mana murtii ykn murta seeraa', 2),
    oldLicense(3),
    applicationForm(4),
    taxClearance(5),
  ],

  'hayyama ejensii dhuunfaa hojii fi hojjetama biyyaa keessaa wal quunamsiisuu bade': [
    nationalId(1),
    req('Police report / sworn affidavit of loss', 'ሊሞሽ ሰርተፍኬት / ስዋርን ስቴትመንት', 'Gabaasa poolisii / ibsa kakuu dhabamuu', 2),
    applicationForm(3),
    taxClearance(4),
  ],

  'restore licenses': [
    nationalId(1),
    oldLicense(2),
    req('Bank guarantee or security deposit receipt', 'ዋስትና ደብዳቤ ወይም ዋስ ካሽ ደረሰኝ', 'Waraqaa garantii baankii ykn rasiidhaa dabalataa nageenyaa', 3),
    applicationForm(4),
  ],

  'hayyama ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haquu': [
    nationalId(1),
    oldLicense(2),
    req('Written request for cancellation with reason', 'ጥያቄ ፊደል ስለሰረዛ ምክንያቱ', 'Gaaffii barreeffamaa haquuf sababa qabu', 3),
    taxClearance(4),
    applicationForm(5),
  ],

  'hayyama waldaalee hawaasa aadda addaa': [
    nationalId(1),
    orgStructure(2),
    applicationForm(3),
    req('Community or social purpose documentation', 'ዓላማ ማህበረሰብ ሰነዶች', 'Sanadoo kaayyoo hawaasummaa', 4),
    photo2x2(5),
  ],

  'waldiddaa dhimma hojjataaf hojjachiisaa': [
    nationalId(1),
    applicationForm(2),
    req('Signed employment contract or work agreement', 'ፊርማ ያለው የቅጥር ወይም የሥራ ስምምነት', 'Waliigaltee qacarraa ykn hojii mallattaa\'ame', 3),
    req('Evidence of the dispute (correspondence, payslips, etc.)', 'ማስረጃ ግጭቱ (ደብዳቤ፣ የደሞዝ ቅጂ፣ ወዘተ)', 'Ragaa waldhabbii (xalayaa, siliippii miindaa, kkf)', 4),
  ],

  // ── Daldala (Trade / Business) ───────────────────────────────────────────
  'xalayaa deggarsaa adda addaa walitti hidhamiinsa gabaa': [
    nationalId(1),
    businessLicense(2),
    tinCert(3),
    applicationForm(4),
    req('Product or commodity description', 'የምርት ወይም ሸቀጥ ዝርዝር', 'Ibsa oomisha ykn meeshaa', 5),
  ],

  'hayyama daldalaa kennuu': [
    nationalId(1),
    applicationForm(2),
    photo2x2(3),
    req('Business premises ownership or lease agreement', 'የንግድ ቦታ ባለቤትነት ወይም ኪራይ ስምምነት', 'Abbummaa iddoo daldalaa ykn waliigaltee kiraa', 4),
    tinCert(5),
    taxClearance(6),
    req('Capital proof / bank statement', 'ማስረጃ ካፒታል / ባንክ ስቴትሜንት', 'Mirkaneessa kaappitaalaa / ibsa herrega baankii', 7),
  ],

  'moggaasa maqaa daldalaa': [
    nationalId(1),
    applicationForm(2),
    req('Proposed trade name options (3 preferred names)', 'ሊሰጡ የፈለጉ የንግድ ስሞች (3 ምርጥ ስሞች)', 'Filmaata maqaalee daldala barbaadame (filannoo 3)', 3),
    businessLicense(4),
  ],

  // ── Bishaan Albuudaa fi Inarjii (Water, Minerals & Energy) ──────────────
  'hayyama qorannoo hojiiwwan albuudaa kennuu': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    req('Technical proposal for mineral exploration', 'ቴክኒካዊ ሃሳብ ለሚነራል ፍቅሻ', 'Yaada teknikaa qorannoo albuudaa', 4),
    req('Environmental impact assessment study', 'የአካባቢ ተጽዕኖ ግምገማ ጥናት', 'Qorannoo madaallii dhiibbaa naannoo', 5),
    taxClearance(6),
    bankStatement(7),
  ],

  'hayyama qorannoo hojiiwwan albuudaa haaroomsuu': [
    nationalId(1),
    oldLicense(2),
    req('Exploration progress report', 'ሪፖርት ፍቅሻ እድገት', 'Gabaasa guddinaa qorannoo', 3),
    applicationForm(4),
    taxClearance(5),
  ],

  'hayyama oomisha albuudaa kennuu': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    taxClearance(4),
    req('Mining feasibility study report', 'ሪፖርት ጥናት ሚነሪንግ ፊዚቢሊቲ', 'Gabaasa qorannoo dandamatuu maayiningii', 5),
    req('Environmental and social impact assessment', 'ግምገማ አካባቢ እና ማህበሮአዊ ተጽዕኖ', 'Madaallii dhiibbaa naannoo fi hawaasummaa', 6),
    bankStatement(7),
  ],

  'hayyama oomisha albuudaa haaroomsuu': [
    nationalId(1),
    oldLicense(2),
    req('Annual production report', 'ዓመታዊ የምርት ሪፖርት', 'Gabaasa oomisha waggaa', 3),
    taxClearance(4),
    applicationForm(5),
  ],

  'hayyama oomishaa albuudaa babal': [
    nationalId(1),
    oldLicense(2),
    applicationForm(3),
    req('Expansion plan with technical justification', 'ዕቅድ ማስፋፊያ ቴክኒካዊ ምክንያቱ', 'Karoora babal\'ina hayyama teeknikaa', 4),
    taxClearance(5),
    bankStatement(6),
  ],

  'hayyama oomisha albuudaa dabarsuu': [
    nationalId(1),
    oldLicense(2),
    applicationForm(3),
    req('Transfer agreement (buyer and seller)', 'ስምምነት ሽያጭ (ሻጭ እና ገዢ)', 'Waliigaltee dabarsuu (gurgurtaa fi bitaa)', 4),
    taxClearance(5),
  ],

  'heeyyama oomisha bishaanii kennu': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    req('Water source survey/hydrological study', 'ዳሰሳ ምንጭ ውሃ / ሃይድሮሎጂካዊ ጥናት', 'Qorannoo madda bishaanii / haaydirooloojii', 4),
    req('Site plan showing water source location', 'ካርታ ቦታ ምንጭ ውሃ', 'Kaartaa iddoo madda bishaanii', 5),
    taxClearance(6),
    req('Environmental clearance certificate', 'ሰርተፍኬት ፍቃድ አካባቢ', 'Sanadoo bilisummaa naannoo', 7),
  ],

  'heeyyama oomisha bishaanii haaromsuu': [
    nationalId(1),
    oldLicense(2),
    req('Water quality test report (recent, within 6 months)', 'ሪፖርት ጥራት ውሃ (ቅርብ ጊዜ, 6 ወር ጊዜ)', 'Gabaasa qormaata qulqullina bishaanii (dhiyoo, ji\'a 6)', 3),
    taxClearance(4),
    applicationForm(5),
  ],

  // ── Fayyaa (Health) ──────────────────────────────────────────────────────
  'inshuraansii fayyaa hawaasaa kennuu': [
    nationalId(1),
    photo2x2(2),
    applicationForm(3),
    req('Household members list (names + ages)', 'ዝርዝር አባላት ቤተሰብ (ስሞች + ዕድሜ)', 'Tarree miseensota maatii (maqaa + umrii)', 4),
    req('Proof of income / employment letter', 'ማስረጃ ገቢ / ደብዳቤ ቅጥር', 'Mirkaneessa galii / xalayaa qacarraa', 5),
  ],

  'inshuraansii fayyaa hawaasaa haaromsuu': [
    nationalId(1),
    req('Existing insurance card / membership number', 'ካርድ ኢንሹራንስ ያለ / ቁጥር አባልነት', 'Kaardii inshuraansii jiru / lakkoofsa miseensummaa', 2),
    applicationForm(3),
    req('Fee payment receipt for renewal', 'ደረሰኝ ክፍያ ሱቅ ለማደስ', 'Rasiidhaa kaffaltii haaromsuu', 4),
  ],

  'hayyama manneen yaalaa dhuunfaa kennuu': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    req('Medical professional qualification certificates', 'ምስክር ወረቀቶች ብቃት ሕክምና ሙያ', 'Waraqaalee ragaa gahumsa ogeessa fayyaa', 4),
    req('Facility floor plan / layout', 'ካርታ ወለል ሕንፃ / ቅርፅ', 'Kaartaa iddoo dhaabbata fayyaa', 5),
    req('Equipment list with specifications', 'ዝርዝር ቁሳቁሶች ዝርዝሩ ጋር', 'Tarree meeshaalee qabiiyyee isaan waliin', 6),
    req('Sanitation and hygiene compliance certificate', 'ሰርተፍኬት ጽዳት እና ንጽህና', 'Sanadoo ragaa qulqullina fi fayyaa', 7),
    taxClearance(8),
  ],

  'hayyama manneen yaalaa dhuunfaa haaromsuu': [
    nationalId(1),
    oldLicense(2),
    req('Updated staff qualification certificates', 'ምስክር ወረቀቶች ብቃት ሠራተኞች የተሻሻሉ', 'Waraqaalee ragaa gahumsa hojjettootaa haaromsaman', 3),
    taxClearance(4),
    applicationForm(5),
  ],

  'waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu': [
    nationalId(1),
    req('Original professional degree / diploma certificate', 'ዋናው ሰርተፍኬት ዲፕሎማ ወይም ዲግሪ', 'Waraqaa ragaa digrii ykn diiploomaa asli', 2),
    photo2x2(3),
    applicationForm(4),
    req('Internship / practical training completion letter', 'ደብዳቤ ፍጻሜ ልምምድ', 'Xalayaa xumura leenjii hojii', 5),
  ],

  'waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu': [
    nationalId(1),
    req('Existing competency certificate (to be renewed)', 'ሰርተፍኬት ብቃት ያለ (ለማደስ)', 'Waraqaa ragaa gahumsa jiru (haaromsuu)', 2),
    applicationForm(3),
    req('Continuing professional development evidence (CPD hours)', 'ማስረጃ ልማት ሙያ ቀጣይነት (ሰዓቶች CPD)', 'Ragaa guddina ogummaa itti fufiinsa (sa\'aatii CPD)', 4),
  ],

  'waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu': [
    nationalId(1),
    businessLicense(2),
    applicationForm(3),
    req('Premises inspection report (from health office)', 'ሪፖርት ምርመራ ቦታ (ከጤና ቢሮ)', 'Gabaasa qorannoo iddoo (biiroo fayyaa irraa)', 4),
    req('Food handler health certificate (for food businesses)', 'ሰርተፍኬት ጤና የምግብ ሰሪዎች (ለምግብ ቢዝነሶች)', 'Waraqaa ragaa fayyaa qopheessaa nyaataa (daldala nyaataa)', 5, false),
  ],

  'waraqaa qulqullinaa gahumsa dhaabilee daldalaa haaromsuu': [
    nationalId(1),
    oldLicense(2),
    businessLicense(3),
    req('Recent premises inspection clearance', 'ፍቃድ ምርመራ ቦታ ቅርብ ጊዜ', 'Bilisummaa qorannoo iddoo dhiyoo', 4),
    applicationForm(5),
  ],

  // ── W/Bulchiinsaa (District Administration) ──────────────────────────────
  'xalayaa deeggarsaa adda addaa kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Clear description of the purpose of the support letter', 'ዓላማ ደብዳቤ ድጋፍ ግልጽ ማብራሪያ', 'Ibsa ifaa kaayyoo xalayaa deeggarsaa', 3),
    supportLetter(4, false),
  ],

  'iyyannoo adda addaa keessuumeessuu': [
    nationalId(1),
    req('Written complaint / petition letter', 'ቅሬታ / ጥያቄ ደብዳቤ ጽሁፍ', 'Xalayaa komii / iyyannoo barreeffamaa', 2),
    req('Supporting evidence documents', 'ሰነዶች ማስረጃ ደጋፊ', 'Sanadoota ragaa deeggaraa', 3),
  ],

  'komii adda addaa keessuumeessuu': [
    nationalId(1),
    req('Written grievance/complaint letter', 'ደብዳቤ ቅሬታ ጽሁፍ', 'Xalayaa komii barreeffamaa', 2),
    req('Evidence supporting the complaint', 'ማስረጃ ቅሬታ ደጋፊ', 'Ragaa komii deeggaruu', 3),
    req('Previous correspondence (if any)', 'ደብዳቤ ቀደም ያለ (ካለ)', 'Xalayaalee duraa (yoo jiraataniyyuu)', 4, false),
  ],

  'xalayaa deeggarsaa kaafamtoota misoomaa': [
    nationalId(1),
    req('Land expropriation order or notice', 'ትዕዛዝ ወይም ማስታወቂያ ፍቃዳ ቅሬታ', 'Ajaja ykn beeksisa kaafamuu lafa', 2),
    applicationForm(3),
    req('Compensation assessment document', 'ሰነድ ግምት ካሳ', 'Sanadoo madaallii beenyaa', 4),
  ],

  'komii kaafamtoota misoomaa hiikuu': [
    nationalId(1),
    req('Original expropriation notice', 'ማስታወቂያ ፍቃዳ ቅሬታ ዋናው', 'Beeksisa kaafamuu asli', 2),
    req('Written dispute/grievance statement', 'ቃል ቅሬታ / ግጭት ጽሁፍ', 'Ibsa waldhabbii / komii barreeffamaa', 3),
    req('Property valuation evidence', 'ማስረጃ ግምት ንብረት', 'Ragaa gatii qabeenya', 4),
    req('Proof of ownership of the expropriated property', 'ማስረጃ ባለቤትነት ንብረት የሚፈናቀሉ', 'Mirkaneessa abbummaa qabeenya kaafame', 5),
  ],

  // ── PSMQN (Civil Service) ────────────────────────────────────────────────
  'xalayaa deeggarsa adda addaa kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Official request letter stating the purpose', 'ደብዳቤ ጥያቄ ዓላማ ሚገልጽ', 'Xalayaa gaaffii kaayyoo ibsu', 3),
  ],

  'komii hojjattoota mootummaa keessumeessuu': [
    nationalId(1),
    req('Government employee ID / employment certificate', 'መታወቂያ ሠራተኛ መንግሥት / ሰርተፍኬት ቅጥር', 'Kaardii hojjetaa mootummaa / waraqaa ragaa qacarraa', 2),
    req('Written grievance letter', 'ደብዳቤ ቅሬታ ጽሁፍ', 'Xalayaa komii barreeffamaa', 3),
    req('Evidence related to the complaint', 'ማስረጃ ቅሬታ ተያያዥ', 'Ragaa komiidhaan walqabatu', 4),
  ],

  // ── Koominikeeshinii (Communications) ────────────────────────────────────
  'deeggarsa hayyama barjaalee kennuu': [
    nationalId(1),
    applicationForm(2),
    businessLicense(3),
    req('Billboard/signage design and dimensions', 'ዲዛይን እና መጠን የምልክት / ሰሌዳ', 'Dizaaynii fi safarri baarjaa', 4),
    req('Site/location plan showing billboard placement', 'ካርታ ቦታ የሚያሳይ ቦታ ሰሌዳ', 'Kaartaa iddoo bakka baarjaa argamu', 5),
  ],

  'xalayaa hayyama beeksiisa sagalee kennuu': [
    nationalId(1),
    applicationForm(2),
    businessLicense(3),
    req('Broadcast content description / schedule', 'ዝርዝር ይዘት ስርጭት / ሰሌዳ ጊዜ', 'Ibsa qabiyyee tamsa\'aa / karoora yeroo', 4),
    req('Equipment list for broadcasting', 'ዝርዝር ቁሳቁሶች ስርጭት', 'Tarree meeshaalee tamsa\'aa', 5),
    taxClearance(6),
  ],

  // ── Geejiba (Transport) ──────────────────────────────────────────────────
  'hayyama konkolaachisaa haaraa kennuu': [
    nationalId(1),
    applicationForm(2),
    photo2x2(3),
    req('Medical fitness certificate (from approved hospital)', 'ሰርተፍኬት ጤና አካላዊ (ከፀደቀ ሆስፒታል)', 'Waraqaa ragaa fayyaa qaamaa (hospitaala mirkana\'amaa irraa)', 4),
    req('Driving school completion certificate', 'ሰርተፍኬት ማጠናቀቂያ ትምህርት ቤት ምልክት', 'Waraqaa ragaa xumura mana barnootaa konkolaachisummaa', 5),
    req('Written and practical driving test results', 'ውጤቶች ፈተና ምልክት ፅሑፍ እና ተግባር', 'Bu\'aa qormaata barreeffamaa fi hojii konkolaachisummaa', 6),
  ],

  'hayyama konkolaachisaa haromsuu': [
    nationalId(1),
    req('Existing driving license (original)', 'ምልክት ፈቃድ ያለ ዋናው', 'Hayyama konkolaachisummaa jiru asli', 2),
    req('Medical fitness certificate', 'ሰርተፍኬት ጤና አካላዊ', 'Waraqaa ragaa fayyaa qaamaa', 3),
    applicationForm(4),
    photo2x2(5),
  ],

  'jijjiirraa faayila konkolaachisaa': [
    nationalId(1),
    req('Current vehicle registration document', 'ሰነድ ምዝገባ ተሽከርካሪ ያለ', 'Sanadoo galmeessa gaarri jiru', 2),
    req('Insurance certificate', 'ሰርተፍኬት ኢንሹራንስ', 'Waraqaa ragaa inshuraansii', 3),
    applicationForm(4),
    req('Vehicle roadworthiness inspection certificate', 'ሰርተፍኬት ምርመራ ብቁነት ተሽከርካሪ', 'Waraqaa ragaa qorannoo qabiyyee gaarri', 5),
  ],

  'hayyama bobbii konkoolaataa kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Vehicle registration and insurance', 'ምዝገባ ተሽከርካሪ እና ኢንሹራንስ', 'Galmeessa gaarri fi inshuraansii', 3),
    req('Route approval document', 'ሰነድ ፍቃድ መስመር', 'Sanadoo hayyama daandii', 4),
    businessLicense(5, false),
  ],

  'murtii taarifaa beeksisuu': [
    nationalId(1),
    applicationForm(2),
    req('Current approved tariff document', 'ሰነድ ታሪፍ ፀደቀ ያለ', 'Sanadoo taarifaa mirkana\'ame jiru', 3),
    req('Justification for tariff revision', 'ምክንያት ክለሳ ታሪፍ', 'Sababa fooyya\'iinsa taarifaa', 4),
  ],

  'mallattoo maxxantuu waggaa haaromsuu': [
    nationalId(1),
    req('Vehicle registration certificate', 'ሰርተፍኬት ምዝገባ ተሽከርካሪ', 'Waraqaa ragaa galmeessa gaarri', 2),
    req('Valid insurance certificate', 'ሰርተፍኬት ኢንሹራንስ ፀና', 'Waraqaa ragaa inshuraansii yeroo ammaa', 3),
    req('Vehicle roadworthiness test (annual inspection)', 'ፈተና ብቁነት ተሽከርካሪ (ምርመራ ዓመታዊ)', 'Qormaata qabiyyee gaarri (qorannoo waggaa)', 4),
    req('Fee payment receipt', 'ደረሰኝ ክፍያ', 'Rasiidhaa kaffaltii', 5),
  ],

  'dhorka konkolaataa raawwachuu fi haquu': [
    nationalId(1),
    req('Court order or legal authority document', 'ትዕዛዝ ፍርድ ቤት ወይም ሰነድ ሕጋዊ ባለሥልጣን', 'Ajaja mana murtii ykn sanadoo abbaa aanaa seeraa', 2),
    req('Vehicle registration documents', 'ሰነዶች ምዝገባ ተሽከርካሪ', 'Sanadoota galmeessa gaarri', 3),
    applicationForm(4),
  ],

  'galmeessa ragaa dhuunfaa fooyyessuu dhorkuu fi kaasuu': [
    nationalId(1),
    req('Existing personal records (to be updated)', 'መዝገቦች ግል ያሉ (ለማሻሻል)', 'Galmeewwan dhuunfaa jiran (foyyeessuu)', 2),
    applicationForm(3),
    req('Supporting evidence for the change', 'ማስረጃ ደጋፊ ለለውጡ', 'Ragaa deeggaraa jijjiiramichaa', 4),
  ],

  'ragaalee konkolaataa badan haaraan bakka buusuu': [
    nationalId(1),
    req('Police report for lost documents', 'ሪፖርት ፖሊስ ለጠፉ ሰነዶች', 'Gabaasa poolisii sanadoota dhabamaniif', 2),
    req('Original remaining vehicle documents', 'ሰነዶች ተሽከርካሪ ዋናዎቹ ቀሪ', 'Sanadoota gaarri jiran asliiwwan', 3),
    applicationForm(4),
    photo2x2(5),
  ],

  'jijjiirraa maqaa abbaa qabeenyummaa raawwachu': [
    nationalId(1),
    req('Vehicle registration certificate', 'ሰርተፍኬት ምዝገባ ተሽከርካሪ', 'Waraqaa ragaa galmeessa gaarri', 2),
    req('Bill of sale / transfer agreement', 'ደረሰኝ ሽያጭ / ስምምነት ዝውውር', 'Rasiidhaa gurgurtaa / waliigaltee dabarsuu', 3),
    req('Both buyer and seller national IDs', 'መታወቂያ ሁለቱም ሻጭ እና ገዢ', 'ID biyyoolessa bitaa fi gurgurtaa lamanuu', 4),
    applicationForm(5),
  ],

  'hayyama tajaajila geejibaa ykn haaromsa eeyyama waldaa': [
    nationalId(1),
    orgStructure(2),
    applicationForm(3),
    req('Fleet list (vehicle registration for each vehicle)', 'ዝርዝር ፍሎት (ምዝገባ ለእያንዳንዱ ተሽከርካሪ)', 'Tarree konkolaataa (galmeessa konkolaataa tokkotokkoof)', 4),
    taxClearance(5),
    businessLicense(6),
  ],

  'sassaabii galii geejjibaa raawwachuu': [
    nationalId(1),
    req('Tax collection authorization letter', 'ደብዳቤ ፍቃድ ስብስብ ታክስ', 'Xalayaa hayyama sassaabii taaksii', 2),
    applicationForm(3),
    req('Revenue collection schedule / route plan', 'ሰሌዳ ስብስብ ገቢ / ዕቅድ መስመር', 'Karoora sassaabii galii / pilaanii daandii', 4),
  ],

  // ── Qonna (Agriculture) ──────────────────────────────────────────────────
  'deggarsaa qonnaan bulaa investimentiitti': [
    nationalId(1),
    applicationForm(2),
    req('Agricultural land holding certificate', 'ሰርተፍኬት ይዞታ መሬት ግብርና', 'Waraqaa ragaa qabiyyee lafa qonnaa', 3),
    req('Business plan / investment proposal', 'ዕቅድ ቢዝነስ / ሃሳብ ኢንቨስትመንት', 'Karoora daldalaa / yaada invastimantii', 4),
    taxClearance(5, false),
  ],

  'hayyama ogummaa galtee qonnaa kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Professional qualification certificate in agriculture', 'ሰርተፍኬት ብቃት ሙያ ግብርና', 'Waraqaa ragaa gahumsa ogummaa qonnaa', 3),
    businessLicense(4),
    req('Product/input list with specifications', 'ዝርዝር ምርት / ጥሬ ዕቃ ዝርዝሩ ጋር', 'Tarree oomisha / galtee qabiiyyee isaan waliin', 5),
  ],

  'hayyama ogummaa galtee qoricha beeyladaa kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Veterinary or pharmacy degree certificate', 'ሰርተፍኬት ዲግሪ የቬተሪናሪ ወይም ፋርማሲ', 'Waraqaa ragaa digrii qoricha beeyladaa ykn faarmaasii', 3),
    businessLicense(4),
    req('Drug/medicine inventory list', 'ዝርዝር ቃተኛ መድሃኒቶች', 'Tarree meeshaalee qoricha', 5),
    taxClearance(6),
  ],

  'hayyama mirk. gahumsa ogummaa ai': [
    nationalId(1),
    applicationForm(2),
    req('AI / animal insemination professional certificate', 'ሰርተፍኬት ሙያ AI / ዘር ሰጠኝ', 'Waraqaa ragaa ogummaa faayidaa diqaaloomsuu', 3),
    req('Equipment list for artificial insemination', 'ዝርዝር ቁሳቁሶች ዘር ሰጠኝ', 'Tarree meeshaalee diqaaloomsuu', 4),
    businessLicense(5),
  ],

  'hayyama mirk. gahumsa ogummaa nyaata beeyladaa': [
    nationalId(1),
    applicationForm(2),
    req('Animal feed production license or certificate', 'ፈቃድ ወይም ሰርተፍኬት ምርት መኖ', 'Hayyama ykn waraqaa ragaa oomisha nyaata beeyladaa', 3),
    req('Feed composition/formula document', 'ሰነድ ቅፅ ወይም ቀመር መኖ', 'Sanadoo qabiiyyee ykn foormulaa nyaata beeyladaa', 4),
    taxClearance(5),
    businessLicense(6),
  ],

  'hayyama mirk. gahumsa ogummaa manaa qalmaa': [
    nationalId(1),
    applicationForm(2),
    req('Slaughterhouse facility plan (floor layout)', 'ዕቅድ ሕንፃ ቤተ ፍ (ወለል ካርታ)', 'Karoora dhaabbata qalmaa (kaartaa iddoo)', 3),
    req('Hygiene and sanitation compliance report', 'ሪፖርት ጽዳት እና ፍቃዳ ቅሬታ', 'Gabaasa hordoffii qulqullina fi fayyaa', 4),
    taxClearance(5),
    req('Veterinary supervision agreement', 'ስምምነት ቁጥጥር የቬቴሪናሪ', 'Waliigaltee to\'annoo ogeessa beeyladaa', 6),
  ],

  'hayyama mirk. gahumsa ogummaa horsiisa lukkuu': [
    nationalId(1),
    applicationForm(2),
    req('Poultry farm facility/land plan', 'ዕቅድ ሕንፃ / መሬት ፋርም ዶሮ', 'Karoora dhaabbata / lafa qeyee lukkuu', 3),
    req('Poultry disease prevention plan', 'ዕቅድ ከልካይ ደዌ ዶሮ', 'Karoora ittisa dhukkuba lukkuu', 4),
    taxClearance(5, false),
    businessLicense(6),
  ],

  'hayyama mirk. gahumsa ogummaa horsiisa horii': [
    nationalId(1),
    applicationForm(2),
    req('Livestock farm/ranch plan', 'ዕቅድ ፋርም ሊቭ ስቶክ', 'Karoora qeyee horsiisa horii', 3),
    req('Vaccination and health management records', 'መዝገቦች ክትባት እና አስተዳደር ጤና', 'Galmeewwan talaalaa fi bulchiinsa fayyaa', 4),
    taxClearance(5, false),
    businessLicense(6),
  ],

  // ── M/Qopheessa (Urban Development / Construction Planning) ─────────────
  'deegarsa bu\'uuraalee misooma': [
    nationalId(1),
    applicationForm(2),
    req('Land use plan / site location map', 'ዕቅድ አጠቃቀም ቦታ / ካርታ ቦታ', 'Karoora fayyadama lafa / kaartaa iddoo', 3),
    req('Project description document', 'ሰነድ ዝርዝር ፕሮጀክት', 'Sanadoo ibsa pirojektii', 4),
    req('Environmental clearance (if required)', 'ፍቃድ አካባቢ (ካስፈለገ)', 'Bilisummaa naannoo (yoo barbaachise)', 5, false),
  ],

  'hayyama tajaajila qalmaa kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Slaughter facility approval certificate', 'ሰርተፍኬት ፍቃድ ሕንፃ ቤተ ፍ', 'Waraqaa ragaa hayyama dhaabbata qalmaa', 3),
    req('Premises sanitation inspection report', 'ሪፖርት ምርመራ ጽዳት ሕንፃ', 'Gabaasa qorannoo qulqullina iddoo', 4),
    req('Veterinary officer supervision letter', 'ደብዳቤ ቁጥጥር ቬቴሪናሪ', 'Xalayaa to\'annoo ogeessa beeyladaa', 5),
    taxClearance(6),
  ],

  // ── Saayinsii Technology ──────────────────────────────────────────────────
  'heyyama gahuumsa ogeessota leenjii suphaa meeshaalee elektirooniksii fi dandeettii kompitaraa (hardware and software) kennuu fi haaromsuu': [
    nationalId(1),
    applicationForm(2),
    req('Relevant technical degree or diploma', 'ዲግሪ ወይም ዲፕሎማ ቴክኒካዊ ተዛማጅ', 'Digrii ykn diiploomaa teeknikaa wal-simu', 3),
    req('Training curriculum / course outline', 'ካሪኩለም ልምምድ / ዝርዝር ኮርስ', 'Kaarikulamii leenjii / tartiiba koorsu', 4),
    businessLicense(5),
    req('Facility/classroom inspection certificate', 'ሰርተፍኬት ምርመራ ሕንፃ / ክፍል', 'Waraqaa ragaa qorannoo dhaabbata / kutaa barnootaa', 6),
  ],

  'hayyama diriirsa bu\'uuraalee teknolojii qunnamtii': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    req('Network / CCTV installation technical plan', 'ዕቅድ ቴክኒካዊ ዝርጋታ Network / CCTV', 'Karoora teeknikaa diriirsa network / CCTV', 4),
    req('Technician qualification certificates', 'ሰርተፍኬቶች ብቃት ቴክኒሻን', 'Waraqaalee ragaa gahumsa teknishaanota', 5),
    taxClearance(6),
  ],

  'heyyama gahuumsa ogeessota daldala meeshaalee elektirooniksii': [
    nationalId(1),
    applicationForm(2),
    businessLicense(3),
    req('Electronics trading qualification certificate', 'ሰርተፍኬት ብቃት ግብይት ኤሌክትሮኒክስ', 'Waraqaa ragaa gahumsa gurgurtaa meeshaalee elektirooniksii', 4),
    taxClearance(5),
    req('Product list / inventory', 'ዝርዝር ምርት / ቃተኛ', 'Tarree oomisha / qabeenya', 6),
  ],

  'heyyama gahuumsa ogeessota suphaa meeshaalee elektirooniksii': [
    nationalId(1),
    applicationForm(2),
    req('Electronics repair technician certification', 'ሰርተፍኬት ቴክኒሻን ጥገና ኤሌክትሮኒክስ', 'Waraqaa ragaa teknishaana suphaa elektirooniksii', 3),
    businessLicense(4),
    req('Workshop/repair shop premises approval', 'ፍቃድ ሕንፃ ወርክሾፕ / ቤተ ጥገና', 'Hayyama iddoo warshaa suphaa', 5),
  ],

  // ── Koonistraakshinii (Construction) ────────────────────────────────────
  'sanitary': [
    nationalId(1),
    req('Sanitary engineer professional license', 'ፈቃድ ሙያ ኢንጂነር ሳኒቴሪ', 'Hayyama ogummaa injiinara saaniiteri', 2),
    applicationForm(3),
    photo2x2(4),
  ],

  'artiteechure': [
    nationalId(1),
    req('Architecture degree certificate', 'ሰርተፍኬት ዲግሪ ሥነ ሕንፃ', 'Waraqaa ragaa digrii haadhaa manaatii', 2),
    applicationForm(3),
    req('Portfolio of past work (minimum 3 projects)', 'ፖርትፎሊዮ ሥራ ቀደም (ቢያንስ 3 ፕሮጀክቶች)', 'Poorotifooliyoo hojii duraa (xiqqaate pirojektii 3)', 4),
    photo2x2(5),
  ],

  'qindeessa garee qorannoo mirkaneessa dizaayinii': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    req('Design and supervision team qualification list', 'ዝርዝር ብቃት ቡድን ዲዛይን እና ቁጥጥር', 'Tarree gahumsa garee dizaaynii fi to\'annoo', 4),
    req('Previous project references', 'ማጣቀሻ ፕሮጀክቶች ቀደም', 'Wabii pirojektiiwwan duraa', 5),
    taxClearance(6),
  ],

  'structure': [
    nationalId(1),
    req('Structural engineering degree certificate', 'ሰርተፍኬት ዲግሪ ኢንጂነሪንግ ስታርክቸር', 'Waraqaa ragaa digrii injiineeriingii caasaa', 2),
    applicationForm(3),
    photo2x2(4),
  ],

  'electrical eng': [
    nationalId(1),
    req('Electrical engineering degree certificate', 'ሰርተፍኬት ዲግሪ ኢንጂነሪንግ ኤሌክትሪካል', 'Waraqaa ragaa digrii injiineeriingii elektirikaala', 2),
    applicationForm(3),
    photo2x2(4),
  ],

  'surveyor': [
    nationalId(1),
    req('Land surveying professional certificate', 'ሰርተፍኬት ሙያ ልኬት መሬት', 'Waraqaa ragaa ogummaa safartuu lafa', 2),
    applicationForm(3),
    photo2x2(4),
  ],

  'quantity': [
    nationalId(1),
    req('Quantity surveying certification', 'ሰርተፍኬት ልኬት ቁጥር', 'Waraqaa ragaa safaruu baay\'ina', 2),
    applicationForm(3),
    photo2x2(4),
  ],

  'wal simsiisisa pilaanii': [
    nationalId(1),
    applicationForm(2),
    req('Urban planning degree / professional certificate', 'ዲግሪ / ሰርተፍኬት ሙያ ዕቅድ ከተማ', 'Digrii / waraqaa ragaa ogummaa pilaaniin magaalaa', 3),
    req('Previous plan approval references', 'ማጣቀሻ ፍቃድ ዕቅድ ቀደም', 'Wabii hayyama pilaaniin duraa', 4),
    taxClearance(5, false),
  ],

  'qindeessa garee galmee fi mirkaneessa gahumsaa industrii konistraakshinii': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    taxClearance(4),
    req('Construction firm registration certificate', 'ሰርተፍኬት ምዝገባ ድርጅት ኮንስትራክሽን', 'Waraqaa ragaa galmeessa dhaabbata konistiraakshinii', 5),
    req('Technical staff qualifications list', 'ዝርዝር ብቃት ሠራተኞች ቴክኒካዊ', 'Tarree gahumsa hojjettootaa teeknikaa', 6),
    req('Financial capacity documentation (bank statement or audited accounts)', 'ሰነዶች ሃይ ፋይናንሻዊ (ስቴትሜንት ባንክ ወይም ሂሳቦች ኦዲት)', 'Sanadoota dandeettii maallaqaa (ibsa baankii ykn herrega hordofame)', 7),
  ],

  'kenna hayyama gahumsa ogummaa ogeessota dhaabbilee waldaalee kontraaktarootaa fi gorsitootaa': [
    nationalId(1),
    applicationForm(2),
    req('Professional degree/diploma (relevant field)', 'ዲግሪ/ዲፕሎማ ሙያ (ዘርፍ ተዛማጅ)', 'Digrii/diiploomaa ogummaa (gahee wal-simu)', 3),
    companyReg(4),
    taxClearance(5),
    req('Portfolio of completed projects', 'ፖርትፎሊዮ ፕሮጀክቶች ተጠናቀቁ', 'Poorotifooliyoo pirojektiiwwan xumuraman', 6),
    req('Professional membership certificate (where applicable)', 'ሰርተፍኬት አባልነት ሙያ (ሲሆን ተፈጻሚ)', 'Waraqaa ragaa miseensummaa ogummaa (yoo hojjatu)', 7, false),
  ],

  // ── Barnoota (Education) ─────────────────────────────────────────────────
  'hayyama gahumsa manneen barnoota dhuunfaa': [
    nationalId(1),
    applicationForm(2),
    companyReg(3),
    req('School facility plan (classrooms, labs, etc.)', 'ዕቅድ ሕንፃ ትምህርት ቤት (ክፍሎች፣ ላቦራቶሪዎች)', 'Karoora dhaabbata mana barnootaa (kutaalee, laboora)', 4),
    req('Teacher qualification certificates (all staff)', 'ሰርተፍኬቶች ብቃት መምህር (ሠራተኞች ሁሉ)', 'Waraqaalee ragaa gahumsa barsiisotaa (hojjettootaa hundi)', 5),
    req('Curriculum plan aligned to national standards', 'ዕቅድ ካሪኩለም ከሚዛን ሀገራዊ ጋር', 'Karoora kaarikulamii sadarkaa biyyaalessaaf walfakkaatu', 6),
    req('Sanitation and safety compliance certificate', 'ሰርተፍኬት ፍቃዳ ቅሬታ ጽዳት እና ደህንነት', 'Waraqaa ragaa hordoffii qulqullina fi nageenya', 7),
    taxClearance(8),
  ],

  'tajaajila jijjiirraa barsiisotaa': [
    nationalId(1),
    req('Current employment certificate (from current school)', 'ሰርተፍኬት ቅጥር ያለ (ከትምህርት ቤት ያለ)', 'Waraqaa ragaa qacarraa jiru (mana barnootaa jiru irraa)', 2),
    req('Transfer request letter (official reason)', 'ደብዳቤ ጥያቄ ዝውውር (ምክንያት ዋናው)', 'Xalayaa gaaffii jijjiirraa (sababa guddaa)', 3),
    applicationForm(4),
    req('Receiving school/institution acceptance letter', 'ደብዳቤ ተቀቡ ትምህርት ቤት / ተቋም', 'Xalayaa fudhannoo mana barnootaa / dhaabbata fudhatu', 5),
  ],

  'ragaa barnootaa sadarkaa naannoo bade kennuu': [
    nationalId(1),
    applicationForm(2),
    req('Police/loss report for the missing certificate', 'ሪፖርት ፖሊስ / ጥፋት ሰርተፍኬት', 'Gabaasa poolisii / dhabamuu waraqaa ragaa', 3),
    req('Sworn affidavit of loss', 'ቃለ መሀላ ጥፋት', 'Ibsa kakuu dhabamuu', 4),
    req('School attendance register (proof of enrollment)', 'መዝገብ ምዝገባ ትምህርት ቤት (ማስረጃ ምዝገባ)', 'Galmeessa haajaa mana barnootaa (mirkaneessa galmeessa)', 5),
  ],

  'xalayaa deegarsa barsiisoota fi hoggantoota': [
    nationalId(1),
    req('Employment/appointment letter', 'ደብዳቤ ቅጥር / ሹመት', 'Xalayaa qacarraa / muudama', 2),
    applicationForm(3),
    req('Purpose of support letter (clear description)', 'ዓላማ ደብዳቤ ድጋፍ (ዝርዝር ግልጽ)', 'Kaayyoo xalayaa deeggarsaa (ibsa ifaa)', 4),
  ],

  // ── D/Manneeni (Housing) ─────────────────────────────────────────────────
  'waldaalee lafa mana jireenyaa gurmaaniif qaama seerummaa': [
    nationalId(1),
    orgStructure(2),
    applicationForm(3),
    req('Members list with contributions', 'ዝርዝር አባላት ከድርሻ', 'Tarree miseensota hanga hirmaannaa isaan', 4),
    req('Proof of initial capital / savings', 'ማስረጃ ካፒታል ቀዳሚ / ቁጠባ', 'Mirkaneessa kaappitaalaa jalqabaa / qusannaa', 5),
    req('Meeting minutes of establishment', 'ቃለ ጉባኤ ስብሰባ ምስረታ', 'Galmee walgahii hundeeffamaa', 6),
  ],

  'waliigaltee kiraa mana mootummaa raawwachu': [
    nationalId(1),
    req('Government house allocation letter', 'ደብዳቤ ድልድል ቤት መንግሥት', 'Xalayaa qoodama mana mootummaa', 2),
    applicationForm(3),
    req('Income/salary proof (recent pay slip)', 'ማስረጃ ገቢ / ደሞዝ (ሰሌዳ ደሞዝ ቅርብ)', 'Mirkaneessa galii / miindaa (siliippii miindaa dhiyoo)', 4),
  ],

  'waliigaltee kireessaafi kireeffataa mirkaneessuu': [
    nationalId(1),
    req('Rental agreement draft (signed by both parties)', 'ረቂቅ ስምምነት ኪራይ (ፊርማ ሁለቱ ወገኖች)', 'Diraaftii waliigaltee kiraa (lamaanuu mallattaa\'an)', 2),
    req('House ownership proof (for landlord)', 'ማስረጃ ባለቤትነት ቤት (ለቤቱ ባለቤት)', 'Mirkaneessa abbummaa mana (miidhaa kireessitoota)', 3),
    applicationForm(4),
    photo2x2(5),
  ],

  'walii galtee gamoo waliinii raawwachuu': [
    nationalId(1),
    req('Condominium ownership certificate', 'ሰርተፍኬት ባለቤትነት ኮንዶሚኒዬም', 'Waraqaa ragaa abbummaa ganda walii', 2),
    req('Transfer/sale agreement signed by all parties', 'ስምምነት ዝውውር / ሽያጭ ፊርማ ሁሉ ወገኖች', 'Waliigaltee dabarsuu / gurgurtaa lamaanuu mallatteeffame', 3),
    applicationForm(4),
    req('Tax clearance for property transfer', 'ፍቃዳ ቅሬታ ታክስ ዝውውር ንብረት', 'Bilisummaa taaksii dabarsuu qabeenya', 5),
  ],

  'hayyama suphaa mana mootummaa kennuu': [
    nationalId(1),
    req('Government house allocation / tenancy document', 'ሰነድ ድልድል / ኪራይ ቤት መንግሥት', 'Sanadoo qoodama / kiraa mana mootummaa', 2),
    applicationForm(3),
    req('Contractor or plumber qualification certificate (if using contractor)', 'ሰርተፍኬት ብቃት ኮንትራክተር (ካለ)', 'Waraqaa ragaa gahumsa kontraaktara (yoo fayyadame)', 4, false),
    req('Repair scope description / cost estimate', 'ዝርዝር ወሰን ጥገና / ግምት ወጪ', 'Ibsa daangaa suphaa / tilmaamni baasii', 5),
  ],

  'kaffaltii kiraa mana mootummaa fi dhuunfaa raawwachiisuu': [
    nationalId(1),
    req('Tenancy agreement or allocation letter', 'ስምምነት ኪራይ ወይም ደብዳቤ ድልድል', 'Waliigaltee kiraa ykn xalayaa qoodamaa', 2),
    req('Payment bank slip / receipt', 'ሰሊፕ ባንክ ክፍያ / ደረሰኝ', 'Siliippii baankii kaffaltii / rasiidhaa', 3),
    applicationForm(4),
  ],

  // ── Abba Alangaa (Legal / Notary) ────────────────────────────────────────
  'barreefama hundeefamaa daldala dhuunfaa plc': [
    nationalId(1),
    applicationForm(2),
    req('Memorandum of Association (MoA) draft', 'ረቂቅ ሰነድ ምሥረታ ኩባንያ (MoA)', 'Diraaftii sanadoo hundeeffama dhaabbataa (MoA)', 3),
    req('Articles of Association (AoA) draft', 'ረቂቅ ሰነድ ቅዋም ኩባንያ (AoA)', 'Diraaftii sanadoo heeyyama dhaabbataa (AoA)', 4),
    req('Shareholder list with share distribution', 'ዝርዝር ተካፋዮች ጋር ስርጭት ድርሻ', 'Tarree hirmaattotaa hanga qoodni isaanii', 5),
    bankStatement(6),
    taxClearance(7, false),
  ],

}; // end REQUIREMENTS_BY_SERVICE_KEY

// ─── Matching logic ───────────────────────────────────────────────────────────
function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findRequirementsForService(service) {
  const nameOr = normalize(service.name?.or || '');
  const nameEn = normalize(service.name?.en || '');

  // Try every key — pick the one with the best overlap
  let bestKey = null;
  let bestScore = 0;

  for (const key of Object.keys(REQUIREMENTS_BY_SERVICE_KEY)) {
    const normKey = normalize(key);
    // Score = shared word count between key and service name
    const keyWords = normKey.split(' ').filter(w => w.length > 3);
    let score = 0;
    for (const word of keyWords) {
      if (nameOr.includes(word) || nameEn.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  // Require at least 2 matching meaningful words
  return bestScore >= 2 ? REQUIREMENTS_BY_SERVICE_KEY[bestKey] : null;
}

// ─── Fallback requirements for unmatched services ─────────────────────────────
function buildFallback(service) {
  return [
    nationalId(1),
    applicationForm(2),
    photo2x2(3),
    req(
      'Supporting documents relevant to the service',
      'ሰነዶች ደጋፊ ለአገልግሎቱ ተዛማጅ',
      'Sanadoota deeggaraa tajaajila kanaan walqabatan',
      4,
      false
    ),
  ];
}

// ─── Main seed function ───────────────────────────────────────────────────────
async function seedRequirements() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const services = await Service.find().populate('organization', 'name');
  console.log(`Found ${services.length} services`);

  let inserted = 0;
  let skipped = 0;
  let fallback = 0;

  for (const service of services) {
    // Skip if this service already has requirements
    const existing = await Requirement.countDocuments({ service: service._id });
    if (existing > 0) {
      skipped++;
      continue;
    }

    const reqs = findRequirementsForService(service) || (fallback++, buildFallback(service));

    const docs = reqs.map(r => ({
      service: service._id,
      requirementText: r.requirementText,
      notes: r.notes,
      isMandatory: r.isMandatory,
      sequenceNo: r.sequenceNo,
    }));

    await Requirement.insertMany(docs);
    inserted += docs.length;

    const orgName = service.organization?.name?.or || service.organization?.name?.en || '?';
    console.log(`  ✓ [${orgName}] "${service.name.or.substring(0, 60)}" → ${docs.length} requirements`);
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`Done! Inserted: ${inserted} requirements across services`);
  console.log(`Skipped (already had requirements): ${skipped}`);
  console.log(`Used fallback requirements: ${fallback}`);
  await mongoose.disconnect();
}

seedRequirements().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
