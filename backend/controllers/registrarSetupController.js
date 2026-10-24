const mongoose = require('mongoose');
const path = require('path');
const xlsx = require('xlsx');
const Floor = require('../models/Floor');
const Organization = require('../models/Organization');
const Window = require('../models/Window');
const Service = require('../models/Service');
const Requirement = require('../models/Requirement');
const User = require('../models/User');
const AppointmentBooking = require('../models/AppointmentBooking');
const QueueCheckIn = require('../models/QueueCheckIn');
const ServiceDelivery = require('../models/ServiceDelivery');
const FeedbackRequest = require('../models/FeedbackRequest');
const Receipt = require('../models/Receipt');
const AuditLog = require('../models/AuditLog');
const { getDefaultRequirementsForService } = require('../seedRequirements');

const MODELS = {
  floor: Floor,
  office: Organization,
  window: Window,
  service: Service,
  requirement: Requirement,
};

const FIELDS = {
  floor: ['floorNumber', 'name', 'description', 'isActive'],
  office: ['name', 'description', 'logoUrl', 'displayOrder', 'floorId', 'isActive'],
  window: ['number', 'name', 'floor', 'floorId', 'organization', 'description', 'isActive'],
  service: ['name', 'description', 'organization', 'window', 'requiredDocuments', 'fee', 'processingTime', 'workingHours', 'contactPhone', 'isActive'],
  requirement: ['service', 'requirementText', 'notes', 'isMandatory', 'sequenceNo', 'isActive'],
};

const copyFields = (type, source) => Object.fromEntries(
  FIELDS[type].filter((field) => source[field] !== undefined).map((field) => [field, source[field]])
);

function normalizeFloorPayload(payload) {
  const data = copyFields('floor', payload);
  if (data.floorNumber !== undefined && (!Number.isInteger(Number(data.floorNumber)) || Number(data.floorNumber) < 1 || Number(data.floorNumber) > 3)) {
    throw Object.assign(new Error('Only floors 1, 2, and 3 can be managed in this setup wizard.'), { status: 400 });
  }
  if (data.floorNumber !== undefined) data.floorNumber = Number(data.floorNumber);
  if (data.name) {
    data.name = {
      en: String(data.name.en || '').trim(),
      am: String(data.name.am || '').trim(),
      or: String(data.name.or || data.name.om || '').trim(),
      om: String(data.name.or || data.name.om || '').trim(),
    };
    if (!data.name.en || !data.name.am || !data.name.or) {
      throw Object.assign(new Error('Floor names are required in English, Amharic, and Afaan Oromo.'), { status: 400 });
    }
  }
  if (data.description) {
    data.description = {
      en: String(data.description.en || '').trim(),
      am: String(data.description.am || '').trim(),
      or: String(data.description.or || data.description.om || '').trim(),
      om: String(data.description.or || data.description.om || '').trim(),
    };
  }
  return data;
}

function normalizeLocalized(type, payload, field, required) {
  if (payload[field] === undefined) return;
  const value = payload[field];
  const normalized = {
    en: String(value?.en || '').trim(),
    am: String(value?.am || '').trim(),
    or: String(value?.or || value?.om || '').trim(),
  };
  if (required && (!normalized.en || !normalized.am || !normalized.or)) {
    throw Object.assign(new Error(`${field} must be completed in English, Amharic, and Afaan Oromo.`), { status: 400 });
  }
  payload[field] = normalized;
}

