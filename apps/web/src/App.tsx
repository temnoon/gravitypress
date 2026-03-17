import { useState, useEffect, useCallback } from 'react'
import './style.css'

// Config
const NPE_API_BASE = import.meta.env.VITE_NPE_API_BASE || 'https://npe-api.tem-527.workers.dev'
const CLOUD_IMAGE_BASE = import.meta.env.VITE_CLOUD_IMAGE_BASE || 'https://cloud-image.tem-527.workers.dev'

// Types
interface User {
  id: string
  email: string
  tier?: string
}

interface Page {
  id: string
  imageUrl: string
  imageKey: string
  transcript?: string
  description?: string
  transformed?: string
  createdAt: Date
}

interface Book {
  id: string
  title: string
  pages: Page[]
  createdAt: Date
}

// Auth Context
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gp-token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      // Verify token
      fetch(`${NPE_API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => setUser(data.user || data))
        .catch(() => {
          localStorage.removeItem('gp-token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${NPE_API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    localStorage.setItem('gp-token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gp-token')
    setToken(null)
    setUser(null)
  }, [])

  return { user, token, loading, login, logout }
}

// Main App
function App() {
  const { user, token, loading, login, logout } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [view, setView] = useState<'scan' | 'pages' | 'book'>('scan')

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('gp-pages')
    if (saved) setPages(JSON.parse(saved))
    const savedBook = localStorage.getItem('gp-current-book')
    if (savedBook) setCurrentBook(JSON.parse(savedBook))
  }, [])

  // Save pages
  useEffect(() => {
    localStorage.setItem('gp-pages', JSON.stringify(pages))
  }, [pages])

  if (loading) {
    return <div className="app loading">Loading...</div>
  }

  if (!user) {
    return <LoginScreen onLogin={login} />
  }

  return (
    <div className="app">
      <header>
        <h1>GravityPress</h1>
        <p>Your Notebook → Your Book</p>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={logout} className="small">Sign Out</button>
        </div>
      </header>

      <nav className="main-nav">
        <button className={view === 'scan' ? 'active' : ''} onClick={() => setView('scan')}>
          Scan Pages
        </button>
        <button className={view === 'pages' ? 'active' : ''} onClick={() => setView('pages')}>
          My Pages ({pages.length})
        </button>
        <button className={view === 'book' ? 'active' : ''} onClick={() => setView('book')}>
          Make Book
        </button>
      </nav>

      <main>
        {view === 'scan' && (
          <ScanView
            onPageScanned={(page) => setPages(prev => [...prev, page])}
          />
        )}
        {view === 'pages' && (
          <PagesView
            pages={pages}
            token={token!}
            onUpdatePage={(id, updates) => setPages(prev =>
              prev.map(p => p.id === id ? { ...p, ...updates } : p)
            )}
            onDeletePage={(id) => setPages(prev => prev.filter(p => p.id !== id))}
          />
        )}
        {view === 'book' && (
          <BookView
            pages={pages}
            book={currentBook}
            onUpdateBook={setCurrentBook}
          />
        )}
      </main>
    </div>
  )
}

// Login Screen
function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app login-screen">
      <div className="login-box">
        <h1>GravityPress</h1>
        <p>Sign in with your Humanizer account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="note">
          Don't have an account? <a href="https://humanizer.com" target="_blank">Create one at humanizer.com</a>
        </p>
      </div>
    </div>
  )
}

// Scan View - Upload and process images
function ScanView({ onPageScanned }: { onPageScanned: (page: Page) => void }) {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)
  const [result, setResult] = useState<{ transcript?: string, description?: string } | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload to cloud_image
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('images', file)

      const res = await fetch(`${CLOUD_IMAGE_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setUploadedKey(data.images[0].key)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleProcess = async (mode: 'transcript' | 'description' | 'both') => {
    if (!uploadedKey) return

    setProcessing(true)
    try {
      const res = await fetch(`${CLOUD_IMAGE_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageKeys: [uploadedKey],
          mode
        })
      })

      if (!res.ok) throw new Error('Processing failed')
      const data = await res.json()
      const pageResult = data.results[0].results

      setResult({
        transcript: pageResult.transcript?.content,
        description: pageResult.description?.content
      })
    } catch (err) {
      console.error('Process error:', err)
      alert('Failed to process image')
    } finally {
      setProcessing(false)
    }
  }

  const handleSavePage = () => {
    if (!preview || !result) return

    const page: Page = {
      id: crypto.randomUUID(),
      imageUrl: preview,
      imageKey: uploadedKey || '',
      transcript: result.transcript,
      description: result.description,
      createdAt: new Date()
    }

    onPageScanned(page)

    // Reset
    setPreview(null)
    setUploadedKey(null)
    setResult(null)
  }

  return (
    <div className="scan-view">
      <section className="upload-section">
        <h2>Scan a Page</h2>
        <p>Upload a photo of your notebook page to extract text and description.</p>

        <label className="file-upload">
          <input type="file" accept="image/*" onChange={handleFileSelect} />
          <span>{uploading ? 'Uploading...' : 'Choose Image or Take Photo'}</span>
        </label>

        {preview && (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="page-preview" />

            {uploadedKey && !result && (
              <div className="process-buttons">
                <button onClick={() => handleProcess('transcript')} disabled={processing}>
                  {processing ? 'Processing...' : 'Extract Text (OCR)'}
                </button>
                <button onClick={() => handleProcess('description')} disabled={processing}>
                  {processing ? 'Processing...' : 'Describe Image'}
                </button>
                <button onClick={() => handleProcess('both')} disabled={processing}>
                  {processing ? 'Processing...' : 'Both'}
                </button>
              </div>
            )}

            {result && (
              <div className="result-container">
                {result.transcript && (
                  <div className="result-block">
                    <h3>Extracted Text</h3>
                    <pre>{result.transcript}</pre>
                  </div>
                )}
                {result.description && (
                  <div className="result-block">
                    <h3>Description</h3>
                    <p>{result.description}</p>
                  </div>
                )}
                <button className="save-btn" onClick={handleSavePage}>
                  Save Page
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// Pages View - List and manage scanned pages
function PagesView({
  pages,
  token,
  onUpdatePage,
  onDeletePage
}: {
  pages: Page[]
  token: string
  onUpdatePage: (id: string, updates: Partial<Page>) => void
  onDeletePage: (id: string) => void
}) {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [transforming, setTransforming] = useState(false)

  const handleTransform = async (page: Page, type: 'humanize' | 'style' | 'persona') => {
    if (!page.transcript) {
      alert('No text to transform')
      return
    }

    setTransforming(true)
    try {
      const endpoint = type === 'humanize'
        ? '/transform/humanize'
        : type === 'style'
        ? '/transform/style'
        : '/transform/persona'

      const body = type === 'humanize'
        ? { text: page.transcript, intensity: 'moderate' }
        : type === 'style'
        ? { text: page.transcript, style: 'formal' }
        : { text: page.transcript, persona: 'thoughtful writer' }

      const res = await fetch(`${NPE_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error('Transform failed')
      const data = await res.json()

      onUpdatePage(page.id, { transformed: data.result || data.text || data.transformed })
    } catch (err) {
      console.error('Transform error:', err)
      alert('Failed to transform text')
    } finally {
      setTransforming(false)
    }
  }

  if (pages.length === 0) {
    return (
      <div className="pages-view empty">
        <h2>No Pages Yet</h2>
        <p>Scan some notebook pages to get started.</p>
      </div>
    )
  }

  return (
    <div className="pages-view">
      <div className="pages-grid">
        {pages.map(page => (
          <div
            key={page.id}
            className={`page-card ${selectedPage?.id === page.id ? 'selected' : ''}`}
            onClick={() => setSelectedPage(page)}
          >
            <img src={page.imageUrl} alt="Page" />
            <div className="page-info">
              <span className="page-date">
                {new Date(page.createdAt).toLocaleDateString()}
              </span>
              {page.transcript && <span className="badge">OCR</span>}
              {page.transformed && <span className="badge transformed">Transformed</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedPage && (
        <div className="page-detail">
          <div className="detail-header">
            <h2>Page Details</h2>
            <button className="danger small" onClick={() => {
              onDeletePage(selectedPage.id)
              setSelectedPage(null)
            }}>Delete</button>
          </div>

          <img src={selectedPage.imageUrl} alt="Page" className="detail-image" />

          {selectedPage.transcript && (
            <div className="detail-section">
              <h3>Extracted Text</h3>
              <pre>{selectedPage.transcript}</pre>

              <div className="transform-buttons">
                <button onClick={() => handleTransform(selectedPage, 'humanize')} disabled={transforming}>
                  Humanize
                </button>
                <button onClick={() => handleTransform(selectedPage, 'style')} disabled={transforming}>
                  Formalize
                </button>
                <button onClick={() => handleTransform(selectedPage, 'persona')} disabled={transforming}>
                  Rewrite
                </button>
              </div>
            </div>
          )}

          {selectedPage.description && (
            <div className="detail-section">
              <h3>Visual Description</h3>
              <p>{selectedPage.description}</p>
            </div>
          )}

          {selectedPage.transformed && (
            <div className="detail-section transformed">
              <h3>Transformed Text</h3>
              <pre>{selectedPage.transformed}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Book View - Assemble and export
function BookView({
  pages,
  book,
  onUpdateBook
}: {
  pages: Page[]
  book: Book | null
  onUpdateBook: (book: Book | null) => void
}) {
  const [title, setTitle] = useState(book?.title || 'My Notebook')
  const [selectedPages, setSelectedPages] = useState<string[]>(book?.pages.map(p => p.id) || [])

  const togglePage = (id: string) => {
    setSelectedPages(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleCreateBook = () => {
    const bookPages = pages.filter(p => selectedPages.includes(p.id))
    const newBook: Book = {
      id: crypto.randomUUID(),
      title,
      pages: bookPages,
      createdAt: new Date()
    }
    onUpdateBook(newBook)
    localStorage.setItem('gp-current-book', JSON.stringify(newBook))
  }

  const handleExport = () => {
    if (!book) return

    // Generate markdown
    let md = `# ${book.title}\n\n`
    md += `*Created ${new Date(book.createdAt).toLocaleDateString()}*\n\n---\n\n`

    book.pages.forEach((page, i) => {
      md += `## Page ${i + 1}\n\n`
      if (page.transformed) {
        md += page.transformed + '\n\n'
      } else if (page.transcript) {
        md += page.transcript + '\n\n'
      }
      if (page.description) {
        md += `*${page.description}*\n\n`
      }
      md += '---\n\n'
    })

    // Download
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${book.title.toLowerCase().replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="book-view">
      <section className="book-config">
        <h2>Create Your Book</h2>

        <div className="form-group">
          <label>Book Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Notebook"
          />
        </div>

        <div className="page-selection">
          <h3>Select Pages ({selectedPages.length} selected)</h3>
          <div className="mini-grid">
            {pages.map(page => (
              <div
                key={page.id}
                className={`mini-page ${selectedPages.includes(page.id) ? 'selected' : ''}`}
                onClick={() => togglePage(page.id)}
              >
                <img src={page.imageUrl} alt="Page" />
                <span className="page-num">
                  {selectedPages.includes(page.id) && selectedPages.indexOf(page.id) + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleCreateBook} disabled={selectedPages.length === 0}>
          {book ? 'Update Book' : 'Create Book'}
        </button>
      </section>

      {book && (
        <section className="book-preview">
          <h2>{book.title}</h2>
          <p>{book.pages.length} pages</p>

          <div className="book-content">
            {book.pages.map((page, i) => (
              <div key={page.id} className="book-page">
                <div className="page-number">Page {i + 1}</div>
                <div className="page-text">
                  {page.transformed || page.transcript || <em>No text</em>}
                </div>
              </div>
            ))}
          </div>

          <div className="export-buttons">
            <button onClick={handleExport}>Export as Markdown</button>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
