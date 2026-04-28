import express from 'express'
import cors from 'cors'
import { Issuer } from './issuer'
import { Holder } from './holder'
import { Verifier } from './verifier'

const app = express()
app.use(cors())
app.use(express.json())

// ----- Singletons -----
const issuer = new Issuer()
const holder = new Holder()
const verifier = new Verifier()
let initialized = false

// ----- GET /api/status -----
app.get('/api/status', (_req, res) => {
  res.json({
    initialized,
    issuerDid: initialized ? issuer.did : null,
    holderDid: initialized ? holder.did : null,
    apiVersion: '1.0.0',
  })
})

// ----- POST /api/initialize -----
// Creates DIDs for both issuer and holder if not already done
app.post('/api/initialize', async (_req, res) => {
  try {
    if (!initialized) {
      await issuer.initialize()
      await holder.initialize()
      initialized = true
    }
    res.json({
      success: true,
      issuerDid: issuer.did,
      holderDid: holder.did,
      message: 'DIDs registered on did:key ledger',
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ----- POST /api/issue-credential -----
// Issuer creates a signed JWT VC for the holder
app.post('/api/issue-credential', async (req, res) => {
  try {
    if (!initialized) return res.status(400).json({ error: 'Call /api/initialize first' })
    const { claims } = req.body as { claims: Record<string, any> }
    const vc = await issuer.issueCredential(holder.did, claims)
    res.json({ success: true, vc, holderDid: holder.did })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ----- POST /api/store-credential -----
// Holder stores a received VC in their local wallet
app.post('/api/store-credential', async (req, res) => {
  try {
    const { vc } = req.body
    holder.storeCredential(vc)
    res.json({ success: true, message: 'Credential stored in holder wallet' })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ----- POST /api/create-presentation -----
// Holder wraps their stored credentials into a signed VP
app.post('/api/create-presentation', async (req, res) => {
  try {
    const { challenge } = req.body as { challenge: string }
    const vp = await holder.createPresentation(challenge)
    res.json({ success: true, vp, holderDid: holder.did })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ----- POST /api/verify-presentation -----
// Verifier cryptographically validates the VP
app.post('/api/verify-presentation', async (req, res) => {
  try {
    const { vp, challenge } = req.body as { vp: any; challenge: string }
    const verified = await verifier.verifyPresentation(vp, challenge)
    res.json({
      success: true,
      verified,
      message: verified
        ? 'Cryptographic signatures valid. Credential issuer confirmed. Challenge binding confirmed.'
        : 'Verification failed.',
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// ----- POST /api/reset -----
// Resets state for a fresh demo run
app.post('/api/reset', (_req, res) => {
  initialized = false
  res.json({ success: true, message: 'State reset. Call /api/initialize to start again.' })
})

// ----- Start -----
const PORT = 3002
app.listen(PORT, () => {
  console.log(`\n🔐 SSI API Server running at http://localhost:${PORT}`)
  console.log(`   Endpoints:`)
  console.log(`   GET  /api/status`)
  console.log(`   POST /api/initialize`)
  console.log(`   POST /api/issue-credential`)
  console.log(`   POST /api/store-credential`)
  console.log(`   POST /api/create-presentation`)
  console.log(`   POST /api/verify-presentation`)
  console.log(`   POST /api/reset\n`)
})
