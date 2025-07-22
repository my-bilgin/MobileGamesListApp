import { useMemo, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, IconButton, Snackbar, Alert, CssBaseline, Card, CardContent, CardMedia, Button, TextField, Box } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles'
import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import Collapse from '@mui/material/Collapse'
import useMediaQuery from '@mui/material/useMediaQuery'

const API_URL = 'http://localhost:5023/api'

interface AuthContextType {
  user: string | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) {
      setToken(t)
      setUser(u)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    setToken(data.token)
    setUser(data.displayName)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', data.displayName)
  }

  const register = async (email: string, password: string, displayName: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    // Kayıt sonrası otomatik giriş
    await login(email, password)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/') // Çıkışta anasayfaya yönlendir
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthContext yok')
  return ctx
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])
  if (!token) return null
  return <>{children}</>
}

function Home() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()

  // Giriş yaptıysa otomatik olarak listelere yönlendir
  useEffect(() => {
    if (token) {
      navigate('/lists')
    }
  }, [token, navigate])

  return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden', p: { xs: 0, sm: 2 } }}>
      {/* AppBar tarzı başlık */}
      <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, bgcolor: theme.palette.background.paper, boxShadow: 3, borderRadius: '0 0 18px 18px', minHeight: 64 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: 28, color: theme.palette.primary.main, letterSpacing: 0.5, flex: 1 }}>Oyun Listem</Typography>
        </Box>
      </Box>
      {/* Hoş geldin ve özet kutusu */}
      <Box sx={{ bgcolor: theme.palette.background.paper, borderRadius: 4, boxShadow: 3, p: 3, mb: 3, mx: { xs: 1, sm: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: 22, color: theme.palette.primary.main, mb: 1 }}>Hoşgeldin{user ? `, ${user}` : ''}!</Typography>
        <Typography sx={{ fontSize: 16, color: theme.palette.text.secondary, textAlign: 'center', mb: 1 }}>
          Oyun Listem ile mobil oyun listeleri oluşturabilir, oyunları otomatik olarak mağaza bilgileriyle ekleyebilir, listelerini paylaşabilir ve kendi oyun koleksiyonunu yönetebilirsin. Uygulama PWA olarak çalışır, cihazına ekleyebilirsin.
        </Typography>
      </Box>
      {/* Giriş/Kayıt veya Listelerime Git butonu */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mx: { xs: 1, sm: 0 } }}>
        {!token ? (
          <>
            <Button onClick={() => navigate('/login')} variant="contained" color="primary" size="large" sx={{ borderRadius: 999, fontWeight: 700, px: 3, py: 1.5, fontSize: 18, boxShadow: 2, textTransform: 'none', letterSpacing: 1 }}>Giriş Yap</Button>
            <Button onClick={() => navigate('/register')} variant="outlined" color="primary" size="large" sx={{ borderRadius: 999, fontWeight: 700, px: 3, py: 1.5, fontSize: 18, boxShadow: 2, textTransform: 'none', letterSpacing: 1 }}>Kayıt Ol</Button>
          </>
        ) : (
          <Button onClick={() => navigate('/lists')} variant="contained" color="primary" size="large" sx={{ borderRadius: 999, fontWeight: 700, px: 3, py: 1.5, fontSize: 18, boxShadow: 2, textTransform: 'none', letterSpacing: 1 }}>Listelerime Git</Button>
        )}
      </Box>
    </Box>
  )
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { show, snackbar } = useSnackbar()
  const theme = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      show('Giriş başarılı!', 'success')
      setTimeout(() => navigate('/lists'), 1000)
    } catch (err: any) {
      show(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', bgcolor: theme.palette.background.default, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box' }}>
      <Box sx={{
        width: 400,
        minHeight: 420,
        borderRadius: 4,
        boxShadow: 6,
        bgcolor: theme.palette.background.paper,
        px: 4,
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 1, color: theme.palette.text.primary, fontSize: 28 }}>Giriş Yap</Typography>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
          <TextField type="email" label="E-posta" value={email} onChange={e => setEmail(e.target.value)} required fullWidth size="medium" sx={{ borderRadius: 2 }} />
          <TextField type="password" label="Şifre" value={password} onChange={e => setPassword(e.target.value)} required fullWidth size="medium" sx={{ borderRadius: 2 }} />
          <Button type="submit" disabled={loading} variant="contained" color="primary" size="large" sx={{ borderRadius: 3, fontWeight: 700, py: 1.5, fontSize: 20, width: '100%' }}>{loading ? '...' : 'Giriş Yap'}</Button>
          <Button type="button" onClick={() => navigate('/register')} variant="outlined" color="primary" size="large" sx={{ borderRadius: 3, fontWeight: 700, py: 1.5, fontSize: 20, width: '100%' }}>Kayıt Ol</Button>
        </form>
        {snackbar}
      </Box>
    </Box>
  )
}

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const { show, snackbar } = useSnackbar()
  const theme = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(email, password, displayName)
      show('Kayıt başarılı!', 'success')
      setTimeout(() => navigate('/lists'), 1000)
    } catch (err: any) {
      show(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', bgcolor: theme.palette.background.default, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box' }}>
      <Box sx={{
        width: 400,
        minHeight: 420,
        borderRadius: 4,
        boxShadow: 6,
        bgcolor: theme.palette.background.paper,
        px: 4,
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 1, color: theme.palette.text.primary, fontSize: 28 }}>Kayıt Ol</Typography>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
          <TextField type="text" label="Adınız" value={displayName} onChange={e => setDisplayName(e.target.value)} required fullWidth size="medium" sx={{ borderRadius: 2 }} />
          <TextField type="email" label="E-posta" value={email} onChange={e => setEmail(e.target.value)} required fullWidth size="medium" sx={{ borderRadius: 2 }} />
          <TextField type="password" label="Şifre" value={password} onChange={e => setPassword(e.target.value)} required fullWidth size="medium" sx={{ borderRadius: 2 }} />
          <Button type="submit" disabled={loading} variant="contained" color="primary" size="large" sx={{ borderRadius: 3, fontWeight: 700, py: 1.5, fontSize: 20, width: '100%' }}>{loading ? '...' : 'Kayıt Ol'}</Button>
          <Button type="button" onClick={() => navigate('/login')} variant="outlined" color="primary" size="large" sx={{ borderRadius: 3, fontWeight: 700, py: 1.5, fontSize: 20, width: '100%' }}>Giriş Yap</Button>
        </form>
        {snackbar}
      </Box>
    </Box>
  )
}

