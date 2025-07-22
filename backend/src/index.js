const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()
const gplay = require('google-play-scraper').default

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

app.post('/api/fetch-game-info', async (req, res) => {
  const { url } = req.body
  try {
    const match = url.match(/id=([a-zA-Z0-9_.]+)/)
    if (!match) return res.status(400).json({ message: 'Geçersiz Google Play linki.' })
    const pkg = match[1]
    const data = await gplay.app({ appId: pkg })
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
    res.status(500).json({ message: 'Oyun bilgisi çekilemedi.' })
  }
})

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`)
})
