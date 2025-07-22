const mongoose = require('mongoose')
const crypto = require('crypto')

const listSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String, unique: true, default: () => crypto.randomBytes(8).toString('hex') },
  items: [
    {
      title: String,
      storeUrl: String,
      imageUrl: String,
      developer: String,
      rating: Number,
      reviewCount: Number,
    }
  ]
}, { timestamps: true })

module.exports = mongoose.model('List', listSchema) 