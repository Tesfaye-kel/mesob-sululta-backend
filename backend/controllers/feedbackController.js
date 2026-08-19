const FeedbackRating = require('../models/FeedbackRating');

const DEFAULT_PERCENTAGES = { 1: 90, 2: 92, 3: 94, 4: 97, 5: 100 };

const getFeedbackSummary = async () => {
  const [counts, FeedbackSetting] = await Promise.all([
    FeedbackRating.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
    require('../models/FeedbackSetting').findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: { key: 'default', percentages: DEFAULT_PERCENTAGES } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  const votes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  counts.forEach(({ _id, count }) => { votes[_id] = count; });
  const mostFrequentRating = [1, 2, 3, 4, 5].reduce((best, rating) =>
    votes[rating] > votes[best] || (votes[rating] === votes[best] && rating > best) ? rating : best, 1);
  const percentages = { ...DEFAULT_PERCENTAGES };
  const storedPercentages = FeedbackSetting.percentages instanceof Map
    ? Object.fromEntries(FeedbackSetting.percentages.entries())
    : FeedbackSetting.percentages || {};
  Object.entries(storedPercentages).forEach(([rating, percentage]) => {
    percentages[rating] = percentage;
  });

  return {
    votes,
    totalRatings: Object.values(votes).reduce((total, count) => total + count, 0),
    mostFrequentRating,
    percentages,
    overallProjectScore: percentages[mostFrequentRating],
    showOverallProjectScore: FeedbackSetting.showOverallProjectScore !== false,
  };
};

const createFeedbackRating = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5' });
    }
    const feedback = await FeedbackRating.create({ rating, service: req.body.service || '' });
    res.status(201).json({ feedback, summary: await getFeedbackSummary() });
  } catch (err) {
    next(err);
  }
};

const getFeedbackDashboard = async (req, res, next) => {
  try {
    res.json(await getFeedbackSummary());
  } catch (err) {
    next(err);
  }
};

const updateFeedbackPercentages = async (req, res, next) => {
  try {
    const input = req.body.percentages;
    if (!input || typeof input !== 'object') {
      return res.status(400).json({ message: 'Percentages are required' });
    }
    const percentages = {};
    for (let rating = 1; rating <= 5; rating += 1) {
      const value = Number(input[rating]);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        return res.status(400).json({ message: `Percentage for ${rating} stars must be between 0 and 100` });
      }
      percentages[rating] = value;
    }
    const update = { $set: { percentages } };
    if (typeof req.body.showOverallProjectScore === 'boolean') {
      update.$set.showOverallProjectScore = req.body.showOverallProjectScore;
    }
    await require('../models/FeedbackSetting').findOneAndUpdate(
      { key: 'default' },
      update,
      { upsert: true, new: true, runValidators: true }
    );
    res.json(await getFeedbackSummary());
  } catch (err) {
    next(err);
  }
};

module.exports = { createFeedbackRating, getFeedbackDashboard, updateFeedbackPercentages, getFeedbackSummary };