async function normalizePayload(type, rawPayload, action) {
  const payload = type === 'floor'
    ? normalizeFloorPayload(rawPayload)
    : copyFields(type, rawPayload);

  if (['office', 'window', 'service'].includes(type)) {
    normalizeLocalized(type, payload, 'name', action !== 'delete');
    normalizeLocalized(type, payload, 'description', false);
  }
  if (type === 'requirement') {
    normalizeLocalized(type, payload, 'requirementText', action !== 'delete');
    normalizeLocalized(type, payload, 'notes', false);
  }
  if (type === 'floor') {
    if (payload.name) {
      payload.name = { en: payload.name.en, am: payload.name.am, or: payload.name.or, om: payload.name.or };
    }
    if (payload.description) {
      payload.description = { en: payload.description.en, am: payload.description.am, or: payload.description.or, om: payload.description.or };
    }
  }
  if (type === 'office' && payload.floorId) {
    if (!mongoose.isValidObjectId(payload.floorId)) {
      throw Object.assign(new Error('Select a valid floor.'), { status: 400 });
    }
    const floor = await Floor.findById(payload.floorId).select('floorNumber');
    if (!floor || floor.floorNumber < 1 || floor.floorNumber > 3) {
      throw Object.assign(new Error('Select one of floors 1, 2, or 3.'), { status: 400 });
    }
  }
  if (type === 'window') {
    if (payload.number !== undefined) {
      payload.number = Number(payload.number);
      if (!Number.isInteger(payload.number) || payload.number < 1) {
        throw Object.assign(new Error('Window number must be a positive whole number.'), { status: 400 });
      }
    }
    if (payload.organization) {
      const office = await Organization.findById(payload.organization).select('floorId');
      if (!office) throw Object.assign(new Error('Select a valid office.'), { status: 400 });
      if (!office.floorId) throw Object.assign(new Error('Assign the office to a floor before adding windows.'), { status: 400 });
      const floor = await Floor.findById(office.floorId).select('floorNumber');
      if (!floor || floor.floorNumber < 1 || floor.floorNumber > 3) {
        throw Object.assign(new Error('The office is not assigned to a supported floor.'), { status: 400 });
      }
      payload.floorId = floor._id;
      payload.floor = floor.floorNumber;
    }
  }
  if (type === 'service') {
    if (action === 'create' && !payload.organization) {
      throw Object.assign(new Error('Select an office for the service.'), { status: 400 });
    }
    if (payload.organization && !(await Organization.exists({ _id: payload.organization }))) {
      throw Object.assign(new Error('Select a valid office.'), { status: 400 });
    }
    if (payload.window === '') payload.window = null;
    if (payload.window) {
      const window = await Window.findById(payload.window).select('organization assignedOrganizations');
      const assignedOfficeIds = window?.assignedOrganizations?.length
        ? window.assignedOrganizations.map(String)
        : window?.organization ? [String(window.organization)] : [];
      if (!window || !assignedOfficeIds.includes(String(payload.organization))) {
        throw Object.assign(new Error('Select a service window assigned to the chosen office.'), { status: 400 });
      }
    }
    if (payload.fee !== undefined) {
      payload.fee = Number(payload.fee);
      if (!Number.isFinite(payload.fee) || payload.fee < 0) {
        throw Object.assign(new Error('Service fee must be a non-negative number.'), { status: 400 });
      }
    }
    if (payload.requiredDocuments !== undefined) {
      if (!Array.isArray(payload.requiredDocuments) || payload.requiredDocuments.length > 100) {
        throw Object.assign(new Error('Provide no more than 100 required documents.'), { status: 400 });
      }
      payload.requiredDocuments = payload.requiredDocuments
        .map((item) => String(item).trim())
        .filter(Boolean);
      if (payload.requiredDocuments.some((item) => item.length > 240)) {
        throw Object.assign(new Error('Each required document must be 240 characters or fewer.'), { status: 400 });
      }
    }
    for (const field of ['processingTime', 'workingHours', 'contactPhone']) {
      if (payload[field] !== undefined) {
        payload[field] = String(payload[field]).trim();
        if (payload[field].length > 240) {
          throw Object.assign(new Error(`${field} must be 240 characters or fewer.`), { status: 400 });
        }
      }
    }
  }
  if (type === 'requirement' && payload.service && !(await Service.exists({ _id: payload.service }))) {
    throw Object.assign(new Error('Select a valid service.'), { status: 400 });
  }
  return payload;
}

function normalizeServiceRequirements(requirements) {
  if (requirements === undefined) return [];
  if (!Array.isArray(requirements) || requirements.length > 100) {
    throw Object.assign(new Error('Provide no more than 100 service requirements.'), { status: 400 });
  }
  return requirements.map((item, index) => {
    const requirementText = item?.requirementText || {};
    const notes = item?.notes || {};
    const normalized = {
      requirementText: {
        en: String(requirementText.en || '').trim(),
        am: String(requirementText.am || '').trim(),
        or: String(requirementText.or || requirementText.om || '').trim(),
      },
      notes: {
        en: String(notes.en || '').trim(),
        am: String(notes.am || '').trim(),
        or: String(notes.or || notes.om || '').trim(),
      },
      isMandatory: item?.isMandatory !== false,
      sequenceNo: index,
      isActive: true,
    };
    if (Object.values(normalized.requirementText).some((value) => !value)) {
      throw Object.assign(new Error('Each service requirement must be completed in English, Amharic, and Afaan Oromo.'), { status: 400 });
    }
    if (Object.values(normalized.requirementText).some((value) => value.length > 240)) {
      throw Object.assign(new Error('Each service requirement must be 240 characters or fewer.'), { status: 400 });
    }
    if (Object.values(normalized.notes).some((value) => value.length > 1000)) {
      throw Object.assign(new Error('Requirement instructions must be 1000 characters or fewer.'), { status: 400 });
    }
    return normalized;
  });
}