function Lists() {
  const { token } = useAuth()
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newList, setNewList] = useState('')
  const theme = useTheme()
  const navigate = useNavigate()

  const fetchLists = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/lists`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setLists(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
    // eslint-disable-next-line
  }, [])

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newList.trim()) return
    try {
      const res = await fetch(`${API_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newList })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setLists((prev) => [...prev, data])
      setNewList('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      {/* AppBar tarzı başlık */}
      <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, bgcolor: theme.palette.background.paper, boxShadow: 3, borderRadius: '0 0 18px 18px', minHeight: 64 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: 28, color: theme.palette.primary.main, letterSpacing: 0.5, flex: 1 }}>Listelerim</Typography>
        </Box>
      </Box>
      {/* Liste ekleme formu kutu içinde modern */}
      <Box sx={{ mb: 2, mx: { xs: 1, sm: 0 } }}>
        <form onSubmit={handleAddList} style={{ display: 'flex', gap: 10, background: theme.palette.background.paper, borderRadius: 4, boxShadow: '0 2px 12px #0002', padding: 14, alignItems: 'center' }}>
          <TextField
            label="Yeni liste adı"
            variant="outlined"
            value={newList}
            onChange={e => setNewList(e.target.value)}
            fullWidth
            size="medium"
            sx={{ bgcolor: theme.palette.background.default, borderRadius: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 999,
              fontWeight: 700,
              px: 2.5,
              py: 1.2,
              minWidth: 0,
              height: 44,
              fontSize: 16,
              textTransform: 'none',
              letterSpacing: 0.5,
              transition: 'all 0.18s',
              bgcolor: theme.palette.primary.dark,
              boxShadow: 2,
              color: '#fff',
              '&:hover': {
                bgcolor: theme.palette.primary.main,
                boxShadow: 4,
                transform: 'translateY(-2px) scale(1.04)',
              },
            }}
          >
            Ekle
          </Button>
        </form>
      </Box>
      {loading ? <Typography sx={{ px: { xs: 1, sm: 0 } }}>Yükleniyor...</Typography> : null}
      {error && <Typography color="error" sx={{ px: { xs: 1, sm: 0 } }}>{error}</Typography>}
      {/* Listeler kart şeklinde, modern */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, mb: 2, mx: { xs: 1, sm: 0 } }}>
        {lists.map((list) => (
          <Card key={list._id} onClick={() => navigate(`/lists/${list._id}`)} sx={{ p: 2, mb: 1, borderRadius: 4, boxShadow: 3, bgcolor: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.secondary.light} 100%)`, cursor: 'pointer', transition: 'all 0.2s', ':hover': { boxShadow: 5, bgcolor: theme.palette.action.hover }, fontSize: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{list.name}</Typography>
            </Box>
            <IconButton size="small" color="primary" onClick={e => { e.stopPropagation(); navigate(`/lists/${list._id}`) }}>
              <span style={{ fontSize: 20 }}>→</span>
            </IconButton>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

function ListDetail() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { listId } = (window.location.pathname.match(/\/lists\/(.+)/) || [])[1] ? { listId: (window.location.pathname.match(/\/lists\/(.+)/) || [])[1] } : { listId: '' }
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [storeUrl, setStoreUrl] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const { show, snackbar } = useSnackbar()
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [fetching, setFetching] = useState(false)
  const theme = useTheme()
  const [showAdd, setShowAdd] = useState(false)

  const handleEditName = () => {
    setEditingName(true)
    setNewName(list.name)
  }

  const handleSaveName = async () => {
    try {
      const res = await fetch(`${API_URL}/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName })
      })
      if (!res.ok) throw new Error('Güncelleme başarısız.')
      setList((prev: any) => ({ ...prev, name: newName }))
      setEditingName(false)
      show('Liste adı güncellendi.', 'success')
    } catch {
      show('Güncelleme başarısız.', 'error')
    }
  }

  const handleDeleteList = async () => {
    if (!window.confirm('Bu listeyi silmek istediğine emin misin?')) return
    try {
      const res = await fetch(`${API_URL}/lists/${listId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Silme başarısız.')
      show('Liste silindi.', 'success')
      setTimeout(() => navigate('/lists'), 1000)
    } catch {
      show('Silme başarısız.', 'error')
    }
  }

  const fetchList = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setList(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line
  }, [listId])

  const fetchShareUrl = async () => {
    try {
      const res = await fetch(`${API_URL}/lists/${listId}/share`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.publicId) {
        setShareUrl(`${window.location.origin}/public/${data.publicId}`)
      }
    } catch {}
  }

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeUrl.trim()) return
    setFetching(true)
    try {
      // Oyun bilgisi çek
      const res = await fetch(`${API_URL}/fetch-game-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storeUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      // Listeye ekle
      const addRes = await fetch(`${API_URL}/lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (!addRes.ok) throw new Error('Oyun eklenemedi.')
      setList((prev: any) => ({ ...prev, items: [...prev.items, data] }))
      setStoreUrl('')
      setShowAdd(false)
      show('Oyun başarıyla eklendi!', 'success')
    } catch (err: any) {
      show(err.message, 'error')
    } finally {
      setFetching(false)
    }
  }

  const handleDeleteGame = async (idx: number) => {
    try {
      const res = await fetch(`${API_URL}/lists/${listId}/items/${idx}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Silme başarısız.')
      setList((prev: any) => ({ ...prev, items: prev.items.filter((_: any, i: number) => i !== idx) }))
      show('Oyun silindi.', 'success')
    } catch {
      show('Silme başarısız.', 'error')
    }
  }

  if (loading) return <Typography>Yükleniyor...</Typography>
  if (error) return <Typography color="error">{error}</Typography>
  if (!list) return <Typography>Liste bulunamadı.</Typography>

  return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      {/* AppBar tarzı başlık ve aksiyonlar */}
      <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, bgcolor: theme.palette.background.paper, boxShadow: 3, borderRadius: '0 0 18px 18px', minHeight: 64 }}>
          <Button onClick={() => navigate('/lists')} startIcon={<span style={{ fontSize: 20 }}>←</span>} variant="text" sx={{ borderRadius: 2, fontWeight: 600, px: 1.5, py: 1, minWidth: 0, color: theme.palette.text.primary, fontSize: 18 }}>Geri</Button>
          <Button onClick={fetchShareUrl} variant="text" color="primary" sx={{ borderRadius: 2, fontWeight: 600, px: 1.5, py: 1, minWidth: 0, fontSize: 18, ml: 1 }}>Paylaş</Button>
          <Box sx={{ flex: 1 }} />
          <IconButton color="primary" onClick={() => setShowAdd(v => !v)} sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1976d2' : '#e3f2fd', boxShadow: 1, ml: 1, ':hover': { bgcolor: '#1565c0' } }}>
            <AddIcon sx={{ fontSize: 24, color: theme.palette.mode === 'dark' ? '#fff' : '#1976d2' }} />
          </IconButton>
          <IconButton color="error" onClick={handleDeleteList} sx={{ bgcolor: theme.palette.mode === 'dark' ? '#ffebee' : '#fff', boxShadow: 1, ml: 1, ':hover': { bgcolor: '#d32f2f' } }}>
            <DeleteForeverIcon sx={{ fontSize: 24, color: '#d32f2f' }} />
          </IconButton>
        </Box>
      </Box>
      {/* Liste adı ve düzenleme */}
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 48, px: { xs: 2, sm: 0 }, mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: 22, color: theme.palette.text.primary, textAlign: 'left', flex: 1, letterSpacing: 0.2 }}>{list.name}</Typography>
        <IconButton size="small" onClick={handleEditName}><EditIcon fontSize="small" /></IconButton>
      </Box>
      {editingName && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, mt: 1, px: { xs: 2, sm: 0 } }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} style={{ fontSize: 18, padding: 6, borderRadius: 8, border: '1px solid #ccc', marginRight: 8 }} />
          <Button onClick={handleSaveName} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 600, px: 2, py: 1 }}>Kaydet</Button>
          <Button onClick={() => setEditingName(false)} variant="outlined" color="primary" sx={{ borderRadius: 2, fontWeight: 600, px: 2, py: 1 }}>İptal</Button>
        </Box>
      )}
      <Collapse in={showAdd} timeout={350} unmountOnExit>
        <form onSubmit={handleAddGame} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18, background: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.primary.light} 100%)`, borderRadius: 4, boxShadow: '0 2px 12px #0002', padding: 14, maxWidth: '100%' }}>
          <TextField
            label="Google Play Store linki"
            variant="outlined"
            value={storeUrl}
            onChange={e => setStoreUrl(e.target.value)}
            fullWidth
            size="medium"
            sx={{ bgcolor: theme.palette.background.default, borderRadius: 2 }}
          />
          <Button type="submit" variant="contained" color="success" size="large" disabled={fetching} sx={{ fontWeight: 700, borderRadius: 2, py: 1.2, fontSize: 16, boxShadow: 1, textTransform: 'none', letterSpacing: 1, transition: 'all 0.2s', ':hover': { bgcolor: theme.palette.success.dark, boxShadow: 2 } }}>
            {fetching ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </form>
      </Collapse>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, mb: 2, mx: { xs: 1, sm: 0 } }}>
        {list.items && list.items.length > 0 ? list.items.map((item: any, i: number) => (
          <Card key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2, boxShadow: 3, borderRadius: 4, bgcolor: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.secondary.light} 100%)`, p: 1.5 }}>
            {item.imageUrl ? (
              <CardMedia
                component="img"
                image={item.imageUrl}
                alt={item.title}
                sx={{ width: 48, height: 48, borderRadius: 2, m: 1.5, bgcolor: '#eee', boxShadow: 1 }}
              />
            ) : (
              <Box sx={{ width: 48, height: 48, borderRadius: 2, m: 1.5, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#bbb', boxShadow: 1 }}>🎮</Box>
            )}
            <CardContent sx={{ flex: 1, p: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15, color: theme.palette.text.primary, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</Typography>
                <IconButton size="small" onClick={() => handleDeleteGame(i)}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>{item.developer}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 0.5 }}>
                <StarRating value={Number(item.rating) || 0} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>{item.rating || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">({item.reviewCount || 0} yorum)</Typography>
              </Box>
              <Button href={item.storeUrl} target="_blank" rel="noopener noreferrer" size="small" variant="text" sx={{ mt: 0.5, color: '#1976d2', fontWeight: 600, textTransform: 'none', fontSize: 12 }}>Store'da Aç</Button>
            </CardContent>
          </Card>
        )) : <Typography>Henüz oyun eklenmemiş.</Typography>}
      </Box>
      {shareUrl && (
        <Box sx={{ wordBreak: 'break-all', fontSize: 13, background: theme.palette.background.paper, p: 1.5, borderRadius: 2, mt: 2, px: { xs: 1, sm: 0 } }}>
          <span>Paylaşılabilir link: </span>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">{shareUrl}</a>
        </Box>
      )}
      {snackbar}
    </Box>
  )
}

