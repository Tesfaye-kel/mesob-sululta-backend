const mongoose = require('mongoose');

const Organization = require('./models/Organization');
const Service = require('./models/Service');

const seedOrganizations = async () => {
  const orgs = [
    {
      name: {
        en: 'National ID Ethiopia',
        am: 'የብሄራዊ መታወቂያ ኤትዮጵያ',
        or: 'Naatiraawaa ID Itoophiyaa',
      },
      description: {
        en: 'Issue, replacement and verification services related to Ethiopia’s National ID.',
        am: 'በኢትዮጵያ ብሄራዊ መታወቂያ ተዛማጅ አገልግሎቶችን ማቅረብ፣ መተካት እና ማረጋገጥ።',
        or: 'Tajaajiloota Mootummaan ID Biyyaalessaa irratti hunda keessatti tajaajilu, bakka bu’uu fi mirkaneessuu.',
      },
      logoUrl: 'https://example.com/logos/national-id-ethiopia.png',
      services: [
        {
          name: {
            en: 'National ID New Registration',
            am: 'አዲስ የብሄራዊ መታወቂያ ምዝገባ',
            or: 'Galmee haaraa ID Biyyaalessaa',
          },
          description: {
            en: 'Register for a National ID for individuals who have no existing record.',
            am: 'ለብቻቸው ምዝገባ መዝገብ የሌላቸው ግለሰቦች አዲስ ምዝገባ።',
            or: 'Namoota galmee duraan hin qabneef ID Biyyaalessaa galmeessuu.',
          },
          requiredDocuments: [
            'Original birth certificate',
            'Proof of residence (kebele/house registry)',
            'Valid contact phone number',
            '2 recent passport photos',
          ],
          fee: 50,
          processingTime: '7-10 business days',
          workingHours: 'Mon-Sat, 8:00 AM - 5:00 PM',
          contactPhone: '+251700000001',
        },
        {
          name: {
            en: 'National ID Replacement',
            am: 'የብሄራዊ መታወቂያ መተካት',
            or: 'Bakka bu’iinsa ID Biyyaalessaa',
          },
          description: {
            en: 'Replace a lost or damaged National ID card.',
            am: 'የጠፋ ወይም የተበላሸ መታወቂያ ካርድ መተካት።',
            or: 'ID Biyyaalessaa dhabame ykn miidhamе bakka bu’uu.',
          },
          requiredDocuments: [
            'Police report (loss/theft)',
            'Original damaged card (if available)',
            'Proof of identity (any official document)',
            '2 recent passport photos',
          ],
          fee: 100,
          processingTime: '10-15 business days',
          workingHours: 'Mon-Sat, 8:00 AM - 5:00 PM',
          contactPhone: '+251700000002',
        },
        {
          name: {
            en: 'National ID Verification',
            am: 'የብሄራዊ መታወቂያ ማረጋገጥ',
            or: 'Mirkaneessuu ID Biyyaalessaa',
          },
          description: {
            en: 'Verify the authenticity of a National ID using reference checks.',
            am: 'የብሄራዊ መታወቂያ እውነተኛነት በሪፈረንስ ማጣራት።',
            or: 'Dhugaa ta’uu ID Biyyaalessaa mirkaneessuu.',
          },
          requiredDocuments: [
            'National ID number',
            'Copy of ID card (for applicant)',
            'Request letter (for institutions)',
          ],
          fee: 30,
          processingTime: '1-3 business days',
          workingHours: 'Mon-Fri, 8:30 AM - 4:30 PM',
          contactPhone: '+251700000003',
        },
      ],
    },
    {
      name: {
        en: 'Document Authentication and Registration Service',
        am: 'ሰነድ ማረጋገጥና መመዝገብ አገልግሎት',
        or: 'Tajaajila Mirkaneessuu fi Galmee Dokkumantii',
      },
      description: {
        en: 'Authentication, notarization, and registration of government and civil documents.',
        am: 'የመንግስት እና የሲቪል ሰነዶች ማረጋገጥ፣ መታለም እና መመዝገብ።',
        or: 'Mirkaneessuu fi ifatti barreessuu fi galmee dokkumantii mootummaa fi hawaasaaf.',
      },
      logoUrl: 'https://example.com/logos/document-auth-registration.png',
      services: [
        {
          name: {
            en: 'Document Authentication',
            am: 'የሰነድ ማረጋገጥ',
            or: 'Mirkaneessuu Dokkumantii',
          },
          description: {
            en: 'Authenticate copies or originals of documents for official use.',
            am: 'ለመንግስታዊ አገልግሎት የሚያስፈልጉ ቅጂዎች ወይም ዋና ሰነዶች ማረጋገጥ።',
            or: 'Dokumantii dhugaa ta’uu mirkaneessuu (guutuu/koophiyaa) tajaajila idaa ti.',
          },
          requiredDocuments: [
            'Valid ID (passport/national ID)',
            'Original document (or certified copy)',
            'Application form',
          ],
          fee: 60,
          processingTime: '2-5 business days',
          workingHours: 'Mon-Fri, 8:00 AM - 4:00 PM',
          contactPhone: '+251700000010',
        },
        {
          name: {
            en: 'Notarization and Certification',
            am: 'ማስረጃ ማረጋገጥ (ኖተርያይዜሽን)',
            or: 'Dhimmaa Mirgaahaa fi Barsiisu',
          },
          description: {
            en: 'Certification for affidavits, agreements, and statements.',
            am: 'መሐላ/መግለጫዎች፣ ውልና ስምምነቶች ማረጋገጥ።',
            or: 'Ilaalcha, waliigaltee fi ibsa irratti mirkaneessuu.',
          },
          requiredDocuments: [
            'Signed affidavit/statement',
            'Valid ID',
            'Two witnesses IDs (if required)',
          ],
          fee: 120,
          processingTime: '3-7 business days',
          workingHours: 'Mon-Fri, 8:00 AM - 4:00 PM',
          contactPhone: '+251700000011',
        },
      ],
    },
    {
      name: {
        en: 'Ministry of Revenue',
        am: 'የገቢዎች ሚኒስቴር',
        or: 'Ministirii Dhakaaawaa',
      },
      description: {
        en: 'Tax-related registrations, updates, and taxpayer services.',
        am: 'የግብር ተዛማጅ ምዝገባዎች፣ ዝማኔዎችና ለተጫማሪዎች አገልግሎት።',
        or: 'Galmee gibiraa, haaromsuu fi tajaajila kaffaltii gibiraa.',
      },
      logoUrl: 'https://example.com/logos/ministry-of-revenue.png',
      services: [
        {
          name: {
            en: 'Taxpayer Registration',
            am: 'የግብር አግባብ ምዝገባ',
            or: 'Galmee Kaffaltii Gibiraa',
          },
          description: {
            en: 'Register as a taxpayer and obtain a tax identification number.',
            am: 'እንደ ግብር አግባብ መመዝገብ እና የግብር መለያ ቁጥር ማግኘት።',
            or: 'Akka kaffaltii gibiraaatti galmeessuu fi lakkoofsa addaa gibiraa argachuu.',
          },
          requiredDocuments: [
            'Business registration documents (if applicable)',
            'National ID/Passport copy',
            'Contact phone and address',
            'Completed application form',
          ],
          fee: 75,
          processingTime: '5-8 business days',
          workingHours: 'Mon-Sat, 8:30 AM - 5:00 PM',
          contactPhone: '+251700000020',
        },
        {
          name: {
            en: 'Tax Records Update',
            am: 'የግብር መዝገቦች ዝማኔ',
            or: 'Haalfata Sakatta’uu Gibiraa Haaromfuu',
          },
          description: {
            en: 'Update taxpayer information such as address and contact details.',
            am: 'እንደ አድራሻ እና የግንኙነት መረጃ ያሉ መረጃዎችን ማሻሻል።',
            or: 'Haala ogeessa gibiraa haaromsuu akka tarreefama fi bilbilaa.',
          },
          requiredDocuments: [
            'Tax identification number (TIN)',
            'Proof of address',
            'National ID/Passport copy',
            'Application form',
          ],
          fee: 40,
          processingTime: '2-4 business days',
          workingHours: 'Mon-Fri, 8:00 AM - 4:30 PM',
          contactPhone: '+251700000021',
        },
      ],
    },
    {
      name: {
        en: 'Immigration and Citizenship Service',
        am: 'የፍልሰትና ዜግነት አገልግሎት',
        or: 'Tajaajila Jireenya Barbadaa fi Dhaloota',
      },
      description: {
        en: 'Visa, residence permits, and citizenship-related services.',
        am: 'ቪዛ፣ የመኖሪያ ፈቃድና ዜግነት ተዛማጅ አገልግሎቶች።',
        or: 'Visa, hayyama jiraataa fi tajaajila biyyaa wajjin walqabate.',
      },
      logoUrl: 'https://example.com/logos/immigration-citizenship.png',
      services: [
        {
          name: {
            en: 'Residence Permit Application',
            am: 'የመኖሪያ ፈቃድ ማመልከቻ',
            or: 'Codinsa Hayyama Jiraataa',
          },
          description: {
            en: 'Apply for or renew a residence permit.',
            am: 'የመኖሪያ ፈቃድ ለማግኘት ወይም ለመታደስ ማመልከቻ።',
            or: 'Hayyama jiraataa haaraa gochuu ykn haaromsuu.',
          },
          requiredDocuments: [
            'Valid passport',
            'Entry stamp / immigration record',
            'Proof of address',
            'Medical report (if required)',
          ],
          fee: 200,
          processingTime: '15-25 business days',
          workingHours: 'Mon-Sat, 9:00 AM - 4:00 PM',
          contactPhone: '+251700000030',
        },
        {
          name: {
            en: 'Citizenship Eligibility Check',
            am: 'የዜግነት ብቃት ማጣሪያ',
            or: 'Qorannoo Qabiyyee Naaachiitii',
          },
          description: {
            en: 'Check eligibility for citizenship and receive guidance.',
            am: 'ለዜግነት ብቃት መመርመር እና መመሪያ መቀበል።',
            or: 'Qabiyyee biyyaa mirkaneessuu fi qajeelfama argachuu.',
          },
          requiredDocuments: [
            'National ID/Passport copy',
            'Proof of residence history',
            'Supporting documents',
          ],
          fee: 120,
          processingTime: '7-12 business days',
          workingHours: 'Mon-Fri, 8:00 AM - 4:00 PM',
          contactPhone: '+251700000031',
        },
      ],
    },
  ];

  // Clear existing seed data (keep it simple and predictable)
  await Service.deleteMany({});
  await Organization.deleteMany({});

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

    await Service.insertMany(servicesToCreate);
  }

  console.log(`Seed completed: inserted ${orgs.length} organizations and related services.`);
};

// When imported, consumers can call it. When run directly: connect+seed.
const runSeed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in environment');
  }

  await mongoose.connect(process.env.MONGO_URI);
  await seedOrganizations();
  await mongoose.connection.close();
};

module.exports = { runSeed, seedOrganizations };

// Allow `node seed.js` for manual runs
if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

