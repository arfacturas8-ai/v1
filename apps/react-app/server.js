import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

// PUBLIC ROUTES - Serve these FIRST without auth
// Standalone Brad page (separate from React app)
app.get('/brad', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/brad.html'))
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json({ status: 'ok', service: 'CRYB React Platform', timestamp: new Date().toISOString() })
})

// Public static assets for brad page
app.use('/crypto.svg', express.static(path.join(__dirname, 'dist/crypto.svg')))
app.use('/favicon', express.static(path.join(__dirname, 'dist')))
app.use('/icons', express.static(path.join(__dirname, 'dist/icons')))
app.use('/images/brad', express.static(path.join(__dirname, 'dist/images/brad')))

// PASSWORD PROTECTION - Apply to all other routes
const basicAuth = (req, res, next) => {
  // Allow /admin/brad-waitlist to pass through (React route)
  if (req.path.startsWith('/admin/brad-waitlist')) {
    return next()
  }

  // Skip auth for static assets (they come from localhost after nginx proxy)
  if (req.path.startsWith('/assets/') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.svg') ||
      req.path.endsWith('.ico') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.jpg')) {
    return next()
  }

  // IP Whitelist - bypass authentication for specific IPs
  const whitelistedIPs = ['192.168.100.251', '190.171.112.234']
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress

  if (whitelistedIPs.includes(clientIP)) {
    return next()
  }

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="CRYB Platform"')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(401).send('Authentication required')
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  // Load credentials from environment variables (REQUIRED)
  const validUsername = process.env.PLATFORM_USERNAME
  const validPassword = process.env.PLATFORM_PASSWORD

  if (!validUsername || !validPassword) {
    console.error('ERROR: PLATFORM_USERNAME and PLATFORM_PASSWORD environment variables must be set')
    return res.status(500).send('Server configuration error')
  }

  if (username === validUsername && password === validPassword) {
    next()
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="CRYB Platform"')
    res.status(401).send('Invalid credentials')
  }
}

app.use(basicAuth)

// Serve static files (now protected by password)
app.use(express.static(path.join(__dirname, 'dist')))

// API routes (proxy to existing API server)
app.use('/api', (req, res) => {
  const url = `https://api.cryb.ai${req.url}`
  res.redirect(307, url)
})

// Serve the React app for all other routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
})

const port = process.env.PORT || 3000
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CRYB React Platform server running on port ${port}`)
  console.log(`📱 Server accessible at http://localhost:${port}`)
  console.log(`🌐 Production URL: https://platform.cryb.ai`)
})

export default app