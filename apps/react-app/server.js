import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')))

// Health check endpoint - place before catch-all
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json({ status: 'ok', service: 'CRYB React Platform', timestamp: new Date().toISOString() })
})

// API routes (proxy to existing API server) - place before catch-all
app.use('/api', (req, res) => {
  // Proxy to existing API server
  const url = `https://api.cryb.ai${req.url}`
  
  // Simple redirect to API server
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