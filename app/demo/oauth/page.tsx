'use client';
import { useState } from 'react';
import Link from 'next/link';

const API = '/api/ssi'


const OLD_STEPS = [
  { label: 'User clicks "Sign in with Google"', duration: 500, log: '> Redirecting to accounts.google.com...' },
  { label: 'Google checks your existing session', duration: 600, log: '> Session found for alice@gmail.com' },
  { label: 'Spotify requests scope: profile, email, contacts', duration: 700, log: '> OAuth2 scope: openid profile email' },
  { label: 'Google generates authorization code', duration: 400, log: '> code: 4/0AeaY...SampleCode' },
  { label: 'Spotify exchanges code for access token', duration: 600, log: '> token issued. expires_in: 3600' },
  { label: 'Google logs this connection to your profile', duration: 300, log: '> Event logged: alice → Spotify @ 2026-04-28T15:33:12Z' },
];

const SSI_STEP_LABELS = [
  'Initialize holder DID via Veramo agent',
  'Issue identity credential to holder',
  'Create DID Authentication Presentation',
  'Verify DID-Auth presentation cryptographically',
];

type LogLine = { text: string; type?: 'ok' | 'err' | 'warn' | 'dim' }

const TRACKING_EVENTS = [
  { service: 'Spotify', time: '2026-04-28 08:33', action: 'Logged in' },
  { service: 'Notion', time: '2026-04-27 14:12', action: 'Logged in' },
  { service: 'Figma', time: '2026-04-26 09:55', action: 'Logged in' },
  { service: 'GitHub', time: '2026-04-25 19:44', action: 'Logged in' },
  { service: 'Slack', time: '2026-04-24 10:11', action: 'Logged in' },
  { service: 'Linear', time: '2026-04-23 16:30', action: 'Logged in' },
];

