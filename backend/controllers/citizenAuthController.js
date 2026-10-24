const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CitizenIdentity = require('../models/CitizenIdentity');
const AuditLog = require('../models/AuditLog');
const AccountRemovalRequest = require('../models/AccountRemovalRequest');
const { getFanHash } = require('../services/citizenIdentityProvider');

function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

function hashSetupToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const registerCitizen = async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const nationalId = typeof req.body.nationalId === 'string' ? req.body.nationalId.trim() : '';
    const occupation = typeof req.body.occupation === 'string' ? req.body.occupation.trim() : '';
    if (name.length < 2 || name.length > 120 || !/^\d{12}$/.test(nationalId) ||
        occupation.length < 2 || occupation.length > 120) {
      return res.status(400).json({ message: 'Enter a valid full name, 12-digit numeric National ID, and occupation/status.' });
    }

    const nationalIdHash = getFanHash(nationalId);
    const existingCitizen = await CitizenIdentity.findOne({
      fanHash: nationalIdHash,
      archivedAt: null,
    }).select('displayName status +fanLastFour').lean();
    if (existingCitizen) {
      return res.status(409).json({
        message: 'This National ID is already linked to a non-archived citizen record. The record may have a legacy status and be missing from the regular list; use the matching details below to locate it.',
        existingAccount: {
          displayName: existingCitizen.displayName,
          status: existingCitizen.status || 'unknown',
          maskedNationalId: existingCitizen.fanLastFour ? `********${existingCitizen.fanLastFour}` : '',
        },
      });
    }
    const now = new Date();
    let identity;
    try {
      identity = await CitizenIdentity.create({
        displayName: name,
        occupation,
        fanHash: nationalIdHash,
        fanLastFour: nationalId.slice(-4),
        password: null,
        status: 'approved',
        isActive: false,
        registrationReviewedBy: req.user.id,
        registrationReviewedAt: now,
        verifiedBy: `registrar:${req.user.id}`,
        verifiedAt: now,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const duplicateFields = Object.keys(error.keyPattern || error.keyValue || {});
      if (!duplicateFields.includes('fanHash')) throw error;

      const nonArchivedCitizen = await CitizenIdentity.findOne({
        fanHash: nationalIdHash,
        archivedAt: null,
      }).select('displayName status +fanLastFour').lean();
      if (nonArchivedCitizen) {
        return res.status(409).json({
          message: 'This National ID is already linked to a non-archived citizen record. The record may have a legacy status and be missing from the regular list; use the matching details below to locate it.',
          existingAccount: {
            displayName: nonArchivedCitizen.displayName,
            status: nonArchivedCitizen.status || 'unknown',
            maskedNationalId: nonArchivedCitizen.fanLastFour ? `********${nonArchivedCitizen.fanLastFour}` : '',
          },
        });
      }

      return res.status(409).json({
        message: 'The National ID conflicts with a retained database index. If the previous account was archived, run the citizen National ID archive migration from the backend folder, restart the backend, and try again.',
      });
    }
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'REGISTER_CITIZEN',
      resourceType: 'CitizenIdentity',
      resourceId: String(identity._id),
      details: { occupation },
      ipAddress: req.ip || '',
    });
    res.status(201).json({
      message: 'Citizen registered. They can create their password from the citizen sign-in page using their registered name and National ID.',
    });
  } catch (error) {
    next(error);
  }
};

const loginCitizen = async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
    const password = req.body.password;
    if (name.length < 2 || name.length > 120 || typeof password !== 'string' || !password || password.length > 128) {
      return res.status(400).json({ message: 'Full name and password are required.' });
    }

    const identities = await CitizenIdentity.find({ displayName: name, archivedAt: null })
      .collation({ locale: 'en', strength: 2 })
      .select('+password +fanLastFour')
      .lean();
    const normalizedName = name.toLocaleLowerCase();
    const matchingNames = identities.filter((identity) =>
      (identity.displayName || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase() === normalizedName
    );
    const passwordMatches = [];
    for (const identity of matchingNames) {
      if (identity.password && await bcrypt.compare(password, identity.password)) {
        passwordMatches.push(identity);
      }
    }
    if (passwordMatches.length > 1) {
      return res.status(401).json({ message: 'The sign-in details are incorrect.' });
    }
    const identity = passwordMatches[0];
    if (!identity) {
      return res.status(401).json({ message: 'The sign-in details are incorrect.' });
    }
    if (identity.status !== 'active' || !identity.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please visit the registration office.' });
    }

    const token = jwt.sign({ id: identity._id, role: 'citizen', verified: true }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({
      token,
      user: {
        id: identity._id,
        name: identity.displayName || 'Citizen',
        role: 'citizen',
        occupation: identity.occupation || '',
        maskedNationalId: `********${identity.fanLastFour || ''}`,
      },
      expiresIn: 4 * 60 * 60,
    });
  } catch (error) {
    next(error);
  }
};

