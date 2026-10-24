function normalizeName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const ORGANIZATION_TRANSLATIONS = [
  {
    aliases: ['Galmeessa Siivilii', 'Civil Registration Office'],
    en: 'Civil Registration Office',
    am: 'የሲቪል ምዝገባ ቢሮ',
  },
  {
    aliases: ['Dhaabbata Bishaan dhugaatii', 'Drinking Water Utility'],
    en: 'Drinking Water Utility',
    am: 'የመጠጥ ውሃ አገልግሎት',
  },
  {
    aliases: ['CHUO', 'Cooperatives Office'],
    en: 'Cooperatives Office',
    am: 'የህብረት ሥራ ማህበራት ጽሕፈት ቤት',
  },
  {
    aliases: ['Hawaasummaa', 'Social Affairs Office'],
    en: 'Social Affairs Office',
    am: 'የማህበራዊ ጉዳዮች ቢሮ',
  },
  {
    aliases: ['Daldala', 'Trade Office'],
    en: 'Trade Office',
    am: 'የንግድ ቢሮ',
  },
  {
    aliases: ['Bishaan Albuudaa fi Inarjii', 'Water, Minerals and Energy Office'],
    en: 'Water, Minerals and Energy Office',
    am: 'የውሃ፣ ማዕድንና ኢነርጂ ቢሮ',
  },
  {
    aliases: ['fayyaa', 'Health Office'],
    en: 'Health Office',
    am: 'የጤና ቢሮ',
  },
  {
    aliases: ['W/Bulchiinsaa', 'District Administration Office'],
    en: 'District Administration Office',
    am: 'የወረዳ አስተዳደር ቢሮ',
  },
  {
    aliases: ['PSMQN', 'Civil Service Office'],
    en: 'Civil Service Office',
    am: 'የሲቪል ሰርቪስ ቢሮ',
  },
  {
    aliases: ['Koominikeeshinii', 'Communication Office'],
    en: 'Communication Office',
    am: 'የኮሙኒኬሽን ቢሮ',
  },
  {
    aliases: ['Geejiba', 'Transport Office'],
    en: 'Transport Office',
    am: 'የትራንስፖርት ቢሮ',
  },
  {
    aliases: ['Qonna', 'Agriculture Office'],
    en: 'Agriculture Office',
    am: 'የግብርና ቢሮ',
  },
  {
    aliases: ['M/Qopheessa', 'Urban Development and Planning Office'],
    en: 'Urban Development and Planning Office',
    am: 'የከተማ ልማትና ፕላን ቢሮ',
  },
  {
    aliases: ['Saayinsii Technology', 'Science and Technology Office'],
    en: 'Science and Technology Office',
    am: 'የሳይንስና ቴክኖሎጂ ቢሮ',
  },
  {
    aliases: ['Koonistraakshinii', 'Construction Office'],
    en: 'Construction Office',
    am: 'የግንባታ ቢሮ',
  },
  {
    aliases: ['Barnoota', 'Education Office'],
    en: 'Education Office',
    am: 'የትምህርት ቢሮ',
  },
  {
    aliases: ['D/Manneeni', 'Housing Development Office'],
    en: 'Housing Development Office',
    am: 'የቤቶች ልማት ቢሮ',
  },
  {
    aliases: ['Abba Alangaa', 'Justice Office'],
    en: 'Justice Office',
    am: 'የፍትህ ቢሮ',
  },
  {
    aliases: ['Abbaa Tayitaa Egumsa nannoo', 'Environmental Protection Authority'],
    en: 'Environmental Protection Authority',
    am: 'የአካባቢ ጥበቃ ባለሥልጣን',
  },
  {
    aliases: ['Lafa', 'Land Administration Office'],
    en: 'Land Administration Office',
    am: 'የመሬት አስተዳደር ቢሮ',
  },
  {
    aliases: ['Kaadastara', 'Cadastre Office', 'Cadaster Office', 'Cadastral Office'],
    en: 'Cadastre Office',
    am: 'የካዳስተር ቢሮ',
  },
  {
    aliases: ['Galii', 'Revenue Office'],
    en: 'Revenue Office',
    am: 'የገቢዎች ቢሮ',
  },
  {
    aliases: ['Buusaa Gonnofaa', 'Buusaa Gonofaa', 'Productive Safety Net Fund'],
    en: 'Buusaa Gonofaa Fund',
    am: 'የቡሳ ጎኖፋ ፈንድ',
  },
  {
    aliases: ['Maallaqa', 'Finance Office'],
    en: 'Finance Office',
    am: 'የፋይናንስ ቢሮ',
  },
  {
    aliases: ['Adaa fi Turizimii', 'Culture and Tourism Office'],
    en: 'Culture and Tourism Office',
    am: 'የባህልና ቱሪዝም ቢሮ',
  },
  {
    aliases: ['Poolisii', 'Police Office'],
    en: 'Police Office',
    am: 'የፖሊስ ቢሮ',
  },
  {
    aliases: ['Inveestimantii', 'Investment Office'],
    en: 'Investment Office',
    am: 'የኢንቨስትመንት ቢሮ',
  },
];

const translationByAlias = new Map();
for (const translation of ORGANIZATION_TRANSLATIONS) {
  for (const alias of translation.aliases) {
    translationByAlias.set(normalizeName(alias), translation);
  }
}

function getOrganizationTranslation(name) {
  const candidates = [name?.or, name?.en, name?.am];
  for (const candidate of candidates) {
    const translation = translationByAlias.get(normalizeName(candidate));
    if (translation) return translation;
  }
  return null;
}

function withOrganizationTranslations(name) {
  const translation = getOrganizationTranslation(name);
  return translation
    ? { en: translation.en, am: translation.am, or: name.or || name.en || name.am }
    : name;
}

function isPlaceholderTranslation(value, sourceName) {
  return !String(value || '').trim() ||
    normalizeName(value) === normalizeName(sourceName);
}

module.exports = {
  ORGANIZATION_TRANSLATIONS,
  getOrganizationTranslation,
  withOrganizationTranslations,
  isPlaceholderTranslation,
};
