const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('./user.model')

const router = express.Router()

// Kayıt
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'Tüm alanlar zorunlu.' })
    }
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ email, password: hashed, displayName })
    res.status(201).json({ message: 'Kayıt başarılı.' })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Giriş
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Geçersiz e-posta veya şifre.' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ message: 'Geçersiz e-posta veya şifre.' })
    const token = jwt.sign({ userId: user._id, displayName: user.displayName }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
    res.json({ token, displayName: user.displayName })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

module.exports = router 