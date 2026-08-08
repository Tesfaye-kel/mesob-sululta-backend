/**
 * seedWindows.js
 * Seeds 5 floors, 11 windows and all services from the Excel file.
 * Run: node seedWindows.js
 * You can re-run safely — existing windows/services are not duplicated.
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Floor = require('./models/Floor');
const Window = require('./models/Window');
const Service = require('./models/Service');
const Organization = require('./models/Organization');

// ── Floor data ───────────────────────────────────────────────────
const FLOORS = [
  { floorNumber: 1, name: { en: '1st Floor', am: 'ወለል 1', om: 'Darbii 1ffaa' } },
  { floorNumber: 2, name: { en: '2nd Floor', am: 'ወለል 2', om: 'Darbii 2ffaa' } },
  { floorNumber: 3, name: { en: '3rd Floor', am: 'ወለል 3', om: 'Darbii 3ffaa' } },
  { floorNumber: 4, name: { en: '4th Floor', am: 'ወለል 4', om: 'Darbii 4ffaa' } },
  { floorNumber: 5, name: { en: '5th Floor', am: 'ወለል 5', om: 'Darbii 5ffaa' } },
];

// ── Window data (floor assigned to 1 by default — admin can reassign) ────────
const WINDOWS = [
  { number: '1', name: { en: 'Window 1st', am: 'ፎዳ 1ኛ', or: 'Foddaa 1ffaa' }, floor: 1 },
  { number: '2', name: { en: 'Window 2nd', am: 'ፎዳ 2ኛ', or: 'Foddaa 2ffaa' }, floor: 1 },
  { number: '3', name: { en: 'Window 3rd', am: 'ፎዳ 3ኛ', or: 'Foddaa 3ffaa' }, floor: 1 },
  { number: '4', name: { en: 'Window 4th', am: 'ፎዳ 4ኛ', or: 'Foddaa 4ffaa' }, floor: 2 },
  { number: '5', name: { en: 'Window 5th', am: 'ፎዳ 5ኛ', or: 'Foddaa 5ffaa' }, floor: 2 },
  { number: '6', name: { en: 'Window 6th', am: 'ፎዳ 6ኛ', or: 'Foddaa 6ffaa' }, floor: 2 },
  { number: '7', name: { en: 'Window 7th', am: 'ፎዳ 7ኛ', or: 'Foddaa 7ffaa' }, floor: 3 },
  { number: '8', name: { en: 'Window 8th', am: 'ፎዳ 8ኛ', or: 'Foddaa 8ffaa' }, floor: 3 },
  { number: '9', name: { en: 'Window 9th', am: 'ፎዳ 9ኛ', or: 'Foddaa 9ffaa' }, floor: 4 },
  { number: '10', name: { en: 'Window 10th', am: 'ፎዳ 10ኛ', or: 'Foddaa 10ffaa' }, floor: 4 },
  { number: '11', name: { en: 'Window 11th', am: 'ፎዳ 11ኛ', or: 'Foddaa 11ffaa' }, floor: 5 },
];

// ── Services per window (Afaan Oromo names from Excel) ───────────────────────
// windowNumber → array of service names (or = Afaan Oromo, en = English translation)
const SERVICES_BY_WINDOW = {
  '1': [
    { or: 'Waraqaa Eenyummaa Jirataa kennuu', en: 'Resident ID Issuance' },
    { or: 'Simannaa maamila haaraa fi Gurgurtaa Biilii Bishaanii', en: 'New Customer Reception & Water Bill' },
    { or: 'Qaama seerummaa waldaalee IMX kennuu', en: 'IMX Association Legal Status' },
    { or: 'Hoji dhabdoota galmeessuu, kaardii hoji dhabdummaa kennuu', en: 'Job Seeker Registration & Card Issuance' },
    { or: 'Kaardii Hoji dhabdumma Haaromsuu', en: 'Job Seeker Card Renewal' },
  ],
  '2': [
    { or: 'Xalayaa deggarsaa walitti hidhamiinsa gabaa oomisha qonnaa fi industrii uumuu daldaltootaaf kennuu', en: 'Support Letter for Agricultural & Industry Market Linkage' },
    { or: 'Inshuraansii fayyaa hawaasaa kennuu', en: 'Community Health Insurance Issuance' },
    { or: 'Inshuraansii fayyaa hawaasaa haaromsuu', en: 'Community Health Insurance Renewal' },
    { or: 'Deeggersa waldaalee IMX paakeejiwwan deggersaa akka argatan haala mijeessu', en: 'IMX Cooperatives Support Package Facilitation' },
    { or: 'Waldaalee IMX Investimentiitti ce\'aniif waraqaa ragaa kennuu', en: 'Certificate for IMX Cooperatives Transitioning to Investment' },
    { or: 'Deggersa aaddaa addaa waldaalee fi walitti hidhamiinsa gabaa WHG uumu kennuu', en: 'Various Support & Market Linkage for WHG Cooperatives' },
    { or: 'Xalayaa deeggarsaa adda addaa kennuu (W/Bulchiinsaa)', en: 'Various Support Letters (Admin Office)' },
    { or: 'Xalayaa deeggarsa adda addaa kennuu (PSMQN)', en: 'Various Support Letters (PSMQN)' },
    { or: 'Deeggarsa Hayyama barjaalee kennuu', en: 'Billboard Permit Support' },
    { or: 'Xalayaa hayyama beeksiisa sagalee kennuu', en: 'Audio Advertisement Permit Letter' },
    { or: 'Xalayaa deeggarsa adda addaa kennuu (Poolisii)', en: 'Various Support Letters (Police)' },
    { or: 'Deggarsaa Qonnaan bulaa investimentiitti ce\'uu fi W/hidhaminsa gabaa kennuu', en: 'Farmer Investment Transition & Market Linkage Support' },
    { or: 'Xalayaa Deeggarsaa Kaafamtoota Misooma Invastimantii ce\'anii fi dhimmota biroof kennuu', en: 'Support Letter for Displaced Persons Transitioning to Investment' },
    { or: 'Xalayaa Deegarsa Barsiisoota fi Hoggantoota', en: 'Support Letter for Teachers & Managers' },
  ],
};

SERVICES_BY_WINDOW['3'] = [
  { or: 'Deegarsa Bu\'uuraalee Misooma (Ibsaa, Daandii, Bishaanii) Kennuu', en: 'Infrastructure Development Support (Electricity, Road, Water)' },
  { or: 'Komii adda addaa keessuumeessuu (Bulchiinsa)', en: 'Receiving Various Complaints (Admin)' },
  { or: 'Iyyannoo adda addaa keessuumeessuu (Bulchiinsa)', en: 'Receiving Various Applications (Admin)' },
  { or: 'Komii hojjattoota mootummaa Keessumeessuu (PSMQN)', en: 'Receiving Government Employee Complaints (PSMQN)' },
  { or: 'Komii kaafamtoota Misoomaa Hiikuu', en: 'Resolving Complaints of Displaced Persons' },
];

SERVICES_BY_WINDOW['4'] = [
  { or: 'Tajaajila jijjiirraa barsiisotaa/hooggantoota manneen barnootaa', en: 'Teacher/School Manager Transfer Service' },
  { or: 'Ragaa barnootaa sadarkaa naannoo (kutaa 6ffaa fi 8ffaa) bade kennuu', en: 'Issuing Lost Regional Education Certificate (Grade 6 & 8)' },
  { or: 'Hayyama Gahumsa Manneen Barnoota Dhuunfaa fi miti mootummaa Kennuu, Haaromsuu, kan bade bakka buusuufi deebisuu', en: 'Private & NGO School Competency License (Issue/Renew/Replace)' },
  { or: 'Hayyama suphaa mana mootummaa kennuu', en: 'Government House Repair Permit' },
  { or: 'Kaffaltii kiraa mana mootummaa fi dhuunfaa raawwachiisuu', en: 'Government & Private House Rent Payment Processing' },
  { or: 'Heyyamaa Tajaajila Qalmaa Kennuu (Lakk.Qeera Kennuu)', en: 'Slaughterhouse Service Permit (Butcher Number Issuance)' },
  { or: 'Hayyama manneen yaalaa dhuunfaa kennuu', en: 'Private Clinic License Issuance' },
  { or: 'Hayyama manneen yaalaa dhuunfaa haaromsuu', en: 'Private Clinic License Renewal' },
  { or: 'Sanitary inspection', en: 'Sanitary Inspection' },
  { or: 'Structure inspection', en: 'Structure Inspection' },
  { or: 'Architecture inspection', en: 'Architecture Inspection' },
  { or: 'Qindeessa Garee Qorannoo Mirkaneessa dizaayinii fi To\'annoo Projeectii Daandii III', en: 'Design Verification & Road Project Control (Phase III)' },
  { or: 'Electrical Engineering inspection', en: 'Electrical Engineering Inspection' },
  { or: 'Surveyor services', en: 'Surveyor Services' },
];

SERVICES_BY_WINDOW['5'] = [
  { or: 'Qindeessa Garee Galmee fi mirkaneessa Gahumsaa Industrii konistraakshinii', en: 'Construction Industry Registration & Competency Verification' },
  { or: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu', en: 'Health Professional Competency Certificate Issuance' },
  { or: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu', en: 'Health Professional Competency Certificate Renewal' },
  { or: 'Waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu', en: 'Business Institution Competency Certificate Issuance' },
  { or: 'Waraqaa qulqullinaa gahumsa dhaabilee daldalaa haaromsuu', en: 'Business Institution Competency Certificate Renewal' },
  { or: 'Hayyama gahumsa ogummaa dhaabilee aadaa kennuu, haaromsuu, haquu', en: 'Cultural Institution Competency License (Issue/Renew/Cancel)' },
];

SERVICES_BY_WINDOW['6'] = [
  { or: 'Hayyama daldalaa kennuu, haaromsuu, fooyyessuu (jijjiraa) fi haquu', en: 'Business License (Issue/Renew/Amend/Cancel)' },
  { or: 'Moggaasa maqaa daldalaa kennuu', en: 'Business Name Reservation' },
  { or: 'Hayyama Qorannoo Hojiiwwan Albuudaa kennuu', en: 'Mining Exploration Permit Issuance' },
  { or: 'Hayyama Qorannoo Hojiiwwan Albuudaa Haaromsuu', en: 'Mining Exploration Permit Renewal' },
  { or: 'Hayyama Oomisha Albuudaa kennuu', en: 'Mining Production Permit Issuance' },
  { or: 'Hayyama Oomisha Albuudaa Haaroomsuu', en: 'Mining Production Permit Renewal' },
  { or: 'Hayyama Oomishaa Albuudaa Babal\'isuu', en: 'Mining Production Permit Expansion' },
  { or: 'Hayyama Oomisha Albuudaa Dabarsuu', en: 'Mining Production Permit Transfer' },
  { or: 'Heeyyama oomisha bishaanii kennuu', en: 'Water Production Permit Issuance' },
  { or: 'Heeyyama Oomisha bishaanii haaromsuu fi haquu', en: 'Water Production Permit Renewal & Cancellation' },
  { or: 'Hayyama konkolaachisaa haaromsuu (Renew driving license)', en: 'Driving License Renewal' },
  { or: 'Jijjiirraa faayila konkolaachisaa', en: 'Driving File Change' },
  { or: 'Hayyama konkolaachisaa kennuu (new driving license)', en: 'New Driving License Issuance' },
  { or: 'Hayyama Bobbii Konkoolaataa kennuu', en: 'Vehicle Deployment Permit Issuance' },
  { or: 'Murtii taarifaa beeksisuu', en: 'Tariff Determination Notification' },
  { or: 'Hayyama ogummaa galtee qonnaa kennuu', en: 'Agricultural Input Competency License' },
  { or: 'Hayyama ogummaa galtee qoricha beeyladaa kennuu (Faarmaasii fi kilinika)', en: 'Veterinary Medicine Competency License (Pharmacy & Clinic)' },
  { or: 'Hayyama mirk. gahumsa ogummaa AI (Mala namaan loon diqaaloomsuu) kennuu fi haaromsuu', en: 'AI Competency License (Artificial Insemination) Issue/Renew' },
  { or: 'Hayyama mirk. gahumsa ogummaa nyaata beeyladaa kennuu fi haaromsuu (Oomishaa fi Gurgurtaa)', en: 'Animal Feed Competency License (Production & Sale) Issue/Renew' },
  { or: 'Hayyama mirk. gahumsa ogummaa manaa qalmaa kennuu fi haaromsuu', en: 'Slaughterhouse Competency License Issue/Renew' },
  { or: 'Hayyama mirk. gahumsa ogummaa horsiisa lukkuu kennuu', en: 'Poultry Farming Competency License' },
  { or: 'Hayyama mirk. gahumsa ogummaa horsiisa horii aannaanii fi foonii kennuu', en: 'Small Livestock & Meat Farming Competency License' },
];

SERVICES_BY_WINDOW['6'].push(
  { or: 'Heyyama gahuumsa ogeessota leenjii suphaa Meeshaalee elektirooniksii fi dandeettii kompitaraa kennuu fi haaromsuu', en: 'Electronics & Computer Training Competency License Issue/Renew' },
  { or: 'Hayyama diriirsa bu\'uuraalee teknolojii qunnamtii odeeffannoo (network fi cctv) hojjachuu barbaadaniif kennuu fi haaromsuu', en: 'ICT Infrastructure (Network & CCTV) Installation License Issue/Renew' },
  { or: 'Heyyama gahuumsa ogeessota daldala Meeshaalee elektirooniksii kennuu fi haaromsuu', en: 'Electronics Trading Competency License Issue/Renew' },
  { or: 'Heyyama gahuumsa ogeessota suphaa Meeshaalee elektirooniksii kennuu fi haaromsuu', en: 'Electronics Repair Competency License Issue/Renew' },
  { or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu', en: 'Private Employment Agency License Issuance' },
  { or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haaressuu', en: 'Private Employment Agency License Renewal' },
  { or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu addaan cite itti fufsiisuu', en: 'Private Employment Agency License Separate Continuation' },
  { or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu bade bakka buusuu', en: 'Private Employment Agency License Replacement' },
  { or: 'Restore Licenses & release security deposit', en: 'Restore Licenses & Release Security Deposit' },
  { or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haquu', en: 'Private Employment Agency License Cancellation' },
  { or: 'Hayyama waldaalee hawaasa aadda addaa kennuu fi haaromsuu', en: 'Various Community Association License Issue/Renew' },
  { or: 'Waldiddaa dhimma hojjataaf hojjachiisaa jidduu jiru keessuumeessuu', en: 'Employee-Employer Dispute Mediation' }
);

SERVICES_BY_WINDOW['7'] = [
  { or: 'Waldaalee lafa mana jireenyaa gurmaa\'aniif qaama seerummaa kennuu fi haquu', en: 'Residential Land Cooperative Legal Status Issue/Cancel' },
  { or: 'Waliigaltee kiraa mana mootummaa raawwachu', en: 'Government House Rental Agreement Processing' },
  { or: 'Waliigaltee kireessaafi kireeffataa mirkaneessuu (Mana dhuunfaa)', en: 'Landlord-Tenant Agreement Verification (Private)' },
  { or: 'Walii galtee gamoo Waliinii raawwachuu fi qaama 3ffaatti dabarsuu', en: 'Joint Venture Agreement Processing & 3rd Party Transfer' },
  { or: 'Mallattoo maxxantuu (boolloo) waggaa haaromsuu (Bollo Renew)', en: 'Annual Stamp (Bollo) Renewal' },
  { or: 'Dhorka konkolaataa raawwachuu fi haquu (Ban or Lift)', en: 'Vehicle Ban or Lift' },
  { or: 'Galmeessa ragaa dhuunfaa fooyyessuu, dhorkuu fi kaasuu', en: 'Private Document Registration Amend/Ban/Lift' },
  { or: 'Ragaalee konkolaataa badan haaraan bakka buusuu (Material replacement)', en: 'Lost Vehicle Documents Replacement' },
  { or: 'Jijjiirraa maqaa abbaa qabeenyummaa raawwachu', en: 'Ownership Name Change Processing' },
  { or: 'Hayyama tajaajila geejibaa ykn haaromsa eeyyama waldaa (Transportation service license or renewal)', en: 'Transportation Service License or Association Renewal' },
  { or: 'Galmeessaa Sanadoota Sivilii (Civil Document Registration)', en: 'Civil Document Registration Service' },
  { or: 'Mirkaneessa Sadadoota Sivilii (Civil Document Authentication)', en: 'Civil Document Authentication Service' },
  { or: 'Barreefama hundeefamaa daldala dhuunfaa itti gaafatmamuummaa murtaa\'e PLC', en: 'Private Limited Company (PLC) Founding Document' },
  { or: 'Galmeesssa Waldaalee IMX SME (Small and Micro Enterprise)', en: 'SME Registration (Small & Micro Enterprise)' },
  { or: 'Ragaalee waldaalee galmeessuu fi mirkaneessu', en: 'Association Documents Registration & Verification' },
  { or: 'Walii galtee galmeessuu fi mirkaneessuu (gurgurtaa, kiraa, etc)', en: 'Contract Registration & Verification (Sale, Rent, etc)' },
  { or: 'Galmeessa waliigaltee Liqii (Loan Agreement)', en: 'Loan Agreement Registration' },
  { or: 'Mirkaneessa hiikaa afaanii/turjumaanaa kennuu', en: 'Translation/Interpretation Verification' },
  { or: 'Bakka bu\'ummaa galmeessuuu fi kennuu (Special Power of Agency)', en: 'Special Power of Attorney Registration & Issuance' },
  { or: 'Mirkaneessa Gurmii Waldaale Hojii Gamtaa (Approval of Cooperative Organizations)', en: 'Cooperative Organization Approval' },
];

SERVICES_BY_WINDOW['8'] = [
  { or: 'Simannaa Piroojektoota investimantii', en: 'Investment Project Reception' },
  { or: 'Hayyama investimantii kennuu (Haaraa, Haaromsu, Bakka Buusuu)', en: 'Investment License (Issue/Renew/Replace)' },
  { or: 'Waliigaltee piroojektii investimantii haaraa mallatteessuu', en: 'New Investment Project Agreement Signing' },
  { or: 'Tajaajila Hayyama Jajjabeessituu Investimantii kennuu', en: 'Investment Incentive License Service' },
  { or: 'Piroojjektii investimantii babal\'insa /Expansion/ akka taasifamuuf gaafataniif', en: 'Investment Project Expansion Request Service' },
  { or: 'Jijjiirraa gosaa Piroojektii investimantii eyyamamuu', en: 'Investment Project Type Change Authorization' },
  { or: 'Mirkaneessa Qorannoo haalaa dhiibbaa Naannoo', en: 'Environmental Impact Assessment Verification' },
  { or: 'TOR Qorannoo Eegumsa Nannoo Mirkaneessuu', en: 'Environmental Protection Study TOR Verification' },
  { or: 'Odiitii dhiibbaa Naannoo gaggeessuu', en: 'Environmental Impact Audit Conducting' },
];

SERVICES_BY_WINDOW['9'] = [
  { or: 'Komii Waldiddaa Lafaa simachuu fi hiikuu', en: 'Land Dispute Complaint Reception & Resolution' },
  { or: 'Galmeessaa fi Kenna Kaartaa qabbiyyee', en: 'Parcel Card Registration & Issuance' },
  { or: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa kennuu', en: 'Document Clearance & Certificate Issuance' },
  { or: 'Wabummaa Kuusan walqabsiisuu (Registration of supportive letter)', en: 'Supportive Letter Registration' },
  { or: 'Jijjiirraa maqaa raawwachuu (Bittaa fi Gurgurtaa, Kenna, Dhaaltummaa, Ajaja M/Murtii)', en: 'Name Change (Sale, Gift, Inheritance, Court Order)' },
  { or: 'Dhorka Mana Murtii haquu (Cancelation of Court Injunction)', en: 'Court Injunction Cancellation' },
  { or: 'Qabiyyee walitti makuu (Merge Parcel)', en: 'Parcel Merge' },
  { or: 'Qabiyyee adda qooduu (Parcel Split)', en: 'Parcel Split' },
  { or: 'Walii galtee Liizii galmeessuu (Registration of lease agreement)', en: 'Lease Agreement Registration' },
  { or: 'Sirreeffama Qabiyyee sirreessuu', en: 'Parcel Correction' },
  { or: 'Tilmaama Qabiyyee raawwachuu', en: 'Parcel Valuation' },
  { or: 'Sanada bade bakka buusuu fi Tajaajila seera qabeessumma qabiyyee mirkaneessuu', en: 'Lost Document Replacement & Parcel Legality Verification' },
  { or: 'Gaaffii lafaa simachuu (Registration of Request for land)', en: 'Land Request Registration' },
  { or: 'Jijiiirraa itti fayyadama lafaa (Change Land use) (Jijjiirraa zoning)', en: 'Land Use Change (Zoning Change)' },
  { or: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii', en: 'Land Use & Project Type Change' },
  { or: 'Galmeeessa fi Waraqaa Ragaa Kennuu Manneen Waliinii fi Qusannoo', en: 'Condominium & Co-ownership Registration & Certificate' },
];

SERVICES_BY_WINDOW['9'].push(
  { or: 'Jijjirraa maqaa Raawwachuu (Transfer of private property — Change Name)', en: 'Private Property Name Transfer (Cadastral)' },
  { or: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu (kadastara)', en: 'Cadastral Document Clearance & Certificate' },
  { or: 'Bakka Bu\'ummaa kuusaan walqabsiisuu (Registration of representative document)', en: 'Representative Document Registration (Cadastral)' },
  { or: 'Wabummaa Kuusan walqabsiisuu (Registration of supportive letter — kadastara)', en: 'Supportive Letter Registration (Cadastral)' },
  { or: 'Galmeessaa fi Kenna Kaartaa Dijitaalaa', en: 'Digital Card Registration & Issuance' },
  { or: 'Qabiyyee walitti makuu (Merge Parcel — kadastara)', en: 'Parcel Merge (Cadastral)' },
  { or: 'Qabiyyee Adda Qooduu (Parcel Split — kadastara)', en: 'Parcel Split (Cadastral)' },
  { or: 'Walii galtee Liizii haaromsuu (Registration of lease agreement Renovation)', en: 'Lease Agreement Renewal (Cadastral)' },
  { or: 'Galmeessa Ragaa Dhorkuu, Fooyyessuu fi Kaasuu', en: 'Document Registration Ban/Amend/Lift (Cadastral)' },
  { or: 'Jijiiirraa itti fayyadama lafaa (Change Land use — kadastara)', en: 'Land Use Change (Cadastral)' },
  { or: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii (kadastara)', en: 'Land Use & Project Type Change (Cadastral)' },
  { or: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu (kadastara)', en: 'Land Dispute Resolution (Cadastral)' }
);

SERVICES_BY_WINDOW['10'] = [
  { or: 'Lakkoosfa kaffalaa Gibiraa (TIN)', en: 'Tax Identification Number (TIN) Issuance' },
  { or: 'Sassabbii galii Idilee', en: 'Regular Tax Revenue Collection' },
  { or: 'Sassaabbii galii M/Qopheessaa', en: 'Withholding Tax Revenue Collection' },
  { or: 'Murtii Gibiraa, kaffaltii VAT, TOT fi withholding galmeessuu', en: 'Tax Assessment, VAT/TOT/Withholding Payment Registration' },
  { or: 'Deggersa maxxansa nagahee kafalaa gibiraa kennuu', en: 'Tax Receipt Printing Support' },
  { or: 'Cost sharing clearance', en: 'Cost Sharing Clearance' },
  { or: 'Waraqaaa qulqullina idaa irraa bilisa ta\'u ibsu', en: 'Debt Clearance Certificate' },
  { or: 'Gabaasa ooditii (Audit Report)', en: 'Audit Report Service' },
  { or: 'Herreega (Accounting services)', en: 'Accounting Services' },
  { or: 'Gumaataa fi galii buusaa gonofaa sassaabuu', en: 'Buusaa Gonofaa Contribution & Revenue Collection' },
  { or: 'Sassabbii galii Abbaa Alangaa', en: 'Prosecutor Office Revenue Collection' },
  { or: 'Sassaabii galii geejjibaa raawwachuu', en: 'Transport Revenue Collection' },
  { or: 'Galii Bishaanii dhugaatii', en: 'Drinking Water Revenue Collection' },
];

SERVICES_BY_WINDOW['11'] = [
  { or: 'Ogeessa Kanfaltii beenyaa (nama 2) barbaachiisa', en: 'Compensation Payment Specialist (2 persons)' },
  { or: 'Ogeessa kanfaltii projeektii (nama 2)', en: 'Project Payment Specialist (2 persons)' },
  { or: 'Ogeessa liqii kafaamtoota misoomaa (nama 1)', en: 'Displaced Persons Loan Specialist (1 person)' },
  { or: 'Ogeessa Kanfaltii tajaajila addaa addaa (nama 2)', en: 'Various Service Payment Specialist (2 persons)' },
  { or: 'Ogeessa bittaa fi tajaajilaa (nama 2)', en: 'Procurement & Service Specialist (2 persons)' },
];

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  // 1. Seed floors
  console.log('\n--- Seeding Floors ---');
  for (const f of FLOORS) {
    const exists = await Floor.findOne({ floorNumber: f.floorNumber });
    if (exists) {
      console.log(`  Floor ${f.floorNumber} already exists, skipping`);
    } else {
      await Floor.create({ floorNumber: f.floorNumber, name: f.name, description: { en: '', am: '', om: '' } });
      console.log(`  Created Floor ${f.floorNumber}: ${f.name.en}`);
    }
  }

  // 2. Find or pick first organization for windows
  const orgs = await Organization.find().sort({ createdAt: 1 });
  if (orgs.length === 0) {
    console.error('No organizations found. Run the main seed first: node seed.js');
    process.exit(1);
  }
  const org = orgs[0];
  console.log(`\nUsing organization: ${org.name.en} (${org._id})`);

  // 3. Seed windows
  console.log('\n--- Seeding Windows ---');
  const windowMap = {};
  for (const w of WINDOWS) {
    let win = await Window.findOne({ organization: org._id, number: w.number });
    if (win) {
      // Update name if missing
      if (!win.name || !win.name.or) {
        win.name = w.name;
        win.floor = w.floor;
        await win.save();
        console.log(`  Updated Window ${w.number}: ${w.name.or}`);
      } else {
        console.log(`  Window ${w.number} already exists, skipping`);
      }
    } else {
      win = await Window.create({
        number: w.number,
        name: w.name,
        floor: w.floor,
        organization: org._id,
        description: { en: '', am: '', or: '' },
      });
      console.log(`  Created Window ${w.number}: ${w.name.or}`);
    }
    windowMap[w.number] = win._id;
  }

  // 4. Seed services
  console.log('\n--- Seeding Services ---');
  for (const [windowNum, services] of Object.entries(SERVICES_BY_WINDOW)) {
    const windowId = windowMap[windowNum];
    if (!windowId) { console.log(`  Window ${windowNum} not found, skipping`); continue; }

    for (const svc of services) {
      const exists = await Service.findOne({
        organization: org._id,
        'name.or': svc.or.trim(),
      });
      if (exists) {
        // Ensure it's linked to this window
        if (!exists.window || exists.window.toString() !== windowId.toString()) {
          exists.window = windowId;
          await exists.save();
          console.log(`  Re-linked: ${svc.en} → Window ${windowNum}`);
        } else {
          console.log(`  Service already exists: ${svc.en}`);
        }
      } else {
        await Service.create({
          name: { en: svc.en, am: svc.or, or: svc.or },
          description: { en: '', am: '', or: '' },
          organization: org._id,
          window: windowId,
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: '',
          contactPhone: '',
        });
        console.log(`  Created: ${svc.en} (Window ${windowNum})`);
      }
    }
  }

  console.log('\n✅ Seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