function buildServiceRequirementRecords(serviceId, defaults, submittedRequirements) {
  return [
    ...defaults.map((item) => ({ service: serviceId, ...item })),
    ...submittedRequirements.map((item, index) => ({
      service: serviceId,
      ...item,
      sequenceNo: defaults.length + index,
    })),
  ];
}

function validateInitialWindowPairs(pairs, offices) {
  if (!Array.isArray(pairs) || pairs.length !== Math.ceil(offices.length / 2) || offices.length % 2 !== 0) {
    throw Object.assign(new Error('Create an even number of active offices and assign exactly two offices to each window.'), { status: 400 });
  }
  const officeIds = new Set(offices.map((office) => String(office._id)));
  const assigned = [];
  const floorCounts = new Map();
  const floorWindowNumbers = new Set();
  for (const pair of pairs) {
    const floorNumber = Number(pair?.floorNumber);
    const windowNumber = Number(pair?.windowNumber);
    const ids = pair?.officeIds;
    if (![1, 2, 3].includes(floorNumber) || !Array.isArray(ids) || ids.length !== 2 ||
        !Number.isInteger(windowNumber) || windowNumber < 1 ||
        ids.some((id) => !mongoose.isValidObjectId(id) || !officeIds.has(String(id))) ||
        String(ids[0]) === String(ids[1])) {
      throw Object.assign(new Error('Each window needs a positive whole number, exactly two different existing offices, and a floor from 1 to 3.'), { status: 400 });
    }
    const floorWindowKey = `${floorNumber}:${windowNumber}`;
    if (floorWindowNumbers.has(floorWindowKey)) {
      throw Object.assign(new Error('Window numbers must be unique within each floor.'), { status: 400 });
    }
    floorWindowNumbers.add(floorWindowKey);
    assigned.push(...ids.map(String));
    floorCounts.set(floorNumber, (floorCounts.get(floorNumber) || 0) + 1);
  }
  if (new Set(assigned).size !== offices.length || assigned.length !== offices.length ||
      [...officeIds].some((id) => !assigned.includes(id))) {
    throw Object.assign(new Error('Assign each active office to exactly one window.'), { status: 400 });
  }
  return Object.fromEntries(floorCounts);
}

