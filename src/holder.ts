import { agent } from './agent'
import { IIdentifier, VerifiableCredential, VerifiablePresentation } from '@veramo/core'

export class Holder {
  private identifier?: IIdentifier
  private wallet: VerifiableCredential[] = []

  // Initialize the Holder by creating a DID
  async initialize(): Promise<void> {
    this.identifier = await agent.didManagerCreate({
      provider: 'did:key',
      alias: 'holder',
    })
    console.log(`[Holder] Initialized with DID: ${this.identifier.did}`)
  }

  get did(): string {
    if (!this.identifier) throw new Error('Holder not initialized')
    return this.identifier.did
  }

  // Store a received credential in the local wallet
  storeCredential(vc: VerifiableCredential): void {
    console.log(`[Holder] Storing credential locally...`)
    this.wallet.push(vc)
    console.log(`[Holder] Credential saved. Total credentials in wallet: ${this.wallet.length}`)
  }

  // Create a Verifiable Presentation (VP) from stored credentials
  async createPresentation(challenge: string): Promise<VerifiablePresentation> {
    if (!this.identifier) throw new Error('Holder not initialized')
    if (this.wallet.length === 0) throw new Error('No credentials to present')

    console.log(`[Holder] Creating Verifiable Presentation for challenge: ${challenge}...`)
    
    // For POC, we just present the first credential in the wallet
    const vp = await agent.createVerifiablePresentation({
      presentation: {
        holder: this.identifier.did,
        verifiableCredential: this.wallet,
        type: ['VerifiablePresentation'],
        '@context': ['https://www.w3.org/2018/credentials/v1']
      },
      proofFormat: 'jwt',
      challenge,
      save: false,
    })

    console.log(`[Holder] Verifiable Presentation created.`)
    return vp
  }
}
