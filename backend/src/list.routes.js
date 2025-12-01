const express = require('express')
const jwt = require('jsonwebtoken')
const List = require('./list.model')

const router = express.Router()

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Token gerekli.' })
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Geçersiz token.' })
  }
}

// Liste oluştur (items desteği)
router.post('/', auth, async (req, res) => {
  try {
    const { name, items } = req.body
    if (!name) return res.status(400).json({ message: 'Liste adı gerekli.' })
    const list = await List.create({ name, user: req.user.userId, items: items || [] })
    res.status(201).json(list)
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Kullanıcının listelerini getir
router.get('/', auth, async (req, res) => {
  try {
    const lists = await List.find({ user: req.user.userId })
    res.json(lists)
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Belirli bir listeyi getir
router.get('/:id', auth, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, user: req.user.userId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    res.json(list)
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Liste adını güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'Liste adı gerekli.' })
    const list = await List.findOneAndUpdate({ _id: req.params.id, user: req.user.userId }, { name }, { new: true })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    res.json(list)
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Liste sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const list = await List.findOneAndDelete({ _id: req.params.id, user: req.user.userId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    res.json({ message: 'Liste silindi.' })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Listeye oyun ekle
router.post('/:id/items', auth, async (req, res) => {
  try {
    const { title, storeUrl, imageUrl, developer, rating, reviewCount, price, originalPrice, discountPercent } = req.body
    if (!title || !storeUrl) return res.status(400).json({ message: 'Oyun adı ve link gerekli.' })
    const list = await List.findOne({ _id: req.params.id, user: req.user.userId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    const newItem = { title, storeUrl, imageUrl, developer, rating, reviewCount, price, originalPrice, discountPercent }
    list.items.push(newItem)
    await list.save()
    res.status(201).json(newItem)
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Listedeki bir oyunun price bilgisini güncelle
router.put('/:id/items/:idx/price', auth, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, user: req.user.userId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    const idx = parseInt(req.params.idx)
    if (isNaN(idx) || idx < 0 || idx >= list.items.length) return res.status(400).json({ message: 'Geçersiz oyun.' })
    
    const { price, originalPrice, discountPercent } = req.body
    if (price !== undefined) {
      list.items[idx].price = price
    }
    if (originalPrice !== undefined) {
      list.items[idx].originalPrice = originalPrice
    }
    if (discountPercent !== undefined) {
      list.items[idx].discountPercent = discountPercent
    }
    await list.save()
    res.json(list.items[idx])
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Listedeki bir oyunu sil
router.delete('/:id/items/:idx', auth, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, user: req.user.userId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    const idx = parseInt(req.params.idx)
    if (isNaN(idx) || idx < 0 || idx >= list.items.length) return res.status(400).json({ message: 'Geçersiz oyun.' })
    list.items.splice(idx, 1)
    await list.save()
    res.json({ message: 'Oyun silindi.' })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// Listenin paylaşım linkini döndür
router.get('/:id/share', auth, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, user: req.user.userId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    res.json({ publicId: list.publicId })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

// PublicId ile herkese açık liste görüntüleme
router.get('/public/:publicId', async (req, res) => {
  try {
    const list = await List.findOne({ publicId: req.params.publicId })
    if (!list) return res.status(404).json({ message: 'Liste bulunamadı.' })
    res.json({ name: list.name, items: list.items })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' })
  }
})

module.exports = router 