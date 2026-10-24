const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ORGANIZATION_TRANSLATIONS,
  getOrganizationTranslation,
  withOrganizationTranslations,
  isPlaceholderTranslation,
} = require('../data/organizationTranslations');
const Organization = require('../models/Organization');
const { getAllOrganizations } = require('../controllers/organizationController');

function createResponse() {
  return {
    body: null,
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('all seeded organization names have English and Amharic translations', () => {
  assert.equal(ORGANIZATION_TRANSLATIONS.length, 27);
  for (const translation of ORGANIZATION_TRANSLATIONS) {
    assert.ok(translation.en);
    assert.ok(translation.am);
    assert.ok(translation.aliases.length > 0);
  }
});

test('office translations match source names regardless of capitalization or spacing', () => {
  const translation = getOrganizationTranslation({
    en: 'KAADASTARA',
    am: 'KAADASTARA',
    or: '  Kaadastara ',
  });

  assert.equal(translation.en, 'Cadastre Office');
  assert.equal(translation.am, 'የካዳስተር ቢሮ');
});

test('seed translation preserves the Afaan Oromo office name', () => {
  const translated = withOrganizationTranslations({
    en: 'Buusaa Gonnofaa',
    am: 'Buusaa Gonnofaa',
    or: 'Buusaa Gonnofaa',
  });

  assert.deepEqual(translated, {
    en: 'Buusaa Gonofaa Fund',
    am: 'የቡሳ ጎኖፋ ፈንድ',
    or: 'Buusaa Gonnofaa',
  });
});

test('migration recognizes placeholders without overwriting existing translations', () => {
  assert.equal(isPlaceholderTranslation('Kaadastara', 'Kaadastara'), true);
  assert.equal(isPlaceholderTranslation('', 'Kaadastara'), true);
  assert.equal(isPlaceholderTranslation('Cadastre Office', 'Kaadastara'), false);
});

test('public organization list returns translated office labels without changing Oromo names', async () => {
  const originalAggregate = Organization.aggregate;
  Organization.aggregate = async () => [{
    _id: 'office-1',
    name: { en: 'Kaadastara', am: 'Kaadastara', or: 'Kaadastara' },
    serviceCount: 3,
  }];
  try {
    const response = createResponse();
    await getAllOrganizations({ query: {} }, response, (error) => { throw error; });

    assert.deepEqual(response.body[0].name, {
      en: 'Cadastre Office',
      am: 'የካዳስተር ቢሮ',
      or: 'Kaadastara',
    });
  } finally {
    Organization.aggregate = originalAggregate;
  }
});
