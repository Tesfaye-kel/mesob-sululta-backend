const test = require('node:test');
const assert = require('node:assert/strict');
const Service = require('../models/Service');
const Requirement = require('../models/Requirement');
const {
  applyChange,
  normalizeServiceRequirements,
  buildServiceRequirementRecords,
  buildWorkbookServiceAssignments,
  validateInitialWindowPairs,
} = require('../controllers/registrarSetupController');

test('service creation adds no generated requirements unless explicitly requested', async () => {
  const original = {
    serviceExists: Service.exists,
    serviceCreate: Service.create,
    requirementInsertMany: Requirement.insertMany,
  };
  const insertedRequirements = [];
  try {
    Service.exists = async () => false;
    Service.create = async (data) => ({ _id: '507f1f77bcf86cd799439011', ...data });
    Requirement.insertMany = async (records) => { insertedRequirements.push(...records); };

    await applyChange({
      entityType: 'service',
      action: 'create',
      after: {
        name: { en: 'Example service', am: 'Example service', or: 'Example service' },
        organization: '507f1f77bcf86cd799439012',
        requirements: [],
      },
      generateDefaultRequirements: false,
    });

    assert.deepEqual(insertedRequirements, []);
  } finally {
    Service.exists = original.serviceExists;
    Service.create = original.serviceCreate;
    Requirement.insertMany = original.requirementInsertMany;
  }
});

test('service creation generates suggested requirements only after explicit confirmation', async () => {
  const original = {
    serviceExists: Service.exists,
    serviceCreate: Service.create,
    requirementInsertMany: Requirement.insertMany,
  };
  let insertedRequirements = [];
  try {
    Service.exists = async () => false;
    Service.create = async (data) => ({ _id: '507f1f77bcf86cd799439011', ...data });
    Requirement.insertMany = async (records) => { insertedRequirements = records; };

    await applyChange({
      entityType: 'service',
      action: 'create',
      after: {
        name: { en: 'Example service', am: 'Example service', or: 'Example service' },
        organization: '507f1f77bcf86cd799439012',
        requirements: [],
      },
      generateDefaultRequirements: true,
    });

    assert.ok(insertedRequirements.length > 0);
    assert.ok(insertedRequirements.every((record) => record.service === '507f1f77bcf86cd799439011'));
  } finally {
    Service.exists = original.serviceExists;
    Service.create = original.serviceCreate;
    Requirement.insertMany = original.requirementInsertMany;
  }
});

test('registrar service requirements require all three languages', () => {
  assert.throws(
    () => normalizeServiceRequirements([{ requirementText: { en: 'National ID', am: '', or: 'ID' } }]),
    { status: 400, message: /English, Amharic, and Afaan Oromo/ }
  );
});

test('registrar service requirements are appended after generated defaults', () => {
  const serviceId = '507f1f77bcf86cd799439011';
  const defaults = [
    { requirementText: { en: 'Generated default' }, sequenceNo: 0, isMandatory: true },
  ];
  const submitted = normalizeServiceRequirements([
    {
      requirementText: { en: 'Custom requirement', am: 'Amharic requirement', or: 'Oromo requirement' },
      notes: { en: 'Bring original', am: '', or: '' },
      isMandatory: false,
    },
  ]);

  const records = buildServiceRequirementRecords(serviceId, defaults, submitted);

  assert.equal(records.length, 2);
  assert.equal(String(records[0].service), serviceId);
  assert.equal(records[0].sequenceNo, 0);
  assert.equal(String(records[1].service), serviceId);
  assert.equal(records[1].sequenceNo, 1);
  assert.equal(records[1].requirementText.en, 'Custom requirement');
  assert.equal(records[1].isMandatory, false);
});

