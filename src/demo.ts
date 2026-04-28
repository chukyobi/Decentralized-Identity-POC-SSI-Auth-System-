import { Issuer } from './issuer'
import { Holder } from './holder'
import { Verifier } from './verifier'

async function runDemo() {
  console.log('--- SSI Credentials Workflow Demo ---')

  const issuer = new Issuer()
  const holder = new Holder()
  const verifier = new Verifier()

  // 1. Initialization (DID Registration)
  console.log('\n--- 1. Initialization ---')
  await issuer.initialize()
  await holder.initialize()

  // 2. Credential Issuance
  console.log('\n--- 2. Credential Issuance ---')
  const claims = {
    name: 'Alice',
    age: 28,
    enrollment: 'University of Engineering',
    nationality: 'Decentraland'
  }
  const vc = await issuer.issueCredential(holder.did, claims)

  // 3. Holder stores the credential
  console.log('\n--- 3. Holder Storage ---')
  holder.storeCredential(vc)

  // 4. Verification Flow
  console.log('\n--- 4. Presentation & Verification ---')
  const challenge = 'random-challenge-xyz-123'
  
  // Holder generates VP
  const vp = await holder.createPresentation(challenge)

  // Verifier validates VP
  const isValid = await verifier.verifyPresentation(vp, challenge)
  
  if (isValid) {
    console.log('\n✅ Demo completed successfully: Identity verified without sharing raw keys or relying on central authorities.')
  } else {
    console.log('\n❌ Demo failed: Verification unsuccessful.')
  }
}

runDemo().catch(console.error)