export default function OAuthDemo() {
  const [mode, setMode] = useState<'old' | 'ssi'>('old')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [done, setDone] = useState(false)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [trackCount, setTrackCount] = useState(0)
  const [showBan, setShowBan] = useState(false)
  const [ssiResult, setSsiResult] = useState<{ verified: boolean; holderDid?: string } | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const addLog = (text: string, type?: LogLine['type']) =>
    setLogs(prev => [...prev, { text, type }])

  const reset = () => { setStep(-1); setDone(false); setLogs([]); setRunning(false); setTrackCount(0); setShowBan(false); setSsiResult(null); setApiError(null); }

  const runOld = async () => {
    reset()
    setRunning(true)
    for (let i = 0; i < OLD_STEPS.length; i++) {
      setStep(i)
      addLog(OLD_STEPS[i].log, i === OLD_STEPS.length - 1 ? 'warn' : undefined)
      if (i >= 4) setTrackCount(prev => prev + 1)
      await new Promise(r => setTimeout(r, OLD_STEPS[i].duration))
    }
    setDone(true)
    setRunning(false)
  }

  const runSSI = async () => {
    reset()
    setRunning(true)
    try {
      setStep(0)
      addLog('> POST /api/ssi {action: initialize} — creating holder DID...', 'dim')
      const initRes = await fetch(API, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      })
      const init = await initRes.json()
      if (!init.success) throw new Error(init.error)
      addLog(`> Holder DID: ${init.holderDid.slice(0, 45)}...`, 'ok')

      setStep(1)
      addLog('> POST /api/ssi {action: issue-credential} — issuing identity VC...', 'dim')
      const issueRes = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue-credential', claims: { service: 'Spotify', authEvent: true } }),
      })
      const issued = await issueRes.json()
      if (!issued.success) throw new Error(issued.error)
      await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'store-credential', vc: issued.vc }),
      })
      addLog('> Identity VC stored in wallet ✓', 'ok')

      setStep(2)
      const challenge = `spotify-auth-${Date.now()}`
      addLog(`> POST /api/ssi {action: create-presentation} (challenge: ${challenge.slice(0, 20)}...)`, 'dim')
      const vpRes = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-presentation', challenge }),
      })
      const vpData = await vpRes.json()
      if (!vpData.success) throw new Error(vpData.error)
      addLog('> DID-Auth VP signed by holder ✓', 'ok')

      setStep(3)
      addLog('> POST /api/ssi {action: verify-presentation} — Ed25519 check...', 'dim')
      const verRes = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-presentation', vp: vpData.vp, challenge }),
      })
      const ver = await verRes.json()
      addLog(ver.verified ? '> ✅ Identity verified. No Google involved.' : '> ❌ Verification failed.', ver.verified ? 'ok' : 'err')

      setSsiResult({ verified: ver.verified, holderDid: init.holderDid })
      setDone(true)
    } catch (e: any) {
      setApiError(e.message)
      addLog(`> ERROR: ${e.message}`, 'err')
    } finally {
      setRunning(false)
      setStep(-1)
    }
  }

  const run = mode === 'old' ? runOld : runSSI

  return (
    <main style={{ minHeight: '100vh', paddingTop: 80 }}>
      <nav className="nav">
        <Link href="/" className="back-btn">← Back</Link>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700 }}>🔗 Model 02 — OAuth / Federated Identity</div>
        <div className="mode-toggle">
          <button className={`toggle-btn ${mode === 'old' ? 'active-old' : ''}`} onClick={() => { setMode('old'); reset(); }}>⚠️ Old Way</button>
          <button className={`toggle-btn ${mode === 'ssi' ? 'active-ssi' : ''}`} onClick={() => { setMode('ssi'); reset(); }}>✨ SSI Way</button>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span className={`badge ${mode === 'old' ? 'badge-old' : 'badge-ssi'}`}>
              {mode === 'old' ? '⚠️ Federated Identity (OAuth 2.0)' : '✅ DID-Based Authentication'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            {mode === 'old' ? '"Sign in with Google" — Google Knows Everything' : 'DID Login — No Third Party, No Tracking'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7 }}>
            {mode === 'old'
              ? 'Every service you log into with Google is logged, profiled, and can be revoked by Google at any time.'
              : 'Alice authenticates with a cryptographic DID. No redirect, no Google, no data leaving her device.'}
          </p>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Auth panel */}
            <div className="card" style={{ padding: 28 }}>
              {mode === 'old' ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Spotify</h3>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>Premium music streaming</p>
                  <button
                    className="btn" onClick={run} disabled={running}
                    style={{ width: '100%', justifyContent: 'center', background: 'white', color: '#1a1a1a', fontSize: 15, padding: '14px 0', borderRadius: 10, gap: 12 }}
                  >
                    <span style={{ fontSize: 18 }}>G</span>
                    {running ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                  {done && <button className="btn btn-ghost" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={reset}>Reset</button>}
                  <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)' }}>
                    By signing in, you grant Google permission to share your data with Spotify
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Spotify</h3>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>Premium music streaming</p>
                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--ssi-border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Your DID</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ssi)', wordBreak: 'break-all' }}>
                      did:key:z6MkgnnR3wsw...alice-wallet
                    </div>
                  </div>
                  <button
                    className="btn btn-ssi" onClick={run} disabled={running}
                    style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px 0' }}
                  >
                    {running ? 'Verifying DID...' : '🔐 Connect DID Wallet'}
                  </button>
                  {done && <button className="btn btn-ghost" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={reset}>Reset</button>}
                  <div style={{ marginTop: 16, fontSize: 12, color: 'var(--green)' }}>
                    ✅ No third party involved — pure peer-to-peer
                  </div>
                </div>
              )}
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

            {/* Result */}
            {done && mode === 'old' && (
              <div className="result-box danger">
                <div style={{ fontWeight: 700, color: 'var(--old)', marginBottom: 8 }}>⚠️ Logged In — But at a cost</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.7 }}>
                  Google now knows you logged into Spotify. This joins your profile of 6 services. If your Google account is suspended, you lose access to all of them instantly.
                </p>
                <button
                  className="btn btn-old" style={{ fontSize: 13 }}
                  onClick={() => setShowBan(true)}
                >
                  Simulate Google Account Ban →
                </button>
              </div>
            )}
            {showBan && (
              <div className="result-box danger" style={{ borderColor: 'var(--old)' }}>
                <div style={{ fontWeight: 700, color: 'var(--old)', marginBottom: 12, fontSize: 16 }}>🚫 Google Account Suspended</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>You instantly lose access to:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Spotify', 'Notion', 'Figma', 'GitHub', 'Slack', 'Linear', '+ 14 more'].map(s => (
                    <span key={s} style={{ padding: '4px 12px', background: 'var(--old-dim)', border: '1px solid var(--old-border)', borderRadius: 100, fontSize: 12, color: 'var(--old)' }}>
                      ❌ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {done && mode === 'ssi' && (
              <div className="result-box success">
                <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
                  {ssiResult?.verified ? '✅ DID Authentication Verified — Real Veramo Agent' : '❌ Verification Failed'}
                </div>
                {ssiResult?.holderDid && (
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 2 }}>
                    <div>Holder DID: {ssiResult.holderDid.slice(0, 48)}...</div>
                    <div style={{ color: 'var(--green)' }}>No Google notified. No data retained. No tracking.</div>
                  </div>
                )}
                {apiError && <div style={{ color: 'var(--old)', fontSize: 13, marginTop: 8 }}>API Error: {apiError}</div>}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Steps */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                🔄 Authentication Flow
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(mode === 'old' ? OLD_STEPS : SSI_STEP_LABELS).map((s, i) => {
                  const label = typeof s === 'string' ? s : s.label
                  const isActive = i === step && running
                  const isDone = (done && !apiError) || (mode === 'ssi' && i < step)
                  return (
                    <div key={i} className={`step-item ${isActive ? (mode === 'old' ? 'active-old' : 'active') : isDone ? 'done' : ''}`}>
                      <div className={`step-dot ${isDone ? 'done' : mode === 'old' ? 'old' : 'ssi'}`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Google tracks */}
            {mode === 'old' && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>📡 Google's Login Ledger</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Everything Google knows</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {TRACKING_EVENTS.map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 8, background: 'var(--bg-2)',
                      border: `1px solid ${i === 0 && done ? 'var(--old-border)' : 'var(--border)'}`,
                      fontSize: 13, transition: 'all 0.4s',
                    }}>
                      <span style={{ fontWeight: 500 }}>{e.service}</span>
                      <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{e.time}</span>
                      <span style={{ color: i === 0 && done ? 'var(--old)' : 'var(--text-3)', fontSize: 12 }}>
                        {i === 0 && done ? '🔴 NEW' : e.action}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                  Google uses this data to build an advertising profile, sell insights, and decide your account risk score.
                </div>
              </div>
            )}

            {/* SSI comparison */}
            {mode === 'ssi' && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>🔒 Privacy Comparison</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Third party notified', old: 'Yes (Google)', ssi: 'None' },
                    { label: 'Login tracked', old: 'Yes, forever', ssi: 'No' },
                    { label: 'Data shared', old: 'Email, profile, contacts', ssi: 'Cryptographic proof only' },
                    { label: 'Single point of failure', old: 'Google account', ssi: 'None — user owns key' },
                    { label: 'Can be revoked by 3rd party', old: 'Yes (anytime)', ssi: 'Never' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-2)', fontWeight: 500, alignSelf: 'center' }}>{row.label}</span>
                      <span style={{ padding: '4px 8px', background: 'var(--old-dim)', color: 'var(--old)', borderRadius: 6, textAlign: 'center' }}>{row.old}</span>
                      <span style={{ padding: '4px 8px', background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 6, textAlign: 'center' }}>{row.ssi}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/demo/database" className="btn btn-ghost">← Demo 1</Link>
          <Link href="/demo/credentials" className="btn btn-primary">Next: Password Demo →</Link>
        </div>
      </div>
    </main>
  );
}