const normalizeWorkbookValue = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function buildWorkbookServiceAssignments(rows, offices, services) {
  const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeWorkbookValue(cell).includes('mana hojii')));
  if (headerIndex < 0) throw new Error('The office and service mapping header was not found in the workbook.');

  const headers = rows[headerIndex].map(normalizeWorkbookValue);
  const officeIndex = headers.findIndex((header) => header.includes('mana hojii'));
  const serviceIndex = headers.findIndex((header) => header.includes('tajaajila'));
  if (officeIndex < 0 || serviceIndex < 0) throw new Error('The workbook must contain office and service columns.');

  const matchOrganization = (officeName) => {
    const target = normalizeWorkbookValue(officeName);
    let best = null;
    let bestScore = 0;
    let tied = false;
    for (const office of offices) {
      for (const candidate of [office.name?.or, office.name?.en, office.name?.am].map(normalizeWorkbookValue)) {
        if (!candidate || !(candidate === target || target.includes(candidate) || candidate.includes(target))) continue;
        const score = Math.min(candidate.length, target.length);
        if (score > bestScore) {
          best = office;
          bestScore = score;
          tied = false;
        } else if (score === bestScore && best && String(best._id) !== String(office._id)) {
          tied = true;
        }
      }
    }
    return best && !tied ? best : null;
  };

  const matches = new Map();
  const conflictingServiceIds = new Set();
  const unmatched = [];
  let currentOfficeName = '';
  for (const row of rows.slice(headerIndex + 1)) {
    const officeName = String(row[officeIndex] || '').trim();
    const taskName = String(row[serviceIndex] || '').trim().replace(/^\d+\.?\s*/, '');
    if (officeName) currentOfficeName = officeName;
    if (!taskName || /ida.?ama waligalaa/i.test(taskName)) continue;

    const office = matchOrganization(currentOfficeName);
    const task = normalizeWorkbookValue(taskName);
    if (!office || task.length < 3) {
      unmatched.push({ officeName: currentOfficeName, serviceName: taskName });
      continue;
    }

    const candidates = services.flatMap((service) => {
      const names = [service.name?.or, service.name?.en, service.name?.am]
        .map(normalizeWorkbookValue)
        .filter(Boolean);
      const score = names.reduce((best, name) => (
        name === task || name.includes(task) || task.includes(name)
          ? Math.max(best, Math.min(name.length, task.length) + (name === task ? 10000 : 0))
          : best
      ), 0);
      return score ? [{ service, score, assignedToOffice: String(service.organization || '') === String(office._id) }] : [];
    });
    const officeCandidates = candidates.filter((candidate) => candidate.assignedToOffice);
    const eligibleCandidates = officeCandidates.length ? officeCandidates : candidates;
    const maxScore = Math.max(...eligibleCandidates.map((candidate) => candidate.score), 0);
    const best = eligibleCandidates.filter((candidate) => candidate.score === maxScore);
    if (!best.length || best.length !== 1) {
      unmatched.push({ officeName: currentOfficeName, serviceName: taskName });
      continue;
    }

    const serviceId = String(best[0].service._id);
    if (conflictingServiceIds.has(serviceId)) {
      unmatched.push({ officeName: currentOfficeName, serviceName: taskName });
      continue;
    }
    const previous = matches.get(serviceId);
    if (previous && String(previous.organizationId) !== String(office._id)) {
      matches.delete(serviceId);
      conflictingServiceIds.add(serviceId);
      unmatched.push({ officeName: currentOfficeName, serviceName: taskName });
      continue;
    }
    matches.set(serviceId, { serviceId: best[0].service._id, organizationId: office._id });
  }
  return { assignments: [...matches.values()], unmatched };
}

async function getCurrentEntity(type, targetId) {
  if (!targetId || !mongoose.isValidObjectId(targetId)) return null;
  return MODELS[type].findById(targetId).lean();
}

async function getSetupData(req, res, next) {
  try {
    const [floors, offices, windows, services, requirements] = await Promise.all([
      Floor.find({ floorNumber: { $gte: 1, $lte: 3 } }).sort({ floorNumber: 1 }).lean(),
      Organization.find().sort({ displayOrder: 1, 'name.en': 1 }).lean(),
      Window.find().populate('organization', 'name floorId').populate('assignedOrganizations', 'name floorId').sort({ floor: 1, number: 1 }).lean(),
      Service.find().populate('organization', 'name floorId').populate('window', 'number floor').sort({ 'name.en': 1 }).lean(),
      Requirement.find().sort({ service: 1, sequenceNo: 1 }).lean(),
    ]);
    const initialSetupApplied = await Window.exists({ initialSetupWindow: true });
    return res.json({ floors, offices, windows, services, requirements, initialSetupApplied: Boolean(initialSetupApplied) });
  } catch (error) {
    next(error);
  }
}

