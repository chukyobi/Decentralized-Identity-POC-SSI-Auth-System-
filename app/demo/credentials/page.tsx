'use client';
import { useState } from 'react';
import Link from 'next/link';

type View = 'register' | 'login' | 'verify' | 'done';

const REG_STEPS = [
  { label: 'Hashing password with bcrypt (cost=12)', duration: 800, log: '> bcrypt hash: $2b$12$KIX9...' },
  { label: 'INSERT INTO users (name, email, password_hash)', duration: 500, log: '> Row inserted. user_id: 4821' },
  { label: 'Sending verification email via SendGrid', duration: 400, log: '> Email queued: alice@gmail.com' },
  { label: 'Creating session in Redis cache', duration: 300, log: '> Session: sess_xK82...expires 24h' },
];

const VERIFY_OLD_STEPS = [
  { label: 'User uploads PDF degree certificate', duration: 600, log: '> File: alice_degree.pdf (2.4MB) uploaded to S3' },
  { label: 'PDF sent to HR via internal email', duration: 500, log: '> Email to hr@company.com with attachment' },
  { label: 'HR manually downloads and reviews PDF', duration: 1500, log: '> [MANUAL] HR reviewing document...' },
  { label: 'HR places call to Lagos University registrar', duration: 1200, log: '> [MANUAL] Calling +234-1-700-0000...' },
  { label: 'University confirms over phone (no record trail)', duration: 900, log: '> [MANUAL] Verbal confirmation received' },
  { label: 'HR updates internal spreadsheet', duration: 400, log: '> Google Sheets: verified=TRUE, date=2026-04-28' },
];

const SSI_REG_STEPS = [
  { label: 'Generating Ed25519 DID key pair on device', duration: 400, log: '> Private key generated (never leaves device)' },
  { label: 'Publishing DID document to ledger', duration: 500, log: '> did:key:z6Mkg...alice → blockchain anchored' },
  { label: 'DID wallet ready — no password stored', duration: 200, log: '> ✅ No DB entry. No password. No breach risk.' },
];

const SSI_VERIFY_STEPS = [
  { label: 'Alice opens wallet and selects degree VC', duration: 300, log: '> VC selected: LASU-Degree-2024-JWT' },
  { label: 'Wallet creates Verifiable Presentation', duration: 350, log: '> VP signed with Alice\'s private key' },
  { label: 'System verifies Ed25519 university signature', duration: 300, log: '> Signature: valid ✓' },
  { label: 'Degree confirmed cryptographically', duration: 200, log: '> ✅ B.Sc Comp. Eng. 2024 — verified in 1.1s' },
];

const DB_FIELDS = ['user_id: 4821', 'name: Alice Okafor', 'email: alice@gmail.com', 'password_hash: $2b$12$KIX9...', 'phone: +234-806-123-4567', 'dob: 1998-03-15', 'ip_address: 102.88.34.211', 'device_fingerprint: 7f2a...', 'created_at: 2026-04-28', 'last_login: 2026-04-28'];

