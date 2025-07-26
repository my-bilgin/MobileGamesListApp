import React, { useMemo, useState, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, IconButton, Snackbar, Alert, CssBaseline, Card, CardContent, CardMedia, Button, TextField, Box, Container, Paper, Chip, Divider, Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LinkIcon from '@mui/icons-material/Link'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles'
import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import Collapse from '@mui/material/Collapse'
import useMediaQuery from '@mui/material/useMediaQuery'

const API_URL = '/api'

interface AuthContextType {
  user: string | null
  token: string | null
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) {
      setToken(t)
      setUser(u)
    }
    setInitialized(true)
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
    <AuthContext.Provider value={{ user, token, initialized, login, register, logout }}>
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
  const { token, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !token) {
      navigate('/login');
    }
  }, [token, initialized, navigate]);

  if (!initialized) return null;
  if (!token) return null;
  return <>{children}</>;
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
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: 28, color: theme.palette.primary.main, letterSpacing: 0.5, flex: 1 }}>GameShare</Typography>
        </Box>
      </Box>
      {/* Hoş geldin ve özet kutusu */}
      <Box sx={{ bgcolor: theme.palette.background.paper, borderRadius: 4, boxShadow: 3, p: 3, mb: 3, mx: { xs: 1, sm: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: 22, color: theme.palette.primary.main, mb: 1 }}>Hoşgeldin{user ? `, ${user}` : ''}!</Typography>
        <Typography sx={{ fontSize: 16, color: theme.palette.text.secondary, textAlign: 'center', mb: 1 }}>
          GameShare ile mobil oyun listeleri oluşturabilir, oyunları otomatik olarak mağaza bilgileriyle ekleyebilir, listelerini paylaşabilir ve kendi oyun koleksiyonunu yönetebilirsin. Uygulama PWA olarak çalışır, cihazına ekleyebilirsin.
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

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
  const [showShare, setShowShare] = useState(false)

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
    // Eğer zaten açıksa kapat
    if (showShare) {
      setShowShare(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/lists/${listId}/share`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.publicId) {
        const url = `${window.location.origin}/public/${data.publicId}`
        setShareUrl(url)
        setShowShare(true)
        
        // Linki otomatik kopyala
        try {
          await navigator.clipboard.writeText(url)
          show('Paylaşım linki kopyalandı!', 'success')
        } catch (err) {
          // Fallback: manuel kopyalama
          const textArea = document.createElement('textarea')
          textArea.value = url
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          show('Paylaşım linki kopyalandı!', 'success')
        }
      }
    } catch (error) {
      show('Paylaşım linki alınamadı', 'error')
    }
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
          <IconButton color="primary" onClick={() => setShowAdd(v => !v)} sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1976d2' : '#e3f2fd', boxShadow: 1, ml: 1, ':hover': { bgcolor: '#1565c0', '& .MuiSvgIcon-root': { color: '#fff' } } }}>
            <AddIcon sx={{ fontSize: 24, color: theme.palette.mode === 'dark' ? '#fff' : '#1976d2' }} />
          </IconButton>
          <IconButton color="error" onClick={handleDeleteList} sx={{ bgcolor: theme.palette.mode === 'dark' ? '#ffebee' : '#fff', boxShadow: 1, ml: 1, ':hover': { bgcolor: '#d32f2f', '& .MuiSvgIcon-root': { color: '#fff' } } }}>
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
      <Collapse in={showShare} timeout={350} unmountOnExit>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: theme.palette.background.paper, borderRadius: 2, boxShadow: 1, border: `1px solid ${theme.palette.divider}`, mx: { xs: 1, sm: 0 } }}>
          <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontSize: 12, color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
            {shareUrl}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${list.name} - GameShare`,
                  text: `${list.name} oyun listesini GameShare ile paylaşıyorum:`,
                  url: shareUrl
                }).catch(() => {
                  // Fallback: kopyala
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    show('Link kopyalandı!', 'success')
                  }).catch(() => {
                    show('Paylaşım başarısız', 'error')
                  })
                })
              } else {
                // Fallback: kopyala
                navigator.clipboard.writeText(shareUrl).then(() => {
                  show('Link kopyalandı!', 'success')
                }).catch(() => {
                  show('Kopyalama başarısız', 'error')
                })
              }
            }}
            sx={{ 
              minWidth: 'auto', 
              p: 0, 
              bgcolor: 'transparent',
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ':hover': { bgcolor: theme.palette.action.hover } 
            }}
          >
            <img src="/share.png" alt="Paylaş" style={{ width: 70, height: 70, filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none' }} />
          </IconButton>
        </Box>
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
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>{item.rating ? Math.round(item.rating * 10) / 10 : '-'}</Typography>
                <Typography variant="caption" color="text.secondary">({item.reviewCount || 0} yorum)</Typography>
              </Box>
              <Button href={item.storeUrl} target="_blank" rel="noopener noreferrer" size="small" variant="text" sx={{ mt: 0.5, color: '#1976d2', fontWeight: 600, textTransform: 'none', fontSize: 12 }}>Store'da Aç</Button>
            </CardContent>
          </Card>
        )) : <Typography>Henüz oyun eklenmemiş.</Typography>}
      </Box>
      {snackbar}
    </Box>
  )
}

