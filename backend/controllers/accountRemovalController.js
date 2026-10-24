const mongoose = require('mongoose');
const AccountRemovalRequest = require('../models/AccountRemovalRequest');
const AuditLog = require('../models/AuditLog');
const CitizenIdentity = require('../models/CitizenIdentity');
const User = require('../models/User');

const targets = {
  citizen: { model: CitizenIdentity, resourceType: 'CitizenIdentity' },
  employee: { model: User, resourceType: 'User' },
};

async function createRemovalRequest(req, res, next, targetType, targetId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid account identifier.' });
    }
    const targetFilter = {
      _id: targetId,
      ...(targetType === 'employee' ? { role: 'employee' } : {}),
      archivedAt: null,
    };
    if (targetType === 'employee' && req.user.role === 'registrar') {
      const registrar = await User.findById(req.user.id).select('profile.officeId').lean();
      if (registrar?.profile?.officeId) {
        targetFilter.$or = [
          { 'profile.officeId': registrar.profile.officeId },
          { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
          { createdBy: req.user.id },
        ];
      } else {
        targetFilter.$or = [
          { status: { $in: ['approved', 'active'] }, 'profile.officeId': null },
          { createdBy: req.user.id },
        ];
      }
    }
    const target = await targets[targetType].model.findOne(targetFilter)
      .select(targetType === 'citizen' ? 'displayName' : 'name');
    if (!target) return res.status(404).json({ message: 'Account was not found or is already archived.' });

    const request = await AccountRemovalRequest.create({
      targetType,
      targetId,
      requestedBy: req.user.id,
      reason: typeof req.body.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 500)
        : 'Registrar requested account removal.',
    });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'REQUEST_ACCOUNT_ARCHIVAL',
      resourceType: targets[targetType].resourceType,
      resourceId: String(targetId),
      details: { requestId: String(request._id), targetType },
      ipAddress: req.ip || '',
    });
    return res.status(201).json({ message: 'Removal request sent to an administrator for approval.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A removal request for this account is already awaiting administrator approval.' });
    }
    return next(error);
  }
}

const requestCitizenRemoval = (req, res, next) =>
  createRemovalRequest(req, res, next, 'citizen', req.params.citizenId);

const requestEmployeeRemoval = (req, res, next) =>
  createRemovalRequest(req, res, next, 'employee', req.params.employeeId);

const listRemovalRequests = async (req, res, next) => {
  try {
    const requests = await AccountRemovalRequest.find({ status: 'pending' })
      .populate('requestedBy', 'name email')
      .sort({ createdAt: 1 })
      .lean();
    const results = await Promise.all(requests.map(async (request) => {
      const Target = targets[request.targetType].model;
      const target = await Target.findById(request.targetId)
        .select(request.targetType === 'citizen'
          ? 'displayName occupation status +fanLastFour'
          : 'name email status employeeType profile.nationalIdLastFour profile.jobTitle')
        .lean();
      if (!target) return null;
      return {
        ...request,
        target: request.targetType === 'citizen'
          ? {
              name: target.displayName,
              detail: target.occupation || '',
              status: target.status,
              maskedNationalId: target.fanLastFour ? `********${target.fanLastFour}` : '',
            }
          : {
              name: target.name,
              detail: target.email,
              status: target.status,
              employeeType: target.employeeType,
              jobTitle: target.profile?.jobTitle || '',
              maskedNationalId: target.profile?.nationalIdLastFour
                ? `********${target.profile.nationalIdLastFour}`
                : '',
            },
      };
    }));
    res.json({ requests: results.filter(Boolean) });
  } catch (error) {
    next(error);
  }
};

const reviewRemovalRequest = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({ message: 'Invalid removal request identifier.' });
    }
    const decision = req.body.decision;
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Choose approve or reject.' });
    }

    const request = await AccountRemovalRequest.findOneAndUpdate(
      { _id: req.params.requestId, status: 'pending' },
      {
        $set: {
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
    if (!request) return res.status(404).json({ message: 'Pending removal request was not found.' });

    if (decision === 'approve') {
      const Target = targets[request.targetType].model;
      const archiveUpdate = request.targetType === 'citizen'
        ? { $set: { archivedAt: request.reviewedAt, status: 'suspended', isActive: false } }
        : { $set: { archivedAt: request.reviewedAt, status: 'suspended' } };
      const target = await Target.findOneAndUpdate(
        {
          _id: request.targetId,
          ...(request.targetType === 'employee' ? { role: 'employee' } : {}),
          archivedAt: null,
        },
        archiveUpdate,
        { returnDocument: 'after' }
      );
      if (!target) {
        request.status = 'rejected';
        await request.save();
        return res.status(409).json({ message: 'The account no longer exists or is already archived; request was closed without deleting records.' });
      }
    }

    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: decision === 'approve' ? 'APPROVE_ACCOUNT_ARCHIVAL' : 'REJECT_ACCOUNT_ARCHIVAL',
      resourceType: targets[request.targetType].resourceType,
      resourceId: String(request.targetId),
      details: { requestId: String(request._id), targetType: request.targetType },
      ipAddress: req.ip || '',
    });
    res.json({
      message: decision === 'approve'
        ? 'Account archived from working lists. Its records and service history were retained.'
        : 'Removal request rejected. The account remains available.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestCitizenRemoval,
  requestEmployeeRemoval,
  listRemovalRequests,
  reviewRemovalRequest,
};