async function applyInitialWindowAssignments(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      if (await Window.exists({ initialSetupWindow: true }).session(session)) {
        throw Object.assign(new Error('The initial shared-window assignment has already been applied.'), { status: 409 });
      }
      const offices = await Organization.find({ isActive: { $ne: false } })
        .sort({ displayOrder: 1, 'name.en': 1, _id: 1 })
        .session(session)
        .lean();
      const pairs = req.body?.pairs;
      const floorCounts = validateInitialWindowPairs(pairs, offices);
      const [floors, services, existingWindows] = await Promise.all([
        Floor.find({ floorNumber: { $in: Object.keys(floorCounts).map(Number) } }).session(session).lean(),
        Service.find().session(session).lean(),
        Window.find({ isActive: { $ne: false } }).sort({ floor: 1, number: 1, _id: 1 }).session(session),
      ]);
      if (floors.length !== Object.keys(floorCounts).length) {
        throw Object.assign(new Error('Create and approve every floor used in the assignment before applying it.'), { status: 409 });
      }
      const workbookPath = path.resolve(__dirname, '../../excel/Humna Namaa Wirtuu Damee Sulultaa.xlsx');
      const workbook = xlsx.readFile(workbookPath);
      const serviceSheet = workbook.Sheets['Tajaajila Waajjiraa'];
      if (!serviceSheet) throw new Error('The workbook is missing its Tajaajila Waajjiraa office-service mapping sheet.');
      const { assignments: workbookAssignments } = buildWorkbookServiceAssignments(
        xlsx.utils.sheet_to_json(serviceSheet, { header: 1, defval: '' }),
        offices,
        services
      );
      if (workbookAssignments.length) {
        await Service.bulkWrite(workbookAssignments.map((assignment) => ({
          updateOne: {
            filter: { _id: assignment.serviceId },
            update: { $set: { organization: assignment.organizationId } },
          },
        })), { session });
      }
      const unassignedServiceCount = await Service.countDocuments({
        $or: [{ organization: null }, { organization: { $exists: false } }],
      }).session(session);
      if (unassignedServiceCount) {
        throw Object.assign(new Error(
          `${unassignedServiceCount} service(s) could not be matched to an office from the workbook. Assign those services to an office before applying the initial window setup.`
        ), { status: 409 });
      }
      const floorByNumber = new Map(floors.map((floor) => [floor.floorNumber, floor]));
      const maxWindowNumber = existingWindows.reduce((max, item) => Math.max(max, Number(item.number) || 0), 0);
      const requiredCount = pairs.length;
      const windows = existingWindows.slice(0, requiredCount);
      while (windows.length < requiredCount) {
        const number = maxWindowNumber + windows.length - existingWindows.length + 1;
        const created = new Window({
          number,
          name: { en: `Window ${number}`, am: `Window ${number}`, or: `Window ${number}` },
          floor: 1,
          organization: null,
          assignedOrganizations: [],
          initialSetupWindow: true,
        });
        await created.save({ session });
        windows.push(created);
      }

      const officeById = new Map(offices.map((office) => [String(office._id), office]));
      for (let index = 0; index < pairs.length; index += 1) {
        const pair = pairs[index];
        const floor = floorByNumber.get(Number(pair.floorNumber));
        const assignedOffices = pair.officeIds.map((id) => officeById.get(String(id)));
        const window = windows[index];

        await Organization.updateMany(
          { _id: { $in: assignedOffices.map((office) => office._id) } },
          { $set: { floorId: floor._id } },
          { session }
        );
        window.number = Number(pair.windowNumber);
        window.name = {
          en: `Window ${window.number}`,
          am: `Window ${window.number}`,
          or: `Window ${window.number}`,
        };
        window.floor = floor.floorNumber;
        window.floorId = floor._id;
        window.organization = assignedOffices[0]._id;
        window.assignedOrganizations = assignedOffices.map((office) => office._id);
        window.initialSetupWindow = true;
        window.isActive = true;
        await window.save({ session });
        await Service.updateMany(
          { organization: { $in: assignedOffices.map((office) => office._id) } },
          { $set: { window: window._id } },
          { session }
        );
      }

      const log = await AuditLog.create([{
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'APPLY_INITIAL_SHARED_WINDOW_ASSIGNMENTS',
        resourceType: 'Window',
        resourceId: '',
        details: {
          officeCount: offices.length,
          windowCount: pairs.length,
          workbookServiceAssignments: workbookAssignments.length,
          floorCounts,
          officeIds: offices.map((office) => String(office._id)),
        },
        ipAddress: req.ip || '',
      }], { session });
      result = { officeCount: offices.length, windowCount: pairs.length, workbookServiceAssignments: workbookAssignments.length, floorCounts, auditLogId: String(log[0]._id) };
    });
    return res.json({
      message: `Applied office-to-service mappings for ${result.workbookServiceAssignments} services, and shared-window assignments for ${result.officeCount} offices across ${result.windowCount} windows.`,
      ...result,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  } finally {
    await session.endSession();
  }
}

