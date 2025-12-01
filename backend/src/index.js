const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const gplay = require('google-play-scraper').default
const User = require('./user.model')

// Cache ve rate limiting için
const gameInfoCache = new Map() // appId -> { data, timestamp }
const CACHE_DURATION = 60 * 60 * 1000 // 1 saat cache
const REQUEST_DELAY = 2000 // İstekler arasında 2 saniye bekle
let lastRequestTime = 0

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gamelist'

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err))

// Basit test endpointi
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
      showAppBanner: user.showAppBanner !== false, // Default true, sadece false ise false yap
      currency: user.currency || 'tr' // Para birimi
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

// Retry fonksiyonu
async function fetchWithRetry(appId, country = 'tr', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Rate limiting - istekler arasında bekle
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      if (timeSinceLastRequest < REQUEST_DELAY) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest))
      }
      lastRequestTime = Date.now()
      
      const data = await gplay.app({ appId, country })
      return data
    } catch (err) {
      console.error(`Google Play Scraper Hatası (deneme ${i + 1}/${retries}):`, err.message)
      
      // 429 hatası ise daha uzun bekle
      if (err.message && err.message.includes('429')) {
        const waitTime = (i + 1) * 5000 // Her denemede daha uzun bekle (5s, 10s, 15s)
        console.log(`${waitTime}ms bekleniyor...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else if (i === retries - 1) {
        throw err
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  throw new Error('Tüm denemeler başarısız oldu')
}

app.put('/api/user/currency-setting', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'Token gerekli' })
    
    const { currency } = req.body
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(401).json({ message: 'Geçersiz token' })
    
    user.currency = currency || 'tr'
    await user.save()
    
    res.json({ 
      message: 'Para birimi ayarı güncellendi',
      currency: user.currency
    })
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' })
  }
})

app.post('/api/fetch-game-info', async (req, res) => {
  const { url, currency, forceRefresh } = req.body
  try {
    const match = url.match(/id=([a-zA-Z0-9_.]+)/)
    if (!match) return res.status(400).json({ message: 'Geçersiz Google Play linki.' })
    const pkg = match[1]
    
    // Currency'yi belirle (varsa kullan, yoksa 'tr' default)
    const countryCode = currency || 'tr'
    
    // Cache kontrolü - currency'ye göre cache key oluştur
    const cacheKey = `${pkg}_${countryCode}`
    const cached = gameInfoCache.get(cacheKey)
    
    // Eğer forceRefresh true değilse ve cache varsa, cache'den döndür
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Cache\'den döndürülüyor:', cacheKey)
      return res.json({ ...cached.data, storeUrl: url })
    }
    
    // forceRefresh true ise cache'i bypass et
    if (forceRefresh) {
      console.log('Cache bypass ediliyor, güncel bilgi çekiliyor:', cacheKey)
    }
    
    console.log('Scraping for app ID:', pkg, 'Country:', countryCode)
    
    const data = await fetchWithRetry(pkg, countryCode)
    console.log('Scraped data:', data.title)
    console.log('Price data:', { price: data.price, priceText: data.priceText, free: data.free, originalPrice: data.originalPrice, sale: data.sale })
    
    // Fiyat bilgisini formatla
    let price = 'Ücretsiz'
    let originalPrice = null
    let discountPercent = 0
    
    if (data.priceText) {
      // priceText genellikle "Free" veya "$4.99" gibi formatlanmış değer içerir
      if (data.priceText === 'Free') {
        price = 'Ücretsiz'
      } else {
        price = data.priceText
      }
    } else if (data.price && data.price !== '0' && data.price !== 0) {
      price = String(data.price)
    } else if (data.free === false && data.price) {
      price = String(data.price)
    }
    
    // İndirim bilgisi kontrolü
    if (data.originalPrice && data.originalPrice !== data.price && data.price !== '0' && data.price !== 0) {
      originalPrice = data.originalPriceText || String(data.originalPrice)
      // İndirim yüzdesini hesapla
      if (data.originalPrice > 0 && data.price > 0) {
        discountPercent = Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
      }
    }
    
    console.log('Final price:', price, 'Original:', originalPrice, 'Discount:', discountPercent + '%')
    
    const result = {
      title: data.title,
      imageUrl: data.icon,
      developer: data.developer,
      rating: data.score,
      reviewCount: data.reviews,
      price: price,
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      storeUrl: url
    }
    
    // Cache'e kaydet
    gameInfoCache.set(cacheKey, { data: result, timestamp: Date.now() })
    
    res.json(result)
  } catch (err) {
    console.error('Google Play Scraper Hatası:', err)
    
    // 429 hatası için özel mesaj
    if (err.message && err.message.includes('429')) {
      return res.status(429).json({ 
        message: 'Google Play Store\'dan çok fazla istek yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.' 
      })
    }
    
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
      price: 'Bilinmiyor',
      storeUrl: url
    })
  }
})

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`)
})