const setupCitizenPassword = async (req, res, next) => {
  try {
    const { token, password, confirmation } = req.body;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const nationalId = typeof req.body.nationalId === 'string' ? req.body.nationalId.trim() : '';
    if ((token !== undefined && (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token))) ||
        name.length < 2 || name.length > 120 || !/^\d{12}$/.test(nationalId) ||
        !validPassword(password) || password !== confirmation) {
      return res.status(400).json({ message: 'Enter your registered full name, 12-digit National ID, and matching valid passwords.' });
    }

    const identityQuery = {
      fanHash: getFanHash(nationalId),
      archivedAt: null,
      status: 'approved',
      password: null,
      ...(token ? {
        invitationToken: hashSetupToken(token),
        invitationExpiresAt: { $gt: new Date() },
        invitationUsedAt: null,
      } : {}),
    };
    const identity = await CitizenIdentity.findOne(identityQuery).select('+invitationToken +password');
    if (!identity || (identity.displayName || '').trim().toLocaleLowerCase() !== name.toLocaleLowerCase()) {
      return res.status(400).json({ message: 'The registered name or National ID could not be verified, or the account is not awaiting password setup.' });
    }

    const now = new Date();
    const passwordUpdateQuery = {
      _id: identity._id,
      archivedAt: null,
      status: 'approved',
      password: null,
      ...(token ? {
        invitationToken: hashSetupToken(token),
        invitationExpiresAt: { $gt: now },
        invitationUsedAt: null,
      } : {}),
    };
    const updated = await CitizenIdentity.findOneAndUpdate(
      passwordUpdateQuery,
      {
        $set: {
          password: await bcrypt.hash(password, 12),
          status: 'active',
          isActive: true,
          invitationToken: null,
          invitationExpiresAt: null,
          invitationUsedAt: now,
        },
      },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(409).json({ message: 'Password setup has already been completed. Please sign in.' });
    await AuditLog.create({
      actorId: updated._id,
      actorRole: 'citizen',
      action: 'SET_CITIZEN_INITIAL_PASSWORD',
      resourceType: 'CitizenIdentity',
      resourceId: String(updated._id),
      details: {},
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Password set. You can now sign in.' });
  } catch (error) {
    next(error);
  }
};

const getPendingCitizenRegistrations = async (req, res, next) => {
  try {
    const registrations = await CitizenIdentity.find({ archivedAt: null })
      .select('displayName email occupation createdAt status registrationReviewedAt +fanLastFour')
      .sort({ displayName: 1, createdAt: 1 })
      .where({ archivedAt: null })
      .limit(200)
      .lean();
    const pendingRemovals = await AccountRemovalRequest.find({
      targetType: 'citizen',
      status: 'pending',
      targetId: { $in: registrations.map((registration) => registration._id) },
    }).select('targetId').lean();
    const pendingRemovalIds = new Set(pendingRemovals.map((item) => String(item.targetId)));
    res.json({
      registrations: registrations.map((registration) => ({
          ...registration,
          maskedNationalId: registration.fanLastFour ? `********${registration.fanLastFour}` : '',
          removalRequested: pendingRemovalIds.has(String(registration._id)),
        })),
    });
  } catch (error) {
    next(error);
  }
};

const updateCitizenStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Citizen status must be active or suspended.' });
    }
    if (!/^[a-f\d]{24}$/i.test(req.params.citizenId)) {
      return res.status(400).json({ message: 'Invalid citizen account identifier.' });
    }
    const identity = await CitizenIdentity.findOne({ _id: req.params.citizenId, archivedAt: null });
    if (!identity) return res.status(404).json({ message: 'Citizen account was not found.' });
    if (identity.archivedAt) return res.status(409).json({ message: 'This citizen account is archived and cannot be reactivated.' });
    if (status === 'active' && !identity.password) {
      return res.status(409).json({ message: 'The citizen must set their password using the one-time setup link before activation.' });
    }
    identity.status = status;
    identity.isActive = status === 'active';
    await identity.save();
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: status === 'active' ? 'REACTIVATE_CITIZEN' : 'SUSPEND_CITIZEN',
      resourceType: 'CitizenIdentity',
      resourceId: String(identity._id),
      details: {},
      ipAddress: req.ip || '',
    });
    res.json({ message: `Citizen account ${status === 'active' ? 'activated' : 'suspended'}.`, status });
  } catch (error) {
    next(error);
  }
};