async function reorderServiceRequirements(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { serviceId, requirementId, targetRequirementId } = req.body || {};
    if (![serviceId, requirementId, targetRequirementId].every((id) => mongoose.isValidObjectId(id)) ||
        String(requirementId) === String(targetRequirementId)) {
      return res.status(400).json({ message: 'Choose a service and two different valid requirements.' });
    }
    let updatedIds;
    await session.withTransaction(async () => {
      const requirements = await Requirement.find({
        _id: { $in: [requirementId, targetRequirementId] },
        service: serviceId,
      }).session(session);
      if (requirements.length !== 2) {
        throw Object.assign(new Error('Both requirements must belong to the selected service.'), { status: 404 });
      }
      const requirement = requirements.find((item) => String(item._id) === String(requirementId));
      const target = requirements.find((item) => String(item._id) === String(targetRequirementId));
      const sequenceNo = requirement.sequenceNo;
      requirement.sequenceNo = target.sequenceNo;
      target.sequenceNo = sequenceNo;
      await requirement.save({ session });
      await target.save({ session });
      await AuditLog.create([{
        actorId: req.user.id,
        actorRole: req.user.role,
        action: `${req.user.role === 'registrar' ? 'REGISTRAR' : 'EMPLOYEE'}_REORDER_SERVICE_REQUIREMENTS`,
        resourceType: 'Service',
        resourceId: String(serviceId),
        details: { requirementId: String(requirement._id), targetRequirementId: String(target._id) },
        ipAddress: req.ip || '',
      }], { session });
      updatedIds = [String(requirement._id), String(target._id)];
    });
    return res.json({ message: 'Requirement order updated immediately.', updatedIds });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  } finally {
    await session.endSession();
  }
}

