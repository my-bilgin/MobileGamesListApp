const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  profileImage: { type: String, default: '/default-avatar.png' },
  favoriteGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  favoriteLists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema) 