const updateCitizenRegistration = async (req, res, next) => {
  try {
    const { name, occupation } = req.body;
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120 ||
        typeof occupation !== 'string' || occupation.trim().length < 2 || occupation.trim().length > 120) {
      return res.status(400).json({ message: 'Enter a valid full name and occupation/status.' });
    }
    if (!/^[a-f\d]{24}$/i.test(req.params.citizenId)) {
      return res.status(400).json({ message: 'Invalid citizen account identifier.' });
    }
    const identity = await CitizenIdentity.findOne({ _id: req.params.citizenId, archivedAt: null });
    if (!identity) return res.status(404).json({ message: 'Citizen account was not found.' });
    identity.displayName = name.trim();
    identity.occupation = occupation.trim();
    await identity.save();
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_CITIZEN_REGISTRATION',
      resourceType: 'CitizenIdentity',
      resourceId: String(identity._id),
      details: { fields: ['name', 'occupation'] },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Citizen information updated.' });
  } catch (error) {
    next(error);
  }
};

const resetCitizenPasswordInPerson = async (req, res, next) => {
  try {
    const nationalId = typeof req.body.nationalId === 'string' ? req.body.nationalId.trim() : '';
    if (req.body.nationalIdVerified !== true || !/^\d{12}$/.test(nationalId)) {
      return res.status(400).json({ message: 'Verify the 12-digit National ID in person before resetting the password.' });
    }
    if (!/^[a-f\d]{24}$/i.test(req.params.citizenId)) {
      return res.status(400).json({ message: 'Invalid citizen account identifier.' });
    }
    const identity = await CitizenIdentity.findOne({ _id: req.params.citizenId, archivedAt: null });
    if (!identity || identity.status !== 'active' || !identity.isActive) {
      return res.status(404).json({ message: 'Active citizen account was not found.' });
    }
    const idHash = getFanHash(nationalId);
    if (identity.fanHash !== idHash) {
      return res.status(403).json({ message: 'The verified National ID does not match this citizen account.' });
    }
    identity.password = null;
    identity.status = 'approved';
    identity.isActive = false;
    identity.invitationToken = null;
    identity.invitationExpiresAt = null;
    identity.invitationUsedAt = null;
    identity.passwordResetToken = null;
    identity.passwordResetExpiresAt = null;
    identity.passwordResetUsedAt = null;
    await identity.save();
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'RESET_CITIZEN_PASSWORD_IN_PERSON',
      resourceType: 'CitizenIdentity',
      resourceId: String(identity._id),
      details: { nationalIdVerified: true, requiresPasswordSetup: true },
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Citizen password reset. The citizen must set a new password from the citizen sign-in page using their registered name and National ID.' });
  } catch (error) {
    next(error);
  }
};

const resendCitizenSetupLink = async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.citizenId)) {
      return res.status(400).json({ message: 'Invalid citizen account identifier.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const identity = await CitizenIdentity.findOneAndUpdate(
      { _id: req.params.citizenId, status: 'approved', password: null, invitationUsedAt: null, archivedAt: null },
      {
        $set: {
          invitationToken: hashSetupToken(token),
          invitationExpiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        },
      },
      { returnDocument: 'after' }
    );
    if (!identity) return res.status(404).json({ message: 'Citizen awaiting first password setup was not found.' });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'RESEND_CITIZEN_PASSWORD_SETUP',
      resourceType: 'CitizenIdentity',
      resourceId: String(identity._id),
      details: {},
      ipAddress: req.ip || '',
    });
    const setupUrl = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')}/citizen/activate?token=${encodeURIComponent(token)}`;
    res.json({ message: 'One-time password setup link generated. Share it privately; it expires in 72 hours.', setupUrl });
  } catch (error) {
    next(error);
  }
};

const getCitizenProfile = async (req, res, next) => {
  try {
    const identity = await CitizenIdentity.findById(req.user.id)
      .select('displayName email occupation status createdAt +fanLastFour');
    if (!identity) return res.status(404).json({ message: 'Citizen account was not found.' });
    res.json({
      profile: {
        name: identity.displayName,
        email: identity.email || '',
        occupation: identity.occupation || '',
        maskedNationalId: `********${identity.fanLastFour || ''}`,
        status: identity.status,
        registeredAt: identity.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changeCitizenPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword || !validPassword(newPassword)) {
      return res.status(400).json({ message: 'Enter your current password and a new password of 8–128 characters.' });
    }
    const identity = await CitizenIdentity.findById(req.user.id).select('+password');
    if (!identity || !identity.password || !await bcrypt.compare(currentPassword, identity.password)) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    identity.password = await bcrypt.hash(newPassword, 12);
    await identity.save();
    await AuditLog.create({
      actorId: identity._id,
      actorRole: 'citizen',
      action: 'CHANGE_CITIZEN_PASSWORD',
      resourceType: 'CitizenIdentity',
      resourceId: String(identity._id),
      details: {},
      ipAddress: req.ip || '',
    });
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCitizen,
  loginCitizen,
  setupCitizenPassword,
  getPendingCitizenRegistrations,
  updateCitizenStatus,
  updateCitizenRegistration,
  resetCitizenPasswordInPerson,
  resendCitizenSetupLink,
  getCitizenProfile,
  changeCitizenPassword,
};