export default function CredentialsDemo() {
  const [mode, setMode] = useState<'old' | 'ssi'>('old');
  const [view, setView] = useState<View>('register');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [registered, setRegistered] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [form, setForm] = useState({ name: 'Alice Okafor', email: 'alice@gmail.com', password: 'P@ssw0rd!2024' });

  const reset = () => { setStep(-1); setDone(false); setLogs([]); setRunning(false); };
  const fullReset = () => { reset(); setRegistered(false); setLoggedIn(false); setView('register'); };

  const runSteps = async (steps: typeof REG_STEPS, onDone: () => void) => {
    reset();
    setRunning(true);
    for (let i = 0; i < steps.length; i++) {
      setStep(i);
      setLogs(prev => [...prev, steps[i].log]);
      await new Promise(r => setTimeout(r, steps[i].duration));
    }
    setDone(true);
    setRunning(false);
    onDone();
  };

  const steps = (() => {
    if (mode === 'old') return view === 'verify' ? VERIFY_OLD_STEPS : REG_STEPS;
    return view === 'verify' ? SSI_VERIFY_STEPS : SSI_REG_STEPS;
  })();

  const totalMs = mode === 'old' && view === 'verify'
    ? VERIFY_OLD_STEPS.reduce((a, s) => a + s.duration, 0)
    : SSI_VERIFY_STEPS.reduce((a, s) => a + s.duration, 0);

  return (
    <main style={{ minHeight: '100vh', paddingTop: 80 }}>
      <nav className="nav">
        <Link href="/" className="back-btn">← Back</Link>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700 }}>🔑 Model 03 — Username + Password + PDF</div>
        <div className="mode-toggle">
          <button className={`toggle-btn ${mode === 'old' ? 'active-old' : ''}`} onClick={() => { setMode('old'); fullReset(); }}>⚠️ Old Way</button>
          <button className={`toggle-btn ${mode === 'ssi' ? 'active-ssi' : ''}`} onClick={() => { setMode('ssi'); fullReset(); }}>✨ SSI Way</button>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span className={`badge ${mode === 'old' ? 'badge-old' : 'badge-ssi'}`}>
              {mode === 'old' ? '⚠️ Traditional Auth + Manual Verification' : '✅ DID Auth + Instant VC Verification'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            {mode === 'old' ? 'Username / Password + PDF Upload — Slow & Forgeable' : 'DID Login + Verifiable Credential — Instant & Tamper-proof'}
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7 }}>
            {mode === 'old'
              ? 'Alice registers, logs in, then manually uploads a PDF degree. HR calls the university. Takes 5–7 days and can be faked.'
              : 'Alice creates a DID (no password), logs in with her key, and presents her VC. Verified in under 2 seconds. Unforgeable.'}
          </p>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 28, width: 'fit-content' }}>
          {(['register', 'login', 'verify'] as View[]).map((v, i) => (
            <button
              key={v}
              onClick={() => { setView(v); reset(); }}
              style={{
                padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600,
                background: view === v ? (mode === 'old' ? 'var(--old)' : 'var(--ssi)') : 'transparent',
                color: view === v ? 'white' : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Step {i + 1}: {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              {/* REGISTER */}
              {view === 'register' && (
                <>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                    {mode === 'old' ? '📝 Create Account' : '🔐 Generate DID Identity'}
                  </h3>
                  {mode === 'old' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><label>Full Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                      <div><label>Email</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                      <div><label>Password</label><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 16, border: '1px solid var(--ssi-border)', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>No username. No password. Your device generates a key pair.</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ssi)', lineHeight: 2 }}>
                        <div>Public Key → DID Document (blockchain)</div>
                        <div>Private Key → stays on your device only</div>
                      </div>
                    </div>
                  )}
                  <button
                    className={`btn ${mode === 'old' ? 'btn-old' : 'btn-ssi'}`}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                    disabled={running || registered}
                    onClick={() => runSteps(mode === 'old' ? REG_STEPS : SSI_REG_STEPS, () => setRegistered(true))}
                  >
                    {running ? '⟳ Processing...' : registered ? '✓ Done' : mode === 'old' ? 'Create Account' : 'Generate DID'}
                  </button>
                  {registered && (
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => { setView('login'); reset(); }}>
                      Next: Login →
                    </button>
                  )}
                </>
              )}

              {/* LOGIN */}
              {view === 'login' && (
                <>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                    {mode === 'old' ? '🔓 Sign In' : '🪪 Sign In with DID'}
                  </h3>
                  {mode === 'old' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div><label>Email</label><input className="input" value={form.email} readOnly /></div>
                      <div><label>Password</label><input className="input" type="password" value={form.password} readOnly /></div>
                    </div>
                  ) : (
                    <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 16, border: '1px solid var(--ssi-border)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>No password needed — sign a challenge with your private key</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ssi)', lineHeight: 2 }}>
                        <div>DID: did:key:z6Mkg...alice</div>
                        <div>Challenge: sign(nonce + timestamp)</div>
                      </div>
                    </div>
                  )}
                  <button
                    className={`btn ${mode === 'old' ? 'btn-old' : 'btn-ssi'}`}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                    disabled={running || loggedIn}
                    onClick={() => {
                      setRunning(true);
                      setLogs([`> Session established for ${form.email}`]);
                      setTimeout(() => { setRunning(false); setLoggedIn(true); setDone(true); }, 800);
                    }}
                  >
                    {running ? '⟳ Authenticating...' : loggedIn ? '✓ Logged In' : mode === 'old' ? 'Sign In' : 'Authenticate with DID'}
                  </button>
                  {loggedIn && (
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => { setView('verify'); reset(); }}>
                      Next: Verify Degree →
                    </button>
                  )}
                </>
              )}

              {/* VERIFY */}
              {view === 'verify' && (
                <>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
                    {mode === 'old' ? '📄 Upload Degree Certificate' : '🪪 Present Degree Credential'}
                  </h3>
                  {mode === 'old' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ border: '2px dashed var(--old-border)', borderRadius: 10, padding: 24, textAlign: 'center', background: 'var(--old-dim)' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>alice_degree_certificate.pdf</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>2.4 MB · Scanned document</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--yellow)', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                        ⚠️ This PDF can be fabricated with free tools in under 10 minutes
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '2px solid var(--ssi-border)', borderRadius: 10, padding: 20, background: 'var(--ssi-dim)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontFamily: 'JetBrains Mono' }}>
                        VC from wallet — signed by Lagos University
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ssi)', lineHeight: 2 }}>
                        <div>type: VerifiableCredential</div>
                        <div>issuer: did:key:z6Mk...university</div>
                        <div>degree: B.Sc Computer Engineering</div>
                        <div>year: 2024 · sig: ✓ Ed25519</div>
                      </div>
                    </div>
                  )}
                  <button
                    className={`btn ${mode === 'old' ? 'btn-old' : 'btn-ssi'}`}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                    disabled={running || done}
                    onClick={() => runSteps(steps, () => {})}
                  >
                    {running ? '⟳ Processing...' : done ? '✓ Done' : mode === 'old' ? 'Submit to HR for Review' : 'Present Credential'}
                  </button>
                </>
              )}
            </div>

            {/* Terminal */}
            {logs.length > 0 && (
              <div className="terminal">
                <div className="dim"># System log</div>
                {logs.map((l, i) => (
                  <div key={i} className={l.includes('MANUAL') ? 'warn' : l.includes('✅') ? 'ok' : undefined}>{l}</div>
                ))}
                {running && <span className="pulse dim">█</span>}
              </div>
            )}

            {/* Result for verify */}
            {done && view === 'verify' && (
              <div className={`result-box ${mode === 'old' ? 'danger' : 'success'}`}>
                {mode === 'old' ? (
                  <>
                    <div style={{ fontWeight: 700, color: 'var(--old)', marginBottom: 8 }}>⏳ Manual Verification Initiated</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      {[
                        { label: 'Estimated wait', val: '5–7 business days' },
                        { label: 'Human steps required', val: '4 manual actions' },
                        { label: 'Forgery risk', val: 'HIGH (PDF)' },
                        { label: 'Audit trail', val: 'Spreadsheet only' },
                      ].map(i => (
                        <div key={i.label} style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{i.label}</div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{i.val}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>✅ Degree Verified in 1.1 seconds</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Verification time', val: '1.1 seconds' },
                        { label: 'Human steps', val: '0' },
                        { label: 'Forgery possible', val: 'No (cryptographic)' },
                        { label: 'Audit trail', val: 'Blockchain-anchored' },
                      ].map(i => (
                        <div key={i.label} style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{i.label}</div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--green)' }}>{i.val}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Steps */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, fontSize: 16 }}>🔄 What's Happening</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {steps.map((s, i) => (
                  <div key={i} className={`step-item ${i === step && running ? (mode === 'old' ? 'active-old' : 'active') : i < step || done ? 'done' : ''}`}>
                    <div className={`step-dot ${i < step || done ? 'done' : mode === 'old' ? 'old' : 'ssi'}`}>
                      {i < step || done ? '✓' : i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                      {i === step && running && mode === 'old' && view === 'verify' && (
                        <div className="pulse" style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 2 }}>⏳ Manual step — no automation possible</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DB exposure (old, register) */}
            {mode === 'old' && view === 'register' && registered && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15 }}>🗄️ Your Data in the Database</h3>
                  <span className="badge badge-old">Breach Target</span>
                </div>
                <div className="terminal" style={{ fontSize: 11 }}>
                  <div className="dim">SELECT * FROM users WHERE id=4821;</div>
                  {DB_FIELDS.map(f => <div key={f}>{f}</div>)}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                  Every registered user's data lives here. One SQL injection or misconfigured S3 bucket exposes all of it.
                </div>
              </div>
            )}

            {/* SSI no DB */}
            {mode === 'ssi' && view === 'register' && registered && (
              <div className="card" style={{ padding: 24, border: '1px solid var(--ssi-border)' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🔒 What's In the Database?</h3>
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🫙</div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 18, marginBottom: 8 }}>Nothing.</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
                    No password hash. No email. No PII. <br />Alice's DID exists on a public blockchain — by design.
                  </div>
                </div>
              </div>
            )}

            {/* Time comparison (verify) */}
            {view === 'verify' && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>⏱️ Verification Time Comparison</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--old)' }}>⚠️ PDF (Manual)</span>
                      <span style={{ fontWeight: 600 }}>5–7 days</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill old" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--ssi)' }}>✅ VC (Cryptographic)</span>
                      <span style={{ fontWeight: 600 }}>1.1 seconds</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill ssi" style={{ width: '0.05%' }} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                  The SSI approach is <strong style={{ color: 'var(--green)' }}>~500,000× faster</strong> and completely eliminates forgery risk.
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/demo/oauth" className="btn btn-ghost">← Demo 2</Link>
          <Link href="/" className="btn btn-primary">← Back to All Demos</Link>
        </div>
      </div>
    </main>
  );
}
