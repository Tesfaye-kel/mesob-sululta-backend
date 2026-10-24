const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const FeedbackRequest = require('../models/FeedbackRequest');
const Notification = require('../models/Notification');

const listFeedbackRequests = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const allowedStatuses = ['new', 'under_review', 'responded', 'resolved'];
    const allowedTypes = ['compliment', 'complaint', 'suggestion'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid feedback status filter.' });
    }
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid feedback type filter.' });
    }
    const feedback = await FeedbackRequest.find({
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    })
      .select('_id type message status response rating createdAt serviceId appointmentId serviceDeliveredAt')
      .populate('serviceId', 'name')
      .populate('appointmentId', 'appointmentReference slotDate session')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

const respondToFeedback = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.feedbackId)) {
      return res.status(400).json({ message: 'Invalid feedback case identifier.' });
    }
    const { response, status } = req.body;
    if (typeof response !== 'string' || response.trim().length < 5 || response.trim().length > 2000 ||
        !['responded', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Provide a response (5–2000 characters) and a responded or resolved status.' });
    }
    const feedback = await FeedbackRequest.findOneAndUpdate(
      { _id: req.params.feedbackId, status: { $in: ['new', 'under_review', 'responded'] } },
      {
        response: response.trim(),
        status,
        respondedBy: req.user.id,
      },
      { new: true, runValidators: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback case was not found or can no longer be updated.' });
    await Promise.all([
      Notification.create({
        userId: feedback.citizenIdentityId,
        type: 'feedback_reply',
        title: 'A response to your feedback is available',
        message: response.trim(),
        relatedId: feedback._id,
      }),
      AuditLog.create({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: status === 'resolved' ? 'RESOLVE_FEEDBACK' : 'RESPOND_TO_FEEDBACK',
        resourceType: 'FeedbackRequest',
        resourceId: String(feedback._id),
        details: { status },
        ipAddress: req.ip || '',
      }),
    ]);
    res.json({ message: 'Feedback response saved.', feedback: { id: feedback._id, status: feedback.status } });
  } catch (error) {
    next(error);
  }
};

module.exports = { listFeedbackRequests, respondToFeedback };
