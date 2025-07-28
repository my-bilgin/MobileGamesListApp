const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const gplay = require('google-play-scraper').default
const User = require('./user.model')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gamelist'

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err))

// Basit test endpointi
debugger
app.get('/', (req, res) => {
  res.json({ message: 'API çalışıyor' })
})

// Kullanıcı ve liste rotaları buraya eklenecek
app.use('/api/auth', require('./auth.routes'))
app.use('/api/lists', require('./list.routes'))

// Kullanıcı profili endpoint'leri
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    // JWT token'dan kullanıcı bilgilerini al
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    res.json({
      email: user.email,
      displayName: user.displayName,
      profileImage: user.profileImage || '/default-avatar.png',
      showAppBanner: user.showAppBanner !== false // Default true, sadece false ise false yap
    })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.put('/api/user/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    const { currentPassword, newPassword } = req.body
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    // Şifre kontrolü
    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' })
    }
    
    // Yeni şifreyi hash'le
    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed
    await user.save()
    
    res.json({ message: 'Şifre başarıyla değiştirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.put('/api/user/profile-image', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    const { profileImage } = req.body
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    user.profileImage = profileImage
    await user.save()
    
    res.json({ message: 'Profil resmi güncellendi' })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.put('/api/user/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    const { displayName, email } = req.body
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    // Email değişikliği varsa kontrol et
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' })
      }
      user.email = email
    }
    
    // Display name değişikliği varsa güncelle
    if (displayName) {
      user.displayName = displayName
    }
    
    await user.save()
    
    res.json({ 
      message: 'Profil güncellendi',
      email: user.email,
      displayName: user.displayName
    })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.put('/api/user/app-banner-setting', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    const { showAppBanner } = req.body
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    user.showAppBanner = showAppBanner
    await user.save()
    
    res.json({ 
      message: 'Uygulama önerisi ayarı güncellendi',
      showAppBanner: user.showAppBanner
    })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.get('/api/user/favorites', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    // Basit favori implementasyonu
    res.json({
      games: user.favoriteGames || [],
      lists: user.favoriteLists || []
    })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.post('/api/fetch-game-info', async (req, res) => {
  const { url } = req.body
  try {
    const match = url.match(/id=([a-zA-Z0-9_.]+)/)
    if (!match) return res.status(400).json({ message: 'Geçersiz Google Play linki.' })
    const pkg = match[1]
    
    console.log('Scraping for app ID:', pkg)
    
    const data = await gplay.app({ appId: pkg })
    console.log('Scraped data:', data.title)
    
    res.json({
      title: data.title,
      imageUrl: data.icon,
      developer: data.developer,
      rating: data.score,
      reviewCount: data.reviews,
      storeUrl: url
    })
  } catch (err) {
    console.error('Google Play Scraper Hatası:', err)
    
    // Eğer app bulunamazsa, basit bir fallback kullan
    const match = url.match(/id=([a-zA-Z0-9_.]+)/)
    const pkg = match ? match[1] : 'unknown'
    const title = pkg.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim()
    
    res.json({
      title: title,
      imageUrl: `https://play.google.com/store/apps/details?id=${pkg}`,
      developer: 'Bilinmeyen Geliştirici',
      rating: 0,
      reviewCount: 0,
      storeUrl: url
    })
  }
})

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`)
})
