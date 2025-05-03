const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const ratingSchema = Joi.object({
  spaceId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().optional(),
});

const getRatingsSchema = Joi.object({
  spaceId: Joi.string().required(),
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = getRatingsSchema.validate(req.query);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { spaceId } = value;
    const ratings = await Rating.find({ spaceId }).populate('userId', 'id name');
    res.json({ success: true, data: ratings });
  } catch (err) {
    console.error(`Error fetching ratings:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = ratingSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { spaceId, rating, comment } = value;
    const newRating = new Rating({
      userId: req.user.id,
      spaceId,
      rating,
      comment,
    });
    await newRating.save();
    res.json({ success: true, message: 'Đánh giá thành công', rating: newRating });
  } catch (err) {
    console.error(`Error creating rating:`, err);
    res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
  }
});

module.exports = router;