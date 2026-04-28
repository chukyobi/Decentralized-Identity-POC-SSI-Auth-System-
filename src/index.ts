import { agent } from './agent'

async function main() {
  console.log('Initializing Decentralized Identity System POC...')
  
  // 1. Create Issuer DID (Using did:ethr for example, but we can use did:key)
  console.log('\n--- 1. DID Registration ---')
  console.log('Generating Issuer DID...')
  const issuerDid = await agent.didManagerCreate({
    provider: 'did:key',
    alias: 'issuer',
  })
  console.log(`Issuer DID Created: ${issuerDid.did}`)

  // 2. Create Holder DID
  console.log('Generating Holder DID...')
  const holderDid = await agent.didManagerCreate({
    provider: 'did:key',
    alias: 'holder',
  })
  console.log(`Holder DID Created: ${holderDid.did}`)

  // 3. Resolve DID
  console.log('\n--- Resolving Holder DID ---')
  const resolutionResult = await agent.resolveDid({ didUrl: holderDid.did })
  console.log(JSON.stringify(resolutionResult.didDocument, null, 2))

  console.log('\nDID Registration module executed successfully.')
}

main().catch(console.error)
