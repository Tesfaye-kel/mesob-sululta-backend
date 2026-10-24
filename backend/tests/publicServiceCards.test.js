const test = require('node:test');
const assert = require('node:assert/strict');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Window = require('../models/Window');
const Floor = require('../models/Floor');
const { getAllOrganizations, getServicesByOrganization } = require('../controllers/organizationController');
const { getAllWindowsGroupedByFloor, getServicesByWindow } = require('../controllers/windowController');

function createResponse() {
  return {
    body: null,
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('public office cards count active services and omit inactive offices', async () => {
  const originalAggregate = Organization.aggregate;
  let pipeline;
  Organization.aggregate = async (stages) => {
    pipeline = stages;
    return [];
  };

  try {
    await getAllOrganizations({ query: {} }, createResponse(), (error) => { throw error; });

    assert.deepEqual(pipeline[0].$match, { isActive: { $ne: false } });
    const serviceLookup = pipeline.find((stage) => stage.$lookup)?.$lookup;
    assert.deepEqual(serviceLookup.pipeline, [{ $match: { isActive: { $ne: false } } }]);
  } finally {
    Organization.aggregate = originalAggregate;
  }
});

test('public office service cards exclude services deactivated by managers', async () => {
  const originalFind = Service.find;
  let filter;
  Service.find = (query) => {
    filter = query;
    return {
      populate() { return this; },
      sort() { return Promise.resolve([]); },
    };
  };

  try {
    await getServicesByOrganization({ params: { id: 'office-1' } }, createResponse(), (error) => { throw error; });
    assert.deepEqual(filter, { organization: 'office-1', isActive: { $ne: false } });
  } finally {
    Service.find = originalFind;
  }
});

test('public window cards list active windows and count only active services', async () => {
  const originalWindowAggregate = Window.aggregate;
  const originalFloorFind = Floor.find;
  let pipeline;
  Window.aggregate = async (stages) => {
    pipeline = stages;
    return [];
  };
  Floor.find = () => ({ sort: async () => [] });

  try {
    await getAllWindowsGroupedByFloor({}, createResponse(), (error) => { throw error; });

    assert.deepEqual(pipeline[0].$match, { isActive: { $ne: false } });
    const serviceLookup = pipeline.find((stage) => stage.$lookup)?.$lookup;
    assert.deepEqual(serviceLookup.pipeline, [{ $match: { isActive: { $ne: false } } }]);
  } finally {
    Window.aggregate = originalWindowAggregate;
    Floor.find = originalFloorFind;
  }
});

test('public window service cards exclude services deactivated by managers', async () => {
  const originalFind = Service.find;
  let filter;
  Service.find = (query) => {
    filter = query;
    return {
      populate() { return this; },
      sort() { return Promise.resolve([]); },
    };
  };

  try {
    await getServicesByWindow({ params: { id: 'window-1' } }, createResponse(), (error) => { throw error; });
    assert.deepEqual(filter, { window: 'window-1', isActive: { $ne: false } });
  } finally {
    Service.find = originalFind;
  }
});
