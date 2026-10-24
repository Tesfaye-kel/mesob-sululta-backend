const Floor = require('../models/Floor');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Window = require('../models/Window');

async function ensureDefaultOfficeWindows() {
  let firstFloor = await Floor.findOne({ floorNumber: 1 });
  if (!firstFloor) {
    firstFloor = await Floor.create({
      floorNumber: 1,
      name: { en: 'Floor 1', am: '1ኛ ፎቅ', or: 'Darbii 1' },
      isActive: true,
    });
  } else if (!firstFloor.isActive) {
    firstFloor.isActive = true;
    await firstFloor.save();
  }

  const [offices, windows] = await Promise.all([
    Organization.find({ isActive: { $ne: false } }).select('floorId').lean(),
    Window.find().select('number organization assignedOrganizations isActive').lean(),
  ]);
  const windowServesOffice = (window, officeId) => {
    if (window.isActive === false) return false;
    if (window.assignedOrganizations?.length) {
      return window.assignedOrganizations.some((assignedId) => String(assignedId) === String(officeId));
    }
    return String(window.organization || '') === String(officeId);
  };
  const defaultsByOffice = new Map();
  const activeWindows = windows.filter((window) => window.isActive !== false)
    .sort((a, b) => Number(a.floor || 1) - Number(b.floor || 1) || Number(a.number) - Number(b.number));
  for (const office of offices) {
    const officeWindow = activeWindows.find((window) => windowServesOffice(window, office._id));
    if (officeWindow) defaultsByOffice.set(String(office._id), officeWindow);
  }

  let createdWindows = 0;
  let assignedServices = 0;
  for (const office of offices) {
    let defaultWindow = defaultsByOffice.get(String(office._id));
    if (!defaultWindow) {
      const floor = office.floorId
        ? await Floor.findById(office.floorId).select('floorNumber isActive').lean()
        : firstFloor;
      if (!floor) throw new Error(`Office ${office._id} refers to a floor that no longer exists.`);
      if (floor.isActive === false) throw new Error(`Office ${office._id} is assigned to an inactive floor.`);
      if (!office.floorId) {
        await Organization.updateOne({ _id: office._id, floorId: null }, { $set: { floorId: firstFloor._id } });
      }
      const usedNumbers = new Set(windows
        .filter((window) => String(window.organization || '') === String(office._id))
        .map((window) => Number(window.number)));
      let number = 1;
      while (usedNumbers.has(number)) number += 1;
      defaultWindow = await Window.create({
        number,
        floor: floor.floorNumber,
        floorId: office.floorId || firstFloor._id,
        organization: office._id,
        assignedOrganizations: [office._id],
        initialSetupWindow: false,
        isActive: true,
      });
      windows.push(defaultWindow.toObject());
      defaultsByOffice.set(String(office._id), defaultWindow);
      createdWindows += 1;
    }
    const services = await Service.find({ organization: office._id, isActive: { $ne: false } })
      .select('_id window').populate('window', 'isActive organization assignedOrganizations').lean();
    const serviceIds = services.filter((service) =>
      !service.window || !windowServesOffice(service.window, office._id)
    ).map((service) => service._id);
    if (serviceIds.length) {
      const result = await Service.updateMany(
        { _id: { $in: serviceIds } },
        { $set: { window: defaultWindow._id } }
      );
      assignedServices += result.modifiedCount || 0;
    }
  }
  return { createdWindows, assignedServices, offices: offices.length };
}

module.exports = { ensureDefaultOfficeWindows };
