import { NextResponse } from 'next/server';
import { Issuer } from '../../../src/issuer';
import { Holder } from '../../../src/holder';
import { Verifier } from '../../../src/verifier';

// IMPORTANT: In Vercel serverless, memory is wiped on cold starts.
// For this Demo, Next.js cache/warm starts keep this active enough for testing.
// A real deployment would use @veramo/data-store (SQLite/Postgres).

let issuer: Issuer;
let holder: Holder;
let verifier: Verifier;
let initialized = false;

async function init() {
  if (!initialized) {
    issuer = new Issuer();
    holder = new Holder();
    verifier = new Verifier();
    await issuer.initialize();
    await holder.initialize();
    initialized = true;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    // Always initialize on first run within this serverless container
    await init();

    switch (action) {
      case 'status':
        return NextResponse.json({
          initialized,
          issuerDid: issuer.did,
          holderDid: holder.did,
          apiVersion: '1.0.0 (Vercel Serverless)',
        });

      case 'initialize':
        return NextResponse.json({
          success: true,
          issuerDid: issuer.did,
          holderDid: holder.did,
          message: 'DIDs registered on did:key ledger (Serverless container warm)',
        });

      case 'issue-credential':
        const vc = await issuer.issueCredential(holder.did, data.claims);
        return NextResponse.json({ success: true, vc, holderDid: holder.did });

      case 'store-credential':
        holder.storeCredential(data.vc);
        return NextResponse.json({ success: true, message: 'Stored in ephemeral wallet' });

      case 'create-presentation':
        const vp = await holder.createPresentation(data.challenge);
        return NextResponse.json({ success: true, vp, holderDid: holder.did });

      case 'verify-presentation':
        const verified = await verifier.verifyPresentation(data.vp, data.challenge);
        return NextResponse.json({
          success: true,
          verified,
          message: verified ? 'Cryptographically verified.' : 'Verification failed.',
        });

      case 'reset':
        initialized = false;
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
