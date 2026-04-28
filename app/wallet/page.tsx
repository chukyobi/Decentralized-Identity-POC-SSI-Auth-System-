'use client';

import { useState } from 'react';
import './wallet.css';

export default function Home() {
  const [userDid] = useState("did:key:z6MkhaXgBZDvotDkL5257faiztiCEsJXVtZa5Bg3d46i");
  const [storedCredential, setStoredCredential] = useState<any>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isProving, setIsProving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [proofData, setProofData] = useState<any>(null);

  const handleReceive = () => {
    setIsReceiving(true);
    
    // Simulate network delay and cryptographic operations
    setTimeout(() => {
      setStoredCredential({
        type: "AgeVerificationCredential",
        issuer: "did:ethr:0xUniversityIssuer",
        claims: {
          name: "Alice",
          birthdate: "1995-08-25",
          ageOver18: true
        }
      });
      setIsReceiving(false);
    }, 1500);
  };

  const handleProve = () => {
    if (!storedCredential) return;
    
    setIsProving(true);
    
    setTimeout(() => {
      // Derive a proof that hides the birthdate and name, but proves the age.
      const derivedZkp = {
        type: "AgeVerificationPresentation",
        holder: userDid,
        zkp_derived_from: "BBS+ Signature",
        revealed_claims: {
          ageOver18: true
        },
        hidden_claims_proved: ["birthdate", "name"],
        cryptographic_proof: "eyJhbGciOiJCQlMrIi...[TRUNCATED]"
      };
      
      setProofData(derivedZkp);
      setShowModal(true);
      setIsProving(false);
    }, 2000);
  };

  return (
    <>
      <div className="wallet-container">
        <header className="glass-header">
          <div className="header-content">
            <h1>My Wallet</h1>
            <div className="did-badge">DID: {userDid.substring(0, 16)}...</div>
          </div>
        </header>

        <main className="wallet-body">
          <section className="credentials-section">
            <h2>Verifiable Credentials</h2>
            <div className="credential-list">
              {!storedCredential ? (
                <div className="credential-card empty-state">
                  <p>No credentials stored yet.</p>
                </div>
              ) : (
                <div className="credential-card">
                  <div className="cred-title">{storedCredential.type}</div>
                  <div className="cred-issuer">Issued by: {storedCredential.issuer.substring(0, 20)}...</div>
                  <div className="cred-claims">
                    <div className="cred-claim-item">
                      <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                      <span>{storedCredential.claims.name}</span>
                    </div>
                    <div className="cred-claim-item">
                      <span style={{ color: 'var(--text-secondary)' }}>Birthdate:</span>
                      <span>{storedCredential.claims.birthdate}</span>
                    </div>
                    <div className="cred-claim-item">
                      <span style={{ color: 'var(--text-secondary)' }}>Age {'>'} 18:</span>
                      <span style={{ color: '#a7f3d0' }}>Yes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="actions-section">
            <button 
              onClick={handleReceive} 
              className="btn primary-btn"
              disabled={!!storedCredential || isReceiving}
            >
              <span className="btn-icon">{isReceiving ? '⏳' : (storedCredential ? '✅' : '⬇️')}</span> 
              {isReceiving ? 'Receiving...' : (storedCredential ? 'Credential Received' : 'Receive Credential')}
            </button>
            <button 
              onClick={handleProve} 
              className="btn secondary-btn" 
              disabled={!storedCredential || isProving}
            >
              <span className="btn-icon">{isProving ? '⏳' : '🛡️'}</span> 
              {isProving ? 'Deriving ZKP...' : 'Generate ZKP (Prove Age)'}
            </button>
          </section>
        </main>
      </div>

      {/* Verification Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`}>
        <div className="glass-modal">
          <h2>Zero-Knowledge Proof Generated!</h2>
          <p>Your Verifiable Presentation was created successfully. Age proven without revealing birthdate.</p>
          <div className="code-block">
            {proofData && JSON.stringify(proofData, null, 2)}
          </div>
          <button onClick={() => setShowModal(false)} className="btn primary-btn">Close</button>
        </div>
      </div>
    </>
  );
}
