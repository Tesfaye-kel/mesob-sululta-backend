const mongoose = require('mongoose');

const Organization = require('./models/Organization');
const Service = require('./models/Service');

// NOTE: Source data is from the official Sululta branch office list (Afan Oromo).
// English (en) and Amharic (am) fields are placeholders ('or' text duplicated)
// until proper translations are provided -- replace these before going live.
const seedOrganizations = async () => {
  const orgs = [
    {
      name: {
        en: 'Galmeessa Siivilii', // TODO: translate to English
        am: 'Galmeessa Siivilii', // TODO: translate to Amharic
        or: 'Galmeessa Siivilii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Tajaajila Waragaa Eenyummaa kennuu (Residential ID)', // TODO: translate
            am: 'Tajaajila Waragaa Eenyummaa kennuu (Residential ID)', // TODO: translate
            or: 'Tajaajila Waragaa Eenyummaa kennuu (Residential ID)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeessaa Sanadoota Sivilii (Civil Document Registration Service)', // TODO: translate
            am: 'Galmeessaa Sanadoota Sivilii (Civil Document Registration Service)', // TODO: translate
            or: 'Galmeessaa Sanadoota Sivilii (Civil Document Registration Service)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Mirkaneessa Sadadoota Sivilii (Civil Document Authentication Service)', // TODO: translate
            am: 'Mirkaneessa Sadadoota Sivilii (Civil Document Authentication Service)', // TODO: translate
            or: 'Mirkaneessa Sadadoota Sivilii (Civil Document Authentication Service)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Dhaabbata Bishaan dhugaatii', // TODO: translate to English
        am: 'Dhaabbata Bishaan dhugaatii', // TODO: translate to Amharic
        or: 'Dhaabbata Bishaan dhugaatii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Simannaa maamila haaraa fi Gurgurtaa Biilii Bishanii', // TODO: translate
            am: 'Simannaa maamila haaraa fi Gurgurtaa Biilii Bishanii', // TODO: translate
            or: 'Simannaa maamila haaraa fi Gurgurtaa Biilii Bishanii',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Mirkaneessa Gurmii Waldaale Hojii Gamtaa (Approval of Cooperative Organizations)', // TODO: translate
            am: 'Mirkaneessa Gurmii Waldaale Hojii Gamtaa (Approval of Cooperative Organizations)', // TODO: translate
            or: 'Mirkaneessa Gurmii Waldaale Hojii Gamtaa (Approval of Cooperative Organizations)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Deggersa aaddaa addaa waldaalee fi walitti hidhamiinsa gabaa WHG uumu kennuu', // TODO: translate
            am: 'Deggersa aaddaa addaa waldaalee fi walitti hidhamiinsa gabaa WHG uumu kennuu', // TODO: translate
            or: 'Deggersa aaddaa addaa waldaalee fi walitti hidhamiinsa gabaa WHG uumu kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'CHUO', // TODO: translate to English
        am: 'CHUO', // TODO: translate to Amharic
        or: 'CHUO',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Qaama seerummaa waldaalee IMX kennuu', // TODO: translate
            am: 'Qaama seerummaa waldaalee IMX kennuu', // TODO: translate
            or: 'Qaama seerummaa waldaalee IMX kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Deeggersa wldaalee IMX paakeejiwwan deggersaa akka argatan haala mijeessu', // TODO: translate
            am: 'Deeggersa wldaalee IMX paakeejiwwan deggersaa akka argatan haala mijeessu', // TODO: translate
            or: 'Deeggersa wldaalee IMX paakeejiwwan deggersaa akka argatan haala mijeessu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'waldaalee IMX Investimentiitti ce’aniif waraqaa ragaa kennuu', // TODO: translate
            am: 'waldaalee IMX Investimentiitti ce’aniif waraqaa ragaa kennuu', // TODO: translate
            or: 'waldaalee IMX Investimentiitti ce’aniif waraqaa ragaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Hawaasummaa', // TODO: translate to English
        am: 'Hawaasummaa', // TODO: translate to Amharic
        or: 'Hawaasummaa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Hoji dhabdoota galmeessuu, kaardii hoji dhabdummaa kennuu (Registration, Card Issuance of Job Seeker)', // TODO: translate
            am: 'Hoji dhabdoota galmeessuu, kaardii hoji dhabdummaa kennuu (Registration, Card Issuance of Job Seeker)', // TODO: translate
            or: 'Hoji dhabdoota galmeessuu, kaardii hoji dhabdummaa kennuu (Registration, Card Issuance of Job Seeker)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Kaardii Hoji dhabdumma Haaromsuu', // TODO: translate
            am: 'Kaardii Hoji dhabdumma Haaromsuu', // TODO: translate
            or: 'Kaardii Hoji dhabdumma Haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Walii galtee qacarrii ogeessota profeeshinaala dhaabbilee dhuunfaa mirkaneessuu', // TODO: translate
            am: 'Walii galtee qacarrii ogeessota profeeshinaala dhaabbilee dhuunfaa mirkaneessuu', // TODO: translate
            or: 'Walii galtee qacarrii ogeessota profeeshinaala dhaabbilee dhuunfaa mirkaneessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu', // TODO: translate
            am: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu', // TODO: translate
            or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haaressuu', // TODO: translate
            am: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haaressuu', // TODO: translate
            or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haaressuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu addaan cite itti fufsiisuu', // TODO: translate
            am: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu addaan cite itti fufsiisuu', // TODO: translate
            or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu addaan cite itti fufsiisuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Ejensii dhuunfaa hojii fi hojjetama biyyaa keessaa wal quunamsiisuu bade bakka buusuu', // TODO: translate
            am: 'Hayyama Ejensii dhuunfaa hojii fi hojjetama biyyaa keessaa wal quunamsiisuu bade bakka buusuu', // TODO: translate
            or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetama biyyaa keessaa wal quunamsiisuu bade bakka buusuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Restore Licenses & release security deposit', // TODO: translate
            am: 'Restore Licenses & release security deposit', // TODO: translate
            or: 'Restore Licenses & release security deposit',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haquu', // TODO: translate
            am: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haquu', // TODO: translate
            or: 'Hayyama Ejensii dhuunfaa hojii fi hojjetaa biyyaa keessaa wal quunamsiisuu haquu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama waldaalee hawaasa aadda addaa kennu fi haaromsuu', // TODO: translate
            am: 'Hayyama waldaalee hawaasa aadda addaa kennu fi haaromsuu', // TODO: translate
            or: 'Hayyama waldaalee hawaasa aadda addaa kennu fi haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waldiddaa dhimma hojjataaf hojjachiisaa jidduu jiru keessuumeessuu', // TODO: translate
            am: 'Waldiddaa dhimma hojjataaf hojjachiisaa jidduu jiru keessuumeessuu', // TODO: translate
            or: 'Waldiddaa dhimma hojjataaf hojjachiisaa jidduu jiru keessuumeessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Daldala', // TODO: translate to English
        am: 'Daldala', // TODO: translate to Amharic
        or: 'Daldala',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Xalayaa deggarsaa adda addaa walitti hidhamiinsa gabaa oomisha qonnaa fi industrii uumuu daldaltootaaf kennuu', // TODO: translate
            am: 'Xalayaa deggarsaa adda addaa walitti hidhamiinsa gabaa oomisha qonnaa fi industrii uumuu daldaltootaaf kennuu', // TODO: translate
            or: 'Xalayaa deggarsaa adda addaa walitti hidhamiinsa gabaa oomisha qonnaa fi industrii uumuu daldaltootaaf kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama daldalaa kennuu, haaromsuu,fooyyessuu(jijjiraa) fi haquu(License Registration)', // TODO: translate
            am: 'Hayyama daldalaa kennuu, haaromsuu,fooyyessuu(jijjiraa) fi haquu(License Registration)', // TODO: translate
            or: 'Hayyama daldalaa kennuu, haaromsuu,fooyyessuu(jijjiraa) fi haquu(License Registration)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Moggaasa maqaa daldalaa kennuu (License Registration)', // TODO: translate
            am: 'Moggaasa maqaa daldalaa kennuu (License Registration)', // TODO: translate
            or: 'Moggaasa maqaa daldalaa kennuu (License Registration)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Bishaan Albuudaa fi Inarjii', // TODO: translate to English
        am: 'Bishaan Albuudaa fi Inarjii', // TODO: translate to Amharic
        or: 'Bishaan Albuudaa fi Inarjii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Hayyama Qorannoo Hojiiwwan Albuudaa kennuu', // TODO: translate
            am: 'Hayyama Qorannoo Hojiiwwan Albuudaa kennuu', // TODO: translate
            or: 'Hayyama Qorannoo Hojiiwwan Albuudaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Qorannoo Hojiiwwan Albuudaa Haaroomsuu', // TODO: translate
            am: 'Hayyama Qorannoo Hojiiwwan Albuudaa Haaroomsuu', // TODO: translate
            or: 'Hayyama Qorannoo Hojiiwwan Albuudaa Haaroomsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Oomisha Albuudaa kennuu', // TODO: translate
            am: 'Hayyama Oomisha Albuudaa kennuu', // TODO: translate
            or: 'Hayyama Oomisha Albuudaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Oomisha Albuudaa Haaroomsuu', // TODO: translate
            am: 'Hayyama Oomisha Albuudaa Haaroomsuu', // TODO: translate
            or: 'Hayyama Oomisha Albuudaa Haaroomsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Oomishaa Albuudaa Babal’isuu', // TODO: translate
            am: 'Hayyama Oomishaa Albuudaa Babal’isuu', // TODO: translate
            or: 'Hayyama Oomishaa Albuudaa Babal’isuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Oomisha Albuudaa Dabarsuu', // TODO: translate
            am: 'Hayyama Oomisha Albuudaa Dabarsuu', // TODO: translate
            or: 'Hayyama Oomisha Albuudaa Dabarsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Heeyyama oomisha bishaanii kennu', // TODO: translate
            am: 'Heeyyama oomisha bishaanii kennu', // TODO: translate
            or: 'Heeyyama oomisha bishaanii kennu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Heeyyama Oomisha bishaanii haaromsuu fi haquu', // TODO: translate
            am: 'Heeyyama Oomisha bishaanii haaromsuu fi haquu', // TODO: translate
            or: 'Heeyyama Oomisha bishaanii haaromsuu fi haquu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'fayyaa', // TODO: translate to English
        am: 'fayyaa', // TODO: translate to Amharic
        or: 'fayyaa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Inshuraansii fayyaa hawaasaa kennuu', // TODO: translate
            am: 'Inshuraansii fayyaa hawaasaa kennuu', // TODO: translate
            or: 'Inshuraansii fayyaa hawaasaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Inshuraansii fayyaa hawaasaa haaromsuu', // TODO: translate
            am: 'Inshuraansii fayyaa hawaasaa haaromsuu', // TODO: translate
            or: 'Inshuraansii fayyaa hawaasaa haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama manneen yaalaa dhuunfaa kennuu', // TODO: translate
            am: 'Hayyama manneen yaalaa dhuunfaa kennuu', // TODO: translate
            or: 'Hayyama manneen yaalaa dhuunfaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama manneen yaalaa dhuunfaa haaromsuu', // TODO: translate
            am: 'Hayyama manneen yaalaa dhuunfaa haaromsuu', // TODO: translate
            or: 'Hayyama manneen yaalaa dhuunfaa haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu', // TODO: translate
            am: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu', // TODO: translate
            or: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu', // TODO: translate
            am: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu', // TODO: translate
            or: 'Waraqaa qulqullinaa gahumsa ogummaa fayyaa haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu', // TODO: translate
            am: 'Waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu', // TODO: translate
            or: 'Waraqaa qulqullinaa gahumsa dhaabbilee daldalaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waraqaa qulqullinaa gahumsa dhaabilee daldalaa haaromsuu', // TODO: translate
            am: 'Waraqaa qulqullinaa gahumsa dhaabilee daldalaa haaromsuu', // TODO: translate
            or: 'Waraqaa qulqullinaa gahumsa dhaabilee daldalaa haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'W/Bulchiinsaa', // TODO: translate to English
        am: 'W/Bulchiinsaa', // TODO: translate to Amharic
        or: 'W/Bulchiinsaa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Xalayaa deeggarsaa adda addaa kennuu', // TODO: translate
            am: 'Xalayaa deeggarsaa adda addaa kennuu', // TODO: translate
            or: 'Xalayaa deeggarsaa adda addaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Iyyannoo adda addaa keessuumeessuu', // TODO: translate
            am: 'Iyyannoo adda addaa keessuumeessuu', // TODO: translate
            or: 'Iyyannoo adda addaa keessuumeessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Komii adda addaa keessuumeessuu', // TODO: translate
            am: 'Komii adda addaa keessuumeessuu', // TODO: translate
            or: 'Komii adda addaa keessuumeessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Xalayaa Deeggarsaa Kaafamtoota Misoomaa Invastimantii ce’anii fi dhimmota biroof kennuu', // TODO: translate
            am: 'Xalayaa Deeggarsaa Kaafamtoota Misoomaa Invastimantii ce’anii fi dhimmota biroof kennuu', // TODO: translate
            or: 'Xalayaa Deeggarsaa Kaafamtoota Misoomaa Invastimantii ce’anii fi dhimmota biroof kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Komii kaafamtoota Misoomaa Hiikuu', // TODO: translate
            am: 'Komii kaafamtoota Misoomaa Hiikuu', // TODO: translate
            or: 'Komii kaafamtoota Misoomaa Hiikuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'PSMQN', // TODO: translate to English
        am: 'PSMQN', // TODO: translate to Amharic
        or: 'PSMQN',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Xalayaa deeggarsa adda addaa kennuu', // TODO: translate
            am: 'Xalayaa deeggarsa adda addaa kennuu', // TODO: translate
            or: 'Xalayaa deeggarsa adda addaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Komii hojjattoota mootummaa Keessumeessuu', // TODO: translate
            am: 'Komii hojjattoota mootummaa Keessumeessuu', // TODO: translate
            or: 'Komii hojjattoota mootummaa Keessumeessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Koominikeeshinii', // TODO: translate to English
        am: 'Koominikeeshinii', // TODO: translate to Amharic
        or: 'Koominikeeshinii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Deeggarsa Hayyama barjaalee kennuu', // TODO: translate
            am: 'Deeggarsa Hayyama barjaalee kennuu', // TODO: translate
            or: 'Deeggarsa Hayyama barjaalee kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Xalayaa hayyama beeksiisa sagalee kennuu', // TODO: translate
            am: 'Xalayaa hayyama beeksiisa sagalee kennuu', // TODO: translate
            or: 'Xalayaa hayyama beeksiisa sagalee kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Geejiba', // TODO: translate to English
        am: 'Geejiba', // TODO: translate to Amharic
        or: 'Geejiba',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Hayyama konkolaachisaa Haaraa kennuu (new driving license)', // TODO: translate
            am: 'Hayyama konkolaachisaa Haaraa kennuu (new driving license)', // TODO: translate
            or: 'Hayyama konkolaachisaa Haaraa kennuu (new driving license)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama konkolaachisaa haromsuu (Renew driving license)', // TODO: translate
            am: 'Hayyama konkolaachisaa haromsuu (Renew driving license)', // TODO: translate
            or: 'Hayyama konkolaachisaa haromsuu (Renew driving license)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijjiirraa faayila konkolaachisaa', // TODO: translate
            am: 'Jijjiirraa faayila konkolaachisaa', // TODO: translate
            or: 'Jijjiirraa faayila konkolaachisaa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama Bobbii Konkoolaataa kennuu (Issuance of Vehicle Deployment Permits)', // TODO: translate
            am: 'Hayyama Bobbii Konkoolaataa kennuu (Issuance of Vehicle Deployment Permits)', // TODO: translate
            or: 'Hayyama Bobbii Konkoolaataa kennuu (Issuance of Vehicle Deployment Permits)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Murtii taarifaa beeksisuu', // TODO: translate
            am: 'Murtii taarifaa beeksisuu', // TODO: translate
            or: 'Murtii taarifaa beeksisuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Mallattoo maxxantuu (boolloo) waggaa haaromsuu(Bollo Renew)', // TODO: translate
            am: 'Mallattoo maxxantuu (boolloo) waggaa haaromsuu(Bollo Renew)', // TODO: translate
            or: 'Mallattoo maxxantuu (boolloo) waggaa haaromsuu(Bollo Renew)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Dhorka konkolaataa raawwachuu fi haquu(Ban or Lift)', // TODO: translate
            am: 'Dhorka konkolaataa raawwachuu fi haquu(Ban or Lift)', // TODO: translate
            or: 'Dhorka konkolaataa raawwachuu fi haquu(Ban or Lift)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeessa ragaa dhuunfaa Fooyyessuu, dhorkuu fi kaasuu', // TODO: translate
            am: 'Galmeessa ragaa dhuunfaa Fooyyessuu, dhorkuu fi kaasuu', // TODO: translate
            or: 'Galmeessa ragaa dhuunfaa Fooyyessuu, dhorkuu fi kaasuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ragaalee konkolaataa badan haaraan bakka buusuu(Material replacement)', // TODO: translate
            am: 'Ragaalee konkolaataa badan haaraan bakka buusuu(Material replacement)', // TODO: translate
            or: 'Ragaalee konkolaataa badan haaraan bakka buusuu(Material replacement)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijjiirraa maqaa abbaa qabeenyummaa raawwachu', // TODO: translate
            am: 'Jijjiirraa maqaa abbaa qabeenyummaa raawwachu', // TODO: translate
            or: 'Jijjiirraa maqaa abbaa qabeenyummaa raawwachu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama tajaajila geejibaa ykn haaromsa eeyyama waldaa (Transportation service license or renewal of association license)', // TODO: translate
            am: 'Hayyama tajaajila geejibaa ykn haaromsa eeyyama waldaa (Transportation service license or renewal of association license)', // TODO: translate
            or: 'Hayyama tajaajila geejibaa ykn haaromsa eeyyama waldaa (Transportation service license or renewal of association license)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Sassaabii galii geejjibaa raawwachuu', // TODO: translate
            am: 'Sassaabii galii geejjibaa raawwachuu', // TODO: translate
            or: 'Sassaabii galii geejjibaa raawwachuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Qonna', // TODO: translate to English
        am: 'Qonna', // TODO: translate to Amharic
        or: 'Qonna',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Deggarsaa Qonnaan bulaa investimentiitti ce’uu fi W/hidhaminsa gabaa kennuu', // TODO: translate
            am: 'Deggarsaa Qonnaan bulaa investimentiitti ce’uu fi W/hidhaminsa gabaa kennuu', // TODO: translate
            or: 'Deggarsaa Qonnaan bulaa investimentiitti ce’uu fi W/hidhaminsa gabaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama ogummaa galtee qonnaa kennuu', // TODO: translate
            am: 'Hayyama ogummaa galtee qonnaa kennuu', // TODO: translate
            or: 'Hayyama ogummaa galtee qonnaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama ogummaa galtee qoricha beeyladaa kennuu(Faarmaasii fi kilinika)', // TODO: translate
            am: 'Hayyama ogummaa galtee qoricha beeyladaa kennuu(Faarmaasii fi kilinika)', // TODO: translate
            or: 'Hayyama ogummaa galtee qoricha beeyladaa kennuu(Faarmaasii fi kilinika)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama mirk. gahumsa ogummaa AI (Mala namaan loon diqaaloomsuu kennuu fi haaromsuu', // TODO: translate
            am: 'Hayyama mirk. gahumsa ogummaa AI (Mala namaan loon diqaaloomsuu kennuu fi haaromsuu', // TODO: translate
            or: 'Hayyama mirk. gahumsa ogummaa AI (Mala namaan loon diqaaloomsuu kennuu fi haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama mirk. gahumsa ogummaa nyaata beeyladaa kennuu fi haaromsuu (Oomishaa fi Gurgurtaa)', // TODO: translate
            am: 'Hayyama mirk. gahumsa ogummaa nyaata beeyladaa kennuu fi haaromsuu (Oomishaa fi Gurgurtaa)', // TODO: translate
            or: 'Hayyama mirk. gahumsa ogummaa nyaata beeyladaa kennuu fi haaromsuu (Oomishaa fi Gurgurtaa)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama mirk. gahumsa ogummaa manaa qalmaa Kennuu fi haaromsuu', // TODO: translate
            am: 'Hayyama mirk. gahumsa ogummaa manaa qalmaa Kennuu fi haaromsuu', // TODO: translate
            or: 'Hayyama mirk. gahumsa ogummaa manaa qalmaa Kennuu fi haaromsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama mirk. gahumsa ogummaa horsiisa lukkuu kennuu', // TODO: translate
            am: 'Hayyama mirk. gahumsa ogummaa horsiisa lukkuu kennuu', // TODO: translate
            or: 'Hayyama mirk. gahumsa ogummaa horsiisa lukkuu kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama mirk. gahumsa ogummaa horsiisa horii Aannaanii fi foonii kennuu', // TODO: translate
            am: 'Hayyama mirk. gahumsa ogummaa horsiisa horii Aannaanii fi foonii kennuu', // TODO: translate
            or: 'Hayyama mirk. gahumsa ogummaa horsiisa horii Aannaanii fi foonii kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'M/Qopheessa', // TODO: translate to English
        am: 'M/Qopheessa', // TODO: translate to Amharic
        or: 'M/Qopheessa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Deegarsa Bu\'uuraalee Misooma (Ibsaa,Daandii ,Bishaanii)Kennuu', // TODO: translate
            am: 'Deegarsa Bu\'uuraalee Misooma (Ibsaa,Daandii ,Bishaanii)Kennuu', // TODO: translate
            or: 'Deegarsa Bu\'uuraalee Misooma (Ibsaa,Daandii ,Bishaanii)Kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama tajaajila qalmaa kennuu (lakk. Qeeraa kennuu)', // TODO: translate
            am: 'Hayyama tajaajila qalmaa kennuu (lakk. Qeeraa kennuu)', // TODO: translate
            or: 'Hayyama tajaajila qalmaa kennuu (lakk. Qeeraa kennuu)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Saayinsii Technology', // TODO: translate to English
        am: 'Saayinsii Technology', // TODO: translate to Amharic
        or: 'Saayinsii Technology',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Heyyama gahuumsa ogeessota leenjii suphaa Meeshaalee elektirooniksii fi dandeettii kompitaraa (hardware and software) Kennuu fi Haaromsuu..', // TODO: translate
            am: 'Heyyama gahuumsa ogeessota leenjii suphaa Meeshaalee elektirooniksii fi dandeettii kompitaraa (hardware and software) Kennuu fi Haaromsuu..', // TODO: translate
            or: 'Heyyama gahuumsa ogeessota leenjii suphaa Meeshaalee elektirooniksii fi dandeettii kompitaraa (hardware and software) Kennuu fi Haaromsuu..',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama diriirsa bu’uuraalee teknolojii qunnamtii odeeffannoo (fkn Diriirsa network fi cctv kaameraa) hojjachuu barbaadaniif kennuu fi haaromsuu.', // TODO: translate
            am: 'Hayyama diriirsa bu’uuraalee teknolojii qunnamtii odeeffannoo (fkn Diriirsa network fi cctv kaameraa) hojjachuu barbaadaniif kennuu fi haaromsuu.', // TODO: translate
            or: 'Hayyama diriirsa bu’uuraalee teknolojii qunnamtii odeeffannoo (fkn Diriirsa network fi cctv kaameraa) hojjachuu barbaadaniif kennuu fi haaromsuu.',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Heyyama gahuumsa ogeessota daldala Meeshaalee elektirooniksii kennuu fi haaromsuu.', // TODO: translate
            am: 'Heyyama gahuumsa ogeessota daldala Meeshaalee elektirooniksii kennuu fi haaromsuu.', // TODO: translate
            or: 'Heyyama gahuumsa ogeessota daldala Meeshaalee elektirooniksii kennuu fi haaromsuu.',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Heyyama gahuumsa ogeessota suphaa Meeshaalee elektirooniksii (hardware and software) Kennuu fi Haaromsuu.', // TODO: translate
            am: 'Heyyama gahuumsa ogeessota suphaa Meeshaalee elektirooniksii (hardware and software) Kennuu fi Haaromsuu.', // TODO: translate
            or: 'Heyyama gahuumsa ogeessota suphaa Meeshaalee elektirooniksii (hardware and software) Kennuu fi Haaromsuu.',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Koonistraakshinii', // TODO: translate to English
        am: 'Koonistraakshinii', // TODO: translate to Amharic
        or: 'Koonistraakshinii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Sanitary', // TODO: translate
            am: 'Sanitary', // TODO: translate
            or: 'Sanitary',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Artiteechure', // TODO: translate
            am: 'Artiteechure', // TODO: translate
            or: 'Artiteechure',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'qindeessa Garee Qorannoo Mirkaneessa dizaayinii fi To\'annoo Projeectii Daandii III(foodaa Booda)', // TODO: translate
            am: 'qindeessa Garee Qorannoo Mirkaneessa dizaayinii fi To\'annoo Projeectii Daandii III(foodaa Booda)', // TODO: translate
            or: 'qindeessa Garee Qorannoo Mirkaneessa dizaayinii fi To\'annoo Projeectii Daandii III(foodaa Booda)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Structure /', // TODO: translate
            am: 'Structure /', // TODO: translate
            or: 'Structure /',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Electrical Eng.', // TODO: translate
            am: 'Electrical Eng.', // TODO: translate
            or: 'Electrical Eng.',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Surveyor', // TODO: translate
            am: 'Surveyor', // TODO: translate
            or: 'Surveyor',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Quantity', // TODO: translate
            am: 'Quantity', // TODO: translate
            or: 'Quantity',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Wal simsiisisa Pilaanii', // TODO: translate
            am: 'Wal simsiisisa Pilaanii', // TODO: translate
            or: 'Wal simsiisisa Pilaanii',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qindeessa Garee Galmee fi mirkaneessa Gahumsaa Industrii konistraakshinii (fooda booda)', // TODO: translate
            am: 'Qindeessa Garee Galmee fi mirkaneessa Gahumsaa Industrii konistraakshinii (fooda booda)', // TODO: translate
            or: 'Qindeessa Garee Galmee fi mirkaneessa Gahumsaa Industrii konistraakshinii (fooda booda)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Kenna Hayyama Gahumsa Ogummaa Ogeessota dhaabbilee, waldaalee ,kontraaktarootaa fi gorsitootaa haaraa kennuu, haaromsuu ol guddisuu fi haquu', // TODO: translate
            am: 'Kenna Hayyama Gahumsa Ogummaa Ogeessota dhaabbilee, waldaalee ,kontraaktarootaa fi gorsitootaa haaraa kennuu, haaromsuu ol guddisuu fi haquu', // TODO: translate
            or: 'Kenna Hayyama Gahumsa Ogummaa Ogeessota dhaabbilee, waldaalee ,kontraaktarootaa fi gorsitootaa haaraa kennuu, haaromsuu ol guddisuu fi haquu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Barnoota', // TODO: translate to English
        am: 'Barnoota', // TODO: translate to Amharic
        or: 'Barnoota',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Hayyama Gahumsa Manneen Barnoota Dhuunfaa fi miti mootummaa Kennuu, Haaromsuu, Kan bade bakka buusuufi deebisuu (Mana Barnootaa BSTDfi sadarkaa tokkoffaa 1-8)', // TODO: translate
            am: 'Hayyama Gahumsa Manneen Barnoota Dhuunfaa fi miti mootummaa Kennuu, Haaromsuu, Kan bade bakka buusuufi deebisuu (Mana Barnootaa BSTDfi sadarkaa tokkoffaa 1-8)', // TODO: translate
            or: 'Hayyama Gahumsa Manneen Barnoota Dhuunfaa fi miti mootummaa Kennuu, Haaromsuu, Kan bade bakka buusuufi deebisuu (Mana Barnootaa BSTDfi sadarkaa tokkoffaa 1-8)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Tajaajila jijjiirraa barsiisotaa/hooggantoota manneen barnootaa', // TODO: translate
            am: 'Tajaajila jijjiirraa barsiisotaa/hooggantoota manneen barnootaa', // TODO: translate
            or: 'Tajaajila jijjiirraa barsiisotaa/hooggantoota manneen barnootaa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ragaa barnootaa sadarkaa naannoo (kutaa 6ffaa fi 8ffaa) bade kennuu', // TODO: translate
            am: 'Ragaa barnootaa sadarkaa naannoo (kutaa 6ffaa fi 8ffaa) bade kennuu', // TODO: translate
            or: 'Ragaa barnootaa sadarkaa naannoo (kutaa 6ffaa fi 8ffaa) bade kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Xalayaa Deegarsa Barsiisoota fi Hoggantoota', // TODO: translate
            am: 'Xalayaa Deegarsa Barsiisoota fi Hoggantoota', // TODO: translate
            or: 'Xalayaa Deegarsa Barsiisoota fi Hoggantoota',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'D/Manneeni', // TODO: translate to English
        am: 'D/Manneeni', // TODO: translate to Amharic
        or: 'D/Manneeni',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Waldaalee lafa mana jireenyaa Gurmaa’aniif qaama seerummaa kennuu fi haquu', // TODO: translate
            am: 'Waldaalee lafa mana jireenyaa Gurmaa’aniif qaama seerummaa kennuu fi haquu', // TODO: translate
            or: 'Waldaalee lafa mana jireenyaa Gurmaa’aniif qaama seerummaa kennuu fi haquu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waliigaltee kiraa mana mootummaa raawwachu', // TODO: translate
            am: 'Waliigaltee kiraa mana mootummaa raawwachu', // TODO: translate
            or: 'Waliigaltee kiraa mana mootummaa raawwachu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waliigaltee kireessaafi kireeffataa mirkaneessuu(Mana dhuunfaa)', // TODO: translate
            am: 'Waliigaltee kireessaafi kireeffataa mirkaneessuu(Mana dhuunfaa)', // TODO: translate
            or: 'Waliigaltee kireessaafi kireeffataa mirkaneessuu(Mana dhuunfaa)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Walii galtee gamoo Waliinii raawwachuu fi qaama 3ffaatti dabarsuu', // TODO: translate
            am: 'Walii galtee gamoo Waliinii raawwachuu fi qaama 3ffaatti dabarsuu', // TODO: translate
            or: 'Walii galtee gamoo Waliinii raawwachuu fi qaama 3ffaatti dabarsuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama suphaa mana mootummaa kennuu', // TODO: translate
            am: 'Hayyama suphaa mana mootummaa kennuu', // TODO: translate
            or: 'Hayyama suphaa mana mootummaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Kaffaltii kiraa mana mootummaa fi dhuunfaa raawwachiisuu', // TODO: translate
            am: 'Kaffaltii kiraa mana mootummaa fi dhuunfaa raawwachiisuu', // TODO: translate
            or: 'Kaffaltii kiraa mana mootummaa fi dhuunfaa raawwachiisuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Abba Alangaa', // TODO: translate to English
        am: 'Abba Alangaa', // TODO: translate to Amharic
        or: 'Abba Alangaa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Barreefama hundeefamaa daldala dhuunfaa itti gaafatmamuummaa isaa murtaa’e Plc ( Private Limited Company )', // TODO: translate
            am: 'Barreefama hundeefamaa daldala dhuunfaa itti gaafatmamuummaa isaa murtaa’e Plc ( Private Limited Company )', // TODO: translate
            or: 'Barreefama hundeefamaa daldala dhuunfaa itti gaafatmamuummaa isaa murtaa’e Plc ( Private Limited Company )',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeesssa Waldaalee IMX SME(Small and Micro Enterprise )', // TODO: translate
            am: 'Galmeesssa Waldaalee IMX SME(Small and Micro Enterprise )', // TODO: translate
            or: 'Galmeesssa Waldaalee IMX SME(Small and Micro Enterprise )',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ragaalee waldaalee galmeessuu fi mirkaneessu', // TODO: translate
            am: 'Ragaalee waldaalee galmeessuu fi mirkaneessu', // TODO: translate
            or: 'Ragaalee waldaalee galmeessuu fi mirkaneessu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Walii galtee galmeessuu fi mirkaneessuu(Walii galtee gurgurtaa fi kenna , waliigaltee kiraa maashinoota addaa addaa', // TODO: translate
            am: 'Walii galtee galmeessuu fi mirkaneessuu(Walii galtee gurgurtaa fi kenna , waliigaltee kiraa maashinoota addaa addaa', // TODO: translate
            or: 'Walii galtee galmeessuu fi mirkaneessuu(Walii galtee gurgurtaa fi kenna , waliigaltee kiraa maashinoota addaa addaa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeessa waliigaltee Liqii Loan Agreement', // TODO: translate
            am: 'Galmeessa waliigaltee Liqii Loan Agreement', // TODO: translate
            or: 'Galmeessa waliigaltee Liqii Loan Agreement',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Mirkaneessa hiikaa afaanii/turjumaanaa kennuu', // TODO: translate
            am: 'Mirkaneessa hiikaa afaanii/turjumaanaa kennuu', // TODO: translate
            or: 'Mirkaneessa hiikaa afaanii/turjumaanaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Bakka bu’ummaa galmeessuuu fi kennuu (Special Power of Agency)', // TODO: translate
            am: 'Bakka bu’ummaa galmeessuuu fi kennuu (Special Power of Agency)', // TODO: translate
            or: 'Bakka bu’ummaa galmeessuuu fi kennuu (Special Power of Agency)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'sassabbii galii Abba Alangaa', // TODO: translate
            am: 'sassabbii galii Abba Alangaa', // TODO: translate
            or: 'sassabbii galii Abba Alangaa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Abbaa Tayitaa Egumsa nannoo', // TODO: translate to English
        am: 'Abbaa Tayitaa Egumsa nannoo', // TODO: translate to Amharic
        or: 'Abbaa Tayitaa Egumsa nannoo',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Mirkaneessa Qorannoo haalaa dhiibbaa Naannoo', // TODO: translate
            am: 'Mirkaneessa Qorannoo haalaa dhiibbaa Naannoo', // TODO: translate
            or: 'Mirkaneessa Qorannoo haalaa dhiibbaa Naannoo',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'TOR Qorannoo Eegumsa Nannoo Mirkaneessuu', // TODO: translate
            am: 'TOR Qorannoo Eegumsa Nannoo Mirkaneessuu', // TODO: translate
            or: 'TOR Qorannoo Eegumsa Nannoo Mirkaneessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Odiitii dhiibbaa Naannoo gaggeessuu', // TODO: translate
            am: 'Odiitii dhiibbaa Naannoo gaggeessuu', // TODO: translate
            or: 'Odiitii dhiibbaa Naannoo gaggeessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Lafa', // TODO: translate to English
        am: 'Lafa', // TODO: translate to Amharic
        or: 'Lafa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu', // TODO: translate
            am: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu', // TODO: translate
            or: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeessaa fi Kenna Kaartaa qabbiyyee', // TODO: translate
            am: 'Galmeessaa fi Kenna Kaartaa qabbiyyee', // TODO: translate
            or: 'Galmeessaa fi Kenna Kaartaa qabbiyyee',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu', // TODO: translate
            am: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu', // TODO: translate
            or: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Wabummaa Kuusan walqabsiisuu/Registration of supportive letter', // TODO: translate
            am: 'Wabummaa Kuusan walqabsiisuu/Registration of supportive letter', // TODO: translate
            or: 'Wabummaa Kuusan walqabsiisuu/Registration of supportive letter',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijjiirraa maqaa raawwachuu (Bittaa fi Gurgurtaa, Kenna, Dhaaltummaa, Ajaja M/Murtii (Transfer of private property to another private party(for change name)', // TODO: translate
            am: 'Jijjiirraa maqaa raawwachuu (Bittaa fi Gurgurtaa, Kenna, Dhaaltummaa, Ajaja M/Murtii (Transfer of private property to another private party(for change name)', // TODO: translate
            or: 'Jijjiirraa maqaa raawwachuu (Bittaa fi Gurgurtaa, Kenna, Dhaaltummaa, Ajaja M/Murtii (Transfer of private property to another private party(for change name)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Dhorka Mana Murtii Haquu / Cancelation of Court Injunction', // TODO: translate
            am: 'Dhorka Mana Murtii Haquu / Cancelation of Court Injunction', // TODO: translate
            or: 'Dhorka Mana Murtii Haquu / Cancelation of Court Injunction',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qabiyyee walitti makuu/Merge Parcel', // TODO: translate
            am: 'Qabiyyee walitti makuu/Merge Parcel', // TODO: translate
            or: 'Qabiyyee walitti makuu/Merge Parcel',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qabiyyee Adda Quuduu/Parcel Split', // TODO: translate
            am: 'Qabiyyee Adda Quuduu/Parcel Split', // TODO: translate
            or: 'Qabiyyee Adda Quuduu/Parcel Split',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Walii galtee Liizii Galmeessuu/Registration of lease agreement', // TODO: translate
            am: 'Walii galtee Liizii Galmeessuu/Registration of lease agreement', // TODO: translate
            or: 'Walii galtee Liizii Galmeessuu/Registration of lease agreement',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Sirreeffama Qabiyyee sirreessuu', // TODO: translate
            am: 'Sirreeffama Qabiyyee sirreessuu', // TODO: translate
            or: 'Sirreeffama Qabiyyee sirreessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Tilmaama Qabiyyee Raawwachuu', // TODO: translate
            am: 'Tilmaama Qabiyyee Raawwachuu', // TODO: translate
            or: 'Tilmaama Qabiyyee Raawwachuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Sanada bade bakka buusuu fi Tajaajila seera qabeessumma qabiyyee mirkaneessuu', // TODO: translate
            am: 'Sanada bade bakka buusuu fi Tajaajila seera qabeessumma qabiyyee mirkaneessuu', // TODO: translate
            or: 'Sanada bade bakka buusuu fi Tajaajila seera qabeessumma qabiyyee mirkaneessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Gaaffii lafaa simachuu(Registration of Request for land )', // TODO: translate
            am: 'Gaaffii lafaa simachuu(Registration of Request for land )', // TODO: translate
            or: 'Gaaffii lafaa simachuu(Registration of Request for land )',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijiiirraa itti fayyadama lafaa (Change Land use) (Jijjiirraa zoning)', // TODO: translate
            am: 'Jijiiirraa itti fayyadama lafaa (Change Land use) (Jijjiirraa zoning)', // TODO: translate
            or: 'Jijiiirraa itti fayyadama lafaa (Change Land use) (Jijjiirraa zoning)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii', // TODO: translate
            am: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii', // TODO: translate
            or: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeeessa fi Waraqaa Ragaa Kennuu Manneen Waliinii fi Qusannoo', // TODO: translate
            am: 'Galmeeessa fi Waraqaa Ragaa Kennuu Manneen Waliinii fi Qusannoo', // TODO: translate
            or: 'Galmeeessa fi Waraqaa Ragaa Kennuu Manneen Waliinii fi Qusannoo',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Kaadastara', // TODO: translate to English
        am: 'Kaadastara', // TODO: translate to Amharic
        or: 'Kaadastara',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Jijjirraa maqaa Raawwachuu (Transfer of private prperty to another party)for Change Name )', // TODO: translate
            am: 'Jijjirraa maqaa Raawwachuu (Transfer of private prperty to another party)for Change Name )', // TODO: translate
            or: 'Jijjirraa maqaa Raawwachuu (Transfer of private prperty to another party)for Change Name )',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu', // TODO: translate
            am: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu', // TODO: translate
            or: 'Qulqulleessa Sanadaa fi Waraqaa Ragaa Qulqullinaa Kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Bakka Bu\'ummaa kuusaan walqabsiisuu/ Registration of representative document', // TODO: translate
            am: 'Bakka Bu\'ummaa kuusaan walqabsiisuu/ Registration of representative document', // TODO: translate
            or: 'Bakka Bu\'ummaa kuusaan walqabsiisuu/ Registration of representative document',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Wabummaa Kuusan walqabsiisuu/Registration of supportive letter', // TODO: translate
            am: 'Wabummaa Kuusan walqabsiisuu/Registration of supportive letter', // TODO: translate
            or: 'Wabummaa Kuusan walqabsiisuu/Registration of supportive letter',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeessaa fi Kenna Kaartaa Dijitaalaa', // TODO: translate
            am: 'Galmeessaa fi Kenna Kaartaa Dijitaalaa', // TODO: translate
            or: 'Galmeessaa fi Kenna Kaartaa Dijitaalaa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qabiyyee walitti makuu/Merge Parcel', // TODO: translate
            am: 'Qabiyyee walitti makuu/Merge Parcel', // TODO: translate
            or: 'Qabiyyee walitti makuu/Merge Parcel',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Qabiyyee Adda Qooduu/Parcel Split', // TODO: translate
            am: 'Qabiyyee Adda Qooduu/Parcel Split', // TODO: translate
            or: 'Qabiyyee Adda Qooduu/Parcel Split',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: '. Walii galtee Liizii Haaromsuu/Registration of lease agreement Renovation)', // TODO: translate
            am: '. Walii galtee Liizii Haaromsuu/Registration of lease agreement Renovation)', // TODO: translate
            or: '. Walii galtee Liizii Haaromsuu/Registration of lease agreement Renovation)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Galmeessa Ragaa Dhorkuu, Fooyyessuu fi Kaasuu', // TODO: translate
            am: 'Galmeessa Ragaa Dhorkuu, Fooyyessuu fi Kaasuu', // TODO: translate
            or: 'Galmeessa Ragaa Dhorkuu, Fooyyessuu fi Kaasuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijiiirraa itti fayyadama lafaa (Change Land use ) (Jijjiirraa zoning)', // TODO: translate
            am: 'Jijiiirraa itti fayyadama lafaa (Change Land use ) (Jijjiirraa zoning)', // TODO: translate
            or: 'Jijiiirraa itti fayyadama lafaa (Change Land use ) (Jijjiirraa zoning)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii', // TODO: translate
            am: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii', // TODO: translate
            or: 'Jijjirraa Itti Fayyadama Lafaa fi Gosa Pirojektii',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu', // TODO: translate
            am: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu', // TODO: translate
            or: 'Komii Waldiddaa Lafaa Simachuu fi Hiikuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Galii', // TODO: translate to English
        am: 'Galii', // TODO: translate to Amharic
        or: 'Galii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Lakkoosfa kaffalaa Gibiraa(TIN)', // TODO: translate
            am: 'Lakkoosfa kaffalaa Gibiraa(TIN)', // TODO: translate
            or: 'Lakkoosfa kaffalaa Gibiraa(TIN)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Sassabbii galii Idilee', // TODO: translate
            am: 'Sassabbii galii Idilee', // TODO: translate
            or: 'Sassabbii galii Idilee',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Sassaabbii galii M/Qopheessaa', // TODO: translate
            am: 'Sassaabbii galii M/Qopheessaa', // TODO: translate
            or: 'Sassaabbii galii M/Qopheessaa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Murtii Gibiraa, kaffaltii VAT,TOT fi withholding galmeessuu', // TODO: translate
            am: 'Murtii Gibiraa, kaffaltii VAT,TOT fi withholding galmeessuu', // TODO: translate
            or: 'Murtii Gibiraa, kaffaltii VAT,TOT fi withholding galmeessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Deggersa maxxansa nagahee kafalaa gibiraa kennuu', // TODO: translate
            am: 'Deggersa maxxansa nagahee kafalaa gibiraa kennuu', // TODO: translate
            or: 'Deggersa maxxansa nagahee kafalaa gibiraa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Cost shareing clearance', // TODO: translate
            am: 'Cost shareing clearance', // TODO: translate
            or: 'Cost shareing clearance',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waraqaaa qulqullina idaa irraa bilisa ta’u ibsu', // TODO: translate
            am: 'Waraqaaa qulqullina idaa irraa bilisa ta’u ibsu', // TODO: translate
            or: 'Waraqaaa qulqullina idaa irraa bilisa ta’u ibsu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Gabaasa ooditii /Audit Report/', // TODO: translate
            am: 'Gabaasa ooditii /Audit Report/', // TODO: translate
            or: 'Gabaasa ooditii /Audit Report/',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Herrega galii', // TODO: translate
            am: 'Herrega galii', // TODO: translate
            or: 'Herrega galii',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Buusaa Gonnofaa', // TODO: translate to English
        am: 'Buusaa Gonnofaa', // TODO: translate to Amharic
        or: 'Buusaa Gonnofaa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Gumaataa fi galii buusaa gonofaa sassaabuu', // TODO: translate
            am: 'Gumaataa fi galii buusaa gonofaa sassaabuu', // TODO: translate
            or: 'Gumaataa fi galii buusaa gonofaa sassaabuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Maallaqa', // TODO: translate to English
        am: 'Maallaqa', // TODO: translate to Amharic
        or: 'Maallaqa',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Ogeessa Kanfaltii beenyaa(nama 2 ) barbaachiisa', // TODO: translate
            am: 'Ogeessa Kanfaltii beenyaa(nama 2 ) barbaachiisa', // TODO: translate
            or: 'Ogeessa Kanfaltii beenyaa(nama 2 ) barbaachiisa',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ogeessa kanfaltii projeektii (nama 2)', // TODO: translate
            am: 'Ogeessa kanfaltii projeektii (nama 2)', // TODO: translate
            or: 'Ogeessa kanfaltii projeektii (nama 2)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ogeessa liqii kafaamtoota misoomaa (nama 1)', // TODO: translate
            am: 'Ogeessa liqii kafaamtoota misoomaa (nama 1)', // TODO: translate
            or: 'Ogeessa liqii kafaamtoota misoomaa (nama 1)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ogeessa Kanfaltii tajaajila addaa addaa (nama 2)', // TODO: translate
            am: 'Ogeessa Kanfaltii tajaajila addaa addaa (nama 2)', // TODO: translate
            or: 'Ogeessa Kanfaltii tajaajila addaa addaa (nama 2)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Ogeessa bittaa fi tajaajilaa (nama 2)', // TODO: translate
            am: 'Ogeessa bittaa fi tajaajilaa (nama 2)', // TODO: translate
            or: 'Ogeessa bittaa fi tajaajilaa (nama 2)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Adaa fi Turizimii', // TODO: translate to English
        am: 'Adaa fi Turizimii', // TODO: translate to Amharic
        or: 'Adaa fi Turizimii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Hayyama gahumsa ogummaa dhaabilee aadaa kennuu, haaromsuu, haquu', // TODO: translate
            am: 'Hayyama gahumsa ogummaa dhaabilee aadaa kennuu, haaromsuu, haquu', // TODO: translate
            or: 'Hayyama gahumsa ogummaa dhaabilee aadaa kennuu, haaromsuu, haquu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Poolisii', // TODO: translate to English
        am: 'Poolisii', // TODO: translate to Amharic
        or: 'Poolisii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Xalayaa deeggarsa adda addaa kennuu', // TODO: translate
            am: 'Xalayaa deeggarsa adda addaa kennuu', // TODO: translate
            or: 'Xalayaa deeggarsa adda addaa kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
    {
      name: {
        en: 'Inveestimantii', // TODO: translate to English
        am: 'Inveestimantii', // TODO: translate to Amharic
        or: 'Inveestimantii',
      },
      description: {
        en: '', // TODO: add English description
        am: '', // TODO: add Amharic description
        or: '',
      },
      logoUrl: '',
      services: [
        {
          name: {
            en: 'Simannaa Piroojektoota invastimantii', // TODO: translate
            am: 'Simannaa Piroojektoota invastimantii', // TODO: translate
            or: 'Simannaa Piroojektoota invastimantii',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Hayyama invastimantii kennuu(Haaraa, Haaromsu,Bakka Buusuu)', // TODO: translate
            am: 'Hayyama invastimantii kennuu(Haaraa, Haaromsu,Bakka Buusuu)', // TODO: translate
            or: 'Hayyama invastimantii kennuu(Haaraa, Haaromsu,Bakka Buusuu)',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Waliigaltee piroojektii investimantii Haaraa Mallatteessuu', // TODO: translate
            am: 'Waliigaltee piroojektii investimantii Haaraa Mallatteessuu', // TODO: translate
            or: 'Waliigaltee piroojektii investimantii Haaraa Mallatteessuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Tajaajila Hayyama Jajjabeessituu Invastimantii Kennuu', // TODO: translate
            am: 'Tajaajila Hayyama Jajjabeessituu Invastimantii Kennuu', // TODO: translate
            or: 'Tajaajila Hayyama Jajjabeessituu Invastimantii Kennuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'piroojjektii investimantii adda addaa kanaan dura heyyama investimantii fudhatanii babal’insa / Expansion / akka taasifamuuf/dabalamuuf/gaafataniif', // TODO: translate
            am: 'piroojjektii investimantii adda addaa kanaan dura heyyama investimantii fudhatanii babal’insa / Expansion / akka taasifamuuf/dabalamuuf/gaafataniif', // TODO: translate
            or: 'piroojjektii investimantii adda addaa kanaan dura heyyama investimantii fudhatanii babal’insa / Expansion / akka taasifamuuf/dabalamuuf/gaafataniif',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
        {
          name: {
            en: 'Jijjiirraa gosaa Piroojektii investimantii eyyamamuu', // TODO: translate
            am: 'Jijjiirraa gosaa Piroojektii investimantii eyyamamuu', // TODO: translate
            or: 'Jijjiirraa gosaa Piroojektii investimantii eyyamamuu',
          },
          description: { en: '', am: '', or: '' },
          requiredDocuments: [],
          fee: 0,
          processingTime: '',
          workingHours: 'Mon-Fri, 8:30 AM - 5:00 PM',
          contactPhone: '',
        },
      ],
    },
  ];

  // Only seed if the database is currently empty.
  // This avoids wiping real data (windows, requests, admin edits, etc.)
  // every time the server restarts.
  const existingCount = await Organization.countDocuments();
  if (existingCount > 0) {
    console.log('Seed skipped: organizations already exist in the database.');
    return;
  }

  for (const org of orgs) {
    const createdOrg = await Organization.create({
      name: org.name,
      description: org.description,
      logoUrl: org.logoUrl,
    });

    const servicesToCreate = org.services.map((s) => ({
      ...s,
      organization: createdOrg._id,
    }));

    if (servicesToCreate.length) {
      await Service.insertMany(servicesToCreate);
    }
  }

  console.log(`Seed completed: inserted ${orgs.length} organizations and related services.`);
};

const runSeed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment');
  }

  await mongoose.connect(process.env.MONGO_URI);
  await seedOrganizations();
  await mongoose.connection.close();
};

module.exports = { runSeed, seedOrganizations };

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}