function PublicList() {
  const { publicId } = (window.location.pathname.match(/\/public\/(.+)/) || [])[1] ? { publicId: (window.location.pathname.match(/\/public\/(.+)/) || [])[1] } : { publicId: '' }
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const { token, initialized } = useAuth()
  const { show, snackbar } = useSnackbar()
  const theme = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_URL}/lists/public/${publicId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setList(data)
        setNewName(`${data.name} Kopyası`)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchList()
    // eslint-disable-next-line
  }, [publicId])

  const handleEditName = () => {
    setEditingName(true)
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return
    setEditingName(false)
  }

  const handleCopyToMyLists = async () => {
    if (!token || !initialized) {
      show('Listeyi kaydetmek için giriş yapmanız gerekiyor', 'error')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, items: list.items })
      })
      
      if (res.ok) {
        show('Liste başarıyla kaydedildi!', 'success')
        navigate('/lists')
      } else {
        const data = await res.json()
        show(data.message || 'Liste kaydedilemedi', 'error')
      }
    } catch (error) {
      show('Bağlantı hatası', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  if (loading) return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    </Box>
  )
  
  if (error) return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>
    </Box>
  )
  
  if (!list) return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      <Typography sx={{ textAlign: 'center', mt: 4 }}>Liste bulunamadı.</Typography>
    </Box>
  )

  return (
    <Box sx={{ width: '100vw', maxWidth: { xs: '100vw', sm: 480 }, mx: 'auto', p: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 2 }, pb: { xs: 2, sm: 3 }, minHeight: '100vh', bgcolor: theme.palette.background.default, overflowX: 'hidden' }}>
      {/* AppBar tarzı başlık ve aksiyonlar */}
      <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 10, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, bgcolor: theme.palette.background.paper, boxShadow: 3, borderRadius: '0 0 18px 18px', minHeight: 64 }}>
          <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 900, fontSize: 28, color: theme.palette.primary.main, letterSpacing: 0.5, flex: 1 }}>Paylaşılan Liste</Typography>
        </Box>
      </Box>

      {/* Liste adı ve düzenleme */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: { xs: 2, sm: 0 } }}>
        {editingName ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, flex: 1 }}>
            <TextField
              value={newName}
              onChange={e => setNewName(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ flex: 1, maxWidth: 300 }}
            />
            <Button onClick={handleSaveName} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 600, px: 2, py: 1 }}>Kaydet</Button>
            <Button onClick={() => setEditingName(false)} variant="outlined" color="primary" sx={{ borderRadius: 2, fontWeight: 600, px: 2, py: 1 }}>İptal</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 24, color: theme.palette.text.primary }}>{newName}</Typography>
            <IconButton onClick={handleEditName} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Oyunlar listesi */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 2, sm: 0 } }}>
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
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>{item.developer}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 0.5 }}>
                <StarRating value={Number(item.rating) || 0} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>{item.rating ? Math.round(item.rating * 10) / 10 : '-'}</Typography>
                <Typography variant="caption" color="text.secondary">({item.reviewCount || 0} yorum)</Typography>
              </Box>
              <Button href={item.storeUrl} target="_blank" rel="noopener noreferrer" size="small" variant="text" sx={{ mt: 0.5, color: '#1976d2', fontWeight: 600, textTransform: 'none', fontSize: 12 }}>Store'da Aç</Button>
            </CardContent>
          </Card>
        )) : <Typography sx={{ textAlign: 'center', mt: 4 }}>Henüz oyun eklenmemiş.</Typography>}
      </Box>

      {/* Listeyi Kaydet butonu */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}`, zIndex: 1000 }}>
        <Button
          variant="contained"
          onClick={handleCopyToMyLists}
          disabled={saving || !token}
          fullWidth
          sx={{ 
            borderRadius: 3, 
            py: 2,
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            }
          }}
        >
          {saving ? 'Kaydediliyor...' : token ? 'Listeyi Kaydet' : 'Giriş Yapın'}
        </Button>
      </Box>

      {snackbar}
    </Box>
  )
}

function ShareTarget() {
  const [sharedData, setSharedData] = useState({ title: '', text: '', url: '' });

  useEffect(() => {
    // Web Share Target POST payload yakalama
    if ('launchQueue' in window && typeof (window as any).launchQueue.setConsumer === 'function') {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        if (launchParams && launchParams.files && launchParams.files.length === 0 && launchParams.formData) {
          const formData = launchParams.formData;
          setSharedData({
            title: formData.get('title') || '',
            text: formData.get('text') || '',
            url: formData.get('url') || ''
          });
        }
      });
    } else {
      // Fallback: GET parametrelerinden al
      const params = new URLSearchParams(window.location.search);
      setSharedData({
        title: params.get('title') || '',
        text: params.get('text') || '',
        url: params.get('url') || ''
      });
    }
  }, []);

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
        body: JSON.stringify({ title: sharedData.title, storeUrl: sharedData.url })
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
      <Typography>Başlık: {sharedData.title}</Typography>
      <Typography>Metin: {sharedData.text}</Typography>
      <Typography>URL: {sharedData.url}</Typography>
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
  const { user, logout, token } = useAuth()
  const { show, snackbar } = useSnackbar()
  const theme = useTheme()
  // Kullanıcı adı (displayName)
  const displayName = user || 'Kullanıcı'

  // Listeler ve oyun sayısı için API'den veri al
  const [stats, setStats] = useState({ listCount: 0, gameCount: 0 })
  
  useEffect(() => {
    if (token) {
      fetchStats()
    }
  }, [token])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/lists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const lists = await res.json()
        const listCount = lists.length
        const gameCount = lists.reduce((acc: number, list: any) => acc + (list.items?.length || 0), 0)
        setStats({ listCount, gameCount })
      }
    } catch (error) {
      console.error('İstatistikler alınamadı:', error)
    }
  }

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
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isHalf = value >= star - 0.5 && value < star;
        const isFull = value >= star;
        
        return (
          <Box
            key={star}
            sx={{
              position: 'relative',
              width: 16,
              height: 16,
              marginRight: 0.5,
            }}
          >
            {/* Boş yıldız arka plan */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                color: '#E0E0E0',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ★
            </Box>
            
            {/* Dolu yıldız */}
            {isFull && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  color: '#FFD700',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ★
              </Box>
            )}
            
            {/* Yarım yıldız */}
            {isHalf && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  color: '#FFD700',
                  fontSize: 16,
                  lineHeight: 1,
                  overflow: 'hidden',
                }}
              >
                ★
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function ShareTargetView() {
  const [sharedUrl, setSharedUrl] = useState('');
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [lists, setLists] = useState<Array<{ _id: string; name: string; items: any[] }>>([]);
  const [selectedList, setSelectedList] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const { token, initialized } = useAuth();
  const { show } = useSnackbar();
  const theme = useTheme();

  // Paylaşılan URL'yi al
  useEffect(() => {
    console.log('ShareTargetView useEffect çalıştı');
    
    // Önce URL parametresinden dene (test için)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrlParam = urlParams.get('url');
    
    if (sharedUrlParam) {
      console.log('URL parametresinden alındı:', sharedUrlParam);
      setSharedUrl(decodeURIComponent(sharedUrlParam));
      setLoading(false);
    } else {
      console.log('Cache\'den alınmaya çalışılıyor...');
      // Cache'den dene
      caches.open('shared-data').then(cache => {
        cache.match('/last-shared-url').then(res => {
          if (res) {
            res.text().then(url => {
              console.log('Cache\'den alındı:', url);
              setSharedUrl(url);
            });
          } else {
            console.log('Cache\'de URL bulunamadı');
          }
          setLoading(false);
        });
      });
    }
  }, []);

  // sharedUrl değiştiğinde oyun bilgilerini al
  useEffect(() => {
    if (sharedUrl) {
      fetchGameInfo();
    }
  }, [sharedUrl]);

  const fetchGameInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/fetch-game-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sharedUrl })
      });
      
      if (res.ok) {
        const data = await res.json();
        setGameInfo(data);
      } else {
        // Fallback - basit bilgiler
        const gameId = sharedUrl.match(/id=([^&]+)/)?.[1] || '';
        setGameInfo({
          title: gameId ? gameId.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim() : 'Bilinmeyen Oyun',
          storeUrl: sharedUrl,
          imageUrl: `https://play.google.com/store/apps/details?id=${gameId}`,
          developer: 'Bilinmeyen Geliştirici',
          rating: 0,
          reviewCount: 0
        });
      }
    } catch (error) {
      console.error('Oyun bilgileri alınamadı:', error);
      // Fallback
      const gameId = sharedUrl.match(/id=([^&]+)/)?.[1] || '';
      setGameInfo({
        title: gameId ? gameId.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim() : 'Bilinmeyen Oyun',
        storeUrl: sharedUrl,
        imageUrl: `https://play.google.com/store/apps/details?id=${gameId}`,
        developer: 'Bilinmeyen Geliştirici',
        rating: 0,
        reviewCount: 0
      });
    }
  };

  // Kullanıcının listelerini al
  useEffect(() => {
    if (token && initialized) {
      fetchLists();
    }
  }, [token, initialized]);

  const fetchLists = async () => {
    try {
      const res = await fetch(`${API_URL}/lists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLists(data);
        if (data.length > 0) {
          setSelectedList(data[0]._id);
        }
      }
    } catch (error) {
      console.error('Listeler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!selectedList || !sharedUrl) return;
    
    setAdding(true);
    try {
      // Önce oyun bilgilerini al
      const gameInfoRes = await fetch(`${API_URL}/fetch-game-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sharedUrl })
      });
      
      if (!gameInfoRes.ok) {
        throw new Error('Oyun bilgileri alınamadı');
      }
      
      const gameData = await gameInfoRes.json();
      
      // Listeye ekle
      const res = await fetch(`${API_URL}/lists/${selectedList}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
      });

      if (res.ok) {
        show('Oyun başarıyla listeye eklendi!', 'success');
        navigate('/lists');
      } else {
        const data = await res.json();
        show(data.message || 'Oyun eklenirken hata oluştu', 'error');
      }
    } catch (error) {
      show('Bağlantı hatası', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // URL'den oyun bilgilerini çıkar
  const getGameInfo = (url: string) => {
    const gameId = url.match(/id=([^&]+)/)?.[1] || '';
    
    // Basit çözüm - gameId'yi kullan
    return {
      id: gameId,
      name: gameId ? gameId.replace(/\./g, ' ').replace(/([A-Z])/g, ' $1').trim() : 'Bilinmeyen Oyun',
      url: url,
      image: `https://play.google.com/store/apps/details?id=${gameId}`,
      rating: 0,
      genre: 'Oyun'
    };
  };

  // gameInfo artık state'den geliyor, bu satırı kaldırıyoruz

  console.log('ShareTargetView render - loading:', loading, 'initialized:', initialized, 'sharedUrl:', sharedUrl);
  
  if (loading || !initialized) {
    console.log('Loading state - render ediliyor');
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!sharedUrl && !loading) {
    console.log('Paylaşılan içerik bulunamadı - render ediliyor');
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Paylaşılan içerik bulunamadı
          </Typography>
          <Button variant="contained" onClick={handleCancel} sx={{ borderRadius: 2 }}>
            Ana Sayfaya Dön
          </Button>
        </Paper>
      </Container>
    );
  }

  if (initialized && !token) {
    console.log('Giriş yapmanız gerekiyor - render ediliyor');
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Giriş Yapmanız Gerekiyor
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Oyun eklemek için lütfen giriş yapın
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login')} sx={{ borderRadius: 2, mr: 1 }}>
            Giriş Yap
          </Button>
          <Button variant="outlined" onClick={handleCancel} sx={{ borderRadius: 2 }}>
            Ana Sayfaya Dön
          </Button>
        </Paper>
      </Container>
    );
  }

  console.log('Ana render bloğu çalışıyor');
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
          Oyun Ekle
        </Typography>
      </Box>

      {/* Oyun Kartı */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Eklenecek Oyun
          </Typography>
        </Box>
        
        {gameInfo && (
          <Card sx={{ display: 'flex', alignItems: 'center', mb: 2, boxShadow: 3, borderRadius: 4, bgcolor: `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.secondary.light} 100%)`, p: 1.5 }}>
            {gameInfo.imageUrl ? (
              <CardMedia
                component="img"
                image={gameInfo.imageUrl}
                alt={gameInfo.title}
                sx={{ width: 48, height: 48, borderRadius: 2, m: 1.5, bgcolor: '#eee', boxShadow: 1 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00MCAyMEMyOC45NTQzIDIwIDIwIDI4Ljk1NDMgMjAgNDBDMjAgNTEuMDQ1NyAyOC45NTQzIDYwIDQwIDYwQzUxLjA0NTcgNjAgNjAgNTEuMDQ1NyA2MCA0MEM2MCAyOC45NTQzIDUxLjA0NTcgMjAgNDAgMjBaIiBmaWxsPSIjQ0NDIi8+Cjwvc3ZnPgo=';
                }}
              />
            ) : (
              <Box sx={{ width: 48, height: 48, borderRadius: 2, m: 1.5, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#bbb', boxShadow: 1 }}>🎮</Box>
            )}
            <CardContent sx={{ flex: 1, p: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 15, color: theme.palette.text.primary, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gameInfo.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mb: 0.5 }}>{gameInfo.developer}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 0.5 }}>
                <StarRating value={Number(gameInfo.rating) || 0} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>{gameInfo.rating ? Math.round(gameInfo.rating * 10) / 10 : '-'}</Typography>
                <Typography variant="caption" color="text.secondary">({gameInfo.reviewCount || 0} yorum)</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11, wordBreak: 'break-all', opacity: 0.7, mt: 0.5 }}>{sharedUrl}</Typography>
            </CardContent>
          </Card>
        )}
      </Paper>

      {/* Liste Seçimi */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, fontSize: '1.2rem' }}>
          Hangi Listeye Eklensin?
        </Typography>
        
        {lists.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Henüz liste oluşturmamışsınız
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/lists')}
              sx={{ borderRadius: 2 }}
            >
              Liste Oluştur
            </Button>
          </Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel>Liste Seçin</InputLabel>
            <Select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              label="Liste Seçin"
              sx={{ borderRadius: 2 }}
            >
              {lists.map((list) => (
                <MenuItem key={list._id} value={list._id}>
                  {list.name} ({list.items?.length || 0} oyun)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>

      {/* Butonlar */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          startIcon={<CloseIcon />}
          fullWidth
          sx={{ 
            borderRadius: 3, 
            py: 2,
            borderColor: 'error.main',
            color: 'error.main',
            fontWeight: 600,
            fontSize: '1rem',
            '&:hover': {
              borderColor: 'error.dark',
              backgroundColor: 'error.light',
              color: 'error.dark'
            }
          }}
        >
          Vazgeç
        </Button>
        
        <Button
          variant="contained"
          onClick={handleAddToList}
          startIcon={adding ? <CircularProgress size={20} /> : <CheckIcon />}
          disabled={!selectedList || adding}
          fullWidth
          sx={{ 
            borderRadius: 3, 
            py: 2,
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            }
          }}
        >
          {adding ? 'Ekleniyor...' : 'Listeye Ekle'}
        </Button>
      </Box>
    </Container>
  );
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
        <AppContent toggleTheme={toggleTheme} realMode={realMode} navigate={navigate} setMode={setMode} mode={mode} />
      </ThemeProvider>
    </AuthProvider>
  )
}

function AppContent({ toggleTheme, realMode, navigate, setMode, mode }: { 
  toggleTheme: () => void, 
  realMode: string, 
  navigate: any, 
  setMode: any, 
  mode: string 
}) {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const showLoading = routeLoading;

  return (
    <>
      {showLoading && (
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flexDirection: 'column',
          gap: 3,
          backgroundColor: 'background.default',
          zIndex: 9999
        }}>
          <CircularProgress size={80} thickness={4} />
          <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 500 }}>
            GameShare Yükleniyor...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lütfen bekleyin
          </Typography>
        </Box>
      )}
      <Box sx={{ 
        opacity: showLoading ? 0 : 1, 
        transition: 'opacity 0.3s ease-in-out',
        visibility: showLoading ? 'hidden' : 'visible'
      }}>
        <AppBar position="sticky">
          <Toolbar>
            <Box sx={{ flexGrow: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
              <img src="/gamesharehome.png" alt="GameShare" style={{ height: 32, marginRight: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>GameShare</Typography>
            </Box>
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
          <Route path="/share-target-view" element={<ShareTargetView />} />
          <Route path="/profile" element={<Profile setMode={setMode} mode={mode} />} />
        </Routes>
      </Box>
    </>
  );
}

export default App