test('workbook service categories map services to their matching offices', () => {
  const offices = [
    { _id: '507f1f77bcf86cd799439011', name: { en: 'Civil Office', am: '', or: '' } },
    { _id: '507f1f77bcf86cd799439012', name: { en: 'Water Office', am: '', or: '' } },
  ];
  const services = [
    { _id: '507f1f77bcf86cd799439021', name: { en: 'Civil Document Registration', am: '', or: '' } },
    { _id: '507f1f77bcf86cd799439022', name: { en: 'New Water Customer Service', am: '', or: '' } },
  ];
  const result = buildWorkbookServiceAssignments([
    ['', 'Mana Hojii', 'Tajaajila'],
    ['', 'Civil Office', '1. Civil Document Registration'],
    ['', 'Water Office', 'New Water Customer Service'],
  ], offices, services);

  assert.deepEqual(result.assignments.map((item) => [String(item.serviceId), String(item.organizationId)]), [
    [services[0]._id, offices[0]._id],
    [services[1]._id, offices[1]._id],
  ]);
  assert.deepEqual(result.unmatched, []);
});

test('workbook service matching prefers a service already assigned to the mapped office', () => {
  const offices = [
    { _id: '507f1f77bcf86cd799439011', name: { en: 'Civil Office' } },
    { _id: '507f1f77bcf86cd799439012', name: { en: 'Water Office' } },
  ];
  const services = [
    { _id: '507f1f77bcf86cd799439021', organization: offices[0]._id, name: { en: 'Registration Service' } },
    { _id: '507f1f77bcf86cd799439022', organization: offices[1]._id, name: { en: 'Registration Service' } },
  ];
  const result = buildWorkbookServiceAssignments([
    ['', 'Mana Hojii', 'Tajaajila'],
    ['', 'Water Office', 'Registration Service'],
  ], offices, services);

  assert.deepEqual(result.assignments.map((item) => String(item.serviceId)), [services[1]._id]);
  assert.deepEqual(result.unmatched, []);
});

test('initial window assignment requires every office exactly once in pairs', () => {
  const offices = [{ _id: '507f1f77bcf86cd799439011' }, { _id: '507f1f77bcf86cd799439012' }];
  assert.deepEqual(
    validateInitialWindowPairs([{ floorNumber: 1, windowNumber: 1, officeIds: offices.map((office) => office._id) }], offices),
    { 1: 1 }
  );
});

test('initial window numbers may repeat across floors but not within a floor', () => {
  const offices = Array.from({ length: 4 }, (_, index) => ({
    _id: `507f1f77bcf86cd79943901${index + 1}`,
  }));
  assert.deepEqual(
    validateInitialWindowPairs([
      { floorNumber: 1, windowNumber: 1, officeIds: offices.slice(0, 2).map((office) => office._id) },
      { floorNumber: 2, windowNumber: 1, officeIds: offices.slice(2).map((office) => office._id) },
    ], offices),
    { 1: 1, 2: 1 }
  );
  assert.throws(
    () => validateInitialWindowPairs([
      { floorNumber: 1, windowNumber: 1, officeIds: offices.slice(0, 2).map((office) => office._id) },
      { floorNumber: 1, windowNumber: 1, officeIds: offices.slice(2).map((office) => office._id) },
    ], offices),
    { status: 400, message: /unique within each floor/ }
  );
});

test('initial window assignment rejects duplicate offices and invalid floors', () => {
  const offices = [{ _id: '507f1f77bcf86cd799439011' }, { _id: '507f1f77bcf86cd799439012' }];
  assert.throws(
    () => validateInitialWindowPairs([{ floorNumber: 1, windowNumber: 1, officeIds: [offices[0]._id, offices[0]._id] }], offices),
    { status: 400, message: /two different existing offices/ }
  );
  assert.throws(
    () => validateInitialWindowPairs([{ floorNumber: 4, windowNumber: 1, officeIds: offices.map((office) => office._id) }], offices),
    { status: 400, message: /floor from 1 to 3/ }
  );
});

test('initial window assignment rejects odd office counts and incomplete pairs', () => {
  const offices = [
    { _id: '507f1f77bcf86cd799439011' },
    { _id: '507f1f77bcf86cd799439012' },
    { _id: '507f1f77bcf86cd799439013' },
  ];
  assert.throws(
    () => validateInitialWindowPairs([{ floorNumber: 1, windowNumber: 1, officeIds: offices.slice(0, 2).map((office) => office._id) }], offices),
    { status: 400, message: /even number/ }
  );
});
