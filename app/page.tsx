import Link from 'next/link';

const demos = [
  {
    id: 'database',
    number: '01',
    title: 'Direct Database Query',
    subtitle: 'University Degree Verification',
    description: 'A verifier contacts the issuer\'s server directly to look up records. The classic enterprise integration model.',
    painPoints: ['Server downtime breaks verification', 'All data fields exposed to verifier', 'Every institution needs a custom integration'],
    scenario: 'Google HR verifying Alice\'s degree by calling Lagos University\'s registrar API',
    color: '#f43f5e',
    icon: '🗄️',
  },
  {
    id: 'oauth',
    number: '02',
    title: 'OAuth / Federated Identity',
    subtitle: '"Sign in with Google" Model',
    description: 'A central Identity Provider (Google, Facebook) brokers authentication between you and every service you use.',
    painPoints: ['Google tracks every service you log into', 'One banned account = lose everything', 'Zero user control over data sharing'],
    scenario: 'Alice logs into Spotify via Google — Google becomes the arbiter of her digital life',
    color: '#fb923c',
    icon: '🔗',
  },
  {
    id: 'credentials',
    number: '03',
    title: 'Username + Password + PDF',
    subtitle: 'Traditional Credential Verification',
    description: 'Users self-report identity with passwords. Credentials are verified manually via phone calls and scanned documents.',
    painPoints: ['PDFs can be forged in minutes', 'Manual verification takes 5–7 days', 'Central database = high-value breach target'],
    scenario: 'Alice uploads a PDF degree certificate and waits a week for HR to manually call the university',
    color: '#a855f7',
    icon: '🔑',
  },
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: -200, background: 'rgba(129,140,248,0.06)' }} />
      <div className="orb" style={{ width: 400, height: 400, top: 200, right: -100, background: 'rgba(244,63,94,0.05)' }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, left: '40%', background: 'rgba(56,189,248,0.04)' }} />

      {/* Nav */}
      <nav className="nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#818cf8,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔐</div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16 }}>Identity Evolution</span>
        </div>
        <span className="badge badge-ssi">Interactive Demo Platform</span>
      </nav>

      <div className="container" style={{ paddingTop: 140, paddingBottom: 80 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div className="badge badge-yellow" style={{ marginBottom: 20, fontSize: 13 }}>
            🧪 Live Proof of Concept
          </div>
          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            How Identity <span className="old-grad">Was Broken</span><br />
            — and How <span className="grad-text">SSI Fixes It</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.8 }}>
            Walk through the 3 traditional identity models, see their vulnerabilities in real-time,
            then flip a switch to see how <strong style={{ color: 'var(--text)' }}>Self-Sovereign Identity</strong> eliminates each problem.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demo/database" className="btn btn-primary" style={{ fontSize: 15 }}>
              Start Demo 1 →
            </Link>
            <a href="#demos" className="btn btn-ghost" style={{ fontSize: 15 }}>
              View All Demos
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 80, border: '1px solid var(--border)' }}>
          {[
            { label: 'Data Breaches (2023)', value: '3,200+', sub: 'from central databases' },
            { label: 'Records Exposed', value: '8.2B', sub: 'in the last 5 years' },
            { label: 'OAuth Providers', value: '3', sub: 'control 95% of logins' },
            { label: 'Verification Time', value: '5–7 days', sub: 'manual PDF checks' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-2)', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit', color: 'var(--old)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Demo cards */}
        <div id="demos" style={{ display: 'grid', gap: 24 }}>
          {demos.map((demo, i) => (
            <div key={demo.id} className="card" style={{ padding: 32, display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 28, alignItems: 'center' }}>
              {/* Number */}
              <div style={{
                width: 80, height: 80, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${demo.color}15`, border: `1px solid ${demo.color}40`, flexShrink: 0,
              }}>
                <span style={{ fontSize: 32 }}>{demo.icon}</span>
              </div>

              {/* Content */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: demo.color, fontFamily: 'JetBrains Mono' }}>MODEL {demo.number}</span>
                  <span style={{ color: 'var(--text-3)' }}>|</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{demo.subtitle}</span>
                </div>
                <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{demo.title}</h2>
                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 14, maxWidth: 600 }}>{demo.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {demo.painPoints.map(p => (
                    <span key={p} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: `${demo.color}10`, color: demo.color, border: `1px solid ${demo.color}30` }}>
                      ⚠️ {p}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  <span style={{ color: 'var(--text-2)' }}>Scenario:</span> {demo.scenario}
                </p>
              </div>

              {/* Action */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <Link
                  href={`/demo/${demo.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: `linear-gradient(135deg, ${demo.color}, ${demo.color}99)`,
                    color: 'white', border: 'none', whiteSpace: 'nowrap',
                    boxShadow: `0 0 20px ${demo.color}30`,
                  }}
                >
                  Launch Demo →
                </Link>
                <span style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>Old Way + SSI Toggle</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="divider" />
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          Built on <span style={{ color: 'var(--ssi)' }}>W3C DID v1.0</span> + <span style={{ color: 'var(--ssi-2)' }}>Verifiable Credentials v1.0</span> standards · Powered by Veramo
        </div>
      </div>
    </main>
  );
}