async function submitSetupChange(req, res, next) {
  try {
    const { entityType, action, targetId } = req.body;
    if (!MODELS[entityType] || !['create', 'update', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'Choose a valid setup record and action.' });
    }
    if ((action === 'create' && targetId) || (action !== 'create' && !mongoose.isValidObjectId(targetId))) {
      return res.status(400).json({ message: 'The selected record identifier is invalid.' });
    }

    const before = action === 'create' ? null : await getCurrentEntity(entityType, targetId);
    if (action !== 'create' && !before) return res.status(404).json({ message: 'The selected record no longer exists.' });
    const after = action === 'delete'
      ? null
      : await normalizePayload(entityType, req.body.data || {}, action);
    const generateDefaultRequirements = entityType === 'service' &&
      action === 'create' && req.body.generateDefaultRequirements === true;
    if (entityType === 'service' && action === 'create') {
      after.requirements = normalizeServiceRequirements(req.body.data?.requirements);
    }
    if (action === 'update' && Object.keys(after).length === 0) {
      return res.status(400).json({ message: 'No changes were submitted.' });
    }

    const appliedId = await applyChange({
      entityType,
      action,
      targetId: targetId || null,
      after,
      generateDefaultRequirements,
    });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: `${req.user.role === 'registrar' ? 'REGISTRAR' : 'EMPLOYEE'}_IMMEDIATE_${action.toUpperCase()}_${entityType.toUpperCase()}`,
      resourceType: entityType,
      resourceId: String(appliedId),
      details: { action, entityType, before, ...(generateDefaultRequirements ? { generateDefaultRequirements: true } : {}) },
      ipAddress: req.ip || '',
    });
    return res.status(action === 'create' ? 201 : 200).json({
      message: `${entityType} ${action === 'delete' ? 'deleted' : action === 'create' ? 'created' : 'updated'} immediately.`,
      appliedId,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
}

async function assertNoDependencies(type, id) {
  let dependencies = [];
  if (type === 'floor') {
    dependencies = await Promise.all([
      Organization.countDocuments({ floorId: id }),
      Window.countDocuments({ $or: [{ floorId: id }, { floor: (await Floor.findById(id).select('floorNumber'))?.floorNumber }] }),
      AppointmentBooking.countDocuments({ floorId: id }),
      User.countDocuments({ 'profile.floorId': id }),
    ]);
  } else if (type === 'office') {
    dependencies = await Promise.all([
      Service.countDocuments({ organization: id }),
      Window.countDocuments({ $or: [{ organization: id }, { assignedOrganizations: id }] }),
      AppointmentBooking.countDocuments({ officeId: id }),
      User.countDocuments({ 'profile.officeId': id }),
    ]);
  } else if (type === 'window') {
    dependencies = await Promise.all([
      AppointmentBooking.countDocuments({ windowId: id }),
      QueueCheckIn.countDocuments({ windowId: id }),
      ServiceDelivery.countDocuments({ windowId: id }),
    ]);
  } else if (type === 'service') {
    dependencies = await Promise.all([
      AppointmentBooking.countDocuments({ serviceId: id }),
      FeedbackRequest.countDocuments({ serviceId: id }),
      Receipt.countDocuments({ serviceId: id }),
      QueueCheckIn.countDocuments({ serviceId: id }),
      ServiceDelivery.countDocuments({ serviceId: id }),
      User.countDocuments({ 'profile.services': id }),
    ]);
  }
  if (dependencies.some((count) => count > 0)) {
    throw Object.assign(new Error(`This ${type} has dependent records. Reassign or deactivate it instead of deleting it.`), { status: 409 });
  }
}

async function applyChange(change) {
  const Model = MODELS[change.entityType];
  const id = change.targetId;
  if (change.action === 'delete') {
    await assertNoDependencies(change.entityType, id);
    const record = await Model.findById(id);
    if (!record) throw Object.assign(new Error('The record no longer exists.'), { status: 409 });
    if (change.entityType === 'service') await Requirement.deleteMany({ service: id });
    if (change.entityType === 'window') await Service.updateMany({ window: id }, { window: null });
    await record.deleteOne();
    return id;
  }

  const data = { ...change.after };
  if (change.action === 'create') {
    if (change.entityType === 'floor' && await Floor.exists({ floorNumber: data.floorNumber })) {
      throw Object.assign(new Error('A floor with this number already exists.'), { status: 409 });
    }
    if (change.entityType === 'office' && await Organization.exists({ 'name.en': data.name.en })) {
      throw Object.assign(new Error('An office with this English name already exists.'), { status: 409 });
    }
    if (change.entityType === 'service' && await Service.exists({ organization: data.organization, 'name.en': data.name.en })) {
      throw Object.assign(new Error('This service already exists in the selected office.'), { status: 409 });
    }
    if (change.entityType === 'requirement' && await Requirement.exists({ service: data.service, 'requirementText.en': data.requirementText.en })) {
      throw Object.assign(new Error('This requirement already exists for the service.'), { status: 409 });
    }
    if (change.entityType === 'window' && await Window.exists({ organization: data.organization, number: data.number })) {
      throw Object.assign(new Error('This window number is already used in the selected office.'), { status: 409 });
    }
    const submittedRequirements = change.entityType === 'service'
      ? normalizeServiceRequirements(data.requirements)
      : [];
    delete data.requirements;
    const created = await Model.create(data);
    if (change.entityType === 'service') {
      const defaults = change.generateDefaultRequirements
        ? getDefaultRequirementsForService(created)
        : [];
      const requirements = buildServiceRequirementRecords(created._id, defaults, submittedRequirements);
      try {
        if (requirements.length) await Requirement.insertMany(requirements);
      } catch (error) {
        await Requirement.deleteMany({ service: created._id });
        await created.deleteOne();
        throw error;
      }
    }
    return created._id;
  }

  const current = await Model.findById(id);
  if (!current) throw Object.assign(new Error('The record no longer exists.'), { status: 409 });
  if (change.entityType === 'floor') {
    Object.assign(current, data);
    await current.save();
    if (data.floorNumber !== undefined) {
      await Window.updateMany({ floorId: current._id }, { floor: data.floorNumber });
    }
    return current._id;
  }
  Object.assign(current, data);
  await current.save();
  if (change.entityType === 'office' && data.floorId !== undefined) {
    if (data.floorId) {
      const floor = await Floor.findById(data.floorId).select('floorNumber');
      await Window.updateMany(
        { organization: current._id },
        { floor: floor.floorNumber, floorId: floor._id }
      );
    } else {
      await Window.updateMany({ organization: current._id }, { floorId: null });
    }
  }
  return current._id;
}

module.exports = {
  getSetupData,
  submitSetupChange,
  applyInitialWindowAssignments,
  reorderServiceRequirements,
  normalizeServiceRequirements,
  buildServiceRequirementRecords,
  buildWorkbookServiceAssignments,
  validateInitialWindowPairs,
  applyChange,
};
