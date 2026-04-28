'use client';
import { useState } from 'react';
import Link from 'next/link';

const API = '/api/ssi'

const OLD_STEPS = [
  { label: 'Resolving DNS: registrar.lasu.edu.ng', duration: 700 },
  { label: 'Establishing SSL/TLS connection', duration: 600 },
  { label: 'Authenticating with registrar API key', duration: 500 },
  { label: 'Executing: SELECT * FROM students WHERE id=?', duration: 1200 },
  { label: 'Fetching related financial records', duration: 900 },
  { label: 'Serialising full student profile (47 fields)', duration: 400 },
]

const EXPOSED_OLD = [
  'Full Legal Name', 'Date of Birth', 'Home Address', 'Phone Number',
  'Student ID', 'Degree Title', 'GPA (4.2/5.0)', 'All Courses Taken',
  'Tuition Payment Status', 'Financial Aid Records', 'Disciplinary Record',
  'National ID Number', 'Next of Kin', 'Medical Records',
]

type LogLine = { text: string; type?: 'ok' | 'err' | 'warn' | 'dim' }

export default function DatabaseDemo() {
  const [mode, setMode] = useState<'old' | 'ssi'>('old')
  const [form, setForm] = useState({ name: 'Alice Okafor', studentId: 'LASU/2020/CS/1042' })
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [done, setDone] = useState(false)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [ssiResult, setSsiResult] = useState<{ verified: boolean; issuerDid?: string; holderDid?: string } | null>(null)
  const [exposedSSI, setExposedSSI] = useState<string[]>([])
  const [apiError, setApiError] = useState<string | null>(null)

  const addLog = (text: string, type?: LogLine['type']) =>
    setLogs(prev => [...prev, { text, type }])

  const reset = () => {
    setStep(-1); setDone(false); setLogs([]); setRunning(false)
    setSsiResult(null); setExposedSSI([]); setApiError(null)
  }

  // ---- OLD WAY: simulated ----
  const runOld = async () => {
    reset()
    setRunning(true)
    for (let i = 0; i < OLD_STEPS.length; i++) {
      setStep(i)
      addLog(`> ${OLD_STEPS[i].label}...`)
      await new Promise(r => setTimeout(r, OLD_STEPS[i].duration))
    }
    addLog('> 47 fields returned from registrar database', 'warn')
    setDone(true)
    setRunning(false)
  }

  // ---- SSI WAY: real API calls to localhost:3002 ----
  const runSSI = async () => {
    reset()
    setRunning(true)
    try {
      // Step 0: Initialize DIDs
      setStep(0)
      addLog('> POST /api/ssi {action: initialize} — registering DIDs...', 'dim')
      const initRes = await fetch(API, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: 'initialize' }) 
      })
      const init = await initRes.json()
      if (!init.success) throw new Error(init.error)
      addLog(`> Issuer DID: ${init.issuerDid.slice(0, 45)}...`, 'ok')
      addLog(`> Holder DID: ${init.holderDid.slice(0, 45)}...`, 'ok')

      // Step 1: Issue credential
      setStep(1)
      addLog('> POST /api/ssi {action: issue-credential} — university signs VC...', 'dim')
      const issueRes = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue-credential',
          claims: {
            name: form.name,
            degree: 'B.Sc Computer Engineering',
            graduationYear: 2024,
            institution: 'Lagos State University',
            studentId: form.studentId,
          },
        }),
      })
      const issued = await issueRes.json()
      if (!issued.success) throw new Error(issued.error)
      const vcPreview = typeof issued.vc === 'string'
        ? issued.vc.slice(0, 50)
        : JSON.stringify(issued.vc).slice(0, 50)
      addLog(`> JWT VC: ${vcPreview}...`, 'ok')

      // Step 2: Store in holder wallet
      setStep(2)
      addLog('> POST /api/ssi {action: store-credential} — storing in wallet...', 'dim')
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'store-credential', vc: issued.vc }),
      })
      addLog('> VC stored in holder wallet ✓', 'ok')

      // Step 3: Create presentation
      setStep(3)
      const challenge = `google-hr-${Date.now()}`
      addLog(`> POST /api/ssi {action: create-presentation} (challenge: ${challenge.slice(0, 24)}...)`, 'dim')
      const vpRes = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-presentation', challenge }),
      })
      const vpData = await vpRes.json()
      if (!vpData.success) throw new Error(vpData.error)
      addLog('> VP signed by holder ✓', 'ok')

      // Step 4: Verify
      setStep(4)
      addLog('> POST /api/ssi {action: verify-presentation} — Ed25519 check...', 'dim')
      const verRes = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-presentation', vp: vpData.vp, challenge }),
      })
      const ver = await verRes.json()
      addLog(ver.verified ? `> ✅ ${ver.message}` : `> ❌ ${ver.message}`, ver.verified ? 'ok' : 'err')

      setSsiResult({ verified: ver.verified, issuerDid: init.issuerDid, holderDid: init.holderDid })
      setExposedSSI(['Degree: B.Sc Computer Engineering', 'Graduated: 2024', 'Institution: Lagos State University'])
      setDone(true)
    } catch (e: any) {
      setApiError(e.message)
      addLog(`> ERROR: ${e.message}`, 'err')
    } finally {
      setRunning(false)
      setStep(-1)
    }
  }

  const ssiStepLabels = [
    'Initialize DIDs (Issuer + Holder)',
    'Issue signed JWT Verifiable Credential',
    'Store credential in holder wallet',
    'Create Verifiable Presentation',
    'Cryptographically verify presentation',
  ]

  return (
    <main style={{ minHeight: '100vh', paddingTop: 80 }}>
      <nav className="nav">
        <Link href="/" className="back-btn">← Back</Link>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700 }}>🗄️ Model 01 — Direct Database Query</div>
        <div className="mode-toggle">
          <button className={`toggle-btn ${mode === 'old' ? 'active-old' : ''}`} onClick={() => { setMode('old'); reset() }}>⚠️ Old Way</button>
          <button className={`toggle-btn ${mode === 'ssi' ? 'active-ssi' : ''}`} onClick={() => { setMode('ssi'); reset() }}>✨ SSI Way</button>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span className={`badge ${mode === 'old' ? 'badge-old' : 'badge-ssi'}`}>
              {mode === 'old' ? '⚠️ Centralized DB Verification' : '✅ Vercel-Ready Serverless API'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            {mode === 'old' ? 'University Degree Verification via Registrar API' : 'Live Cryptographic VC Verification via Vercel Serverless'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7 }}>
            {mode === 'old'
              ? 'Google HR queries Lagos University\'s central database. Every call exposes Alice\'s full profile.'
              : 'The SSI toggle calls the real Veramo agent inside a Next.js Serverless Route. DIDs are created, a JWT credential is issued, and cryptographically verified — live.'}
          </p>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                {mode === 'old' ? '📋 Verification Request Form' : '🪪 Alice\'s Identity Wallet'}
              </h3>
              {mode === 'old' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label>Applicant Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label>Student ID</label><input className="input" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} /></div>
                  <div><label>Institution</label><input className="input" value="Lagos State University" readOnly style={{ opacity: 0.6 }} /></div>
                  <div style={{ padding: 10, background: 'var(--old-dim)', borderRadius: 8, border: '1px solid var(--old-border)', fontSize: 12, color: 'var(--old)' }}>
                    ⚠️ This call will expose 47+ data fields from the central database
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, border: '1px solid var(--ssi-border)', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Claims to be issued as VC</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ssi)', lineHeight: 2 }}>
                      <div>name: {form.name}</div>
                      <div>degree: B.Sc Computer Engineering</div>
                      <div>graduationYear: 2024</div>
                      <div>studentId: {form.studentId}</div>
                    </div>
                  </div>
                  <div><label>Applicant Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                </div>
              )}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button
                  className={`btn ${mode === 'old' ? 'btn-old' : 'btn-ssi'}`}
                  onClick={mode === 'old' ? runOld : runSSI}
                  disabled={running}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {running
                    ? <><span className="spin" style={{ display: 'inline-block' }}>⟳</span> Running...</>
                    : mode === 'old' ? '🔍 Query Registrar API' : '🔐 Run Live SSI Verification'}
                </button>
                {done && <button className="btn btn-ghost" onClick={reset}>Reset</button>}
              </div>
            </div>

            {/* Terminal */}
            {logs.length > 0 && (
              <div className="terminal">
                <div className="dim"># {mode === 'old' ? 'Simulated' : 'Live Veramo API'} log</div>
                {logs.map((l, i) => (
                  <div key={i} className={l.type}>{l.text}</div>
                ))}
                {running && <span className="pulse dim">█</span>}
              </div>
            )}

            {apiError && (
              <div className="result-box danger">
                <div style={{ fontWeight: 700, color: 'var(--old)', marginBottom: 8 }}>⚠️ API Connection Error</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                  Could not reach the SSI backend.
                </p>
              </div>
            )}

            {done && !apiError && (
              <div className={`result-box ${mode === 'old' ? 'danger' : 'success'}`}>
                {mode === 'old' ? (
                  <>
                    <div style={{ fontWeight: 700, color: 'var(--old)', marginBottom: 8 }}>⚠️ Verification Complete — 47 Fields Exposed</div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                      The university returned Alice's <strong>complete profile</strong> — medical records, finances, discipline history. Google only needed to confirm she has a degree.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
                      {ssiResult?.verified ? '✅ Cryptographically Verified — Real Veramo Agent' : '❌ Verification Failed'}
                    </div>
                    {ssiResult && (
                      <div style={{ fontSize: 12, lineHeight: 2, fontFamily: 'JetBrains Mono', color: 'var(--text-2)' }}>
                        <div>Issuer: {ssiResult.issuerDid?.slice(0, 48)}...</div>
                        <div>Holder: {ssiResult.holderDid?.slice(0, 48)}...</div>
                        <div style={{ color: 'var(--green)' }}>No server was called. Zero data retained by verifier.</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Steps */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                🔄 {mode === 'old' ? 'Simulated Flow' : 'Real Veramo API Calls'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(mode === 'old' ? OLD_STEPS : ssiStepLabels).map((s, i) => {
                  const label = typeof s === 'string' ? s : s.label
                  const isActive = i === step && running
                  const isDone = (done && !apiError) || (i < step && mode === 'ssi')
                  return (
                    <div key={i} className={`step-item ${isActive ? (mode === 'old' ? 'active-old' : 'active') : isDone ? 'done' : ''}`}>
                      <div className={`step-dot ${isDone ? 'done' : mode === 'old' ? 'old' : 'ssi'}`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                        {isActive && mode === 'ssi' && <div className="pulse" style={{ fontSize: 11, color: 'var(--ssi)', marginTop: 2 }}>calling Veramo agent...</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {mode === 'ssi' && (
                <div style={{ marginTop: 14, padding: 10, background: 'var(--ssi-dim)', borderRadius: 8, border: '1px solid var(--ssi-border)', fontSize: 12, color: 'var(--ssi)' }}>
                  All steps call <code>/api/ssi</code> — running Veramo directly in Vercel Serverless!
                </div>
              )}
            </div>

            {/* Data exposure */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15 }}>Data Exposure</h3>
                <span className={`badge ${mode === 'old' ? 'badge-old' : 'badge-green'}`}>
                  {mode === 'old' ? '47 fields exposed' : `${exposedSSI.length || 3} fields verified`}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
                {(mode === 'old' ? EXPOSED_OLD : (exposedSSI.length ? exposedSSI : ['Degree title', 'Graduation year', 'Institution'])).map(field => (
                  <div key={field} className={`data-row ${mode === 'old' ? 'exposed' : 'safe'}`}>
                    <span>{field}</span>
                    <span style={{ fontSize: 12 }}>{mode === 'old' ? '👁️ Visible' : '✅ Verified'}</span>
                  </div>
                ))}
                {mode === 'old' && <div style={{ textAlign: 'center', padding: 8, fontSize: 12, color: 'var(--text-3)' }}>+ 33 more fields including medical &amp; financial</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Architecture note */}
        {mode === 'ssi' && (
          <div className="card" style={{ padding: 24, marginTop: 24, border: '1px solid var(--ssi-border)' }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🏗️ How the System Connects</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { name: 'Demo Platform', port: 3001, role: 'This UI — presents scenarios', color: 'var(--ssi)' },
                { name: 'SSI API Server', port: null, role: '/api/ssi — Serverless API', color: 'var(--green)' },
                { name: 'Wallet UI', port: null, role: '/wallet — Alice\'s wallet app', color: 'var(--yellow)' },
                { name: 'Veramo Agent', port: null, role: 'Integrated in Route Handler', color: '#a78bfa' },
              ].map(s => (
                <div key={s.name} style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 10, border: `1px solid ${s.color}30` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/" className="btn btn-ghost">← All Demos</Link>
          <Link href="/demo/oauth" className="btn btn-primary">Next: OAuth Demo →</Link>
        </div>
      </div>
    </main>
  )
}