function PublicList() {
  const { publicId } = (window.location.pathname.match(/\/public\/(.+)/) || [])[1] ? { publicId: (window.location.pathname.match(/\/public\/(.+)/) || [])[1] } : { publicId: '' }
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()
  // show ve snackbar kaldırıldı

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_URL}/lists/public/${publicId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setList(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchList()
    // eslint-disable-next-line
  }, [publicId])

  const handleCopyToMyLists = async () => {
    if (!token) {
      return
    }
    try {
      const res = await fetch(`${API_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: list.name, items: list.items })
      })
      if (!res.ok) throw new Error('Kopyalama başarısız.')
    } catch {
      // hata yönetimi
    }
  }

  if (loading) return <Typography>Yükleniyor...</Typography>
  if (error) return <Typography color="error">{error}</Typography>
  if (!list) return <Typography>Liste bulunamadı.</Typography>

  return (
    <>
      <Typography variant="h5">{list.name}</Typography>
      <button onClick={handleCopyToMyLists} style={{ alignSelf: 'flex-end', background: '#eee', color: '#1976d2', border: 'none', borderRadius: 8, padding: 8 }}>Kendi listeme ekle</button>
      {/* {copyMsg && <Typography color="primary">{copyMsg}</Typography>} */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.items && list.items.length > 0 ? list.items.map((item: any, i: number) => (
          <div key={i} style={{ padding: 12, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #0001', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, cursor: 'pointer', minHeight: 72 }}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: '#eee' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 8, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#bbb' }}>🎮</div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{item.title}</Typography>
              <Typography variant="caption" color="text.secondary">{item.developer}</Typography>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StarRating value={Number(item.rating) || 0} />
                <Typography variant="body2">{item.rating || '-'} / 5</Typography>
                <Typography variant="caption" color="text.secondary">({item.reviewCount || 0} yorum)</Typography>
              </div>
              <a href={item.storeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1976d2', wordBreak: 'break-all' }}>Store'da Aç</a>
            </div>
          </div>
        )) : <Typography>Henüz oyun eklenmemiş.</Typography>}
      </div>
      {/* {snackbar} */}
    </>
  )
}

function ShareTarget() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const url = params.get('url') || ''
  const title = params.get('title') || ''
  // Kullanıcı giriş yaptıysa, mevcut listelerden birini seçip, oyun ekleme formunu otomatik dolduracak şekilde yönlendirme yapılabilir
  // Basitçe: Kullanıcıya hangi listeye ekleyeceğini soran bir ekran
  const { token } = useAuth()
  const [lists, setLists] = useState<any[]>([])
  const [selectedList, setSelectedList] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/lists`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLists(data))
  }, [token])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedList) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_URL}/lists/${selectedList}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, storeUrl: url })
      })
      if (!res.ok) throw new Error('Ekleme başarısız.')
      setSuccess('Oyun başarıyla eklendi!')
    } catch {
      setError('Ekleme başarısız.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return <Typography>Oyun eklemek için giriş yapmalısın.</Typography>

  return (
    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Typography variant="h6">Paylaşılan oyun linkini ekle</Typography>
      <Typography>Başlık: {title}</Typography>
      <Typography>Link: {url}</Typography>
      <select value={selectedList} onChange={e => setSelectedList(e.target.value)} style={{ padding: 8, fontSize: 16 }} required>
        <option value="">Liste seç</option>
        {lists.map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
      </select>
      <button type="submit" disabled={loading} style={{ padding: 12, fontSize: 16, borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none' }}>{loading ? '...' : 'Ekle'}</button>
      {success && <Typography color="primary">{success}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
    </form>
  )
}

function useSnackbar() {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('info')
  const show = (message: string, sev: 'success' | 'error' | 'info' = 'info') => {
    setMsg(message)
    setSeverity(sev)
    setOpen(true)
  }
  const snackbar = (
    <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>{msg}</Alert>
    </Snackbar>
  )
  return { show, snackbar }
}

function Profile({ setMode, mode }: { setMode: (m: any) => void, mode: string }) {
  const { user, logout } = useAuth()
  const { show, snackbar } = useSnackbar()
  const theme = useTheme()
  // Kullanıcı adı (displayName)
  const displayName = user || 'Kullanıcı'

  // Listeler ve oyun sayısı için localStorage veya context kullanılabilir, burada örnek olarak localStorage'dan çekiyoruz
  const [stats, setStats] = useState({ listCount: 0, gameCount: 0 })
  useEffect(() => {
    // Listeler sayfasında da aynı veri yapısı kullanılıyor
    const listsRaw = localStorage.getItem('lists')
    let listCount = 0
    let gameCount = 0
    if (listsRaw) {
      try {
        const lists = JSON.parse(listsRaw)
        if (Array.isArray(lists)) {
          listCount = lists.length
          gameCount = lists.reduce((acc, l) => acc + (l.items?.length || 0), 0)
        }
      } catch {}
    }
    setStats({ listCount, gameCount })
  }, [])

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value)
    localStorage.setItem('theme', e.target.value)
    show('Tema tercihiniz kaydedildi.', 'success')
  }

  return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      {/* AppBar tarzı başlık */}
      <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, bgcolor: theme.palette.background.paper, boxShadow: 3, borderRadius: '0 0 18px 18px', minHeight: 64 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: 28, color: theme.palette.primary.main, letterSpacing: 0.5, flex: 1 }}>Profilim</Typography>
        </Box>
      </Box>
      {/* Kullanıcı bilgileri kutusu */}
      <Box sx={{ bgcolor: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.primary.light} 100%)`, borderRadius: 4, boxShadow: 3, p: 2.5, mb: 2, mx: { xs: 1, sm: 0 }, display: 'flex', alignItems: 'center', gap: 2 }}>
        <AccountCircleIcon sx={{ fontSize: 38, color: theme.palette.primary.main, mr: 1 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>{displayName}</Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>Kullanıcı</Typography>
        </Box>
      </Box>
      {/* İstatistik kutusu */}
      <Box sx={{ bgcolor: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.secondary.light} 100%)`, borderRadius: 4, boxShadow: 3, p: 2.5, mb: 2, mx: { xs: 1, sm: 0 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 22, color: theme.palette.primary.main }}>{stats.listCount}</Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>Listem</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 22, color: theme.palette.primary.main }}>{stats.gameCount}</Typography>
          <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>Oyun</Typography>
        </Box>
      </Box>
      {/* Tema ayarı ve çıkış kutusu */}
      <Box sx={{ bgcolor: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.info.light} 100%)`, borderRadius: 4, boxShadow: 3, p: 2.5, mb: 2, mx: { xs: 1, sm: 0 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 16, mb: 0.5 }}>Tema Ayarı</Typography>
        <select value={mode} onChange={handleThemeChange} style={{ padding: 10, fontSize: 15, borderRadius: 8, maxWidth: 220, marginTop: 2, width: '100%', marginBottom: 8 }}>
          <option value="auto">Otomatik (cihaz temasına göre)</option>
          <option value="light">Açık</option>
          <option value="dark">Koyu</option>
        </select>
        <Button onClick={logout} variant="outlined" color="error" sx={{ borderRadius: 3, fontWeight: 700, px: 3, py: 1.2, boxShadow: 1, textTransform: 'none', fontSize: 15, mt: 1 }}>Çıkış Yap</Button>
      </Box>
      {snackbar}
    </Box>
  )
}

function StarRating({ value }: { value: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push('★')
    else if (value >= i - 0.5) stars.push('⯨')
    else stars.push('☆')
  }
  return <span style={{ color: '#ffb400', fontSize: 22, letterSpacing: 1 }}>{stars.join('')}</span>
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const [mode, setMode] = useState<'light' | 'dark' | 'auto'>(localStorage.getItem('theme') as any || 'auto')
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
    if (stored && stored !== mode) setMode(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', mode)
  }, [mode])

  const realMode = mode === 'auto' ? (prefersDarkMode ? 'dark' : 'light') : mode

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: realMode,
        },
      }),
    [realMode]
  )

  const toggleTheme = () => setMode((prev) => prev === 'light' ? 'dark' : prev === 'dark' ? 'auto' : 'light')

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="sticky">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>Oyun Listem</Typography>
            <IconButton color="inherit" onClick={toggleTheme} size="large">
              {realMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton color="inherit" onClick={() => navigate('/profile')} size="large">
              <AccountCircleIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lists" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
          <Route path="/lists/:id" element={<ProtectedRoute><ListDetail /></ProtectedRoute>} />
          <Route path="/public/:publicId" element={<PublicList />} />
          <Route path="/share-target" element={<ShareTarget />} />
          <Route path="/profile" element={<Profile setMode={setMode} mode={mode} />} />
          {/* Diğer sayfalar buraya eklenecek */}
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
