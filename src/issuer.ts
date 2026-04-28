import { agent } from './agent'
import { IIdentifier, VerifiableCredential } from '@veramo/core'

export class Issuer {
  private identifier?: IIdentifier

  // Initialize the Issuer by creating a DID
  async initialize(): Promise<void> {
    this.identifier = await agent.didManagerCreate({
      provider: 'did:key',
      alias: 'issuer',
    })
    console.log(`[Issuer] Initialized with DID: ${this.identifier.did}`)
  }

  get did(): string {
    if (!this.identifier) throw new Error('Issuer not initialized')
    return this.identifier.did
  }

  // Issue a Verifiable Credential to a Holder
  async issueCredential(holderDid: string, claims: Record<string, any>): Promise<VerifiableCredential> {
    if (!this.identifier) throw new Error('Issuer not initialized')

    console.log(`[Issuer] Issuing credential to ${holderDid}...`)
    
    const verifiableCredential = await agent.createVerifiableCredential({
      credential: {
        issuer: { id: this.identifier.did },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: holderDid,
          ...claims
        },
        type: ['VerifiableCredential', 'CustomIdentityCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1']
      },
      proofFormat: 'jwt',
      save: false,
    })

    console.log(`[Issuer] Credential issued successfully.`)
    return verifiableCredential
  }
}
